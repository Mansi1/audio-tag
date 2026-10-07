import { ByteReader, ByteWriter, asciiString, startsWith } from '../core/bytes.js'
import { TagWriteError, type WarningSink } from '../core/errors.js'
import { afterID3v2 } from '../file/detect.js'

// SPEC: spec/flac/rfc9639.md §8.1. A metadata block is a 4-byte header (last-block flag, 7-bit
// type, 24-bit big-endian size) and its data.

export class FLACWriteError extends TagWriteError {
  override name = 'FLACWriteError'
}

export const BlockType = {
  STREAMINFO: 0,
  PADDING: 1,
  APPLICATION: 2,
  SEEKTABLE: 3,
  VORBIS_COMMENT: 4,
  CUESHEET: 5,
  PICTURE: 6,
} as const

/** §8.1: the size field is 24 bits, so no block can hold more than this. */
export const MAX_BLOCK_SIZE = 0xffffff

export interface BlockHeader {
  type: number
  /** Offset of the 4-byte header. */
  start: number
  /** End of the block data. */
  end: number
}

export interface FLACLayout {
  /** Offset of the "fLaC" marker: after any ID3v2 tags in front of the stream (F3). */
  start: number
  /** Metadata blocks in file order. */
  blocks: BlockHeader[]
  /** First byte after the last metadata block: the first audio frame. */
  audioStart: number
}

/** Where the "fLaC" marker is, or -1. */
export function markerOffset(data: Uint8Array): number {
  const p = afterID3v2(data)
  return startsWith(data, 'fLaC', p) ? p : -1
}

/**
 * Walks the metadata block headers. `head` must reach at least to the end of the last block
 * (the first audio frame); random-access readers find that point first with blockEnd().
 */
export function readLayout(head: Uint8Array, w: WarningSink): FLACLayout | undefined {
  const start = markerOffset(head)
  if (start < 0) {
    w.warn('flac-marker', 'no "fLaC" marker: not a FLAC stream')
    return undefined
  }
  const blocks: BlockHeader[] = []
  let pos = start + 4
  for (;;) {
    if (pos + 4 > head.length) {
      w.warn('flac-truncated', 'the metadata ends before the last-block flag', { offset: pos })
      break
    }
    const last = (head[pos]! & 0x80) !== 0
    const type = head[pos]! & 0x7f
    const size = (head[pos + 1]! << 16) | (head[pos + 2]! << 8) | head[pos + 3]!
    // SPEC: §8.1 "A value of 127 (i.e., 0b1111111) is forbidden."
    if (type === 127) w.warn('flac-block-type', 'metadata block type 127 is forbidden', { offset: pos })
    const end = pos + 4 + size
    if (end > head.length) {
      w.warn('flac-truncated', `metadata block ${type} runs past the end of the data`, { offset: pos })
      break
    }
    blocks.push({ type, start: pos, end })
    pos = end
    if (last) break
  }
  // SPEC: §8 "The first metadata block MUST be a streaminfo metadata block."
  if (blocks[0]?.type !== BlockType.STREAMINFO) w.warn('flac-streaminfo', 'the first metadata block is not streaminfo', { offset: start + 4 })
  return { start, blocks, audioStart: pos }
}

/** Header fields of the block at `pos`, for walking a file without reading the block data. */
export function parseBlockHeader(h: Uint8Array): { last: boolean; type: number; size: number } {
  return { last: (h[0]! & 0x80) !== 0, type: h[0]! & 0x7f, size: (h[1]! << 16) | (h[2]! << 8) | h[3]! }
}

/** A block with its 4-byte header. */
export function serializeBlock(type: number, data: Uint8Array, last: boolean): Uint8Array {
  if (data.length > MAX_BLOCK_SIZE) {
    throw new FLACWriteError('flac-block-size', `metadata block ${type} is ${data.length} bytes; the 24-bit size field allows ${MAX_BLOCK_SIZE}`)
  }
  return new ByteWriter(4 + data.length)
    .u8((last ? 0x80 : 0) | type)
    .u24(data.length)
    .bytes(data)
    .toUint8Array()
}

export interface StreamInfo {
  minBlockSize: number
  maxBlockSize: number
  minFrameSize: number
  maxFrameSize: number
  /** Hz; 0 for non-audio. */
  sampleRate: number
  channels: number
  bitsPerSample: number
  /** Total interchannel samples; 0 when unknown. */
  totalSamples: number
  md5: Uint8Array
}

/** SPEC: §8.2 Table 3, 34 bytes. */
export function parseStreamInfo(data: Uint8Array, w: WarningSink): StreamInfo | undefined {
  if (data.length !== 34) {
    w.warn('flac-streaminfo-size', `streaminfo is ${data.length} bytes, not 34`)
    if (data.length < 34) return undefined
  }
  const r = new ByteReader(data)
  const minBlockSize = r.u16()
  const maxBlockSize = r.u16()
  const minFrameSize = r.u24()
  const maxFrameSize = r.u24()
  const b = r.bytes(8)
  return {
    minBlockSize,
    maxBlockSize,
    minFrameSize,
    maxFrameSize,
    sampleRate: (b[0]! << 12) | (b[1]! << 4) | (b[2]! >> 4), // u(20)
    channels: ((b[2]! >> 1) & 0x07) + 1, // u(3) + 1
    bitsPerSample: (((b[2]! & 0x01) << 4) | (b[3]! >> 4)) + 1, // u(5) + 1
    totalSamples: (b[3]! & 0x0f) * 2 ** 32 + ((b[4]! << 24) >>> 0) + (b[5]! << 16) + (b[6]! << 8) + b[7]!, // u(36)
    md5: r.bytes(16),
  }
}

export interface FLACPicture {
  /** §8.8 Table 13 (the ID3v2 APIC picture types). 3 = front cover. */
  type: number
  /** Media type, or "-->" when `data` is a URI. */
  mimeType: string
  description: string
  width: number
  height: number
  /** Colour depth in bits per pixel; 0 when unknown. */
  depth: number
  /** Number of colours of an indexed picture; 0 otherwise. */
  colors: number
  data: Uint8Array
}

const utf8 = new TextDecoder('utf-8')
const utf8Encoder = new TextEncoder()
const PRINTABLE_ASCII = /^[\x20-\x7e]*$/

/** SPEC: §8.8 Table 12. Lengths and numbers are big-endian. */
export function parsePicture(data: Uint8Array, w: WarningSink): FLACPicture | undefined {
  try {
    const r = new ByteReader(data)
    const type = r.u32()
    const mimeType = asciiString(r.bytes(r.u32()))
    // SPEC: §8.8 the media type "must be in printable ASCII characters 0x20-0x7E".
    if (!PRINTABLE_ASCII.test(mimeType)) w.warn('flac-picture-mime', 'picture media type is not printable ASCII')
    const description = utf8.decode(r.bytes(r.u32()))
    const width = r.u32()
    const height = r.u32()
    const depth = r.u32()
    const colors = r.u32()
    const pic = r.bytes(r.u32())
    if (r.remaining) w.warn('flac-picture-trailing', `${r.remaining} bytes after the picture data`)
    return { type, mimeType, description, width, height, depth, colors, data: pic }
  } catch {
    w.warn('flac-picture', 'picture block is truncated; it is kept as it is')
    return undefined
  }
}

export function serializePicture(p: FLACPicture): Uint8Array {
  if (!PRINTABLE_ASCII.test(p.mimeType)) throw new FLACWriteError('flac-picture-mime', `picture media type "${p.mimeType}" is not printable ASCII`)
  const mime = utf8Encoder.encode(p.mimeType)
  const desc = utf8Encoder.encode(p.description)
  return new ByteWriter(32 + mime.length + desc.length + p.data.length)
    .u32(p.type)
    .u32(mime.length)
    .bytes(mime)
    .u32(desc.length)
    .bytes(desc)
    .u32(p.width)
    .u32(p.height)
    .u32(p.depth)
    .u32(p.colors)
    .u32(p.data.length)
    .bytes(p.data)
    .toUint8Array()
}
