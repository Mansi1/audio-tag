import { concat, equalBytes } from '../core/bytes.js'
import { type Warning, WarningSink } from '../core/errors.js'
import type { Segment } from '../file/segments.js'
import {
  BlockType,
  type FLACLayout,
  type FLACPicture,
  FLACWriteError,
  MAX_BLOCK_SIZE,
  type StreamInfo,
  parsePicture,
  parseStreamInfo,
  readLayout,
  serializeBlock,
  serializePicture,
} from './blocks.js'
import { type VorbisComment, parseVorbisComment, serializeVorbisComment } from './vorbis.js'

export interface FLACTags {
  /** The Vorbis comment block; undefined when the file has none. */
  vorbis?: VorbisComment
  pictures: FLACPicture[]
}

export interface ReadFLACResult {
  tags: FLACTags
  streamInfo?: StreamInfo
  layout: FLACLayout
  warnings: Warning[]
}

export interface FLACWriteOptions {
  /** Padding to leave when the metadata no longer fits and the file is rewritten (F4). Default 1024. */
  padding?: number
  strict?: boolean
}

export interface FLACWriteResult {
  segments: Segment[]
  /** The file length and the audio position did not change. */
  inPlace: boolean
  warnings: Warning[]
}

/**
 * Reads the tags from the start of a FLAC file. `head` must reach to the first audio frame; the
 * audio itself is not needed.
 */
export function readFLACHead(head: Uint8Array, w: WarningSink = new WarningSink()): ReadFLACResult {
  const layout = readLayout(head, w) ?? { start: 0, blocks: [], audioStart: 0 }
  const tags: FLACTags = { pictures: [] }
  let streamInfo: StreamInfo | undefined
  for (const b of layout.blocks) {
    const data = head.subarray(b.start + 4, b.end)
    if (b.type === BlockType.STREAMINFO && b === layout.blocks[0]) streamInfo = parseStreamInfo(data, w)
    else if (b.type === BlockType.VORBIS_COMMENT) {
      // SPEC: §8.6 "A FLAC file MUST NOT contain more than one Vorbis comment metadata block."
      if (tags.vorbis) w.warn('flac-vorbis-count', 'more than one Vorbis comment block; using the first', { offset: b.start })
      else tags.vorbis = parseVorbisComment(data, w)
    } else if (b.type === BlockType.PICTURE) {
      const p = parsePicture(data, w)
      if (p) tags.pictures.push(p)
    }
  }
  // F3: ID3 tags around the stream are not FLAC metadata.
  if (layout.start > 0) w.note('flac-id3', 'an ID3v2 tag in front of the FLAC stream is ignored (readID3File() reads it) and kept on write')
  const out: ReadFLACResult = { tags, layout, warnings: w.list }
  if (streamInfo) out.streamInfo = streamInfo
  return out
}

/** Reads a whole FLAC file. */
export function readFLAC(data: Uint8Array, options: { strict?: boolean } = {}): ReadFLACResult {
  return readFLACHead(data, new WarningSink(options.strict ?? false))
}

/** The bytes each existing block would get if written again unchanged: detects unchanged tags. */
const snapshot = {
  vorbis: (data: Uint8Array) => serializeVorbisComment(parseVorbisComment(data, new WarningSink())),
  picture: (data: Uint8Array) => {
    const p = parsePicture(data, new WarningSink())
    return p ? serializePicture(p) : undefined
  },
}

/**
 * Plans writing `tags` into a FLAC file whose metadata is in `head` (up to the first audio frame).
 * Other blocks keep their bytes and order (F8); the space of the old blocks and padding is reused
 * (F4). Returns the new head and the byte range of the audio.
 */
export function planFLACWrite(head: Uint8Array, fileLength: number, tags: FLACTags, options: FLACWriteOptions = {}): FLACWriteResult {
  const w = new WarningSink(options.strict ?? false)
  const layout = readLayout(head, new WarningSink())
  if (!layout) throw new FLACWriteError('flac-marker', 'no "fLaC" marker: not a FLAC stream')
  const last = layout.blocks[layout.blocks.length - 1]
  if (!last || last.end !== layout.audioStart || (head[last.start]! & 0x80) === 0) {
    throw new FLACWriteError('flac-truncated', 'the metadata blocks are truncated; the file cannot be written safely')
  }
  const data = (b: (typeof layout.blocks)[number]) => head.subarray(b.start + 4, b.end)

  // The new comment block, or the old bytes when it is unchanged.
  const oldComment = layout.blocks.find((b) => b.type === BlockType.VORBIS_COMMENT)
  let comment = tags.vorbis ? serializeVorbisComment(tags.vorbis) : undefined
  if (comment && oldComment && equalBytes(snapshot.vorbis(data(oldComment)), comment)) comment = data(oldComment)

  // F5: pictures that are unchanged keep their old bytes.
  const oldPictures = layout.blocks.filter((b) => b.type === BlockType.PICTURE && snapshot.picture(data(b)))
  const unused = new Set(oldPictures)
  // SPEC: §8.8 "There MAY only be one each of picture types 1 and 2 in a file."
  for (const t of [1, 2]) {
    if (tags.pictures.filter((p) => p.type === t).length > 1) throw new FLACWriteError('flac-picture-icon', `only one picture of type ${t} (file icon) is allowed`)
  }
  const pictures = tags.pictures.map((p) => {
    const bytes = serializePicture(p)
    const same = [...unused].find((b) => equalBytes(snapshot.picture(data(b))!, bytes))
    if (!same) return bytes
    unused.delete(same)
    return data(same)
  })

  // F8: keep the order; drop padding, the old comment and the old (parsed) pictures.
  const blocks: { type: number; data: Uint8Array }[] = []
  let commentDone = false
  let picturesDone = false
  for (const b of layout.blocks) {
    if (b.type === BlockType.PADDING) continue
    if (b.type === BlockType.VORBIS_COMMENT) {
      if (!commentDone && comment) blocks.push({ type: b.type, data: comment })
      commentDone = true
      continue
    }
    if (oldPictures.includes(b)) {
      if (!picturesDone) for (const p of pictures) blocks.push({ type: BlockType.PICTURE, data: p })
      picturesDone = true
      continue
    }
    blocks.push({ type: b.type, data: data(b) })
  }
  if (!commentDone && comment) blocks.push({ type: BlockType.VORBIS_COMMENT, data: comment })
  if (!picturesDone) for (const p of pictures) blocks.push({ type: BlockType.PICTURE, data: p })

  const kept = layout.blocks.filter((b) => b.type !== BlockType.PADDING)
  const unchanged = blocks.length === kept.length && blocks.every((b, i) => b.type === kept[i]!.type && equalBytes(b.data, data(kept[i]!)))
  if (unchanged) return { segments: [{ start: 0, end: fileLength }], inPlace: true, warnings: w.list }

  const available = layout.audioStart - (layout.start + 4)
  const needed = blocks.reduce((n, b) => n + 4 + b.data.length, 0)
  const left = available - needed
  // In place: the space left becomes padding. Otherwise the requested padding; 0 means no block.
  let padding = 0
  if (left >= 4) padding = left - 4
  else if (left !== 0) padding = Math.min(MAX_BLOCK_SIZE, Math.max(0, options.padding ?? 1024))
  if (left >= 4 || padding > 0) blocks.push({ type: BlockType.PADDING, data: new Uint8Array(padding) })

  const newHead = concat([head.subarray(0, layout.start + 4), ...blocks.map((b, i) => serializeBlock(b.type, b.data, i === blocks.length - 1))])
  const segments: Segment[] = [newHead]
  if (layout.audioStart < fileLength) segments.push({ start: layout.audioStart, end: fileLength })
  return { segments, inPlace: newHead.length === layout.audioStart, warnings: w.list }
}
