import { describe, expect, it } from 'vitest'
import { WarningSink } from '../src/core/errors'
import {
  describeRestrictions,
  parseExtendedHeaderV23,
  parseExtendedHeaderV24,
  serializeExtendedHeaderV23,
  serializeExtendedHeaderV24,
} from '../src/id3v2/extended-header'
import { isTagHeader, parseTagHeader, serializeTagHeader } from '../src/id3v2/header'

const b = (...x: number[]) => Uint8Array.from(x)

describe('tag header', () => {
  it('detects the pattern $49 44 33 yy yy xx zz zz zz zz', () => {
    expect(isTagHeader(b(0x49, 0x44, 0x33, 4, 0, 0, 0, 0, 2, 1))).toBe(true)
    expect(isTagHeader(b(0x49, 0x44, 0x33, 0xff, 0, 0, 0, 0, 2, 1))).toBe(false)
    expect(isTagHeader(b(0x49, 0x44, 0x33, 4, 0xff, 0, 0, 0, 2, 1))).toBe(false)
    expect(isTagHeader(b(0x49, 0x44, 0x33, 4, 0, 0, 0, 0x80, 2, 1))).toBe(false)
  })

  it('decodes flags per version', () => {
    expect(parseTagHeader(b(0x49, 0x44, 0x33, 2, 0, 0xc0, 0, 0, 0, 1))!.flags).toEqual({
      unsynchronisation: true,
      compression: true,
    })
    expect(parseTagHeader(b(0x49, 0x44, 0x33, 3, 0, 0xe0, 0, 0, 0, 1))!.flags).toEqual({
      unsynchronisation: true,
      extendedHeader: true,
      experimental: true,
    })
    expect(parseTagHeader(b(0x49, 0x44, 0x33, 4, 0, 0xf1, 0, 0, 2, 1))).toMatchObject({
      size: 257,
      flags: { unsynchronisation: true, extendedHeader: true, experimental: true, footer: true, unknownBits: 1 },
    })
  })

  it('round-trips a header and a footer', () => {
    const h = serializeTagHeader(4, 0, { unsynchronisation: false, footer: true }, 1000)
    expect(parseTagHeader(h)).toMatchObject({ major: 4, revision: 0, size: 1000, flags: { footer: true } })
    const f = serializeTagHeader(4, 0, { unsynchronisation: false, footer: true }, 1000, '3DI')
    expect(parseTagHeader(f, 0, '3DI')).toMatchObject({ size: 1000 })
  })

  it('drops undefined flag bits unless asked to keep them', () => {
    const flags = { unsynchronisation: false, unknownBits: 0x01 }
    expect(serializeTagHeader(4, 0, flags, 1)[5]).toBe(0)
    expect(serializeTagHeader(4, 0, flags, 1, 'ID3', true)[5]).toBe(1)
  })
})

describe('v2.3 extended header', () => {
  it('reads and writes the 6-byte form', () => {
    const bytes = serializeExtendedHeaderV23({ version: 3, paddingSize: 100 })
    expect(bytes).toEqual(b(0, 0, 0, 6, 0, 0, 0, 0, 0, 100))
    expect(parseExtendedHeaderV23(bytes, 0, new WarningSink())).toEqual({
      header: { version: 3, paddingSize: 100 },
      size: 10,
    })
  })
  it('reads and writes the 10-byte form with CRC', () => {
    const bytes = serializeExtendedHeaderV23({ version: 3, paddingSize: 0, crc: 0xdeadbeef })
    expect(bytes).toEqual(b(0, 0, 0, 10, 0x80, 0, 0, 0, 0, 0, 0xde, 0xad, 0xbe, 0xef))
    expect(parseExtendedHeaderV23(bytes, 0, new WarningSink()).header.crc).toBe(0xdeadbeef)
  })
})

describe('v2.4 extended header', () => {
  it('writes the minimal form', () => {
    expect(serializeExtendedHeaderV24({ version: 4, isUpdate: false })).toEqual(b(0, 0, 0, 6, 1, 0))
  })
  it('round-trips every flag', () => {
    const h = {
      version: 4 as const,
      isUpdate: true,
      crc: 0xffffffff,
      restrictions: { tagSize: 2 as const, textEncoding: 1 as const, textFieldSize: 3 as const, imageEncoding: 1 as const, imageSize: 3 as const },
    }
    const bytes = serializeExtendedHeaderV24(h)
    // size 6 + 1 (update) + 6 (CRC) + 2 (restrictions) = 15
    expect(bytes.slice(0, 6)).toEqual(b(0, 0, 0, 15, 1, 0x70))
    // restrictions %ppqrrstt = 10 1 11 1 11
    expect(bytes[14]).toBe(0b10111111)
    const w = new WarningSink()
    expect(parseExtendedHeaderV24(bytes, 0, w)).toEqual({ header: h, size: 15 })
    expect(w.list).toEqual([])
  })
  it('describes the restriction limits from the spec', () => {
    expect(describeRestrictions({ tagSize: 3, textEncoding: 1, textFieldSize: 2, imageEncoding: 0, imageSize: 1 })).toEqual({
      maxFrames: 32,
      maxTagSize: 4096,
      encodings: [0, 3],
      maxStringLength: 128,
      maxImageSize: 256,
    })
  })
})
