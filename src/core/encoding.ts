import type { ByteReader, ByteWriter } from './bytes.js'
import type { WarningSink } from './errors.js'
import { TagWriteError } from './errors.js'

// SPEC: v2.4 structure §4 (encodings $00-$03), v2.3 §3.3 and v2.2 §3.2 ($00 and $01 only).
export enum TextEncoding {
  /** ISO-8859-1, terminated with $00. */
  Latin1 = 0,
  /** v2.4: UTF-16 with BOM. v2.2 and v2.3: UCS-2 ("Unicode") with BOM. Terminated with $00 00. */
  UTF16 = 1,
  /** v2.4 only: UTF-16BE without BOM. Terminated with $00 00. */
  UTF16BE = 2,
  /** v2.4 only: UTF-8. Terminated with $00. */
  UTF8 = 3,
}

export type MajorVersion = 2 | 3 | 4

export function allowedEncodings(major: MajorVersion): readonly TextEncoding[] {
  return major === 4
    ? [TextEncoding.Latin1, TextEncoding.UTF16, TextEncoding.UTF16BE, TextEncoding.UTF8]
    : [TextEncoding.Latin1, TextEncoding.UTF16]
}

export function isAllowedEncoding(enc: number, major: MajorVersion): enc is TextEncoding {
  return (allowedEncodings(major) as readonly number[]).includes(enc)
}

export function terminatorWidth(enc: TextEncoding): 1 | 2 {
  return enc === TextEncoding.UTF16 || enc === TextEncoding.UTF16BE ? 2 : 1
}

export interface DecodeOptions {
  warnings?: WarningSink
  /** v2.2 strings may lack a BOM; they are read as big-endian. */
  major?: MajorVersion
  frameId?: string
}

export interface EncodeOptions {
  warnings?: WarningSink
  /** Byte order for $01 strings. Defaults to little-endian (BOM $FF FE). */
  littleEndian?: boolean
  /** Write $01 as UCS-2 (v2.2/v2.3): characters outside the BMP are rejected. */
  ucs2?: boolean
  frameId?: string
  /** For Latin-1, replace unrepresentable characters with "?" instead of throwing. */
  lenient?: boolean
}

// TextDecoder('latin1') is windows-1252 in every engine, which maps $80-$9F differently,
// so ISO-8859-1 is done by hand.
export function decodeLatin1(bytes: Uint8Array): string {
  let s = ''
  for (let i = 0; i < bytes.length; i += 8192) {
    s += String.fromCharCode(...bytes.subarray(i, i + 8192))
  }
  return s
}

export function isLatin1Representable(s: string): boolean {
  for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) > 0xff) return false
  return true
}

export function encodeLatin1(s: string, opts: EncodeOptions = {}): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    if (c > 0xff) {
      if (!opts.lenient) {
        throw new TagWriteError('latin1-range', `"${s}" contains a character outside ISO-8859-1`)
      }
      opts.warnings?.note('latin1-range', `replaced U+${c.toString(16)} with "?"`, frameIdOf(opts))
      out[i] = 0x3f
    } else out[i] = c
  }
  return out
}

function frameIdOf(o: { frameId?: string }): { frameId?: string } {
  return o.frameId === undefined ? {} : { frameId: o.frameId }
}

/** Remembers which byte order the BOMs in a frame used, for exact round trips. */
export interface Utf16State {
  littleEndian?: boolean
}

function decodeUtf16(bytes: Uint8Array, opts: DecodeOptions, state?: Utf16State): string {
  let le = false
  let start = 0
  if (bytes.length >= 2 && bytes[0] === 0xff && bytes[1] === 0xfe) {
    le = true
    start = 2
  } else if (bytes.length >= 2 && bytes[0] === 0xfe && bytes[1] === 0xff) {
    start = 2
  } else if (bytes.length > 0) {
    // SPEC: v2.3 §3.3 requires a BOM. v2.2 does not; read big-endian as UCS-2 is defined.
    if (opts.major !== 2) {
      opts.warnings?.warn('utf16-no-bom', 'UTF-16 string without BOM, reading as big-endian', frameIdOf(opts))
    }
    if (state?.littleEndian !== undefined) le = state.littleEndian
  }
  if (state && start === 2) {
    if (state.littleEndian !== undefined && state.littleEndian !== le) {
      // SPEC: v2.4 §4 "All strings in the same frame SHALL have the same byteorder."
      opts.warnings?.warn('utf16-mixed-bom', 'strings in one frame use different byte orders', frameIdOf(opts))
    }
    state.littleEndian ??= le
  }
  return decodeUtf16Units(bytes.subarray(start), le, opts)
}

function decodeUtf16Units(bytes: Uint8Array, le: boolean, opts: DecodeOptions): string {
  let len = bytes.length
  if (len % 2 === 1) {
    opts.warnings?.warn('utf16-odd-length', 'UTF-16 string has an odd number of bytes', frameIdOf(opts))
    len--
  }
  const units: number[] = []
  for (let i = 0; i < len; i += 2) {
    units.push(le ? bytes[i]! | (bytes[i + 1]! << 8) : (bytes[i]! << 8) | bytes[i + 1]!)
  }
  let s = ''
  for (let i = 0; i < units.length; i += 8192) s += String.fromCharCode(...units.slice(i, i + 8192))
  return s
}

function encodeUtf16(s: string, le: boolean, bom: boolean): Uint8Array {
  const out = new Uint8Array((bom ? 2 : 0) + s.length * 2)
  let o = 0
  if (bom) {
    out[o++] = le ? 0xff : 0xfe
    out[o++] = le ? 0xfe : 0xff
  }
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i)
    out[o++] = le ? c & 0xff : c >> 8
    out[o++] = le ? c >> 8 : c & 0xff
  }
  return out
}

const utf8Decoder = new TextDecoder('utf-8', { fatal: false })
const utf8Strict = new TextDecoder('utf-8', { fatal: true })
const utf8Encoder = new TextEncoder()

export function isValidUtf8(bytes: Uint8Array): boolean {
  try {
    utf8Strict.decode(bytes)
    return true
  } catch {
    return false
  }
}

export function decodeText(bytes: Uint8Array, enc: TextEncoding, opts: DecodeOptions = {}, state?: Utf16State): string {
  switch (enc) {
    case TextEncoding.Latin1:
      return decodeLatin1(bytes)
    case TextEncoding.UTF16:
      return decodeUtf16(bytes, opts, state)
    case TextEncoding.UTF16BE:
      return decodeUtf16Units(bytes, false, opts)
    case TextEncoding.UTF8:
      if (!isValidUtf8(bytes)) {
        opts.warnings?.warn('utf8-invalid', 'invalid UTF-8 sequence replaced', frameIdOf(opts))
      }
      return utf8Decoder.decode(bytes)
    default:
      throw new RangeError(`unknown text encoding ${enc as number}`)
  }
}

export function encodeText(s: string, enc: TextEncoding, opts: EncodeOptions = {}): Uint8Array {
  switch (enc) {
    case TextEncoding.Latin1:
      return encodeLatin1(s, opts)
    case TextEncoding.UTF16:
      if (opts.ucs2 && /[\uD800-\uDFFF]/.test(s)) {
        if (!opts.lenient) {
          throw new TagWriteError('ucs2-range', 'v2.2/v2.3 Unicode is UCS-2; characters outside the BMP are not allowed')
        }
        opts.warnings?.note('ucs2-range', 'wrote a surrogate pair into a UCS-2 string', frameIdOf(opts))
      }
      return encodeUtf16(s, opts.littleEndian ?? true, true)
    case TextEncoding.UTF16BE:
      return encodeUtf16(s, false, false)
    case TextEncoding.UTF8:
      return utf8Encoder.encode(s)
    default:
      throw new RangeError(`unknown text encoding ${enc as number}`)
  }
}

/** Reads a terminated string; at the end of the slice an unterminated string is accepted. */
export function readTerminated(
  reader: ByteReader,
  enc: TextEncoding,
  opts: DecodeOptions = {},
  state?: Utf16State,
): string {
  const { bytes } = reader.terminated(terminatorWidth(enc))
  return decodeText(bytes, enc, opts, state)
}

/** Reads the rest of the slice as one string, ignoring a single trailing terminator. */
export function readToEnd(reader: ByteReader, enc: TextEncoding, opts: DecodeOptions = {}, state?: Utf16State): string {
  let bytes = reader.rest()
  const w = terminatorWidth(enc)
  if (bytes.length >= w && bytes.subarray(bytes.length - w).every((x) => x === 0)) {
    // only strip when the terminator is aligned for 2-byte encodings
    if (w === 1 || bytes.length % 2 === 0) bytes = bytes.subarray(0, bytes.length - w)
  }
  return decodeText(bytes, enc, opts, state)
}

/**
 * Splits a null-separated list (v2.4 §4.2 multi-value text frames). A single trailing
 * terminator is ignored.
 */
export function splitStrings(bytes: Uint8Array, enc: TextEncoding, opts: DecodeOptions = {}, state?: Utf16State): string[] {
  const w = terminatorWidth(enc)
  const parts: Uint8Array[] = []
  let start = 0
  for (let i = 0; i + w <= bytes.length; i += w) {
    if (bytes[i] === 0 && (w === 1 || bytes[i + 1] === 0)) {
      parts.push(bytes.subarray(start, i))
      start = i + w
    }
  }
  if (start < bytes.length) parts.push(bytes.subarray(start))
  else if (parts.length === 0) parts.push(bytes.subarray(0, 0))
  return parts.map((p) => decodeText(p, enc, opts, state))
}

export function writeTerminated(writer: ByteWriter, s: string, enc: TextEncoding, opts: EncodeOptions = {}): void {
  writer.bytes(encodeText(s, enc, opts))
  writer.zeros(terminatorWidth(enc))
}

/** The smallest legal encoding that can represent `s` (Latin-1 if possible). */
export function pickEncoding(s: string | readonly string[], major: MajorVersion, preferred?: TextEncoding): TextEncoding {
  const all = typeof s === 'string' ? [s] : s
  if (preferred !== undefined && isAllowedEncoding(preferred, major)) {
    if (preferred !== TextEncoding.Latin1 || all.every(isLatin1Representable)) return preferred
  }
  if (all.every(isLatin1Representable)) return TextEncoding.Latin1
  return TextEncoding.UTF16
}
