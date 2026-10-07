import { ByteWriter, bigToBytes, bytesToBig } from '../core/bytes.js'
import { MP4WriteError } from './atoms.js'

/**
 * Data type codes. QTFF Well-known_types.md defines 0-5, 13, 14, 21-24, 27, 28, 65-79.
 * iTunes adds codes documented by mutagen (spec/mp4/mutagen-mp4.md); see M5 for the overlaps.
 */
export const DataType = {
  Implicit: 0,
  UTF8: 1,
  UTF16: 2,
  SJIS: 3,
  UTF8Sort: 4,
  UTF16Sort: 5,
  HTML: 6,
  XML: 7,
  UUID: 8,
  ISRC: 9,
  MI3P: 10,
  GIF: 12,
  JPEG: 13,
  PNG: 14,
  URL: 15,
  Duration: 16,
  DateTime: 17,
  Genres: 18,
  SignedInt: 21,
  UnsignedInt: 22,
  Float32: 23,
  Float64: 24,
  UPC: 25,
  BMP: 27,
  MetadataAtom: 28,
  Int8: 65,
  Int16: 66,
  Int32: 67,
  Int64: 74,
  UInt8: 75,
  UInt16: 76,
  UInt32: 77,
  UInt64: 78,
} as const

const utf8 = new TextDecoder('utf-8')
const utf8Enc = new TextEncoder()

function utf16be(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i + 1 < b.length; i += 2) s += String.fromCharCode((b[i]! << 8) | b[i + 1]!)
  return s
}

function toUtf16be(s: string): Uint8Array {
  const out = new Uint8Array(s.length * 2)
  for (let i = 0; i < s.length; i++) {
    out[2 * i] = s.charCodeAt(i) >> 8
    out[2 * i + 1] = s.charCodeAt(i) & 0xff
  }
  return out
}

/** A value as stored: type indicator, locale indicator and raw bytes. */
export interface MP4Value {
  type: number
  locale: number
  data: Uint8Array
}

const TEXT_TYPES = new Set<number>([DataType.UTF8, DataType.UTF16, DataType.UTF8Sort, DataType.UTF16Sort, DataType.ISRC, DataType.MI3P, DataType.URL, DataType.UPC, DataType.HTML, DataType.XML])

/** Decodes a text value; undefined for non-text types. */
export function valueText(v: MP4Value): string | undefined {
  if (v.type === DataType.UTF16 || v.type === DataType.UTF16Sort) return utf16be(v.data)
  if (TEXT_TYPES.has(v.type)) return utf8.decode(v.data)
  return undefined
}

export function textValue(s: string, type: number = DataType.UTF8): MP4Value {
  return { type, locale: 0, data: type === DataType.UTF16 || type === DataType.UTF16Sort ? toUtf16be(s) : utf8Enc.encode(s) }
}

/**
 * SPEC: Well-known_types.md 21/22 "a big-endian (un)signed integer in 1,2,3 or 4 bytes; size of
 * value determines integer size". iTunes also writes 8 bytes (plID), see M5.
 */
export function valueInt(v: MP4Value): number | bigint | undefined {
  const d = v.data
  const signed = v.type === DataType.SignedInt || v.type === DataType.Int8 || v.type === DataType.Int16 || v.type === DataType.Int32 || v.type === DataType.Int64
  const unsigned = v.type === DataType.UnsignedInt || v.type === DataType.UInt8 || v.type === DataType.UInt16 || v.type === DataType.UInt32 || v.type === DataType.UInt64 || v.type === DataType.Implicit
  if ((!signed && !unsigned) || d.length === 0 || d.length > 8) return undefined
  let big = bytesToBig(d)
  if (signed && d[0]! & 0x80) big -= 1n << BigInt(8 * d.length)
  return d.length <= 6 || (big >= BigInt(Number.MIN_SAFE_INTEGER) && big <= BigInt(Number.MAX_SAFE_INTEGER)) ? Number(big) : big
}

/** An integer value in the smallest of 1, 2, 4 or 8 bytes (or exactly `bytes`). */
export function intValue(n: number | bigint, bytes?: 1 | 2 | 4 | 8, type: number = DataType.SignedInt): MP4Value {
  const big = BigInt(n)
  const size = bytes ?? (big >= -128n && big <= 127n ? 1 : big >= -32768n && big <= 32767n ? 2 : big >= -(2n ** 31n) && big < 2n ** 31n ? 4 : 8)
  const range = 1n << BigInt(8 * size)
  if (big < -(range / 2n) || big >= range) throw new MP4WriteError('mp4-int-range', `${n} does not fit in ${size} bytes`)
  return { type, locale: 0, data: bigToBytes(big < 0n ? big + range : big, size) }
}

export function valueFloat(v: MP4Value): number | undefined {
  const dv = new DataView(v.data.buffer, v.data.byteOffset, v.data.byteLength)
  if (v.type === DataType.Float32 && v.data.length === 4) return dv.getFloat32(0)
  if (v.type === DataType.Float64 && v.data.length === 8) return dv.getFloat64(0)
  return undefined
}

/** SPEC (de facto, task 26): trkn is 00 00, number u16, total u16, 00 00; disk omits the last two bytes. */
export function decodePair(v: MP4Value): { no: number; of: number } | undefined {
  const d = v.data
  if (d.length < 6) return undefined
  return { no: (d[2]! << 8) | d[3]!, of: (d[4]! << 8) | d[5]! }
}

export function encodePair(no: number, of: number, kind: 'trkn' | 'disk'): MP4Value {
  for (const x of [no, of]) if (!Number.isInteger(x) || x < 0 || x > 0xffff) throw new MP4WriteError('mp4-pair-range', `${kind} values must be 0-65535`)
  const w = new ByteWriter(8).u16(0).u16(no).u16(of)
  if (kind === 'trkn') w.u16(0)
  return { type: DataType.Implicit, locale: 0, data: w.toUint8Array() }
}

/** Image MIME type for covr data types 13, 14, 27 (and iTunes' 12 GIF). */
export function imageMime(type: number): string | undefined {
  return { 12: 'image/gif', 13: 'image/jpeg', 14: 'image/png', 27: 'image/bmp' }[type]
}

export function imageType(mime: string): number {
  const m = mime.toLowerCase()
  if (m === 'image/jpeg' || m === 'image/jpg') return DataType.JPEG
  if (m === 'image/png') return DataType.PNG
  if (m === 'image/bmp') return DataType.BMP
  throw new MP4WriteError('mp4-image-type', `MP4 cover art must be JPEG, PNG or BMP, not ${mime}`)
}

/** SPEC: Language_code_values.md: three lowercase letters packed as 5-bit values (char - 0x60). */
export function packLanguage(code: string): number {
  if (!/^[a-z]{3}$/.test(code)) throw new MP4WriteError('mp4-language', `"${code}" is not a lowercase ISO 639-2/T code`)
  return ((code.charCodeAt(0) - 0x60) << 10) | ((code.charCodeAt(1) - 0x60) << 5) | (code.charCodeAt(2) - 0x60)
}

export function unpackLanguage(v: number): string | undefined {
  if (v < 0x400 || v === 0x7fff) return undefined
  return String.fromCharCode(((v >> 10) & 31) + 0x60, ((v >> 5) & 31) + 0x60, (v & 31) + 0x60)
}

/** SPEC: Locale_indicator.md: country u16 then language u16; 0 = default, 1-255 = list index. */
export function decodeLocale(locale: number): { country: number | string; language: number | string } {
  const c = locale >>> 16
  const l = locale & 0xffff
  return {
    country: c > 255 ? String.fromCharCode(c >> 8, c & 0xff) : c,
    language: l > 255 ? (unpackLanguage(l) ?? l) : l,
  }
}

// Mac Roman 0x80-0xFF (M7: Macintosh language codes use Macintosh text encoding).
const MAC_ROMAN =
  'ÄÅÇÉÑÖÜáàâäãåçéèêëíìîïñóòôöõúùûü†°¢£§•¶ß®©™´¨≠ÆØ∞±≤≥¥µ∂∑∏π∫ªºΩæø¿¡¬√ƒ≈∆«»… ÀÃÕŒœ–—“”‘’÷◊ÿŸ⁄€‹›ﬁﬂ‡·‚„‰ÂÊÁËÈÍÎÏÌÓÔÒÚÛÙıˆ˜¯˘˙˚¸˝˛ˇ'

export function decodeMacRoman(b: Uint8Array): string {
  let s = ''
  for (const x of b) s += x < 0x80 ? String.fromCharCode(x) : MAC_ROMAN[x - 0x80]!
  return s
}

let macRomanReverse: Map<string, number> | undefined

/** Encodes Mac Roman; undefined when a character has no Mac Roman form. */
export function encodeMacRoman(s: string): Uint8Array | undefined {
  macRomanReverse ??= new Map(Array.from(MAC_ROMAN, (c, i) => [c, 0x80 + i]))
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c < 0x80) out[i] = c
    else {
      const b = macRomanReverse.get(s[i]!)
      if (b === undefined) return undefined
      out[i] = b
    }
  }
  return out
}
