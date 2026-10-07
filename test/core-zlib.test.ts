import { describe, expect, it } from 'vitest'
import { TagReadError, WarningSink } from '../src/core/errors'
import { adler32, deflate, inflate } from '../src/core/zlib'

const levels = [0, 1, 6] as const

/** Byte comparison; vitest's deep equality is slow on megabyte arrays. */
function same(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}
const ascii = (s: string) => Uint8Array.from(s, (c) => c.charCodeAt(0))

/** Deterministic pseudo-random bytes (xorshift32), so failures reproduce. */
function random(n: number, seed = 0x12345678): Uint8Array {
  const out = new Uint8Array(n)
  let x = seed
  for (let i = 0; i < n; i++) {
    x ^= x << 13
    x ^= x >>> 17
    x ^= x << 5
    out[i] = x & 0xff
  }
  return out
}

function repetitiveText(n: number): Uint8Array {
  const words = ['the ', 'quick ', 'brown ', 'fox ', 'jumps ', 'over ', 'lazy ', 'dog ', 'ID3 ', 'frame ']
  const out = new Uint8Array(n)
  let i = 0
  let k = 0
  while (i < n) {
    const w = words[(k * 7 + (k >> 3)) % words.length]!
    for (let j = 0; j < w.length && i < n; j++) out[i++] = w.charCodeAt(j)
    k++
  }
  return out
}

function expectID3Error(fn: () => unknown, code?: string) {
  try {
    fn()
  } catch (e) {
    expect(e).toBeInstanceOf(TagReadError)
    if (code) expect((e as TagReadError).code).toBe(code)
    return
  }
  throw new Error('expected a TagReadError')
}

describe('adler32 (RFC 1950 §8.2)', () => {
  it('matches the known value for "Wikipedia"', () => {
    expect(adler32(ascii('Wikipedia'))).toBe(0x11e60398)
  })
  it('is 1 for empty input', () => {
    expect(adler32(new Uint8Array(0))).toBe(1)
  })
  it('handles long runs of 0xFF without overflow', () => {
    // Reference computed by the naive definition with modulo on every step.
    const d = new Uint8Array(100000).fill(0xff)
    let a = 1
    let b = 0
    for (const x of d) {
      a = (a + x) % 65521
      b = (b + a) % 65521
    }
    expect(adler32(d)).toBe(((b << 16) | a) >>> 0)
  })
})

describe('deflate/inflate round trip', () => {
  const cases: [string, Uint8Array][] = [
    ['empty', new Uint8Array(0)],
    ['1 byte', Uint8Array.of(0x42)],
    ['64 KB random', random(65536)],
    ['1 MB repetitive text', repetitiveText(1024 * 1024)],
    ['200 KB zeros', new Uint8Array(200000)],
    ['mixed random and text', (() => {
      const r = random(70000, 99)
      r.set(repetitiveText(30000), 20000)
      return r
    })()],
  ]
  for (const level of levels) {
    for (const [name, data] of cases) {
      it(`level ${level}: ${name}`, () => {
        const z = deflate(data, level)
        expect(z[0]).toBe(0x78)
        expect((z[0]! * 256 + z[1]!) % 31).toBe(0)
        const sink = new WarningSink()
        const back = inflate(z, { expectedSize: data.length, warnings: sink })
        expect(back.length).toBe(data.length)
        expect(same(back, data)).toBe(true)
        expect(sink.list).toEqual([])
      })
    }
  }

  it('uses the expected header bytes per level', () => {
    expect([...deflate(ascii('x'), 0).subarray(0, 2)]).toEqual([0x78, 0x01])
    expect([...deflate(ascii('x'), 1).subarray(0, 2)]).toEqual([0x78, 0x01])
    expect([...deflate(ascii('x'), 6).subarray(0, 2)]).toEqual([0x78, 0x9c])
    expect([...deflate(ascii('x')).subarray(0, 2)]).toEqual([0x78, 0x9c])
  })

  it('compresses repetitive text well at level 6', () => {
    const data = repetitiveText(1024 * 1024)
    expect(deflate(data, 6).length).toBeLessThan(data.length / 20)
  })

  it('inflates 1 MB quickly', () => {
    const data = repetitiveText(1024 * 1024)
    const z = deflate(data, 1)
    const t = performance.now()
    inflate(z)
    expect(performance.now() - t).toBeLessThan(500)
  })
})

describe('inflate on bad input', () => {
  const good = deflate(repetitiveText(5000), 6)

  it('warns on an Adler-32 mismatch', () => {
    const bad = good.slice()
    bad[bad.length - 1]! ^= 0xff
    const sink = new WarningSink()
    expect(inflate(bad, { warnings: sink })).toEqual(repetitiveText(5000))
    expect(sink.list.map((w) => w.code)).toEqual(['zlib-adler'])
  })

  it('throws zlib-corrupt on truncation at every length', () => {
    for (let n = 2; n < good.length - 4; n += 7) expectID3Error(() => inflate(good.subarray(0, n)), 'zlib-corrupt')
  })

  it('throws zlib-corrupt for garbage and empty input', () => {
    expectID3Error(() => inflate(new Uint8Array(0)), 'zlib-corrupt')
    expectID3Error(() => inflate(Uint8Array.of(0x78, 0x9c, 0xff, 0xff, 0xff)), 'zlib-corrupt')
    // Stored block with LEN/NLEN mismatch.
    expectID3Error(() => inflate(Uint8Array.of(0x78, 0x01, 0x01, 0x05, 0x00, 0x00, 0x00)), 'zlib-corrupt')
  })

  it('never hangs on random corruption', () => {
    for (let s = 1; s <= 300; s++) {
      const bad = good.slice()
      const r = random(4, s)
      const i = 2 + ((r[0]! * 256 + r[1]!) % (bad.length - 2))
      bad[i] = bad[i]! ^ (r[2]! | 1)
      try {
        inflate(bad, { expectedSize: 5000 })
      } catch (e) {
        expect(e).toBeInstanceOf(TagReadError)
      }
    }
  })

  it('throws zlib-too-large past the expected size guard', () => {
    const z = deflate(new Uint8Array(3 * 1024 * 1024), 6)
    expectID3Error(() => inflate(z, { expectedSize: 100 }), 'zlib-too-large')
    expect(inflate(z, { expectedSize: 1024 * 1024 }).length).toBe(3 * 1024 * 1024)
  })

  it('decodes raw deflate with a zlib-raw warning', () => {
    const z = deflate(ascii('hello hello hello hello'), 6)
    const raw = z.subarray(2, z.length - 4)
    const sink = new WarningSink()
    expect(inflate(raw, { warnings: sink })).toEqual(ascii('hello hello hello hello'))
    expect(sink.list.map((w) => w.code)).toEqual(['zlib-raw'])
  })

  it('rejects a preset dictionary header unless it parses as raw deflate', () => {
    // 0x78 0xBB: FDICT set with valid check bits.
    expect((0x78 * 256 + 0xbb) % 31).toBe(0)
    expectID3Error(() => inflate(Uint8Array.of(0x78, 0xbb, 1, 2, 3, 4)), 'zlib-corrupt')
  })
})
