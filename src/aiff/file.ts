import { equalBytes } from '../core/bytes.js'
import { type Warning, WarningSink } from '../core/errors.js'
import { type Segment, mergeRanges } from '../file/segments.js'
import { isUnsupported, readID3v2 } from '../id3v2/reader.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import { type WriteOptions as ID3v2WriteOptions, writeID3v2 } from '../id3v2/writer.js'
import {
  type AIFFComment,
  type AIFFLayout,
  AIFFWriteError,
  type Chunk,
  type CommonChunk,
  addChunk,
  formEnd,
  formHeader,
  formStart,
  newLayout,
  padded,
  parseComments,
  parseCommon,
  parseText,
  serializeChunk,
  serializeComments,
  serializeText,
} from './chunks.js'

export interface AIFFTags {
  /** `NAME`: the name of the sampled sound. */
  name?: string
  /** `AUTH`: one or more author names. */
  author?: string
  /** `(c) `: "a date followed by the copyright owner". */
  copyright?: string
  /** `ANNO` chunks, in file order. */
  annotations: string[]
  /** The `COMT` chunk. */
  comments: AIFFComment[]
  /** The ID3v2 tag of the `ID3 ` chunk (A1). */
  id3v2?: ID3v2Tag
}

export interface ReadAIFFResult {
  tags: AIFFTags
  common?: CommonChunk
  layout: AIFFLayout
  warnings: Warning[]
}

/** Options for the ID3 chunk's tag (padding, unsynchronisation, ...); `originalSize` is set by the writer. */
export type AIFFWriteOptions = Omit<ID3v2WriteOptions, 'originalSize'> & { strict?: boolean }

export interface AIFFWriteResult {
  segments: Segment[]
  /** The file length did not change and nothing moved. */
  inPlace: boolean
  warnings: Warning[]
}

const TEXT_IDS = { NAME: 'name', AUTH: 'author', '(c) ': 'copyright' } as const
const ID3_IDS = ['ID3 ', 'id3 ']

/** Reads the tags from the chunks; chunks without data (the sound data, when skipped) are not needed. */
export function readAIFFChunks(layout: AIFFLayout, w: WarningSink = new WarningSink()): ReadAIFFResult {
  const tags: AIFFTags = { annotations: [], comments: [] }
  let common: CommonChunk | undefined
  const seen = new Set<string>()
  for (const c of layout.chunks) {
    if (!c.data) continue
    const once = (what: string) => {
      if (seen.has(c.id)) w.warn('aiff-chunk-count', `more than one ${what} chunk; using the first`, { offset: c.start })
      const first = !seen.has(c.id)
      seen.add(c.id)
      return first
    }
    if (c.id === 'COMM') {
      if (once("'COMM'")) common = parseCommon(c.data, w)
    } else if (c.id in TEXT_IDS) {
      if (once(`'${c.id}'`)) tags[TEXT_IDS[c.id as keyof typeof TEXT_IDS]] = parseText(c.id, c.data, w)
    } else if (c.id === 'ANNO') tags.annotations.push(parseText('ANNO', c.data, w))
    else if (c.id === 'COMT') {
      if (once("'COMT'")) tags.comments = parseComments(c.data, w)
    } else if (ID3_IDS.includes(c.id)) {
      if (tags.id3v2) {
        w.warn('aiff-chunk-count', 'more than one ID3 chunk; using the first', { offset: c.start })
        continue
      }
      const r = readID3v2(c.data, 0, { strict: w.strict })
      if (!r) w.warn('aiff-id3', 'the ID3 chunk holds no ID3v2 tag', { offset: c.start })
      else if (isUnsupported(r)) w.warn('aiff-id3', `the ID3 chunk holds an unsupported ID3v2.${r.major} tag; it is kept as it is`, { offset: c.start })
      else {
        tags.id3v2 = r.tag
        for (const x of r.warnings) w.list.push(x)
      }
    }
  }
  // SPEC: "One and only one Common Chunk is required in every FORM AIFF."
  if (!seen.has('COMM')) w.warn('aiff-comm', 'the FORM has no Common Chunk')
  // A4: an ID3v2 tag in front of the FORM is not part of the file format.
  if (layout.start > 0) w.note('aiff-id3-prefix', 'an ID3v2 tag in front of the FORM is ignored (readID3File() reads it) and kept on write')
  const out: ReadAIFFResult = { tags, layout, warnings: w.list }
  if (common) out.common = common
  return out
}

/** The layout of a whole file, with every chunk's data. */
export function aiffLayout(data: Uint8Array, w: WarningSink): AIFFLayout | undefined {
  const start = formStart(data)
  const form = formHeader(data, start)
  if (!form) return undefined
  const layout = newLayout(start, data.length, form, w)
  const end = formEnd(layout)
  for (let pos: number | undefined = start + 12; pos !== undefined && pos + 8 <= end; ) {
    const { chunk, next } = addChunk(layout, pos, data.subarray(pos, pos + 8), w)
    chunk.data = data.subarray(chunk.start + 8, chunk.start + 8 + chunk.size)
    pos = next
  }
  return layout
}

/**
 * Plans writing `tags` into an AIFF file. Unchanged chunks are referenced as byte ranges, so the
 * sound data is never loaded (A4); new text and ID3 chunks go where the old ones were, or at the
 * end of the FORM (A1).
 */
export function planAIFFWrite(layout: AIFFLayout, tags: AIFFTags, options: AIFFWriteOptions = {}): AIFFWriteResult {
  const w = new WarningSink(options.strict ?? false)
  const { strict: _, ...id3Options } = options
  if (layout.truncated) throw new AIFFWriteError('aiff-truncated', 'the file is truncated; it cannot be written safely')
  const same = (c: Chunk, data: Uint8Array) => c.data !== undefined && equalBytes(c.data, data)

  // New chunk data by ID; undefined removes the chunk.
  const textData = (id: keyof typeof TEXT_IDS) => {
    const v = tags[TEXT_IDS[id]]
    return v === undefined ? undefined : serializeText(id, v)
  }
  const oldID3 = layout.chunks.find((c) => ID3_IDS.includes(c.id) && c.data)
  // An ID3 chunk this library cannot read is kept as it is, unless a new tag replaces it.
  const parsed = oldID3 ? readID3v2(oldID3.data!) : undefined
  const unreadable = oldID3 !== undefined && (!parsed || isUnsupported(parsed))
  let id3: Uint8Array | undefined = unreadable && !tags.id3v2 ? oldID3.data : undefined
  if (tags.id3v2 && tags.id3v2.frames.length) {
    const opts: ID3v2WriteOptions = { ...id3Options }
    if (oldID3) opts.originalSize = oldID3.size
    const r = writeID3v2(tags.id3v2, opts)
    w.list.push(...r.warnings)
    id3 = r.bytes
  }
  const comments = tags.comments.length ? serializeComments(tags.comments) : undefined

  type Out = Uint8Array | { chunk: Chunk }
  const out: Out[] = []
  const done = new Set<string>()
  const put = (c: Chunk, id: string, data: Uint8Array | undefined) => {
    if (data !== undefined) out.push(same(c, data) && c.id === id ? { chunk: c } : serializeChunk(id, data))
  }
  let annoIndex = 0
  for (const c of layout.chunks) {
    if (c.id in TEXT_IDS) {
      if (!done.has(c.id)) put(c, c.id, textData(c.id as keyof typeof TEXT_IDS))
      done.add(c.id)
    } else if (c.id === 'ANNO') {
      // ANNO chunks are replaced one by one; extra old ones are dropped, extra new ones appended.
      const a = tags.annotations[annoIndex++]
      if (a !== undefined) put(c, 'ANNO', serializeText('ANNO', a))
    } else if (c.id === 'COMT') {
      if (!done.has('COMT')) put(c, 'COMT', comments)
      done.add('COMT')
    } else if (ID3_IDS.includes(c.id)) {
      if (!done.has('ID3')) put(c, c.id, id3)
      done.add('ID3')
    } else out.push({ chunk: c })
  }
  for (const id of Object.keys(TEXT_IDS) as (keyof typeof TEXT_IDS)[]) {
    const d = textData(id)
    if (!done.has(id) && d) out.push(serializeChunk(id, d))
  }
  for (const a of tags.annotations.slice(annoIndex)) out.push(serializeChunk('ANNO', serializeText('ANNO', a)))
  if (!done.has('COMT') && comments) out.push(serializeChunk('COMT', comments))
  if (!done.has('ID3') && id3) out.push(serializeChunk('ID3 ', id3))

  // Segments: bytes in front of the FORM (an ID3v2 tag, kept), the FORM header, each chunk (new
  // bytes or the old range, pad byte included), and whatever follows the FORM.
  const end = formEnd(layout)
  const length = (o: Out) => ('chunk' in o ? 8 + padded(o.chunk.size) : o.length)
  const formSize = 4 + out.reduce((n, o) => n + length(o), 0)
  if (formSize > 0xffffffff) throw new AIFFWriteError('aiff-form-size', 'the FORM chunk would exceed 4 GiB')
  const header = new Uint8Array(12)
  header.set([0x46, 0x4f, 0x52, 0x4d])
  new DataView(header.buffer).setUint32(4, formSize)
  header.set(Array.from(layout.formType, (ch) => ch.charCodeAt(0)), 8)

  const segments: Segment[] = layout.start > 0 ? [{ start: 0, end: layout.start }, header] : [header]
  let pos = layout.start + 12
  let moved = layout.start + 8 + formSize !== end
  for (const o of out) {
    if ('chunk' in o) {
      const chunkEnd = Math.min(o.chunk.start + 8 + padded(o.chunk.size), end)
      if (o.chunk.start !== pos) moved = true
      segments.push({ start: o.chunk.start, end: chunkEnd })
      pos += chunkEnd - o.chunk.start
    } else {
      segments.push(o)
      pos += o.length
    }
  }
  if (end < layout.fileLength) segments.push({ start: end, end: layout.fileLength })
  return { segments: mergeRanges(segments), inPlace: !moved, warnings: w.list }
}
