import { describe, expect, it } from 'vitest'
import { ByteReader, ByteWriter, bigToBytes, bytesToBig } from '../src/core/bytes'
import { crc32 } from '../src/core/crc32'
import { decodeSynchsafe, encodeSynchsafe, isSynchsafe } from '../src/core/synchsafe'
import { needsUnsync, resynchronise, unsynchronise } from '../src/core/unsync'

const b = (...x: number[]) => Uint8Array.from(x)

describe('synchsafe (v2.4 structure §6.2)', () => {
  it('encodes 255 as $01 7F in 16 bits', () => {
    expect(encodeSynchsafe(255, 2)).toEqual(b(0x01, 0x7f))
  })
  it('encodes a 257-byte tag size as $00 00 02 01 (v2.3 §3.1)', () => {
    expect(encodeSynchsafe(257)).toEqual(b(0, 0, 2, 1))
    expect(decodeSynchsafe(b(0, 0, 2, 1))).toBe(257)
  })
  it('round-trips boundary values', () => {
    for (const v of [0, 1, 127, 128, 2 ** 28 - 1]) expect(decodeSynchsafe(encodeSynchsafe(v))).toBe(v)
    expect(() => encodeSynchsafe(2 ** 28)).toThrow(RangeError)
  })
  it('holds a 32-bit CRC in 35 bits with the top 4 bits zero', () => {
    const e = encodeSynchsafe(0xffffffff, 5)
    expect(e[0]).toBe(0x0f)
    expect(isSynchsafe(e, 0, 5)).toBe(true)
    expect(decodeSynchsafe(e, 0, 5)).toBe(0xffffffff)
  })
})

describe('unsynchronisation (v2.4 structure §6.1)', () => {
  it('inserts $00 after a false sync', () => {
    expect(unsynchronise(b(0xff, 0xe0)).data).toEqual(b(0xff, 0x00, 0xe0))
  })
  it('turns $FF 00 into $FF 00 00', () => {
    expect(unsynchronise(b(0xff, 0x00)).data).toEqual(b(0xff, 0x00, 0x00))
  })
  it('leaves $FF 7F alone', () => {
    const r = unsynchronise(b(0xff, 0x7f))
    expect(r.changed).toBe(false)
    expect(r.data).toEqual(b(0xff, 0x7f))
  })
  it('handles consecutive $FF bytes', () => {
    expect(unsynchronise(b(0xff, 0xff, 0xe0)).data).toEqual(b(0xff, 0, 0xff, 0, 0xe0))
  })
  it('reports a trailing $FF', () => {
    expect(unsynchronise(b(1, 0xff)).endsWithFF).toBe(true)
  })
  it('round-trips random data', () => {
    for (let n = 0; n < 200; n++) {
      const d = new Uint8Array(64).map(() => (Math.random() < 0.3 ? 0xff : Math.random() < 0.5 ? 0 : 0xe5))
      const u = unsynchronise(d).data
      for (let i = 0; i + 1 < u.length; i++) if (u[i] === 0xff) expect(u[i + 1]! < 0xe0).toBe(true)
      expect(needsUnsync(d)).toBe(d.some((x, i) => x === 0xff && i + 1 < d.length && (d[i + 1]! >= 0xe0 || d[i + 1] === 0)))
      expect(resynchronise(u)).toEqual(d)
    }
  })
})

describe('crc32 (ISO-3309)', () => {
  it('matches the standard check value', () => {
    expect(crc32(new TextEncoder().encode('123456789'))).toBe(0xcbf43926)
  })
})

describe('ByteReader / ByteWriter', () => {
  it('reads and writes big-endian integers', () => {
    const w = new ByteWriter(1).u8(1).u16(0x0203).u24(0x040506).u32(0x0708090a).i16(-2)
    const r = new ByteReader(w.toUint8Array())
    expect([r.u8(), r.u16(), r.u24(), r.u32(), r.i16()]).toEqual([1, 0x0203, 0x040506, 0x0708090a, -2])
  })
  it('finds a 2-byte terminator only on a character boundary', () => {
    const r = new ByteReader(b(0x41, 0x00, 0x00, 0x42, 0x00, 0x00, 0x99))
    const t = r.terminated(2)
    expect(t.bytes).toEqual(b(0x41, 0x00, 0x00, 0x42))
    expect(r.u8()).toBe(0x99)
  })
  it('handles bigint counters', () => {
    expect(bytesToBig(bigToBytes(2n ** 40n + 5n, 4))).toBe(2n ** 40n + 5n)
    expect(bigToBytes(1n, 4)).toEqual(b(0, 0, 0, 1))
  })
  it('throws on truncated reads', () => {
    expect(() => new ByteReader(b(1)).u16()).toThrow()
  })
})
