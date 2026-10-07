import { TagReadError } from './errors.js'

/** Big-endian cursor over a byte slice (ID3v2 is MSB first: v2.4 structure §3, v2.3 §3). */
export class ByteReader {
  offset: number
  readonly end: number

  constructor(
    readonly data: Uint8Array,
    start = 0,
    end = data.length,
  ) {
    this.offset = start
    this.end = Math.min(end, data.length)
  }

  get remaining(): number {
    return this.end - this.offset
  }

  private need(n: number): void {
    if (n > this.remaining) {
      throw new TagReadError('truncated', `needed ${n} bytes, ${this.remaining} left`, this.offset)
    }
  }

  u8(): number {
    this.need(1)
    return this.data[this.offset++]!
  }

  u16(): number {
    return this.uN(2)
  }

  u24(): number {
    return this.uN(3)
  }

  u32(): number {
    return this.uN(4)
  }

  /** Unsigned big-endian integer of `n` bytes; `n` must be at most 6 to stay exact. */
  uN(n: number): number {
    if (n > 6) throw new RangeError('uN supports at most 6 bytes; use big()')
    this.need(n)
    let v = 0
    for (let i = 0; i < n; i++) v = v * 256 + this.data[this.offset++]!
    return v
  }

  /** Unsigned big-endian integer of any width. */
  big(n: number): bigint {
    this.need(n)
    let v = 0n
    for (let i = 0; i < n; i++) v = (v << 8n) | BigInt(this.data[this.offset++]!)
    return v
  }

  i16(): number {
    const v = this.u16()
    return v >= 0x8000 ? v - 0x10000 : v
  }

  bytes(n: number): Uint8Array {
    this.need(n)
    const out = this.data.subarray(this.offset, this.offset + n)
    this.offset += n
    return out
  }

  rest(): Uint8Array {
    return this.bytes(this.remaining)
  }

  peek(n = 1): Uint8Array {
    return this.data.subarray(this.offset, Math.min(this.offset + n, this.end))
  }

  /**
   * Bytes up to (not including) a terminator of `width` zero bytes; the terminator is consumed.
   * For width 2 the scan stays aligned to the string start, so `41 00 00 42` is not split in the
   * middle of a character. Returns `terminated: false` when the slice ends first.
   */
  terminated(width: 1 | 2): { bytes: Uint8Array; terminated: boolean } {
    const start = this.offset
    if (width === 1) {
      for (let i = start; i < this.end; i++) {
        if (this.data[i] === 0) {
          this.offset = i + 1
          return { bytes: this.data.subarray(start, i), terminated: true }
        }
      }
    } else {
      for (let i = start; i + 1 < this.end; i += 2) {
        if (this.data[i] === 0 && this.data[i + 1] === 0) {
          this.offset = i + 2
          return { bytes: this.data.subarray(start, i), terminated: true }
        }
      }
    }
    this.offset = this.end
    return { bytes: this.data.subarray(start, this.end), terminated: false }
  }
}

/** Growable big-endian byte buffer. */
export class ByteWriter {
  private buf: Uint8Array
  length = 0

  constructor(initial = 256) {
    this.buf = new Uint8Array(initial)
  }

  private ensure(n: number): void {
    if (this.length + n <= this.buf.length) return
    let size = this.buf.length * 2
    while (size < this.length + n) size *= 2
    const next = new Uint8Array(size)
    next.set(this.buf.subarray(0, this.length))
    this.buf = next
  }

  u8(v: number): this {
    this.ensure(1)
    this.buf[this.length++] = v & 0xff
    return this
  }

  u16(v: number): this {
    return this.uN(v, 2)
  }

  u24(v: number): this {
    return this.uN(v, 3)
  }

  u32(v: number): this {
    return this.uN(v, 4)
  }

  i16(v: number): this {
    return this.u16(v < 0 ? v + 0x10000 : v)
  }

  uN(v: number, n: number): this {
    if (!Number.isInteger(v) || v < 0 || v >= 2 ** (8 * n)) {
      throw new RangeError(`${v} does not fit in ${n} unsigned bytes`)
    }
    this.ensure(n)
    for (let i = n - 1; i >= 0; i--) {
      this.buf[this.length + i] = v % 256
      v = Math.floor(v / 256)
    }
    this.length += n
    return this
  }

  big(v: bigint, n: number): this {
    if (v < 0n || v >= 1n << BigInt(8 * n)) throw new RangeError(`${v} does not fit in ${n} bytes`)
    this.ensure(n)
    for (let i = n - 1; i >= 0; i--) {
      this.buf[this.length + i] = Number(v & 0xffn)
      v >>= 8n
    }
    this.length += n
    return this
  }

  bytes(b: Uint8Array | readonly number[]): this {
    this.ensure(b.length)
    this.buf.set(b, this.length)
    this.length += b.length
    return this
  }

  zeros(n: number): this {
    this.ensure(n)
    this.buf.fill(0, this.length, this.length + n)
    this.length += n
    return this
  }

  toUint8Array(): Uint8Array {
    return this.buf.slice(0, this.length)
  }
}

/** ASCII-only string to bytes, for frame IDs, magic markers and Lyrics3 digits. */
export function ascii(s: string): Uint8Array {
  const out = new Uint8Array(s.length)
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i) & 0xff
  return out
}

export function asciiString(b: Uint8Array): string {
  let s = ''
  for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]!)
  return s
}

export function concat(parts: readonly Uint8Array[]): Uint8Array {
  let n = 0
  for (const p of parts) n += p.length
  const out = new Uint8Array(n)
  let o = 0
  for (const p of parts) {
    out.set(p, o)
    o += p.length
  }
  return out
}

export function equalBytes(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

/** True when `data` at `offset` starts with the ASCII `marker`. */
export function startsWith(data: Uint8Array, marker: string, offset = 0): boolean {
  if (offset < 0 || offset + marker.length > data.length) return false
  for (let i = 0; i < marker.length; i++) if (data[offset + i] !== marker.charCodeAt(i)) return false
  return true
}

/** Unsigned big-endian bigint to the minimum number of bytes, padded to at least `min`. */
export function bigToBytes(v: bigint, min: number): Uint8Array {
  const out: number[] = []
  while (v > 0n) {
    out.unshift(Number(v & 0xffn))
    v >>= 8n
  }
  while (out.length < min) out.unshift(0)
  return Uint8Array.from(out)
}

export function bytesToBig(b: Uint8Array): bigint {
  let v = 0n
  for (const x of b) v = (v << 8n) | BigInt(x)
  return v
}

/**
 * True for a Uint8Array from any realm. `instanceof Uint8Array` fails for arrays created in another
 * realm (iframes, workers, jsdom), so the library never relies on it.
 */
export function isBytes(v: unknown): v is Uint8Array {
  return ArrayBuffer.isView(v) && Object.prototype.toString.call(v) === '[object Uint8Array]'
}
