import { deflateRawSync, deflateSync, inflateSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'
import { WarningSink } from '../src/core/errors'
import { deflate, inflate } from '../src/core/zlib'

/** Byte comparison; vitest's deep equality is slow on megabyte arrays. */
function same(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false
  return true
}

function sample(): Uint8Array {
  const parts: number[] = []
  let x = 7
  for (let i = 0; i < 300000; i++) {
    x = (x * 1103515245 + 12345) >>> 0
    // Mostly text-like with some noise, so all block types show up.
    parts.push(i % 1000 < 800 ? 'abcdefghij klmnop'.charCodeAt((x >>> 16) % 6 + (i % 11)) : (x >>> 24) & 0xff)
  }
  return Uint8Array.from(parts)
}

const data = sample()
const inputs: [string, Uint8Array][] = [
  ['empty', new Uint8Array(0)],
  ['1 byte', Uint8Array.of(9)],
  ['sample', data],
]

describe('interop with node:zlib', () => {
  for (let level = 1; level <= 9; level++) {
    it(`inflates deflateSync level ${level}`, () => {
      for (const [, d] of inputs) {
        const sink = new WarningSink()
        expect(same(inflate(new Uint8Array(deflateSync(d, { level })), { warnings: sink }), d)).toBe(true)
        expect(sink.list).toEqual([])
      }
    })
  }

  it('inflates deflateRawSync output with a zlib-raw warning', () => {
    const sink = new WarningSink()
    expect(same(inflate(new Uint8Array(deflateRawSync(data)), { warnings: sink }), data)).toBe(true)
    expect(sink.list.map((w) => w.code)).toEqual(['zlib-raw'])
  })

  for (const level of [0, 1, 6] as const) {
    it(`inflateSync accepts our deflate level ${level}`, () => {
      for (const [, d] of inputs) expect(same(new Uint8Array(inflateSync(deflate(d, level))), d)).toBe(true)
    })
  }
})
