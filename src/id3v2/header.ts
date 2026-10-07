import { startsWith } from '../core/bytes.js'
import { decodeSynchsafe, encodeSynchsafe } from '../core/synchsafe.js'

export const HEADER_SIZE = 10

/** Normalised tag header flags. Each flag only exists in the versions noted. */
export interface TagHeaderFlags {
  /** a: all versions. v2.2/v2.3: the whole tag is unsynchronised. v2.4: every frame is. */
  unsynchronisation: boolean
  /** v2.2 bit 6: compression. The spec says to ignore the whole tag when it is set. */
  compression?: boolean
  /** v2.3/v2.4 bit 6. */
  extendedHeader?: boolean
  /** v2.3/v2.4 bit 5. */
  experimental?: boolean
  /** v2.4 bit 4. */
  footer?: boolean
  /** Undefined bits that were set; kept for round trips and cleared when the tag is modified. */
  unknownBits?: number
}

export interface TagHeader {
  major: number
  revision: number
  flags: TagHeaderFlags
  /** Size field: everything after the header, excluding the footer. */
  size: number
  rawFlags: number
}

// SPEC: v2.4 §3.1 / v2.3 §3.1 / v2.2 §3.1 detection pattern:
//   $49 44 33 yy yy xx zz zz zz zz   where yy < $FF and zz < $80
export function isTagHeader(data: Uint8Array, offset = 0, marker: 'ID3' | '3DI' = 'ID3'): boolean {
  if (!startsWith(data, marker, offset) || offset + HEADER_SIZE > data.length) return false
  if (data[offset + 3]! === 0xff || data[offset + 4]! === 0xff) return false
  for (let i = 6; i < 10; i++) if (data[offset + i]! >= 0x80) return false
  return true
}

function knownMask(major: number): number {
  if (major === 2) return 0xc0
  if (major === 3) return 0xe0
  return 0xf0
}

export function decodeTagFlags(major: number, b: number): TagHeaderFlags {
  const flags: TagHeaderFlags = { unsynchronisation: (b & 0x80) !== 0 }
  if (major === 2) flags.compression = (b & 0x40) !== 0
  else {
    flags.extendedHeader = (b & 0x40) !== 0
    flags.experimental = (b & 0x20) !== 0
    if (major >= 4) flags.footer = (b & 0x10) !== 0
  }
  const unknown = b & ~knownMask(major) & 0xff
  if (unknown) flags.unknownBits = unknown
  return flags
}

export function encodeTagFlags(major: number, f: TagHeaderFlags, keepUnknown = false): number {
  let b = f.unsynchronisation ? 0x80 : 0
  if (major === 2) {
    if (f.compression) b |= 0x40
  } else {
    if (f.extendedHeader) b |= 0x40
    if (f.experimental) b |= 0x20
    if (major >= 4 && f.footer) b |= 0x10
  }
  if (keepUnknown && f.unknownBits) b |= f.unknownBits & ~knownMask(major) & 0xff
  return b
}

/** Parses a 10-byte header (or a v2.4 footer when `marker` is "3DI"). */
export function parseTagHeader(data: Uint8Array, offset = 0, marker: 'ID3' | '3DI' = 'ID3'): TagHeader | null {
  if (!isTagHeader(data, offset, marker)) return null
  const major = data[offset + 3]!
  const rawFlags = data[offset + 5]!
  return {
    major,
    revision: data[offset + 4]!,
    rawFlags,
    flags: decodeTagFlags(major, rawFlags),
    size: decodeSynchsafe(data, offset + 6),
  }
}

export function serializeTagHeader(
  major: number,
  revision: number,
  flags: TagHeaderFlags,
  size: number,
  marker: 'ID3' | '3DI' = 'ID3',
  keepUnknownFlags = false,
): Uint8Array {
  const out = new Uint8Array(HEADER_SIZE)
  for (let i = 0; i < 3; i++) out[i] = marker.charCodeAt(i)
  out[3] = major
  out[4] = revision
  out[5] = encodeTagFlags(major, flags, keepUnknownFlags)
  out.set(encodeSynchsafe(size), 6)
  return out
}
