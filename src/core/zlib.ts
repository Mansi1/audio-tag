// SPEC: zlib (RFC 1950) around DEFLATE (RFC 1951), used for frame compression in
// v2.3 §3.3.1 flag i and v2.4 §4.1.2 flag k. Pure, synchronous, no platform imports.
import { TagReadError, type WarningSink } from './errors.js'

export interface InflateOptions {
  /** Decompressed size announced by the frame; caps output at max(4 × size, 1 MB). */
  expectedSize?: number
  warnings?: WarningSink
}

const MB = 1024 * 1024
const HARD_LIMIT = 256 * MB

// SPEC: RFC 1951 §3.2.5 length and distance tables.
const LEN_BASE = Uint16Array.of(
  3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 15, 17, 19, 23, 27, 31, 35, 43, 51, 59, 67, 83, 99, 115, 131,
  163, 195, 227, 258,
)
const LEN_EXTRA = Uint8Array.of(
  0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0,
)
const DIST_BASE = Uint16Array.of(
  1, 2, 3, 4, 5, 7, 9, 13, 17, 25, 33, 49, 65, 97, 129, 193, 257, 385, 513, 769, 1025, 1537, 2049,
  3073, 4097, 6145, 8193, 12289, 16385, 24577,
)
const DIST_EXTRA = Uint8Array.of(
  0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13,
)
// SPEC: RFC 1951 §3.2.7 order of code length code lengths.
const CL_ORDER = Uint8Array.of(16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15)

// SPEC: RFC 1951 §3.2.5 fixed Huffman code lengths.
function fixedLitLengths(): Uint8Array {
  const l = new Uint8Array(288)
  l.fill(8, 0, 144)
  l.fill(9, 144, 256)
  l.fill(7, 256, 280)
  l.fill(8, 280, 288)
  return l
}

function reverseBits(code: number, len: number): number {
  let r = 0
  for (let i = 0; i < len; i++) {
    r = (r << 1) | (code & 1)
    code >>>= 1
  }
  return r
}

/** Canonical Huffman codes (RFC 1951 §3.2.2) for each symbol, bit-reversed for LSB-first I/O. */
function canonicalCodes(lengths: Uint8Array): Uint16Array {
  const count = new Uint16Array(16)
  for (let i = 0; i < lengths.length; i++) count[lengths[i]!]!++
  count[0] = 0
  const next = new Uint16Array(16)
  let code = 0
  for (let bits = 1; bits < 16; bits++) {
    code = (code + count[bits - 1]!) << 1
    next[bits] = code
  }
  const codes = new Uint16Array(lengths.length)
  for (let s = 0; s < lengths.length; s++) {
    const l = lengths[s]!
    if (l) codes[s] = reverseBits(next[l]!++, l)
  }
  return codes
}

interface Table {
  /** Indexed by the next `bits` input bits; entry is (symbol << 4) | length, 0 if invalid. */
  t: Int32Array
  bits: number
}

function corrupt(msg: string): never {
  throw new TagReadError('zlib-corrupt', `corrupt deflate stream: ${msg}`)
}

function buildTable(lengths: Uint8Array): Table {
  const count = new Uint16Array(16)
  let max = 0
  for (let i = 0; i < lengths.length; i++) {
    const l = lengths[i]!
    count[l]!++
    if (l > max) max = l
  }
  count[0] = 0
  let left = 1
  for (let b = 1; b < 16; b++) {
    left = (left << 1) - count[b]!
    if (left < 0) corrupt('over-subscribed Huffman code')
  }
  // Incomplete codes are tolerated; unused slots stay 0 and fail on use.
  const bits = max || 1
  const t = new Int32Array(1 << bits)
  const codes = canonicalCodes(lengths)
  for (let s = 0; s < lengths.length; s++) {
    const l = lengths[s]!
    if (!l) continue
    const e = (s << 4) | l
    for (let j = codes[s]!; j < t.length; j += 1 << l) t[j] = e
  }
  return { t, bits }
}

let fixedLit: Table | undefined
let fixedDist: Table | undefined

/** Thrown internally when the zlib header is unusable, so the caller can try raw deflate. */
class BadHeader extends Error {}

/** Decodes a DEFLATE stream starting at `start`; returns output and the byte offset after it. */
function inflateRaw(data: Uint8Array, start: number, limit: number, initial: number): { out: Uint8Array; end: number } {
  const n = data.length
  let pos = start
  let buf = 0
  let cnt = 0
  let pad = 0 // zero bytes fed past the end of input

  let out = new Uint8Array(Math.max(1024, Math.min(initial, limit)))
  let op = 0

  const fill = (need: number): void => {
    while (cnt < need) {
      if (pos < n) buf |= data[pos++]! << cnt
      else pad++
      cnt += 8
    }
  }
  const bits = (k: number): number => {
    if (cnt < k) fill(k)
    const v = buf & ((1 << k) - 1)
    buf >>>= k
    cnt -= k
    if (pad && cnt < pad * 8) corrupt('unexpected end of input')
    return v
  }
  const decode = (tb: Table): number => {
    if (cnt < tb.bits) fill(tb.bits)
    const e = tb.t[buf & ((1 << tb.bits) - 1)]!
    if (!e) corrupt('invalid Huffman code')
    const l = e & 15
    buf >>>= l
    cnt -= l
    if (pad && cnt < pad * 8) corrupt('unexpected end of input')
    return e >>> 4
  }
  const grow = (need: number): void => {
    const want = op + need
    if (want > limit) {
      throw new TagReadError('zlib-too-large', `decompressed data exceeds ${limit} bytes`)
    }
    const next = new Uint8Array(Math.min(limit, Math.max(out.length * 2, want)))
    next.set(out.subarray(0, op))
    out = next
  }

  let final = 0
  while (!final) {
    final = bits(1)
    const type = bits(2)
    if (type === 0) {
      // SPEC: RFC 1951 §3.2.4 stored block.
      bits(cnt & 7)
      const len = bits(16)
      const nlen = bits(16)
      if ((len ^ 0xffff) !== nlen) corrupt('stored block length mismatch')
      if (op + len > out.length) grow(len)
      let k = 0
      while (k < len && cnt >= 8) {
        out[op++] = buf & 0xff
        buf >>>= 8
        cnt -= 8
        k++
      }
      if (pad) corrupt('unexpected end of input')
      const rest = len - k
      if (pos + rest > n) corrupt('stored block runs past end of input')
      out.set(data.subarray(pos, pos + rest), op)
      op += rest
      pos += rest
      continue
    }
    let lit: Table
    let dist: Table
    if (type === 1) {
      lit = fixedLit ??= buildTable(fixedLitLengths())
      dist = fixedDist ??= buildTable(new Uint8Array(30).fill(5))
    } else if (type === 2) {
      // SPEC: RFC 1951 §3.2.7 dynamic Huffman block header.
      const hlit = bits(5) + 257
      const hdist = bits(5) + 1
      const hclen = bits(4) + 4
      if (hlit > 286 || hdist > 30) corrupt('too many length or distance codes')
      const clLens = new Uint8Array(19)
      for (let i = 0; i < hclen; i++) clLens[CL_ORDER[i]!] = bits(3)
      const cl = buildTable(clLens)
      const lens = new Uint8Array(hlit + hdist)
      let i = 0
      while (i < lens.length) {
        const sym = decode(cl)
        if (sym < 16) {
          lens[i++] = sym
          continue
        }
        let prev = 0
        let rep: number
        if (sym === 16) {
          if (i === 0) corrupt('repeat with no previous length')
          prev = lens[i - 1]!
          rep = 3 + bits(2)
        } else if (sym === 17) rep = 3 + bits(3)
        else rep = 11 + bits(7)
        if (i + rep > lens.length) corrupt('code lengths overflow')
        lens.fill(prev, i, i + rep)
        i += rep
      }
      if (!lens[256]) corrupt('missing end-of-block code')
      lit = buildTable(lens.subarray(0, hlit))
      dist = buildTable(lens.subarray(hlit))
    } else {
      corrupt('reserved block type')
    }

    // SPEC: RFC 1951 §3.2.5 literal/length and distance decoding.
    for (;;) {
      const sym = decode(lit)
      if (sym < 256) {
        if (op >= out.length) grow(1)
        out[op++] = sym
        continue
      }
      if (sym === 256) break
      const li = sym - 257
      if (li >= 29) corrupt('invalid length code')
      const len = LEN_BASE[li]! + (LEN_EXTRA[li] ? bits(LEN_EXTRA[li]!) : 0)
      const di = decode(dist)
      if (di >= 30) corrupt('invalid distance code')
      const d = DIST_BASE[di]! + (DIST_EXTRA[di] ? bits(DIST_EXTRA[di]!) : 0)
      if (d > op) corrupt('distance too far back')
      if (op + len > out.length) grow(len)
      let from = op - d
      if (d >= len) {
        out.copyWithin(op, from, from + len)
        op += len
      } else {
        for (let k = 0; k < len; k++) out[op++] = out[from++]!
      }
    }
  }
  // Byte offset just after the last block (partial byte discarded).
  const end = pos - ((cnt >> 3) - pad)
  return { out: op === out.length ? out : out.slice(0, op), end }
}

/** Decompresses a zlib stream, falling back to raw DEFLATE for broken taggers. */
export function inflate(data: Uint8Array, opts: InflateOptions = {}): Uint8Array {
  const { expectedSize, warnings } = opts
  const limit =
    expectedSize !== undefined && expectedSize >= 0 ? Math.min(HARD_LIMIT, Math.max(expectedSize * 4, MB)) : HARD_LIMIT
  const initial = expectedSize ?? data.length * 4

  try {
    // SPEC: RFC 1950 §2.2 CMF/FLG: CM = 8, CINFO <= 7, check bits, no preset dictionary.
    if (data.length < 2) throw new BadHeader('stream too short')
    const cmf = data[0]!
    const flg = data[1]!
    if ((cmf & 0x0f) !== 8 || cmf >> 4 > 7) throw new BadHeader('compression method is not deflate')
    if ((cmf * 256 + flg) % 31 !== 0) throw new BadHeader('header check bits are wrong')
    if (flg & 0x20) throw new BadHeader('preset dictionary not supported')
  } catch (e) {
    if (!(e instanceof BadHeader)) throw e
    let res
    try {
      res = inflateRaw(data, 0, limit, initial)
    } catch (e2) {
      if (e2 instanceof TagReadError && e2.code === 'zlib-too-large') throw e2
      throw new TagReadError('zlib-corrupt', `invalid zlib header (${e.message}) and not raw deflate either`)
    }
    warnings?.warn('zlib-raw', `invalid zlib header (${e.message}); decoded as raw deflate`)
    return res.out
  }

  const { out, end } = inflateRaw(data, 2, limit, initial)
  // SPEC: RFC 1950 §2.2 ADLER32 trailer, most significant byte first.
  if (end + 4 > data.length) {
    warnings?.warn('zlib-adler', 'zlib stream has no Adler-32 trailer')
  } else {
    const want = ((data[end]! << 24) | (data[end + 1]! << 16) | (data[end + 2]! << 8) | data[end + 3]!) >>> 0
    const got = adler32(out)
    if (want !== got) {
      warnings?.warn('zlib-adler', `Adler-32 mismatch: stored ${hex(want)}, computed ${hex(got)}`)
    }
  }
  return out
}

function hex(n: number): string {
  return '0x' + n.toString(16).padStart(8, '0')
}

// SPEC: RFC 1950 §8.2 Adler-32.
export function adler32(data: Uint8Array): number {
  let a = 1
  let b = 0
  const n = data.length
  let i = 0
  while (i < n) {
    const end = Math.min(i + 5552, n) // largest run before b can overflow 2^32
    for (; i < end; i++) {
      a += data[i]!
      b += a
    }
    a %= 65521
    b %= 65521
  }
  return ((b << 16) | a) >>> 0
}

/** LSB-first bit writer over a growing byte buffer. */
class BitWriter {
  out: Uint8Array
  pos = 0
  private buf = 0
  private cnt = 0

  constructor(size: number) {
    this.out = new Uint8Array(Math.max(64, size))
  }

  private ensure(n: number): void {
    if (this.pos + n <= this.out.length) return
    const next = new Uint8Array(Math.max(this.out.length * 2, this.pos + n))
    next.set(this.out.subarray(0, this.pos))
    this.out = next
  }

  /** Writes up to 16 bits. */
  bits(v: number, k: number): void {
    this.buf |= v << this.cnt
    this.cnt += k
    if (this.cnt >= 8) {
      this.ensure(3)
      while (this.cnt >= 8) {
        this.out[this.pos++] = this.buf & 0xff
        this.buf >>>= 8
        this.cnt -= 8
      }
    }
  }

  align(): void {
    if (this.cnt > 0) this.bits(0, 8 - this.cnt)
  }

  bytes(b: Uint8Array): void {
    this.ensure(b.length)
    this.out.set(b, this.pos)
    this.pos += b.length
  }

  finish(): Uint8Array {
    this.align()
    return this.out.slice(0, this.pos)
  }
}

let litCodes: Uint16Array | undefined
let litLens: Uint8Array | undefined
let lenSym: Uint8Array | undefined // match length -> length code index 0..28
let distSym: Uint8Array | undefined // distance -> distance code index 0..29

function encoderTables(): void {
  if (litCodes) return
  litLens = fixedLitLengths()
  litCodes = canonicalCodes(litLens)
  lenSym = new Uint8Array(259)
  for (let i = 0; i < 29; i++) {
    const top = i === 28 ? 258 : LEN_BASE[i]! + (1 << LEN_EXTRA[i]!) - 1
    lenSym.fill(i, LEN_BASE[i]!, top + 1)
  }
  lenSym[258] = 28
  distSym = new Uint8Array(32769)
  for (let i = 0; i < 30; i++) {
    distSym.fill(i, DIST_BASE[i]!, Math.min(32769, DIST_BASE[i]! + (1 << DIST_EXTRA[i]!)))
  }
}

const WSIZE = 32768
const WMASK = WSIZE - 1
const HBITS = 15
const HMASK = (1 << HBITS) - 1
const MAX_MATCH = 258
const BLOCK = 65535 // input bytes per block, so a stored fallback fits one stored block

function writeStored(w: BitWriter, data: Uint8Array, final: boolean): void {
  // SPEC: RFC 1951 §3.2.4 stored block: header, align, LEN, NLEN, bytes.
  w.bits(final ? 1 : 0, 3)
  w.align()
  const len = data.length
  w.bits(len & 0xffff, 16)
  w.bits(~len & 0xffff, 16)
  w.bytes(data)
}

/** Compresses to a zlib stream. Level 0 stores; 1 and 6 use LZ77 with fixed Huffman codes. */
export function deflate(data: Uint8Array, level: 0 | 1 | 6 = 6): Uint8Array {
  const n = data.length
  const w = new BitWriter(level === 0 ? n + 16 + 5 * Math.ceil(n / BLOCK) : (n >> 1) + 64)
  // SPEC: RFC 1950 §2.2 CMF = 0x78 (deflate, 32K window); FLG level hint with valid check bits.
  w.bits(0x78, 8)
  w.bits(level === 6 ? 0x9c : 0x01, 8)

  if (level === 0) {
    let i = 0
    do {
      const end = Math.min(n, i + BLOCK)
      writeStored(w, data.subarray(i, end), end === n)
      i = end
    } while (i < n)
  } else if (n === 0) {
    // One final fixed block holding only end-of-block (code 256 is seven 0 bits).
    w.bits(3, 3)
    w.bits(0, 7)
  } else {
    lz77(w, data, level)
  }

  w.align()
  const a = adler32(data)
  w.bits((a >>> 24) & 0xff, 8)
  w.bits((a >>> 16) & 0xff, 8)
  w.bits((a >>> 8) & 0xff, 8)
  w.bits(a & 0xff, 8)
  return w.finish()
}

function lz77(w: BitWriter, data: Uint8Array, level: 1 | 6): void {
  encoderTables()
  const lc = litCodes!
  const ll = litLens!
  const ls = lenSym!
  const ds = distSym!
  const n = data.length
  const maxChain = level === 1 ? 4 : 128
  const nice = level === 1 ? 32 : MAX_MATCH
  const lazy = level === 6
  const head = new Int32Array(1 << HBITS).fill(-1)
  const prev = new Int32Array(WSIZE)
  let inserted = 0 // positions below this are in the hash chains

  const insertTo = (p: number): void => {
    const lim = Math.min(p, n - 2)
    for (let i = inserted; i < lim; i++) {
      const h = ((data[i]! << 10) ^ (data[i + 1]! << 5) ^ data[i + 2]!) & HMASK
      prev[i & WMASK] = head[h]!
      head[h] = i
    }
    if (p > inserted) inserted = p
  }

  let mLen = 0
  let mDist = 0
  const find = (i: number, end: number): void => {
    mLen = 0
    const maxLen = Math.min(MAX_MATCH, end - i)
    if (maxLen < 3) return
    insertTo(i)
    let cand = head[((data[i]! << 10) ^ (data[i + 1]! << 5) ^ data[i + 2]!) & HMASK]!
    let chain = maxChain
    let best = 2
    while (cand >= 0 && chain-- > 0) {
      const d = i - cand
      if (d > WSIZE || d <= 0) break
      if (data[cand + best] === data[i + best] && data[cand] === data[i]) {
        let k = 0
        while (k < maxLen && data[cand + k] === data[i + k]) k++
        if (k > best) {
          best = k
          mDist = d
          if (k >= nice || k === maxLen) break
        }
      }
      const nx = prev[cand & WMASK]!
      if (nx >= cand) break
      cand = nx
    }
    if (best >= 3) mLen = best
  }

  // Tokens for one block: lens[i] = 0 for a literal (val = byte), else match length/distance.
  const tLen = new Uint16Array(BLOCK)
  const tVal = new Uint16Array(BLOCK)

  for (let start = 0; start < n; start += BLOCK) {
    const end = Math.min(n, start + BLOCK)
    let nt = 0
    let cost = 0 // fixed-Huffman bits for this block
    const lit = (b: number): void => {
      tLen[nt] = 0
      tVal[nt++] = b
      cost += ll[b]!
    }
    const match = (len: number, d: number): void => {
      tLen[nt] = len
      tVal[nt++] = d
      const li = ls[len]!
      const di = ds[d]!
      cost += ll[257 + li]! + LEN_EXTRA[li]! + 5 + DIST_EXTRA[di]!
    }

    let i = start
    while (i < end) {
      find(i, end)
      if (!mLen) {
        lit(data[i]!)
        i++
        continue
      }
      let len = mLen
      let d = mDist
      if (lazy) {
        // Defer the match while the next position offers a longer one.
        while (len < nice && i + 1 < end) {
          find(i + 1, end)
          if (mLen <= len) break
          lit(data[i]!)
          i++
          len = mLen
          d = mDist
        }
      }
      match(len, d)
      i += len
    }

    const final = end === n
    const storedCost = (end - start + 5) * 8 + 7
    if (cost + 3 + 7 > storedCost) {
      writeStored(w, data.subarray(start, end), final)
      continue
    }
    // SPEC: RFC 1951 §3.2.6 fixed Huffman block.
    w.bits(final ? 3 : 2, 3)
    for (let t = 0; t < nt; t++) {
      const len = tLen[t]!
      if (!len) {
        const b = tVal[t]!
        w.bits(lc[b]!, ll[b]!)
        continue
      }
      const d = tVal[t]!
      const li = ls[len]!
      const s = 257 + li
      w.bits(lc[s]!, ll[s]!)
      if (LEN_EXTRA[li]) w.bits(len - LEN_BASE[li]!, LEN_EXTRA[li]!)
      const di = ds[d]!
      w.bits(reverseBits(di, 5), 5)
      if (DIST_EXTRA[di]) w.bits(d - DIST_BASE[di]!, DIST_EXTRA[di]!)
    }
    w.bits(lc[256]!, ll[256]!)
  }
}
