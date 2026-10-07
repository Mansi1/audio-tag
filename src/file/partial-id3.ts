import { asciiString, concat, startsWith, isBytes } from '../core/bytes.js'
import { TagWriteError, type Warning } from '../core/errors.js'
import { decodeSynchsafe } from '../core/synchsafe.js'
import { MP4_NOT_ID3, type ID3ReadResult, type ID3WriteInput, type ID3WriteOptions, readID3File, writeID3File } from '../api/api-id3.js'
import type { Segment } from './segments.js'
import { type AudioFormat, detectFormat } from './detect.js'
import type { FileLayout, LocateOptions } from './layout.js'

/** Random access to a file-like source (a Blob, a Node file handle, ...). */
export interface RandomAccess {
  size: number
  read(offset: number, length: number): Promise<Uint8Array>
}

export type { Segment }

/** Files up to this size are simply read whole. */
export const WHOLE_FILE_LIMIT = 1024 * 1024
/** Stands in for the audio between the head and tail regions; zeros never start a tag. */
const FILLER = 16

interface Regions {
  head: Uint8Array
  tail: Uint8Array
  /** Offset of the tail region in the real file. */
  tailStart: number
}

/** Where the prepended ID3v2 tags end: "ID3" headers stacked from offset 0. */
export async function headEnd(src: RandomAccess): Promise<number> {
  let pos = 0
  while (pos + 10 <= src.size) {
    const h = await src.read(pos, 10)
    if (!startsWith(h, 'ID3') || h[3] === 0xff || h[4] === 0xff || h.subarray(6).some((b) => b >= 0x80)) break
    const footer = h[3] === 4 && (h[5]! & 0x10) !== 0
    pos += 10 + decodeSynchsafe(h, 6) + (footer ? 10 : 0)
  }
  return Math.min(pos, src.size)
}

/** Where the tail tags start: ID3v1, Lyrics3 and appended ID3v2 tags, read from the back. */
async function tailStart(src: RandomAccess, floor: number): Promise<number> {
  let end = src.size
  if (end - floor >= 128 && startsWith(await src.read(end - 128, 3), 'TAG')) end -= 128
  if (end - floor >= 9 + 11) {
    const marker = asciiString(await src.read(end - 9, 9))
    if (marker === 'LYRICS200' && end - floor >= 15) {
      const digits = asciiString(await src.read(end - 15, 6))
      if (/^[0-9]{6}$/.test(digits)) end = Math.max(floor, end - 15 - Number(digits))
    } else if (marker === 'LYRICSEND') {
      const from = Math.max(floor, end - 9 - 5100 - 11)
      const win = asciiString(await src.read(from, end - from))
      const at = win.lastIndexOf('LYRICSBEGIN')
      if (at >= 0) end = from + at
    }
  }
  while (end - floor >= 20) {
    const f = await src.read(end - 10, 10)
    if (!startsWith(f, '3DI') || f.subarray(6).some((b) => b >= 0x80)) break
    const start = end - 20 - decodeSynchsafe(f, 6)
    if (start < floor) break
    end = start
  }
  return end
}

async function regions(src: RandomAccess): Promise<Regions | Uint8Array> {
  if (src.size <= WHOLE_FILE_LIMIT) return src.read(0, src.size)
  const h = await headEnd(src)
  const t = await tailStart(src, h)
  if (t - h < FILLER) return src.read(0, src.size)
  return { head: await src.read(0, h), tail: await src.read(t, src.size - t), tailStart: t }
}

function synthetic(r: Regions): Uint8Array {
  return concat([r.head, new Uint8Array(FILLER), r.tail])
}

/** Maps offsets in the synthetic buffer back to the real file. */
function mapLayout(layout: FileLayout, r: Regions): FileLayout {
  const split = r.head.length + FILLER
  const delta = r.tailStart - split
  const m = (x: number) => (x >= split ? x + delta : x)
  return {
    id3v2: layout.id3v2.map((t) => ({ ...t, start: m(t.start), end: m(t.end) })),
    unsupported: layout.unsupported.map((u) => ({ ...u, offset: m(u.offset) })),
    ...(layout.lyrics3 ? { lyrics3: { ...layout.lyrics3, start: m(layout.lyrics3.start), end: m(layout.lyrics3.end) } } : {}),
    ...(layout.id3v1 ? { id3v1: { ...layout.id3v1, start: m(layout.id3v1.start), end: m(layout.id3v1.end) } } : {}),
    audio: { start: layout.audio.start, end: m(layout.audio.end) },
  }
}

function hasSeek(res: ID3ReadResult): boolean {
  return res.layout.id3v2.some((t) => t.tag.frames.some((f) => f.type === 'seek'))
}

/** Whether the file is MP4/M4A, from its first bytes (the tag regions alone do not tell). */
export async function isMP4(src: RandomAccess): Promise<boolean> {
  return detectFormat(await src.read(0, Math.min(16, src.size))) === 'mp4'
}

/** detectFormat() for a file read by random access: the prepended ID3v2 tags and 16 bytes after them. */
export async function detectRandomAccessFormat(src: RandomAccess): Promise<AudioFormat> {
  if (await isMP4(src)) return 'mp4'
  const h = await headEnd(src)
  return detectFormat(await src.read(0, Math.min(h + 16, src.size)))
}

/** Reads the ID3 tags of a file, loading only the tag regions of large files. */
export async function readID3RandomAccess(src: RandomAccess, options: LocateOptions = {}): Promise<ID3ReadResult> {
  if (await isMP4(src)) {
    // No ID3 here: report the format (with its "format-not-id3" warning) like readID3File() does.
    const res = readID3File(await src.read(0, Math.min(16, src.size)), options)
    return { ...res, layout: { ...res.layout, audio: { start: 0, end: src.size } } }
  }
  const r = await regions(src)
  if (isBytes(r)) return readID3File(r, options)
  const res = readID3File(synthetic(r), options)
  // A SEEK frame can point to a tag in the middle of the file: read everything.
  if (hasSeek(res)) return readID3File(await src.read(0, src.size), options)
  return { ...res, layout: mapLayout(res.layout, r) }
}

export interface PlannedWrite {
  /** The new file: new bytes, or byte ranges of the original file (never loaded for large files). */
  segments: Segment[]
  /** The file keeps its length and the audio does not move: only the new bytes need writing. */
  inPlace: boolean
  warnings: Warning[]
}

/** Plans an ID3 write without loading the audio of large files. */
export async function planID3FileWrite(src: RandomAccess, input: ID3WriteInput, options: ID3WriteOptions = {}): Promise<PlannedWrite> {
  if (await isMP4(src)) throw new TagWriteError('format-mp4', MP4_NOT_ID3)
  let r = await regions(src)
  if (!(isBytes(r)) && hasSeek(readID3File(synthetic(r), options.locate))) r = await src.read(0, src.size)
  if (isBytes(r)) {
    const res = writeID3File(r, input, options)
    return { segments: [res.bytes], inPlace: res.inPlace, warnings: res.warnings }
  }
  const res = writeID3File(synthetic(r), input, options)
  const head = res.bytes.subarray(0, res.headSize)
  const tail = res.bytes.subarray(res.headSize + FILLER)
  const sameTail = tail.length === r.tail.length && tail.every((b, i) => b === r.tail[i])
  return {
    segments: [head, { start: r.head.length, end: r.tailStart }, tail],
    inPlace: head.length === r.head.length && sameTail,
    warnings: res.warnings,
  }
}
