import { ascii, asciiString, startsWith } from '../core/bytes.js'
import { decodeLatin1, isLatin1Representable, isValidUtf8 } from '../core/encoding.js'
import { TagWriteError, type WarningSink } from '../core/errors.js'
import { afterID3v2 } from '../file/detect.js'

// SPEC: spec/riff/riffmci.md Chapter 2 "Chunks": a chunk is a four-character ID, a 32-bit
// little-endian ("Intel format") ckSize and the data; "If the chunk size is an odd number of bytes,
// a pad byte with value zero is written after ckData. ... The ckSize value does not include the
// pad byte." A RIFF form is RIFF(<formType> <ck>...); WAVE files have form type 'WAVE'.

export class RIFFWriteError extends TagWriteError {
  override name = 'RIFFWriteError'
}

export interface Chunk {
  id: string
  /** Offset of the 8-byte chunk header. */
  start: number
  /** ckSize (data only, no pad byte). */
  size: number
  /** The data, when it was read (random-access readers skip the sound data). */
  data?: Uint8Array
}

export interface RIFFLayout {
  /** Offset of the RIFF chunk: after any ID3v2 tags in front of it, which are kept (W7). */
  start: number
  /** RIFF ckSize from the header. */
  formSize: number
  chunks: Chunk[]
  fileLength: number
  /** A chunk or the RIFF form runs past the end of the file. */
  truncated: boolean
}

export const padded = (size: number) => size + (size & 1)

function u32le(b: Uint8Array, pos: number): number {
  return (b[pos]! | (b[pos + 1]! << 8) | (b[pos + 2]! << 16) | (b[pos + 3]! << 24)) >>> 0
}

function u16le(b: Uint8Array, pos: number): number {
  return b[pos]! | (b[pos + 1]! << 8)
}

function le32(n: number): number[] {
  return [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]
}

export function chunkHeader(h: Uint8Array): { id: string; size: number } {
  return { id: asciiString(h.subarray(0, 4)), size: u32le(h, 4) }
}

/** Where the RIFF chunk starts: after ID3v2 tags in front of the file. */
export function formStart(head: Uint8Array): number {
  return afterID3v2(head)
}

/** The RIFF header at `start`: undefined if the data is not a WAVE file. */
export function riffHeader(head: Uint8Array, start = 0): { formSize: number } | undefined {
  if (head.length < start + 12 || !startsWith(head, 'RIFF', start) || !startsWith(head, 'WAVE', start + 8)) return undefined
  return { formSize: u32le(head, start + 4) }
}

export function newLayout(start: number, fileLength: number, formSize: number, w: WarningSink): RIFFLayout {
  const layout: RIFFLayout = { start, formSize, chunks: [], fileLength, truncated: false }
  if (start + 8 + formSize > fileLength) {
    layout.truncated = true
    w.warn('riff-riff-size', `the RIFF chunk claims ${formSize} bytes but the file ends after ${fileLength - start - 8}`)
  }
  return layout
}

/** End of the RIFF form's data in the file. */
export function formEnd(layout: RIFFLayout): number {
  return Math.min(layout.fileLength, layout.start + 8 + layout.formSize)
}

/** Adds the chunk whose 8-byte header `h` is at `pos`; returns it and the next position (undefined after a truncated chunk). */
export function addChunk(layout: RIFFLayout, pos: number, h: Uint8Array, w: WarningSink): { chunk: Chunk; next: number | undefined } {
  const { id, size } = chunkHeader(h)
  const end = formEnd(layout)
  const truncated = pos + 8 + size > end
  if (truncated) {
    layout.truncated = true
    w.warn('riff-truncated', `chunk '${id}' runs past the end of the RIFF form`, { offset: pos })
  }
  const chunk: Chunk = { id, start: pos, size: truncated ? end - pos - 8 : size }
  layout.chunks.push(chunk)
  return { chunk, next: truncated ? undefined : pos + 8 + padded(size) }
}

/** A chunk with its header and pad byte. */
export function serializeChunk(id: string, data: Uint8Array): Uint8Array {
  const out = new Uint8Array(8 + padded(data.length))
  out.set(ascii(id))
  out.set(le32(data.length), 4)
  out.set(data, 8)
  return out
}

export interface RIFFFormat {
  /** wFormatTag: 1 = PCM. */
  formatTag: number
  channels: number
  /** dwSamplesPerSec. */
  sampleRate: number
  /** dwAvgBytesPerSec. */
  byteRate: number
  blockAlign: number
  /** wBitsPerSample (PCM format-specific field), when present. */
  bitsPerSample?: number
}

/** SPEC: Chapter 3 "WAVE Format Chunk": wFormatTag, wChannels, dwSamplesPerSec, dwAvgBytesPerSec, wBlockAlign. */
export function parseFormat(data: Uint8Array, w: WarningSink): RIFFFormat | undefined {
  if (data.length < 14) {
    w.warn('riff-fmt', `the format chunk is ${data.length} bytes, less than 14`)
    return undefined
  }
  const f: RIFFFormat = { formatTag: u16le(data, 0), channels: u16le(data, 2), sampleRate: u32le(data, 4), byteRate: u32le(data, 8), blockAlign: u16le(data, 12) }
  if (data.length >= 16) f.bitsPerSample = u16le(data, 14)
  return f
}

/** SPEC: "FACT Chunk": dwFileSize, the number of samples. */
export function parseFact(data: Uint8Array): number | undefined {
  return data.length >= 4 ? u32le(data, 0) : undefined
}

/** SPEC: "CSET (Character Set) Chunk": wCodePage first; 0 means ISO 8859/1. */
export function parseCodePage(data: Uint8Array): number {
  return data.length >= 2 ? u16le(data, 0) : 0
}

export interface InfoEntry {
  /** Four-character ID (INAM, IART, ...). */
  id: string
  value: string
}

const utf8 = new TextDecoder('utf-8')

/** W4: ISO-8859-1 (or UTF-8 by CSET 65001, or valid multi-byte UTF-8 without CSET). */
function decodeInfo(id: string, bytes: Uint8Array, codePage: number, w: WarningSink): string {
  if (codePage === 65001) return utf8.decode(bytes)
  if (codePage !== 0 && codePage !== 28591) w.warn('riff-info-codepage', `code page ${codePage} is read as ISO-8859-1`)
  if (codePage === 0 && bytes.some((b) => b > 0x7f) && isValidUtf8(bytes)) {
    w.warn('riff-info-utf8', `'${id}' is valid UTF-8 without a CSET chunk; read as UTF-8`)
    return utf8.decode(bytes)
  }
  return decodeLatin1(bytes)
}

/**
 * SPEC: "INFO List Chunk": LIST('INFO' <chunk>...), each chunk a ZSTR. `data` is the LIST data
 * from the list type on.
 */
export function parseInfo(data: Uint8Array, codePage: number, w: WarningSink): InfoEntry[] {
  const out: InfoEntry[] = []
  let pos = 4
  while (pos + 8 <= data.length) {
    const { id, size } = chunkHeader(data.subarray(pos, pos + 8))
    if (pos + 8 + size > data.length) {
      w.warn('riff-info-truncated', `INFO entry '${id}' runs past the end of the list`)
      break
    }
    let text = data.subarray(pos + 8, pos + 8 + size)
    // W5: trailing NULs end the ZSTR; a missing NUL is tolerated.
    let n = text.length
    while (n > 0 && text[n - 1] === 0) n--
    text = text.subarray(0, n)
    out.push({ id, value: decodeInfo(id, text, codePage, w) })
    pos += 8 + padded(size)
  }
  return out
}

/** The LIST data of an INFO list: 'INFO' and ZSTR chunks in ISO-8859-1 (W4, W5). */
export function serializeInfo(entries: readonly InfoEntry[]): Uint8Array {
  const parts: Uint8Array[] = [ascii('INFO')]
  for (const e of entries) {
    if (!/^[\x20-\x7e]{4}$/.test(e.id)) throw new RIFFWriteError('riff-info-id', `INFO ID ${JSON.stringify(e.id)} must be four printable ASCII characters`)
    if (!isLatin1Representable(e.value)) throw new RIFFWriteError('riff-info-latin1', `INFO '${e.id}' can only hold ISO-8859-1 text`)
    const text = new Uint8Array(e.value.length + 1)
    for (let i = 0; i < e.value.length; i++) text[i] = e.value.charCodeAt(i)
    parts.push(serializeChunk(e.id, text))
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}
