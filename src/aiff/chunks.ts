import { ByteReader, ByteWriter, ascii, asciiString, startsWith } from '../core/bytes.js'
import { decodeLatin1 } from '../core/encoding.js'
import { TagWriteError, type WarningSink } from '../core/errors.js'
import { afterID3v2 } from '../file/detect.js'

// SPEC: spec/aiff/AIFF-1.3.md "File Structure". A FORM chunk ('FORM', size, form type 'AIFF' or
// 'AIFC') holds local chunks: a 4-character ID, a 32-bit big-endian size and the data, padded with
// a zero byte to an even length ("The pad byte is not included in ckSize").

export class AIFFWriteError extends TagWriteError {
  override name = 'AIFFWriteError'
}

export interface Chunk {
  id: string
  /** Offset of the 8-byte chunk header. */
  start: number
  /** Size from the header (data only, no pad byte). */
  size: number
  /** The data, when it was read (random-access readers skip the sound data). */
  data?: Uint8Array
}

export interface AIFFLayout {
  /** Offset of the FORM chunk: after any ID3v2 tags in front of it, which are kept (A4). */
  start: number
  formType: 'AIFF' | 'AIFC'
  /** FORM size from the header. */
  formSize: number
  chunks: Chunk[]
  /** File length; bytes after the FORM chunk are kept on write (A4). */
  fileLength: number
  /** A chunk or the FORM runs past the end of the file. */
  truncated: boolean
}

/** Header and padded length of the chunk at `pos`. */
export function chunkHeader(h: Uint8Array): { id: string; size: number } {
  return { id: asciiString(h.subarray(0, 4)), size: ((h[4]! << 24) >>> 0) + (h[5]! << 16) + (h[6]! << 8) + h[7]! }
}

export const padded = (size: number) => size + (size & 1)

/** Where the FORM chunk starts: after ID3v2 tags in front of the file (A4). */
export function formStart(head: Uint8Array): number {
  return afterID3v2(head)
}

/** The FORM header at `start`: undefined if the data is not an AIFF file. */
export function formHeader(head: Uint8Array, start = 0): { formType: 'AIFF' | 'AIFC'; formSize: number } | undefined {
  if (head.length < start + 12 || !startsWith(head, 'FORM', start)) return undefined
  const formType = asciiString(head.subarray(start + 8, start + 12))
  if (formType !== 'AIFF' && formType !== 'AIFC') return undefined
  return { formType, formSize: chunkHeader(head.subarray(start, start + 8)).size }
}

/** A new layout for the FORM at `start`; warns when the FORM runs past the end of the file. */
export function newLayout(start: number, fileLength: number, form: { formType: 'AIFF' | 'AIFC'; formSize: number }, w: WarningSink): AIFFLayout {
  const layout: AIFFLayout = { start, ...form, chunks: [], fileLength, truncated: false }
  if (start + 8 + form.formSize > fileLength) {
    layout.truncated = true
    w.warn('aiff-form-size', `the FORM chunk claims ${form.formSize} bytes but the file ends after ${fileLength - start - 8}`)
  }
  return layout
}

/** End of the FORM's data in the file. */
export function formEnd(layout: AIFFLayout): number {
  return Math.min(layout.fileLength, layout.start + 8 + layout.formSize)
}

/**
 * Adds the chunk whose 8-byte header `h` is at `pos` and returns it with the position of the next
 * chunk (undefined after a truncated chunk). Readers walk with this, reading data as they like.
 */
export function addChunk(layout: AIFFLayout, pos: number, h: Uint8Array, w: WarningSink): { chunk: Chunk; next: number | undefined } {
  const { id, size } = chunkHeader(h)
  const end = formEnd(layout)
  const truncated = pos + 8 + size > end
  if (truncated) {
    layout.truncated = true
    w.warn('aiff-truncated', `chunk '${id}' runs past the end of the FORM`, { offset: pos })
  }
  const chunk: Chunk = { id, start: pos, size: truncated ? end - pos - 8 : size }
  layout.chunks.push(chunk)
  return { chunk, next: truncated ? undefined : pos + 8 + padded(size) }
}

export interface CommonChunk {
  channels: number
  sampleFrames: number
  sampleSize: number
  /** Hz, from the 80-bit IEEE 754 extended value. */
  sampleRate: number
}

/** SPEC: "Common Chunk": short numChannels, unsigned long numSampleFrames, short sampleSize, extended sampleRate. */
export function parseCommon(data: Uint8Array, w: WarningSink): CommonChunk | undefined {
  if (data.length < 18) {
    w.warn('aiff-comm', `the Common Chunk is ${data.length} bytes, not 18`)
    return undefined
  }
  const r = new ByteReader(data)
  return { channels: r.u16(), sampleFrames: r.u32(), sampleSize: r.u16(), sampleRate: extended(r.bytes(10)) }
}

/** 80-bit extended: sign, 15-bit exponent (bias 16383), 64-bit mantissa with an explicit integer bit. */
export function extended(b: Uint8Array): number {
  const exponent = ((b[0]! & 0x7f) << 8) | b[1]!
  let mantissa = 0
  for (let i = 2; i < 10; i++) mantissa = mantissa * 256 + b[i]!
  if (exponent === 0 && mantissa === 0) return 0
  const v = mantissa * 2 ** (exponent - 16383 - 63)
  return b[0]! & 0x80 ? -v : v
}

/** SPEC: "Text Chunks": text "contains pure ASCII characters" (A3: read as ISO-8859-1). */
export function parseText(id: string, data: Uint8Array, w: WarningSink): string {
  if (data.some((b) => b > 0x7f)) w.warn('aiff-text-ascii', `'${id}' has characters outside ASCII; read as ISO-8859-1`)
  return decodeLatin1(data)
}

export function isASCII(s: string): boolean {
  return /^[\x00-\x7f]*$/.test(s)
}

export function serializeText(id: string, s: string): Uint8Array {
  if (!isASCII(s)) throw new AIFFWriteError('aiff-text-ascii', `'${id}' text must be ASCII`)
  return ascii(s)
}

export interface AIFFComment {
  /** Seconds since 1904-01-01 (the Macintosh epoch). */
  timeStamp: number
  /** ID of the marker the comment belongs to; 0 for none. */
  marker: number
  text: string
}

/** SPEC: "Comments Chunk": numComments, then timeStamp, MarkerID, count and text padded to even. */
export function parseComments(data: Uint8Array, w: WarningSink): AIFFComment[] {
  const out: AIFFComment[] = []
  try {
    const r = new ByteReader(data)
    const n = r.u16()
    for (let i = 0; i < n; i++) {
      const timeStamp = r.u32()
      const marker = r.i16()
      const count = r.u16()
      out.push({ timeStamp, marker, text: parseText('COMT', r.bytes(count), w) })
      if (count & 1 && r.remaining) r.u8()
    }
  } catch {
    w.warn('aiff-comt', 'the Comments Chunk is truncated')
  }
  return out
}

export function serializeComments(comments: readonly AIFFComment[]): Uint8Array {
  const out = new ByteWriter().u16(comments.length)
  for (const c of comments) {
    const text = serializeText('COMT', c.text)
    if (text.length > 0xffff) throw new AIFFWriteError('aiff-comt', 'a COMT comment is limited to 65535 bytes')
    out.u32(c.timeStamp).u16(c.marker & 0xffff).u16(text.length).bytes(text)
    if (text.length & 1) out.u8(0)
  }
  return out.toUint8Array()
}

/** A chunk with its header and pad byte. */
export function serializeChunk(id: string, data: Uint8Array): Uint8Array {
  const out = new ByteWriter(8 + padded(data.length)).bytes(ascii(id)).u32(data.length).bytes(data)
  if (data.length & 1) out.u8(0)
  return out.toUint8Array()
}
