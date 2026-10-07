import { ByteReader, ByteWriter } from '../core/bytes.js'
import type { WarningSink } from '../core/errors.js'
import { decodeSynchsafe, encodeSynchsafe } from '../core/synchsafe.js'

// SPEC: v2.3 §3.2
//   Extended header size   $xx xx xx xx   (6 or 10, excludes itself)
//   Extended flags         $xx xx         %x0000000 00000000, x = CRC present
//   Size of padding        $xx xx xx xx
//   Total frame CRC        $xx xx xx xx   (only when x is set)
export interface ExtendedHeaderV23 {
  version: 3
  /** CRC-32 of the frames, before unsynchronisation. */
  crc?: number
  paddingSize: number
  /** Flag bits other than the CRC bit, kept for round trips. */
  unknownFlags?: number
}

// SPEC: v2.4 structure §3.2
//   Extended header size   4 * %0xxxxxxx   (whole extended header, at least 6)
//   Number of flag bytes   $01
//   Extended Flags         $xx             %0bcd0000
// Each set flag carries data: a length byte, then the data.
export interface ExtendedHeaderV24 {
  version: 4
  /** b: this tag updates an earlier tag in the file. */
  isUpdate: boolean
  /** c: CRC-32 of frames + padding, stored as a 35-bit synchsafe integer. */
  crc?: number
  /** d: tag restrictions. */
  restrictions?: TagRestrictions
  /** Unknown flag bits; MUST be cleared (with their data) when the tag is modified. */
  unknownFlags?: { bits: number; data: Uint8Array[] }
}

export type ExtendedHeader = ExtendedHeaderV23 | ExtendedHeaderV24

/** SPEC: v2.4 structure §3.2 restriction byte %ppqrrstt. */
export interface TagRestrictions {
  /** p: 0 = 128 frames/1 MB, 1 = 64 frames/128 KB, 2 = 32 frames/40 KB, 3 = 32 frames/4 KB. */
  tagSize: 0 | 1 | 2 | 3
  /** q: 0 = no restriction, 1 = only ISO-8859-1 or UTF-8. */
  textEncoding: 0 | 1
  /** r: 0 = none, 1 = 1024 chars, 2 = 128 chars, 3 = 30 chars. */
  textFieldSize: 0 | 1 | 2 | 3
  /** s: 0 = none, 1 = only PNG or JPEG. */
  imageEncoding: 0 | 1
  /** t: 0 = none, 1 = at most 256x256, 2 = at most 64x64, 3 = exactly 64x64 unless required otherwise. */
  imageSize: 0 | 1 | 2 | 3
}

export function decodeRestrictions(b: number): TagRestrictions {
  return {
    tagSize: ((b >> 6) & 3) as TagRestrictions['tagSize'],
    textEncoding: ((b >> 5) & 1) as 0 | 1,
    textFieldSize: ((b >> 3) & 3) as TagRestrictions['textFieldSize'],
    imageEncoding: ((b >> 2) & 1) as 0 | 1,
    imageSize: (b & 3) as TagRestrictions['imageSize'],
  }
}

export function encodeRestrictions(r: TagRestrictions): number {
  return (r.tagSize << 6) | (r.textEncoding << 5) | (r.textFieldSize << 3) | (r.imageEncoding << 2) | r.imageSize
}

/** The limits from the spec tables, for validation. */
export function describeRestrictions(r: TagRestrictions): {
  maxFrames: number
  maxTagSize: number
  maxStringLength?: number
  encodings?: readonly number[]
  imageMimeTypes?: readonly string[]
  maxImageSize?: number
  exactImageSize?: number
} {
  const sizes = [
    [128, 1024 * 1024],
    [64, 128 * 1024],
    [32, 40 * 1024],
    [32, 4 * 1024],
  ] as const
  const [maxFrames, maxTagSize] = sizes[r.tagSize]
  const out: ReturnType<typeof describeRestrictions> = { maxFrames, maxTagSize }
  if (r.textEncoding) out.encodings = [0, 3]
  if (r.textFieldSize) out.maxStringLength = [0, 1024, 128, 30][r.textFieldSize]!
  if (r.imageEncoding) out.imageMimeTypes = ['image/png', 'image/jpeg']
  if (r.imageSize === 1) out.maxImageSize = 256
  if (r.imageSize === 2) out.maxImageSize = 64
  if (r.imageSize === 3) out.exactImageSize = 64
  return out
}

/** Parses a v2.3 extended header from already-resynchronised tag data. Returns its total size. */
export function parseExtendedHeaderV23(
  data: Uint8Array,
  offset: number,
  w: WarningSink,
): { header: ExtendedHeaderV23; size: number } {
  const r = new ByteReader(data, offset)
  const size = r.u32()
  if (size !== 6 && size !== 10) w.warn('ext-header-size', `v2.3 extended header size ${size}, expected 6 or 10`, { offset })
  const flags = r.u16()
  const paddingSize = r.u32()
  const header: ExtendedHeaderV23 = { version: 3, paddingSize }
  if (flags & 0x8000) {
    if (size < 10) w.warn('ext-header-crc', 'CRC flag set but extended header is too small', { offset })
    else header.crc = r.u32()
  }
  if (flags & 0x7fff) header.unknownFlags = flags & 0x7fff
  return { header, size: 4 + size }
}

export function serializeExtendedHeaderV23(h: ExtendedHeaderV23): Uint8Array {
  const w = new ByteWriter(14)
  const hasCrc = h.crc !== undefined
  w.u32(hasCrc ? 10 : 6)
  w.u16((hasCrc ? 0x8000 : 0) | (h.unknownFlags ?? 0))
  w.u32(h.paddingSize)
  if (hasCrc) w.u32(h.crc!)
  return w.toUint8Array()
}

export function parseExtendedHeaderV24(
  data: Uint8Array,
  offset: number,
  w: WarningSink,
): { header: ExtendedHeaderV24; size: number } {
  const size = decodeSynchsafe(data, offset)
  if (size < 6) w.warn('ext-header-size', `v2.4 extended header size ${size} is below 6`, { offset })
  const r = new ByteReader(data, offset + 4, offset + Math.max(size, 6))
  const flagBytes = r.u8()
  if (flagBytes !== 1) w.warn('ext-header-flag-bytes', `number of flag bytes is ${flagBytes}, expected 1`, { offset })
  const flags = r.u8()
  r.offset += Math.max(0, flagBytes - 1)
  const header: ExtendedHeaderV24 = { version: 4, isUpdate: false }
  const readData = (expected: number, name: string): Uint8Array => {
    const len = r.u8()
    if (len !== expected) w.warn('ext-header-flag-data', `${name} data length ${len}, expected ${expected}`, { offset })
    return r.bytes(len)
  }
  // SPEC: data for set flags comes in flag order (b, c, d).
  if (flags & 0x40) {
    header.isUpdate = true
    readData(0, 'update')
  }
  if (flags & 0x20) {
    const d = readData(5, 'CRC')
    header.crc = decodeSynchsafe(d, 0, 5)
  }
  if (flags & 0x10) {
    const d = readData(1, 'restrictions')
    header.restrictions = decodeRestrictions(d[0] ?? 0)
  }
  const unknown = flags & 0x8f
  if (unknown) {
    const list: Uint8Array[] = []
    for (let bit = 0x08; bit; bit >>= 1) if (unknown & bit && r.remaining) list.push(r.bytes(r.u8()))
    header.unknownFlags = { bits: unknown, data: list }
  }
  return { header, size: Math.max(size, 6) }
}

export function serializeExtendedHeaderV24(h: ExtendedHeaderV24, keepUnknown = false): Uint8Array {
  const body = new ByteWriter(16)
  let flags = 0
  if (h.isUpdate) {
    flags |= 0x40
    body.u8(0)
  }
  if (h.crc !== undefined) {
    flags |= 0x20
    body.u8(5).bytes(encodeSynchsafe(h.crc, 5))
  }
  if (h.restrictions) {
    flags |= 0x10
    body.u8(1).u8(encodeRestrictions(h.restrictions))
  }
  if (keepUnknown && h.unknownFlags) {
    flags |= h.unknownFlags.bits & 0x0f
    for (const d of h.unknownFlags.data) body.u8(d.length).bytes(d)
  }
  const b = body.toUint8Array()
  const out = new ByteWriter(6 + b.length)
  out.bytes(encodeSynchsafe(6 + b.length)).u8(1).u8(flags).bytes(b)
  return out.toUint8Array()
}

/** Offset of the CRC value inside a serialised v2.4 extended header, or -1. */
export function crcOffsetV24(h: ExtendedHeaderV24): number {
  if (h.crc === undefined) return -1
  return 6 + (h.isUpdate ? 1 : 0) + 1
}
