import { describe, expect, it } from 'vitest'
import { ByteReader } from '../src/core/bytes'
import { WarningSink } from '../src/core/errors'
import {
  TextEncoding,
  allowedEncodings,
  decodeText,
  encodeText,
  pickEncoding,
  readTerminated,
  splitStrings,
  type Utf16State,
} from '../src/core/encoding'

const b = (...x: number[]) => Uint8Array.from(x)

describe('text encodings', () => {
  it('limits v2.2/v2.3 to $00 and $01', () => {
    expect(allowedEncodings(3)).toEqual([0, 1])
    expect(allowedEncodings(4)).toEqual([0, 1, 2, 3])
  })

  it('decodes ISO-8859-1 exactly, including $80-$9F', () => {
    expect(decodeText(b(0x80, 0x9f, 0xe4), TextEncoding.Latin1)).toBe('\u0080\u009fä')
  })

  it('decodes UTF-16 with either BOM', () => {
    expect(decodeText(b(0xff, 0xfe, 0x41, 0x00), TextEncoding.UTF16)).toBe('A')
    expect(decodeText(b(0xfe, 0xff, 0x00, 0x41), TextEncoding.UTF16)).toBe('A')
  })

  it('reads an empty UTF-16 string written as BOM + NUL', () => {
    const r = new ByteReader(b(0xff, 0xfe, 0x00, 0x00, 0x42))
    expect(readTerminated(r, TextEncoding.UTF16)).toBe('')
    expect(r.u8()).toBe(0x42)
  })

  it('reads v2.2 UCS-2 without a BOM as big-endian, silently', () => {
    const w = new WarningSink()
    expect(decodeText(b(0x00, 0x41), TextEncoding.UTF16, { major: 2, warnings: w })).toBe('A')
    expect(w.list).toHaveLength(0)
  })

  it('warns on a missing BOM in v2.3 and on an odd byte count', () => {
    const w = new WarningSink()
    decodeText(b(0x00, 0x41, 0x00), TextEncoding.UTF16, { major: 3, warnings: w })
    expect(w.list.map((x) => x.code)).toEqual(['utf16-no-bom', 'utf16-odd-length'])
  })

  it('warns when a frame mixes byte orders', () => {
    const w = new WarningSink()
    const st: Utf16State = {}
    decodeText(b(0xff, 0xfe, 0x41, 0x00), TextEncoding.UTF16, { warnings: w }, st)
    decodeText(b(0xfe, 0xff, 0x00, 0x41), TextEncoding.UTF16, { warnings: w }, st)
    expect(w.list[0]?.code).toBe('utf16-mixed-bom')
  })

  it('round-trips every encoding', () => {
    const s = 'räksmörgås ✓ 𝄞'
    for (const enc of [TextEncoding.UTF16, TextEncoding.UTF16BE, TextEncoding.UTF8]) {
      expect(decodeText(encodeText(s, enc), enc)).toBe(s)
    }
    expect(decodeText(encodeText('räksmörgås', TextEncoding.Latin1), TextEncoding.Latin1)).toBe('räksmörgås')
  })

  it('refuses non-Latin-1 characters unless lenient', () => {
    expect(() => encodeText('✓', TextEncoding.Latin1)).toThrow()
    expect(encodeText('✓', TextEncoding.Latin1, { lenient: true })).toEqual(b(0x3f))
  })

  it('refuses surrogate pairs in UCS-2', () => {
    expect(() => encodeText('𝄞', TextEncoding.UTF16, { ucs2: true })).toThrow()
  })

  it('splits null-separated lists and ignores one trailing terminator', () => {
    expect(splitStrings(b(0x65, 0x6e, 0x67, 0, 0x73, 0x76, 0x65, 0), TextEncoding.Latin1)).toEqual(['eng', 'sve'])
    expect(splitStrings(b(), TextEncoding.Latin1)).toEqual([''])
    expect(splitStrings(b(0x41, 0, 0, 0x42), TextEncoding.Latin1)).toEqual(['A', '', 'B'])
  })

  it('picks the smallest legal encoding', () => {
    expect(pickEncoding('abc', 3)).toBe(TextEncoding.Latin1)
    expect(pickEncoding('✓', 3)).toBe(TextEncoding.UTF16)
    expect(pickEncoding('✓', 4, TextEncoding.UTF8)).toBe(TextEncoding.UTF8)
    expect(pickEncoding('✓', 3, TextEncoding.UTF8)).toBe(TextEncoding.UTF16)
  })
})
