// Hand-built byte fixtures. These deliberately avoid the library's own writer so that tests
// compare against the spec layouts rather than against our own output.

export type Bytes = number[] | Uint8Array | string

/** Concatenates numbers, byte arrays and ISO-8859-1 strings. */
export function bytes(...parts: Bytes[]): Uint8Array {
  const arrays = parts.map((p) => (typeof p === 'string' ? Uint8Array.from(p, (c) => c.charCodeAt(0) & 0xff) : p instanceof Uint8Array ? p : Uint8Array.from(p)))
  const out = new Uint8Array(arrays.reduce((n, a) => n + a.length, 0))
  let o = 0
  for (const a of arrays) {
    out.set(a, o)
    o += a.length
  }
  return out
}

export function u32(n: number): number[] {
  return [(n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff]
}

export function synchsafe(n: number): number[] {
  return [(n >> 21) & 0x7f, (n >> 14) & 0x7f, (n >> 7) & 0x7f, n & 0x7f]
}

/** UTF-16LE with BOM. */
export function utf16(s: string): number[] {
  const out = [0xff, 0xfe]
  for (let i = 0; i < s.length; i++) out.push(s.charCodeAt(i) & 0xff, s.charCodeAt(i) >> 8)
  return out
}

/** A frame with header for the given major version. */
export function frame(major: 2 | 3 | 4, id: string, body: Bytes, flags: [number, number] = [0, 0]): Uint8Array {
  const b = bytes(body)
  if (major === 2) return bytes(id, [(b.length >> 16) & 0xff, (b.length >> 8) & 0xff, b.length & 0xff], b)
  return bytes(id, major === 4 ? synchsafe(b.length) : u32(b.length), flags, b)
}

/** A full tag: header + body (+ footer when the footer flag is set). */
export function tag(major: 2 | 3 | 4, body: Bytes, opts: { flags?: number; padding?: number; revision?: number } = {}): Uint8Array {
  const b = bytes(body, new Array(opts.padding ?? 0).fill(0))
  const flags = opts.flags ?? 0
  const head = bytes('ID3', [major, opts.revision ?? 0, flags], synchsafe(b.length))
  if (major === 4 && flags & 0x10) return bytes(head, b, '3DI', [major, opts.revision ?? 0, flags], synchsafe(b.length))
  return bytes(head, b)
}

export function hex(b: Uint8Array): string {
  return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join(' ')
}
