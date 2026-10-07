import { asciiString, equalBytes } from '../core/bytes.js'
import { type Warning, WarningSink } from '../core/errors.js'
import { type Segment, mergeRanges } from '../file/segments.js'
import { isUnsupported, readID3v2 } from '../id3v2/reader.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import { type WriteOptions as ID3v2WriteOptions, writeID3v2 } from '../id3v2/writer.js'
import {
  type Chunk,
  type InfoEntry,
  type WAVFormat,
  type WAVLayout,
  WAVWriteError,
  addChunk,
  formEnd,
  formStart,
  newLayout,
  padded,
  parseCodePage,
  parseFact,
  parseFormat,
  parseInfo,
  riffHeader,
  serializeChunk,
  serializeInfo,
} from './chunks.js'

export interface WAVTags {
  /** The entries of the first LIST INFO chunk; undefined when the file has none (W2). */
  info?: InfoEntry[]
  /** The ID3v2 tag of the `id3 ` chunk (W1). */
  id3v2?: ID3v2Tag
}

export interface WAVAudio {
  format: WAVFormat
  /** Size of the `data` chunk. */
  dataSize?: number
  /** Sample frames from the `fact` chunk (compressed formats). */
  sampleFrames?: number
}

export interface ReadWAVResult {
  tags: WAVTags
  audio?: WAVAudio
  layout: WAVLayout
  warnings: Warning[]
}

/** Options for the ID3 chunk's tag (padding, unsynchronisation, ...); `originalSize` is set by the writer. */
export type WAVWriteOptions = Omit<ID3v2WriteOptions, 'originalSize'> & { strict?: boolean }

export interface WAVWriteResult {
  segments: Segment[]
  /** The file length did not change and nothing moved. */
  inPlace: boolean
  warnings: Warning[]
}

const ID3_IDS = ['id3 ', 'ID3 ']
const isInfo = (c: Chunk) => c.id === 'LIST' && c.data !== undefined && c.data.length >= 4 && asciiString(c.data.subarray(0, 4)) === 'INFO'

/** Reads the tags from the chunks; chunks without data (the sound data, when skipped) are not needed. */
export function readWAVChunks(layout: WAVLayout, w: WarningSink = new WarningSink()): ReadWAVResult {
  const tags: WAVTags = {}
  const cset = layout.chunks.find((c) => c.id === 'CSET' && c.data)
  const codePage = cset ? parseCodePage(cset.data!) : 0
  let format: WAVFormat | undefined
  let fact: number | undefined
  for (const c of layout.chunks) {
    if (c.id === 'fmt ' && c.data && !format) format = parseFormat(c.data, w)
    else if (c.id === 'fact' && c.data) fact = parseFact(c.data)
    else if (isInfo(c)) {
      if (tags.info) w.warn('wav-info-count', 'more than one INFO list; using the first, the others are kept', { offset: c.start })
      else tags.info = parseInfo(c.data!, codePage, w)
    } else if (ID3_IDS.includes(c.id) && c.data) {
      if (tags.id3v2) {
        w.warn('wav-chunk-count', 'more than one ID3 chunk; using the first', { offset: c.start })
        continue
      }
      const r = readID3v2(c.data, 0, { strict: w.strict })
      if (!r) w.warn('wav-id3', 'the ID3 chunk holds no ID3v2 tag', { offset: c.start })
      else if (isUnsupported(r)) w.warn('wav-id3', `the ID3 chunk holds an unsupported ID3v2.${r.major} tag; it is kept as it is`, { offset: c.start })
      else {
        tags.id3v2 = r.tag
        for (const x of r.warnings) w.list.push(x)
      }
    }
  }
  // SPEC: "<fmt-ck> must always occur before <wave-data>, and both of these chunks are mandatory".
  if (!format) w.warn('wav-fmt', 'the WAVE form has no format chunk')
  if (layout.start > 0) w.note('wav-id3-prefix', 'an ID3v2 tag in front of the RIFF form is ignored (readID3File() reads it) and kept on write')
  const out: ReadWAVResult = { tags, layout, warnings: w.list }
  if (format) {
    const audio: WAVAudio = { format }
    const data = layout.chunks.find((c) => c.id === 'data')
    if (data) audio.dataSize = data.size
    if (fact !== undefined) audio.sampleFrames = fact
    out.audio = audio
  }
  return out
}

/** The layout of a whole file, with every chunk's data. */
export function wavLayout(data: Uint8Array, w: WarningSink): WAVLayout | undefined {
  const start = formStart(data)
  const riff = riffHeader(data, start)
  if (!riff) return undefined
  const layout = newLayout(start, data.length, riff.formSize, w)
  const end = formEnd(layout)
  for (let pos: number | undefined = start + 12; pos !== undefined && pos + 8 <= end; ) {
    const { chunk, next } = addChunk(layout, pos, data.subarray(pos, pos + 8), w)
    chunk.data = data.subarray(chunk.start + 8, chunk.start + 8 + chunk.size)
    pos = next
  }
  return layout
}

/**
 * Plans writing `tags` into a WAV file. Unchanged chunks are referenced as byte ranges, so the
 * sound data is never loaded (W7); the INFO list and the ID3 chunk go where the old ones were, or
 * at the end of the RIFF form (W1).
 */
export function planWAVWrite(layout: WAVLayout, tags: WAVTags, options: WAVWriteOptions = {}): WAVWriteResult {
  const w = new WarningSink(options.strict ?? false)
  const { strict: _, ...id3Options } = options
  if (layout.truncated) throw new WAVWriteError('wav-truncated', 'the file is truncated; it cannot be written safely')
  const same = (c: Chunk, data: Uint8Array) => c.data !== undefined && equalBytes(c.data, data)

  const info = tags.info?.length ? serializeInfo(tags.info) : undefined
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

  type Out = Uint8Array | { chunk: Chunk }
  const out: Out[] = []
  const put = (c: Chunk, data: Uint8Array | undefined) => {
    if (data !== undefined) out.push(same(c, data) ? { chunk: c } : serializeChunk(c.id, data))
  }
  let infoDone = false
  let id3Done = false
  for (const c of layout.chunks) {
    if (isInfo(c) && !infoDone) {
      put(c, info)
      infoDone = true
    } else if (ID3_IDS.includes(c.id) && !id3Done) {
      put(c, id3)
      id3Done = true
    } else out.push({ chunk: c })
  }
  if (!infoDone && info) out.push(serializeChunk('LIST', info))
  if (!id3Done && id3) out.push(serializeChunk('id3 ', id3))

  // Segments: bytes in front of the RIFF form (kept), the RIFF header, each chunk (new bytes or the
  // old range, pad byte included), and whatever follows the form.
  const end = formEnd(layout)
  const length = (o: Out) => ('chunk' in o ? 8 + padded(o.chunk.size) : o.length)
  const formSize = 4 + out.reduce((n, o) => n + length(o), 0)
  if (formSize > 0xffffffff) throw new WAVWriteError('wav-riff-size', 'the RIFF form would exceed 4 GiB')
  const header = new Uint8Array(12)
  header.set([0x52, 0x49, 0x46, 0x46])
  new DataView(header.buffer).setUint32(4, formSize, true)
  header.set([0x57, 0x41, 0x56, 0x45], 8)

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
