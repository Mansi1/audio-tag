import { describe, expect, it } from 'vitest'
import { type MajorVersion, TextEncoding } from '../src/core/encoding'
import type { TagRestrictions } from '../src/id3v2/extended-header'
import type { FrameFlags } from '../src/id3v2/frame-header'
import type { Frame, FrameInit, FrameType } from '../src/id3v2/frames/types'
import { createFrame, createTag, type ID3v2Tag } from '../src/id3v2/tag'
import { type Issue, jpegSize, pngSize, validateID3v2 } from '../src/id3v2/validate'
import { bytes, u32 } from './helpers'

const L = TextEncoding.Latin1

function fr<T extends FrameType>(type: T, id: string, init: FrameInit<T>, major: MajorVersion = 4, flags: Partial<FrameFlags> = {}): Frame {
  return createFrame(type, id, init, major, flags)
}
const text = (id: string, values: string[], major: MajorVersion = 4, encoding = L) => fr('text', id, { encoding, values }, major)
const title = (major: MajorVersion = 4) => text(major === 2 ? 'TT2' : 'TIT2', ['Title'], major)
const tag = (major: MajorVersion, ...frames: Frame[]): ID3v2Tag => createTag(major, frames)

function issues(t: ID3v2Tag, code: string): Issue[] {
  return validateID3v2(t).filter((i) => i.code === code)
}
/** Asserts that the tag has an issue with this code and level, and returns it. */
function fails(t: ID3v2Tag, code: string, level: Issue['level'] = 'error'): Issue {
  const found = issues(t, code)
  expect(found.map((i) => i.code), JSON.stringify(validateID3v2(t))).toContain(code)
  expect(found[0]!.level).toBe(level)
  expect(found[0]!.spec).toMatch(/§/)
  return found[0]!
}
function passes(t: ID3v2Tag, code: string): void {
  expect(issues(t, code)).toEqual([])
}

function png(width: number, height: number): Uint8Array {
  return bytes([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], u32(13), 'IHDR', u32(width), u32(height), [8, 6, 0, 0, 0], [0, 0, 0, 0])
}
function jpeg(width: number, height: number): Uint8Array {
  return bytes(
    [0xff, 0xd8],
    [0xff, 0xe0, 0x00, 0x10], 'JFIF', [0, 1, 1, 0, 0, 1, 0, 1, 0, 0],
    [0xff, 0xff], // fill byte
    [0xff, 0xc0, 0x00, 0x11, 8, height >> 8, height & 0xff, width >> 8, width & 0xff, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1],
    [0xff, 0xd9],
  )
}
const apic = (init: Partial<FrameInit<'picture'>> = {}, major: MajorVersion = 4) =>
  fr('picture', major === 2 ? 'PIC' : 'APIC', { encoding: L, mimeType: major === 2 ? 'PNG' : 'image/png', pictureType: 3, description: '', data: png(64, 64), ...init }, major)

describe('image size helpers', () => {
  it('reads PNG IHDR', () => {
    expect(pngSize(png(32, 16))).toEqual({ width: 32, height: 16 })
    expect(pngSize(jpeg(1, 1))).toBeUndefined()
    expect(pngSize(new Uint8Array(30))).toBeUndefined()
  })
  it('reads JPEG SOFn, skipping other segments', () => {
    expect(jpegSize(jpeg(640, 480))).toEqual({ width: 640, height: 480 })
    expect(jpegSize(png(1, 1))).toBeUndefined()
    expect(jpegSize(bytes([0xff, 0xd8, 0xff, 0xd9]))).toBeUndefined()
  })
})

describe('a well-formed tag', () => {
  it('has no issues', () => {
    expect(validateID3v2(tag(4, title(), text('TRCK', ['4/9']), text('TDRC', ['2004-05-06T07:08:09'])))).toEqual([])
    expect(validateID3v2(tag(3, title(3), text('TYER', ['2004'], 3)))).toEqual([])
    expect(validateID3v2(tag(2, title(2), text('TYE', ['2004'], 2)))).toEqual([])
  })
})

describe('uniqueness', () => {
  it('"There may only be one" text frame of its kind', () => {
    passes(tag(4, title(), text('TALB', ['A'])), 'duplicate-frame')
    const i = fails(tag(4, title(), title()), 'duplicate-frame')
    expect(i.frameId).toBe('TIT2')
    expect(i.spec).toBe('v2.4 frames §4.2.1')
  })
  it('single frames: MCDI, ETCO, PCNT, OWNE, ...', () => {
    const pcnt = () => fr('pcnt', 'PCNT', { count: 1n })
    passes(tag(4, pcnt()), 'duplicate-frame')
    fails(tag(4, pcnt(), pcnt()), 'duplicate-frame')
  })
  it('USER: single in v2.3, by language in v2.4', () => {
    const user = (lang: string, major: MajorVersion) => fr('user', 'USER', { encoding: L, language: lang, text: 'x' }, major)
    passes(tag(4, user('eng', 4), user('deu', 4)), 'duplicate-frame')
    fails(tag(4, user('eng', 4), user('eng', 4)), 'duplicate-frame')
    fails(tag(3, user('eng', 3), user('deu', 3)), 'duplicate-frame')
  })
  it('TXXX/WXXX by description', () => {
    const txxx = (d: string) => fr('user-text', 'TXXX', { encoding: L, description: d, values: ['v'] })
    passes(tag(4, txxx('a'), txxx('b')), 'duplicate-frame')
    fails(tag(4, txxx('a'), txxx('a')), 'duplicate-frame')
  })
  it('COMM by language and description', () => {
    const comm = (lang: string, d: string) => fr('comment', 'COMM', { encoding: L, language: lang, description: d, text: 't' })
    passes(tag(4, comm('eng', ''), comm('deu', ''), comm('eng', 'x')), 'duplicate-frame')
    fails(tag(4, comm('eng', 'x'), comm('eng', 'x')), 'duplicate-frame')
  })
  it('WCOM/WOAR/PRIV/COMR by content', () => {
    const wcom = (u: string) => fr('url', 'WCOM', { url: u })
    passes(tag(4, wcom('http://a/'), wcom('http://b/')), 'duplicate-frame')
    fails(tag(4, wcom('http://a/'), wcom('http://a/')), 'duplicate-frame')
    const priv = (d: number[]) => fr('priv', 'PRIV', { owner: 'o', data: Uint8Array.from(d) })
    passes(tag(4, priv([1]), priv([2])), 'duplicate-frame')
    fails(tag(4, priv([1]), priv([1])), 'duplicate-frame')
  })
  it('APIC picture types $01 and $02 at most once each', () => {
    const icon = (d: string) => apic({ pictureType: 2, description: d })
    passes(tag(4, icon('a'), apic({ description: 'b' })), 'duplicate-picture-type')
    fails(tag(4, icon('a'), icon('b')), 'duplicate-picture-type')
  })
  it('ENCR/GRID unique by symbol and by owner', () => {
    const enc = { encryptionMethod: 0x80 }
    const encr = (owner: string, sym: number) => fr('encr', 'ENCR', { owner, methodSymbol: sym, data: new Uint8Array(0) })
    const used = fr('text', 'TIT2', { encoding: L, values: ['x'] }, 4, enc)
    const used2 = fr('text', 'TALB', { encoding: L, values: ['x'] }, 4, { encryptionMethod: 0x81 })
    passes(tag(4, used, used2, encr('a', 0x80), encr('b', 0x81)), 'duplicate-frame')
    expect(issues(tag(4, used, encr('a', 0x80), encr('b', 0x80)), 'duplicate-frame')[0]!.message).toMatch(/symbol \$80/)
    expect(issues(tag(4, used, used2, encr('a', 0x80), encr('a', 0x81)), 'duplicate-frame')[0]!.message).toMatch(/owner/)
  })
  it('CHAP and CTOC element IDs are unique across both', () => {
    const chap = (eid: string) => fr('chap', 'CHAP', { elementId: eid, startTime: 0, endTime: 1, startOffset: 0xffffffff, endOffset: 0xffffffff, frames: [title()] })
    const ctoc = fr('ctoc', 'CTOC', { elementId: 'toc', topLevel: true, ordered: true, childElementIds: ['c1'], frames: [title()] })
    passes(tag(4, ctoc, chap('c1')), 'duplicate-element-id')
    fails(tag(4, ctoc, chap('c1'), chap('toc')), 'duplicate-element-id')
  })
  it('sub-frames are checked per CHAP, separately from the tag', () => {
    const chap = (frames: Frame[]) => fr('chap', 'CHAP', { elementId: 'c', startTime: 0, endTime: 1, startOffset: 0, endOffset: 0, frames })
    passes(tag(4, title(), chap([title()])), 'duplicate-frame')
    fails(tag(4, chap([title(), title()])), 'duplicate-frame')
  })
})

describe('cross-frame requirements', () => {
  const mcdi = (major: MajorVersion = 4) => fr('mcdi', major === 2 ? 'MCI' : 'MCDI', { toc: new Uint8Array(12) }, major)
  it('MCDI requires TRCK (v2.2 MCI requires TRK)', () => {
    passes(tag(4, mcdi(), text('TRCK', ['1'])), 'mcdi-requires-trck')
    fails(tag(4, mcdi()), 'mcdi-requires-trck')
    passes(tag(2, mcdi(2), text('TRK', ['1'], 2)), 'mcdi-requires-trck')
    expect(fails(tag(2, mcdi(2)), 'mcdi-requires-trck').spec).toBe('v2.2 §4.5')
  })
  it('ASPI requires TLEN', () => {
    const aspi = fr('aspi', 'ASPI', { indexedDataStart: 0, indexedDataLength: 0, bitsPerIndexPoint: 8, fractions: [] })
    passes(tag(4, aspi, text('TLEN', ['1000'])), 'aspi-requires-tlen')
    expect(fails(tag(4, aspi), 'aspi-requires-tlen').spec).toBe('v2.4 frames §4.30')
  })
  it('an encryption method in use has an ENCR frame', () => {
    const f = fr('text', 'TIT2', { encoding: L, values: ['x'] }, 3, { encryptionMethod: 0x90 })
    passes(tag(3, f, fr('encr', 'ENCR', { owner: 'o', methodSymbol: 0x90, data: new Uint8Array(0) }, 3)), 'encryption-unregistered')
    expect(fails(tag(3, f), 'encryption-unregistered').spec).toBe('v2.3 §4.26')
  })
  it('a group in use has a GRID frame', () => {
    const f = fr('text', 'TIT2', { encoding: L, values: ['x'] }, 4, { groupId: 0x90 })
    passes(tag(4, f, fr('grid', 'GRID', { owner: 'o', groupSymbol: 0x90, data: new Uint8Array(0) })), 'group-unregistered')
    expect(fails(tag(4, f), 'group-unregistered').spec).toBe('v2.4 frames §4.26')
  })
  it('ENCR and GRID symbols are used somewhere in the tag', () => {
    const encr = fr('encr', 'ENCR', { owner: 'o', methodSymbol: 0x90, data: new Uint8Array(0) })
    const grid = fr('grid', 'GRID', { owner: 'o', groupSymbol: 0x91, data: new Uint8Array(0) })
    const used = fr('text', 'TIT2', { encoding: L, values: ['x'] }, 4, { encryptionMethod: 0x90, groupId: 0x91 })
    passes(tag(4, used, encr, grid), 'encryption-unused')
    passes(tag(4, used, encr, grid), 'group-unused')
    fails(tag(4, title(), encr), 'encryption-unused')
    fails(tag(4, title(), grid), 'group-unused')
  })
})

describe('table of contents', () => {
  const chap = (eid: string) => fr('chap', 'CHAP', { elementId: eid, startTime: 0, endTime: 1, startOffset: 0, endOffset: 0, frames: [title()] })
  const ctoc = (eid: string, children: string[], topLevel = false) =>
    fr('ctoc', 'CTOC', { elementId: eid, topLevel, ordered: true, childElementIds: children, frames: [title()] })
  it('children exist', () => {
    passes(tag(4, ctoc('toc', ['c1'], true), chap('c1')), 'ctoc-child-missing')
    fails(tag(4, ctoc('toc', ['c1', 'c2'], true), chap('c1')), 'ctoc-child-missing')
  })
  it('only one top-level CTOC, and it is nobody\'s child', () => {
    passes(tag(4, ctoc('toc', ['sub'], true), ctoc('sub', ['c1']), chap('c1')), 'ctoc-top-level')
    fails(tag(4, ctoc('a', ['c1'], true), ctoc('b', ['c1'], true), chap('c1')), 'ctoc-top-level')
    fails(tag(4, ctoc('a', ['b'], true), ctoc('b', ['a']), chap('c1')), 'ctoc-top-level-child')
  })
  it('no cycles', () => {
    passes(tag(4, ctoc('a', ['b'], true), ctoc('b', ['c1']), chap('c1')), 'ctoc-cycle')
    fails(tag(4, ctoc('a', ['b']), ctoc('b', ['a'])), 'ctoc-cycle')
    fails(tag(4, ctoc('a', ['a'])), 'ctoc-cycle')
  })
  it('the entry count is greater than zero', () => {
    passes(tag(4, ctoc('toc', ['c1'], true), chap('c1')), 'ctoc-empty')
    fails(tag(4, ctoc('toc', [], true)), 'ctoc-empty')
  })
  it('recommends a TIT2 sub-frame', () => {
    passes(tag(4, chap('c1')), 'chapter-title')
    fails(tag(4, fr('chap', 'CHAP', { elementId: 'c', startTime: 0, endTime: 1, startOffset: 0, endOffset: 0, frames: [] })), 'chapter-title', 'warning')
  })
})

describe('field formats', () => {
  it('numeric strings (TBPM, TLEN, TDLY, TSIZ, ... and v2.2 equivalents)', () => {
    passes(tag(4, text('TBPM', ['120']), text('TLEN', ['1000']), text('TDLY', ['0'])), 'numeric-string')
    fails(tag(4, text('TBPM', ['120.5'])), 'numeric-string')
    passes(tag(3, text('TSIZ', ['12345'], 3)), 'numeric-string')
    fails(tag(3, text('TSIZ', ['12k'], 3)), 'numeric-string')
    passes(tag(2, text('TLE', ['1000'], 2)), 'numeric-string')
    fails(tag(2, text('TLE', ['1 s'], 2)), 'numeric-string')
  })
  it('numeric strings are ISO-8859-1 in v2.2/v2.3', () => {
    passes(tag(3, text('TLEN', ['1'], 3)), 'numeric-encoding')
    fails(tag(3, text('TLEN', ['1'], 3, TextEncoding.UTF16)), 'numeric-encoding', 'warning')
  })
  it('TRCK and TPOS are n or n/m', () => {
    passes(tag(4, text('TRCK', ['4/9']), text('TPOS', ['1'])), 'number-format')
    fails(tag(4, text('TRCK', ['4 of 9'])), 'number-format')
    fails(tag(3, text('TPOS', ['1/'], 3)), 'number-format')
  })
  it('TDAT is DDMM, TIME is HHMM, TYER/TORY are four digits', () => {
    passes(tag(3, text('TDAT', ['2902'], 3), text('TIME', ['2359'], 3), text('TYER', ['1999'], 3), text('TORY', ['1970'], 3)), 'date-format')
    fails(tag(3, text('TDAT', ['3102'], 3)), 'date-format')
    fails(tag(3, text('TDAT', ['0113'], 3)), 'date-format')
    passes(tag(3, text('TIME', ['0000'], 3)), 'time-format')
    fails(tag(3, text('TIME', ['2460'], 3)), 'time-format')
    passes(tag(3, text('TYER', ['1999'], 3)), 'year-format')
    fails(tag(3, text('TYER', ['99'], 3)), 'year-format')
    fails(tag(2, text('TOR', ['70'], 2)), 'year-format')
  })
  it('v2.4 timestamps follow the ISO 8601 subset', () => {
    for (const v of ['2004', '2004-05', '2004-05-06', '2004-05-06T07', '2004-05-06T07:08', '2004-05-06T07:08:09', '2003/2004']) {
      passes(tag(4, text('TDRC', [v])), 'timestamp-format')
    }
    for (const v of ['04', '2004-5', '2004-13', '2004-02-30', '2004-05-06 07:08', '2004-05-06T24', '2004-05T07']) {
      fails(tag(4, text('TDRC', [v])), 'timestamp-format')
    }
    fails(tag(4, text('TDEN', ['2004', 'later'])), 'timestamp-format')
  })
  it('TCOP and TPRO begin with a year and a space', () => {
    passes(tag(4, text('TCOP', ['2004 Label']), text('TPRO', ['1999 Studio'])), 'copyright-format')
    fails(tag(4, text('TCOP', ['(C) 2004 Label'])), 'copyright-format')
    fails(tag(4, text('TPRO', ['2004Studio'])), 'copyright-format')
    fails(tag(2, text('TCR', ['Label'], 2)), 'copyright-format')
  })
  it('TKEY: at most 3 characters of the key alphabet', () => {
    passes(tag(4, text('TKEY', ['Dbm']), text('TIT2', ['x'])), 'key-format')
    for (const k of ['C', 'F#', 'Am', 'o']) passes(tag(4, text('TKEY', [k])), 'key-format')
    for (const k of ['H', 'C##', '10A', 'Dbmm', '']) fails(tag(4, text('TKEY', [k])), 'key-format')
  })
  it('TSRC should be a 12-character ISRC', () => {
    passes(tag(4, text('TSRC', ['GBX459800112'])), 'isrc-format')
    fails(tag(4, text('TSRC', ['GB-X45-98-00112'])), 'isrc-format', 'warning')
  })
  it('language codes: three letters; lower case or "XXX" in v2.4', () => {
    const comm = (lang: string, major: MajorVersion = 4) => fr('comment', major === 2 ? 'COM' : 'COMM', { encoding: L, language: lang, description: '', text: 't' }, major)
    passes(tag(4, comm('eng')), 'language-format')
    passes(tag(4, comm('XXX')), 'language-case')
    fails(tag(4, comm('en')), 'language-format')
    fails(tag(4, comm('\0\0\0')), 'language-format')
    fails(tag(4, comm('ENG')), 'language-case', 'warning')
    passes(tag(3, comm('ENG', 3)), 'language-case')
    fails(tag(4, text('TLAN', ['english'])), 'language-format', 'warning')
  })
  it('OWNE: price is a currency code + amount; date is YYYYMMDD', () => {
    const owne = (pricePaid: string, purchaseDate: string) => fr('owne', 'OWNE', { encoding: L, pricePaid, purchaseDate, seller: 's' })
    passes(tag(4, owne('EUR9.99', '20040229')), 'owne-price')
    passes(tag(4, owne('EUR9.99', '20040229')), 'owne-date')
    fails(tag(4, owne('9.99 EUR', '20040229')), 'owne-price')
    fails(tag(4, owne('EUR9,99', '20040229')), 'owne-price')
    fails(tag(4, owne('EUR9.99', '20030229')), 'owne-date')
    fails(tag(4, owne('EUR9.99', '2004-02-29')), 'owne-date')
  })
  it('COMR: prices, one currency each, valid-until date, logo MIME type', () => {
    const comr = (prices: string, validUntil = '20251231', logoMimeType?: string) =>
      fr('comr', 'COMR', { encoding: L, prices, validUntil, contactUrl: 'http://x/', receivedAs: 3, seller: 's', description: 'd', ...(logoMimeType ? { logoMimeType, logo: png(1, 1) } : {}) })
    passes(tag(4, comr('EUR1.00/USD1.20', '20251231', 'image/png')), 'comr-price')
    fails(tag(4, comr('EUR1.00/1.20')), 'comr-price')
    passes(tag(4, comr('EUR1/USD1')), 'comr-currency-duplicate')
    fails(tag(4, comr('EUR1/EUR2')), 'comr-currency-duplicate')
    fails(tag(4, comr('EUR1', '20251301')), 'comr-date')
    passes(tag(4, comr('EUR1', '20251231', 'jpeg')), 'comr-logo-format')
    fails(tag(4, comr('EUR1', '20251231', 'image/gif')), 'comr-logo-format')
  })
  it('URLs are ISO-8859-1 without control characters', () => {
    passes(tag(4, fr('url', 'WOAR', { url: 'http://example.com/ä' })), 'url-control-char')
    fails(tag(4, fr('url', 'WOAR', { url: 'http://example.com/\n' })), 'url-control-char')
    fails(tag(4, fr('user-url', 'WXXX', { encoding: TextEncoding.UTF8, description: 'd', url: 'http://例え.jp/' })), 'url-latin1')
  })
  it('no newline in single-line strings; allowed in full text (COMM, USLT, SYLT, USER)', () => {
    passes(tag(4, fr('comment', 'COMM', { encoding: L, language: 'eng', description: '', text: 'a\nb' })), 'newline-forbidden')
    passes(tag(4, fr('uslt', 'USLT', { encoding: L, language: 'eng', description: '', text: 'a\nb' })), 'newline-forbidden')
    passes(tag(4, fr('user', 'USER', { encoding: L, language: 'eng', text: 'a\nb' })), 'newline-forbidden')
    passes(tag(4, fr('sylt', 'SYLT', { encoding: L, language: 'eng', timestampFormat: 2, contentType: 1, description: '', entries: [{ text: 'a\n', timestamp: 0 }] })), 'newline-forbidden')
    fails(tag(4, text('TIT2', ['a\nb'])), 'newline-forbidden')
    fails(tag(4, fr('comment', 'COMM', { encoding: L, language: 'eng', description: 'a\nb', text: '' })), 'newline-forbidden')
  })
  it('control characters: error in ISO-8859-1 strings, warning in Unicode strings', () => {
    passes(tag(4, text('TIT2', ['tab-free'])), 'control-char')
    fails(tag(4, text('TIT2', ['a\tb'])), 'control-char')
    fails(tag(4, fr('comment', 'COMM', { encoding: L, language: 'eng', description: '', text: 'a\r\nb' })), 'control-char')
    fails(tag(4, text('TIT2', ['a\tb'], 4, TextEncoding.UTF8)), 'control-char', 'warning')
  })
  it('ISO-8859-1 strings hold only ISO-8859-1 characters', () => {
    passes(tag(4, text('TIT2', ['Ärger'])), 'latin1-range')
    fails(tag(4, text('TIT2', ['€'])), 'latin1-range')
    passes(tag(4, text('TIT2', ['€'], 4, TextEncoding.UTF8)), 'latin1-range')
  })
  it('APIC type $01 is a 32x32 PNG', () => {
    passes(tag(4, apic({ pictureType: 1, data: png(32, 32) })), 'file-icon-format')
    passes(tag(4, apic({ pictureType: 1, data: png(32, 32) })), 'file-icon-size')
    fails(tag(4, apic({ pictureType: 1, mimeType: 'image/jpeg', data: jpeg(32, 32) })), 'file-icon-format')
    fails(tag(4, apic({ pictureType: 1, data: png(64, 64) })), 'file-icon-size')
    passes(tag(2, apic({ pictureType: 1, data: png(32, 32) }, 2)), 'file-icon-format')
  })
  it('v2.2/v2.3 picture description is at most 64 characters', () => {
    passes(tag(3, apic({ description: 'x'.repeat(64) }, 3)), 'picture-description-length')
    fails(tag(3, apic({ description: 'x'.repeat(65) }, 3)), 'picture-description-length')
    passes(tag(4, apic({ description: 'x'.repeat(65) })), 'picture-description-length')
  })
  it('UFID: owner non-empty, identifier at most 64 bytes', () => {
    const ufid = (owner: string, n: number, major: MajorVersion = 4) => fr('ufid', major === 2 ? 'UFI' : 'UFID', { owner, identifier: new Uint8Array(n) }, major)
    passes(tag(4, ufid('http://www.id3.org/dummy/ufid.html', 64)), 'ufid-identifier-size')
    fails(tag(4, ufid('o', 65)), 'ufid-identifier-size')
    passes(tag(4, ufid('o', 1)), 'ufid-owner-empty')
    fails(tag(4, ufid('', 1)), 'ufid-owner-empty')
    fails(tag(2, ufid('', 1, 2)), 'ufid-owner-empty', 'warning')
  })
  it('ENCR/GRID symbol range: v2.3 $80+, v2.4 $80-$F0', () => {
    const tagWith = (major: MajorVersion, sym: number) =>
      tag(major, fr('text', 'TIT2', { encoding: L, values: ['x'] }, major, { groupId: sym }), fr('grid', 'GRID', { owner: 'o', groupSymbol: sym, data: new Uint8Array(0) }, major))
    passes(tagWith(4, 0xf0), 'symbol-range')
    fails(tagWith(4, 0xf1), 'symbol-range')
    fails(tagWith(4, 0x7f), 'symbol-range')
    passes(tagWith(3, 0xf1), 'symbol-range')
    fails(tagWith(3, 0x7f), 'symbol-range')
  })
  it('ETCO and SYTC MUST be sorted in v2.4, should in v2.3', () => {
    const etco = (ts: number[], major: MajorVersion = 4) => fr('etco', 'ETCO', { timestampFormat: 2, events: ts.map((timestamp) => ({ type: 2, timestamp })) }, major)
    passes(tag(4, etco([0, 10, 10, 20])), 'not-chronological')
    fails(tag(4, etco([10, 0])), 'not-chronological', 'error')
    fails(tag(3, etco([10, 0], 3)), 'not-chronological', 'warning')
    const sytc = (ts: number[]) => fr('sytc', 'SYTC', { timestampFormat: 2, tempos: ts.map((timestamp) => ({ bpm: 120, timestamp })) })
    passes(tag(4, sytc([0, 5])), 'not-chronological')
    fails(tag(4, sytc([5, 0])), 'not-chronological', 'error')
  })
  it('SYLT time stamps should be sorted', () => {
    const sylt = (ts: number[]) => fr('sylt', 'SYLT', { encoding: L, language: 'eng', timestampFormat: 2, contentType: 1, description: '', entries: ts.map((timestamp) => ({ text: 'x', timestamp })) })
    passes(tag(4, sylt([0, 5])), 'not-chronological')
    fails(tag(4, sylt([5, 0])), 'not-chronological', 'warning')
  })
  it('EQU2/EQUA points ordered by frequency, each frequency once', () => {
    const equ2 = (fs: number[]) => fr('equ2', 'EQU2', { interpolation: 1, identification: 'x', points: fs.map((frequency) => ({ frequency, adjustment: 0 })) })
    passes(tag(4, equ2([100, 200])), 'frequency-order')
    passes(tag(4, equ2([100, 200])), 'frequency-duplicate')
    fails(tag(4, equ2([200, 100])), 'frequency-order', 'warning')
    fails(tag(4, equ2([100, 100])), 'frequency-duplicate', 'warning')
    const equa = (fs: number[]) => fr('equa', 'EQUA', { adjustmentBits: 16, bands: fs.map((frequency) => ({ increment: true, frequency, adjustment: 1 })) }, 3)
    passes(tag(3, equa([1, 2])), 'frequency-order')
    fails(tag(3, equa([2, 1])), 'frequency-order', 'warning')
  })
  it('MLLT: bits per reference are a multiple of 4', () => {
    const mllt = (a: number, b: number) =>
      fr('mllt', 'MLLT', { framesBetweenReference: 1, bytesBetweenReference: 1, millisecondsBetweenReference: 1, bitsForBytesDeviation: a, bitsForMillisecondsDeviation: b, references: [] })
    passes(tag(4, mllt(4, 8)), 'mllt-bits')
    fails(tag(4, mllt(4, 6)), 'mllt-bits')
  })
  it('text encodings allowed for the version', () => {
    passes(tag(3, text('TIT2', ['x'], 3, TextEncoding.UTF16)), 'encoding-version')
    fails(tag(3, text('TIT2', ['x'], 3, TextEncoding.UTF8)), 'encoding-version')
    passes(tag(4, text('TIT2', ['x'], 4, TextEncoding.UTF16BE)), 'encoding-version')
  })
  it('RVAD/EQUA bits may not be $00', () => {
    const rvad = (bitsUsed: number) => fr('rvad', 'RVAD', { bitsUsed, channels: [] }, 3)
    passes(tag(3, rvad(16)), 'rvad-bits')
    fails(tag(3, rvad(0)), 'rvad-bits')
    const equa = (adjustmentBits: number) => fr('equa', 'EQUA', { adjustmentBits, bands: [] }, 3)
    passes(tag(3, equa(16)), 'equa-bits')
    fails(tag(3, equa(0)), 'equa-bits')
  })
  it('POPM rating is 0-255', () => {
    const popm = (rating: number) => fr('popm', 'POPM', { email: 'a@b', rating })
    passes(tag(4, popm(255)), 'popm-rating')
    fails(tag(4, popm(256)), 'popm-rating')
  })
})

describe('tag restrictions (v2.4 structure §3.2)', () => {
  const restricted = (r: Partial<TagRestrictions>, ...frames: Frame[]): ID3v2Tag => {
    const t = tag(4, ...frames)
    t.extendedHeader = { version: 4, isUpdate: false, restrictions: { tagSize: 0, textEncoding: 0, textFieldSize: 0, imageEncoding: 0, imageSize: 0, ...r } }
    return t
  }
  it('are only checked when present', () => {
    passes(tag(4, text('TIT2', ['x'.repeat(5000)])), 'restriction-string-length')
  })
  it('frame count', () => {
    const many = (n: number) => Array.from({ length: n }, (_, i) => fr('user-text', 'TXXX', { encoding: L, description: `d${i}`, values: ['v'] }))
    passes(restricted({ tagSize: 2 }, ...many(32)), 'restriction-frame-count')
    fails(restricted({ tagSize: 2 }, ...many(33)), 'restriction-frame-count')
  })
  it('total tag size', () => {
    passes(restricted({ tagSize: 3 }, text('TIT2', ['x'.repeat(3000)])), 'restriction-tag-size')
    fails(restricted({ tagSize: 3 }, text('TIT2', ['x'.repeat(5000)])), 'restriction-tag-size')
  })
  it('encodings limited to ISO-8859-1 and UTF-8', () => {
    passes(restricted({ textEncoding: 1 }, text('TIT2', ['x'], 4, TextEncoding.UTF8)), 'restriction-encoding')
    fails(restricted({ textEncoding: 1 }, text('TIT2', ['x'], 4, TextEncoding.UTF16)), 'restriction-encoding')
  })
  it('string length counts the sum of a text frame\'s strings', () => {
    passes(restricted({ textFieldSize: 3 }, text('TPE1', ['x'.repeat(15), 'y'.repeat(15)])), 'restriction-string-length')
    fails(restricted({ textFieldSize: 3 }, text('TPE1', ['x'.repeat(15), 'y'.repeat(16)])), 'restriction-string-length')
    fails(restricted({ textFieldSize: 3 }, fr('comment', 'COMM', { encoding: L, language: 'eng', description: '', text: 'z'.repeat(31) })), 'restriction-string-length')
  })
  it('images limited to PNG and JPEG', () => {
    passes(restricted({ imageEncoding: 1 }, apic({ mimeType: 'image/jpeg', data: jpeg(10, 10) })), 'restriction-image-format')
    fails(restricted({ imageEncoding: 1 }, apic({ mimeType: 'image/gif', data: new Uint8Array(4) })), 'restriction-image-format')
  })
  it('image pixel sizes', () => {
    passes(restricted({ imageSize: 1 }, apic({ data: png(256, 256) })), 'restriction-image-size')
    fails(restricted({ imageSize: 1 }, apic({ mimeType: 'image/jpeg', data: jpeg(257, 10) })), 'restriction-image-size')
    passes(restricted({ imageSize: 2 }, apic({ data: png(64, 32) })), 'restriction-image-size')
    fails(restricted({ imageSize: 2 }, apic({ data: png(65, 64) })), 'restriction-image-size')
    passes(restricted({ imageSize: 3 }, apic({ data: png(64, 64) }), apic({ pictureType: 1, description: 'icon', data: png(32, 32) })), 'restriction-image-size')
    fails(restricted({ imageSize: 3 }, apic({ data: png(63, 64) })), 'restriction-image-size')
    fails(restricted({ imageSize: 3 }, apic({ data: bytes('not an image') })), 'restriction-image-size-unknown', 'warning')
  })
})
