import { isValidUtf8 } from '../core/encoding.js'
import type { WarningSink } from '../core/errors.js'
import { FLACWriteError } from './blocks.js'

// SPEC: spec/flac/rfc9639.md §8.6 and spec/ogg/v-comment.md. A vendor string, then a list of
// "NAME=value" fields, each with a 32-bit little-endian length; all text is UTF-8. The layout is
// the same in Ogg (Vorbis, Opus), where a framing bit or signature is added around it.

export interface VorbisField {
  /** As stored; names are compared case-insensitively (§8.6). */
  name: string
  value: string
}

export interface VorbisComment {
  vendor: string
  fields: VorbisField[]
}

const decoder = new TextDecoder('utf-8')
const encoder = new TextEncoder()

/** SPEC: §8.6 "U+0020 through U+007E, excluding U+003D". */
export function isValidFieldName(name: string): boolean {
  return name.length > 0 && /^[\x20-\x3c\x3e-\x7e]+$/.test(name)
}

function u32le(data: Uint8Array, pos: number): number {
  return (data[pos]! | (data[pos + 1]! << 8) | (data[pos + 2]! << 16) | (data[pos + 3]! << 24)) >>> 0
}

export function parseVorbisComment(data: Uint8Array, w: WarningSink): VorbisComment {
  let pos = 0
  const text = (what: string): string | undefined => {
    if (pos + 4 > data.length) return undefined
    const n = u32le(data, pos)
    if (pos + 4 + n > data.length) return undefined
    const bytes = data.subarray(pos + 4, pos + 4 + n)
    pos += 4 + n
    if (!isValidUtf8(bytes)) w.warn('vorbis-utf8', `${what} is not valid UTF-8`)
    return decoder.decode(bytes)
  }
  const vendor = text('the vendor string')
  if (vendor === undefined) {
    w.warn('vorbis-truncated', 'the comment block ends inside the vendor string')
    return { vendor: '', fields: [] }
  }
  const fields: VorbisField[] = []
  if (pos + 4 > data.length) {
    w.warn('vorbis-truncated', 'the comment block ends before the field count')
    return { vendor, fields }
  }
  const count = u32le(data, pos)
  pos += 4
  for (let i = 0; i < count; i++) {
    const f = text(`field ${i + 1}`)
    if (f === undefined) {
      w.warn('vorbis-truncated', `the comment block declares ${count} fields, ${i} present`)
      break
    }
    const eq = f.indexOf('=')
    if (eq < 0) {
      w.warn('vorbis-field', `field ${i + 1} has no "="; it is read as a name with an empty value`)
      fields.push({ name: f, value: '' })
      continue
    }
    const name = f.slice(0, eq)
    if (!isValidFieldName(name)) w.warn('vorbis-field-name', `field name ${JSON.stringify(name)} has characters outside U+0020-U+007E or is empty`)
    fields.push({ name, value: f.slice(eq + 1) })
  }
  if (pos < data.length) w.warn('vorbis-trailing', `${data.length - pos} bytes after the last field`)
  return { vendor, fields }
}

export function serializeVorbisComment(c: VorbisComment): Uint8Array {
  const parts: Uint8Array[] = [encoder.encode(c.vendor)]
  for (const f of c.fields) {
    if (!isValidFieldName(f.name)) throw new FLACWriteError('vorbis-field-name', `field name ${JSON.stringify(f.name)} must be printable ASCII without "="`)
    parts.push(encoder.encode(`${f.name}=${f.value}`))
  }
  const size = parts.reduce((n, p) => n + 4 + p.length, 4)
  const out = new Uint8Array(size)
  const dv = new DataView(out.buffer)
  let pos = 0
  const put = (p: Uint8Array) => {
    dv.setUint32(pos, p.length, true)
    out.set(p, pos + 4)
    pos += 4 + p.length
  }
  put(parts[0]!)
  dv.setUint32(pos, c.fields.length, true)
  pos += 4
  for (const p of parts.slice(1)) put(p)
  return out
}
