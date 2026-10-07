import { concat } from '../core/bytes.js'
import { type AudioFormat, FORMAT_NAMES, NATIVE_TAGS, detectFormat } from './detect.js'
import type { MajorVersion } from '../core/encoding.js'
import { TagWriteError, type Warning, WarningSink } from '../core/errors.js'
import { ID3V1_SIZE, type ID3v1ReadOptions, type ID3v1Tag, hasID3v1, parseID3v1, serializeID3v1 } from '../id3v1/id3v1.js'
import { encodeFrame } from '../id3v2/frame-io.js'
import { getDefinition, uniquenessOf } from '../id3v2/frames/registry.js'
import type { Frame, FrameOf } from '../id3v2/frames/types.js'
import { HEADER_SIZE, isTagHeader, parseTagHeader } from '../id3v2/header.js'
import { type ReadOptions, type UnsupportedTag, isUnsupported, readID3v2 } from '../id3v2/reader.js'
import { type ID3v2Tag, cloneFrame, createFrame } from '../id3v2/tag.js'
import { type WriteOptions, writeID3v2 } from '../id3v2/writer.js'
import { type Lyrics3Tag, findLyrics3, serializeLyrics3 } from '../lyrics3/lyrics3.js'

export interface LocatedID3v2 {
  tag: ID3v2Tag
  start: number
  end: number
  /** Before the audio (prepended, or reached through SEEK) or after it (found by its footer). */
  position: 'prepended' | 'appended'
  warnings: Warning[]
}

export interface FileLayout {
  /** ID3v2 tags in file order. */
  id3v2: LocatedID3v2[]
  /** Tags that must be ignored (newer versions, v2.2 compression). */
  unsupported: UnsupportedTag[]
  lyrics3?: { tag: Lyrics3Tag; start: number; end: number; warnings: Warning[] }
  id3v1?: { tag: ID3v1Tag; start: number; end: number; warnings: Warning[] }
  /** The audio data between the tags. */
  audio: { start: number; end: number }
}

export interface LocateOptions extends ReadOptions {
  id3v1?: ID3v1ReadOptions
  /** How far past a SEEK offset to look for the next tag. Default 64 KB. */
  seekWindow?: number
}

/**
 * Finds every tag in a file.
 * SPEC: v2.4 structure §5: look for a prepended tag, follow SEEK frames, then look for a footer
 * from the back of the file. ID3v1 is the last 128 bytes; Lyrics3 sits right before it.
 */
export function locateTags(data: Uint8Array, options: LocateOptions = {}): FileLayout {
  const layout: FileLayout = { id3v2: [], unsupported: [], audio: { start: 0, end: data.length } }
  let end = data.length

  if (hasID3v1(data)) {
    const r = parseID3v1(data.subarray(end - ID3V1_SIZE), options.id3v1)
    if (r) {
      layout.id3v1 = { tag: r.tag, start: end - ID3V1_SIZE, end, warnings: r.warnings }
      end -= ID3V1_SIZE
    }
  }

  const ly = findLyrics3(data)
  if (ly) {
    layout.lyrics3 = ly
    end = ly.start
  }

  // Appended tags, found by their footer ("3DI"), possibly several in a row.
  const appended: LocatedID3v2[] = []
  while (end >= 2 * HEADER_SIZE && isTagHeader(data, end - HEADER_SIZE, '3DI')) {
    const footer = parseTagHeader(data, end - HEADER_SIZE, '3DI')!
    const start = end - 2 * HEADER_SIZE - footer.size
    if (start < 0) break
    const r = readID3v2(data, start, options)
    if (!r || isUnsupported(r) || r.totalSize !== end - start) break
    appended.unshift({ tag: r.tag, start, end, position: 'appended', warnings: r.warnings })
    end = start
  }

  // Prepended tags: one at offset 0, any stacked directly behind it, and any reached through SEEK.
  let pos = 0
  for (;;) {
    const r = readID3v2(data, pos, options)
    if (!r) break
    if (isUnsupported(r)) {
      layout.unsupported.push(r)
      pos += r.totalSize
      continue
    }
    const tagEnd = pos + r.totalSize
    layout.id3v2.push({ tag: r.tag, start: pos, end: tagEnd, position: 'prepended', warnings: r.warnings })
    pos = tagEnd
    const seek = r.tag.frames.find((f): f is FrameOf<'seek'> => f.type === 'seek')
    if (seek) {
      // SPEC: v2.4 frames §4.29 "The 'minimum offset to next tag' is calculated from the end of
      // this tag to the beginning of the next."
      const from = tagEnd + seek.minimumOffset
      const next = findTagStart(data, from, Math.min(end, from + (options.seekWindow ?? 65536)))
      if (next !== undefined && next !== pos && !appended.some((a) => a.start === next)) {
        const s = readID3v2(data, next, options)
        if (s && !isUnsupported(s)) {
          layout.id3v2.push({ tag: s.tag, start: next, end: next + s.totalSize, position: 'prepended', warnings: s.warnings })
        }
      }
    }
  }
  layout.audio = { start: Math.min(pos, end), end }
  layout.id3v2.push(...appended)
  return layout
}

function findTagStart(data: Uint8Array, from: number, to: number): number | undefined {
  for (let i = Math.max(0, from); i + HEADER_SIZE <= to; i++) {
    if (data[i] === 0x49 && isTagHeader(data, i)) return i
  }
  return undefined
}

/** A key that says which frames a newer tag replaces (the spec's uniqueness rules). */
function replaceKey(f: Frame, major: MajorVersion): string | undefined {
  const def = getDefinition(f.id, major)
  if (!def) return undefined
  const u = uniquenessOf(def, major)
  if (u.kind === 'single') return f.id
  if (u.kind === 'key') return `${f.id}\0${u.key(f)}`
  if (u.kind === 'content') {
    try {
      return `${f.id}\0${Array.from(encodeFrame(f, major, new WarningSink())).join(',')}`
    } catch {
      return undefined
    }
  }
  return undefined
}

/**
 * Merges tags in file order.
 * SPEC: v2.4 structure §5 "For every new tag that is found, the old tag should be discarded unless
 * the update flag in the extended header is set." §3.2: with the update flag, unique frames in
 * the new tag override the earlier ones.
 */
export function mergeTags(tags: readonly ID3v2Tag[]): ID3v2Tag | undefined {
  let merged: ID3v2Tag | undefined
  for (const t of tags) {
    const isUpdate = t.extendedHeader?.version === 4 && t.extendedHeader.isUpdate
    if (!merged || !isUpdate || merged.version.major !== t.version.major) {
      merged = { ...t, frames: t.frames.map(cloneFrame) }
      continue
    }
    const major = t.version.major
    const replaced = new Set(t.frames.map((f) => replaceKey(f, major)).filter((k): k is string => k !== undefined))
    merged = {
      ...merged,
      frames: [...merged.frames.filter((f) => !replaced.has(replaceKey(f, major) ?? '')), ...t.frames.map(cloneFrame)],
    }
  }
  return merged
}

export interface ReadTagsResult {
  /** Container format, from the file's first bytes. */
  format: AudioFormat
  /** The effective ID3v2 tag after merging all ID3v2 tags in the file. */
  id3v2?: ID3v2Tag
  id3v1?: ID3v1Tag
  lyrics3?: Lyrics3Tag
  layout: FileLayout
  warnings: Warning[]
}

export function readTags(data: Uint8Array, options: LocateOptions = {}): ReadTagsResult {
  const layout = locateTags(data, options)
  const warnings = [
    ...layout.id3v2.flatMap((t) => t.warnings),
    ...(layout.lyrics3?.warnings ?? []),
    ...(layout.id3v1?.warnings ?? []),
  ]
  for (const u of layout.unsupported) {
    warnings.push({ code: 'tag-unsupported', message: `ID3v2.${u.major}.${u.revision} tag ignored (${u.reason})`, offset: u.offset })
  }
  const format = detectFormat(data)
  const out: ReadTagsResult = { format, layout, warnings }
  const merged = mergeTags(layout.id3v2.map((t) => t.tag))
  if (merged) out.id3v2 = merged
  if (layout.id3v1) out.id3v1 = layout.id3v1.tag
  if (layout.lyrics3) out.lyrics3 = layout.lyrics3.tag
  const native = NATIVE_TAGS[format]
  if (native && !out.id3v2 && !out.id3v1 && !out.lyrics3) {
    warnings.push({ code: 'format-not-id3', message: `This is a ${FORMAT_NAMES[format]} file without ID3 tags; its tags are ${native}` })
  }
  return out
}

export interface WriteTagsInput {
  /** undefined keeps the file's ID3v2 tags, null removes them. */
  id3v2?: ID3v2Tag | null
  /** undefined keeps the file's ID3v1 tag, null removes it. */
  id3v1?: ID3v1Tag | null
  /** undefined keeps the file's Lyrics3 tag, null removes it. */
  lyrics3?: Lyrics3Tag | null
}

export interface WriteTagsOptions extends WriteOptions {
  /**
   * Where the ID3v2 tag goes (v2.4 structure §5 order of preference):
   * 'prepend' (default), 'append' (v2.4 only, with footer), or 'both': a prepended tag with the
   * vital frames and a SEEK frame, plus an appended update tag with the rest (v2.4 only).
   */
  id3v2Location?: 'prepend' | 'append' | 'both'
  /** For 'both': frames that go to the appended tag. Default: pictures, objects and frames over 4 KB. */
  appendFrame?: (f: Frame) => boolean
  locate?: LocateOptions
}

export interface WriteTagsResult {
  bytes: Uint8Array
  /** The audio did not move: only the first `headSize` bytes changed and the length is unchanged. */
  inPlace: boolean
  headSize: number
  warnings: Warning[]
}

/** Writes tags into a file and returns the new file. The input is not modified. */
export function writeTags(data: Uint8Array, input: WriteTagsInput, options: WriteTagsOptions = {}): WriteTagsResult {
  const layout = locateTags(data, options.locate)
  const warnings: Warning[] = []
  const audio = data.subarray(layout.audio.start, layout.audio.end)
  const location = options.id3v2Location ?? 'prepend'

  let head: Uint8Array = data.subarray(0, layout.audio.start)
  let appendedV2: Uint8Array = concat(layout.id3v2.filter((t) => t.position === 'appended').map((t) => data.subarray(t.start, t.end)))
  if (input.id3v2 === null) {
    head = new Uint8Array(0)
    appendedV2 = new Uint8Array(0)
  } else if (input.id3v2) {
    const tag = input.id3v2
    const prepended = layout.id3v2.filter((t) => t.position === 'prepended')
    const writeOpts: WriteOptions = { ...options }
    // keep the old size when it fits, so the audio does not move (id3guide "Padding")
    if (location === 'prepend' && prepended.length === 1 && writeOpts.originalSize === undefined) {
      writeOpts.originalSize = prepended[0]!.end - prepended[0]!.start
    }
    if (location !== 'prepend' && tag.version.major !== 4) {
      throw new TagWriteError('append-version', 'only ID3v2.4 tags can be appended (they need a footer)')
    }
    if (location === 'prepend') {
      const r = writeID3v2({ ...tag, flags: { ...tag.flags, footer: false } }, writeOpts)
      warnings.push(...r.warnings)
      head = r.bytes
      appendedV2 = new Uint8Array(0)
    } else if (location === 'append') {
      // SPEC: v2.4 structure §3.4 a footer is REQUIRED for an appended tag.
      const r = writeID3v2({ ...tag, flags: { ...tag.flags, footer: true } }, { ...writeOpts, padding: 0 })
      warnings.push(...r.warnings)
      head = new Uint8Array(0)
      appendedV2 = r.bytes
    } else {
      const both = writeBoth(tag, audio.length, writeOpts, options.appendFrame)
      warnings.push(...both.warnings)
      head = both.head
      appendedV2 = both.tail
    }
  }

  let id3v1: Uint8Array = layout.id3v1 ? data.subarray(layout.id3v1.start, layout.id3v1.end) : new Uint8Array(0)
  if (input.id3v1 === null) id3v1 = new Uint8Array(0)
  else if (input.id3v1) {
    const w = new WarningSink()
    id3v1 = serializeID3v1(input.id3v1, { warnings: w, ...(options.strict ? { strict: true } : {}) })
    warnings.push(...w.list)
  }
  let lyrics: Uint8Array = layout.lyrics3 ? data.subarray(layout.lyrics3.start, layout.lyrics3.end) : new Uint8Array(0)
  if (input.lyrics3 === null) lyrics = new Uint8Array(0)
  else if (input.lyrics3) lyrics = serializeLyrics3(input.lyrics3)
  // SPEC: Lyrics3 "resides between the audio and the ID3 tag, which must be present".
  if (lyrics.length && !id3v1.length) throw new TagWriteError('lyrics3-needs-id3v1', 'a Lyrics3 tag requires an ID3v1 tag after it')

  // SPEC: v2.4 structure §5: an appended tag goes "before tags from other tagging systems".
  const bytes = concat([head, audio, appendedV2, lyrics, id3v1])
  const oldHead = layout.audio.start
  const inPlace =
    head.length === oldHead &&
    bytes.length === data.length &&
    appendedV2.length + lyrics.length + id3v1.length === data.length - layout.audio.end &&
    equalTail(bytes, data, head.length)
  return { bytes, inPlace, headSize: head.length, warnings }
}

function equalTail(a: Uint8Array, b: Uint8Array, from: number): boolean {
  for (let i = from; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

const BIG_FRAME = 4096

/**
 * SPEC: v2.4 structure §5 option 2: "Prepend a tag with all vital information and add a second tag
 * at the end of the file ... The first tag is required to have a SEEK frame." The appended tag is
 * marked as an update so that readers merge it instead of discarding the first tag.
 */
function writeBoth(
  tag: ID3v2Tag,
  audioLength: number,
  opts: WriteOptions,
  appendFrame?: (f: Frame) => boolean,
): { head: Uint8Array; tail: Uint8Array; warnings: Warning[] } {
  const isBig =
    appendFrame ??
    ((f: Frame) => {
      if (f.type === 'picture' || f.type === 'geob') return true
      try {
        return encodeFrame(f, 4, new WarningSink()).length > BIG_FRAME
      } catch {
        return false
      }
    })
  const frames = tag.frames.filter((f) => f.type !== 'seek')
  const later = frames.filter(isBig)
  const first = frames.filter((f) => !isBig(f))
  if (!later.length) throw new TagWriteError('both-empty', "nothing to put in the appended tag; use id3v2Location 'prepend'")
  const appended: ID3v2Tag = {
    version: { major: 4, revision: tag.version.revision },
    flags: { unsynchronisation: tag.flags.unsynchronisation, footer: true },
    extendedHeader: { version: 4, isUpdate: true },
    frames: later,
    padding: 0,
  }
  const { originalSize: _ignored, ...rest } = opts
  const tail = writeID3v2(appended, { ...rest, padding: 0 })
  const seek = createFrame('seek', 'SEEK', { minimumOffset: audioLength }, 4)
  const prepended: ID3v2Tag = { ...tag, flags: { ...tag.flags, footer: false }, frames: [...first, seek] }
  const head = writeID3v2(prepended, opts)
  return { head: head.bytes, tail: tail.bytes, warnings: [...head.warnings, ...tail.warnings] }
}

/** Removes the chosen tag types from a file. */
export function stripTags(data: Uint8Array, which: { id3v2?: boolean; id3v1?: boolean; lyrics3?: boolean } = { id3v2: true, id3v1: true, lyrics3: true }): Uint8Array {
  const input: WriteTagsInput = {}
  if (which.id3v2) input.id3v2 = null
  if (which.id3v1) input.id3v1 = null
  if (which.lyrics3 || which.id3v1) input.lyrics3 = null
  return writeTags(data, input).bytes
}

