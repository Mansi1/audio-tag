import { describe, expect, it } from 'vitest'
import { TextEncoding } from '../src/core/encoding'
import { scramble } from '../src/id3v2/frames/codecs-addenda'
import { dbToFixed, fixedToDb } from '../src/id3v2/frames/codecs-audio'
import { aspiFraction, aspiOffset, pictureLinkUrl, pictureMimeType } from '../src/id3v2/frames/codecs-misc'
import type { FrameOf, FrameType } from '../src/id3v2/frames/types'
import { readID3v2, type ReadResult } from '../src/id3v2/reader'
import { cloneFrame, createFrame, createTag } from '../src/id3v2/tag'
import { writeID3v2 } from '../src/id3v2/writer'
import { bytes, frame, hex, tag, u32, utf16 } from './helpers'

function read(data: Uint8Array, opts = {}): ReadResult {
  const r = readID3v2(data, 0, opts)
  if (!r || 'unsupported' in r) throw new Error('no tag')
  return r
}

/** Reads one frame from a tag, checks its fields, and checks the writer reproduces the bytes. */
function roundTrip<T extends FrameType>(major: 2 | 3 | 4, id: string, body: number[] | Uint8Array | string, type: T): FrameOf<T> {
  const data = tag(major, frame(major, id, body))
  const r = read(data)
  expect(r.warnings).toEqual([])
  expect(r.tag.frames).toHaveLength(1)
  const f = r.tag.frames[0]!
  expect(f.type).toBe(type)
  expect(hex(writeID3v2(r.tag, { padding: 0 }).bytes)).toBe(hex(data))
  // also re-encode a copy, which bypasses the stored-bytes shortcut
  const copy = { ...r.tag, frames: [cloneFrame(f)] }
  expect(hex(writeID3v2(copy, { padding: 0 }).bytes)).toBe(hex(data))
  return f as FrameOf<T>
}

describe('text frames (v2.4 §4.2, v2.3 §4.2, v2.2 §4.2)', () => {
  it('v2.4 holds null-separated values', () => {
    const f = roundTrip(4, 'TLAN', bytes([0], 'eng', [0], 'sve'), 'text')
    expect(f.values).toEqual(['eng', 'sve'])
  })
  it('v2.4 UTF-8 and UTF-16BE', () => {
    expect(roundTrip(4, 'TIT2', bytes([3], [0x72, 0xc3, 0xa4, 0x6b]), 'text').values).toEqual(['räk'])
    expect(roundTrip(4, 'TIT2', bytes([2], [0, 0x41, 0, 0x42]), 'text').values).toEqual(['AB'])
  })
  it('v2.3 ignores everything after the terminator', () => {
    const r = read(tag(3, frame(3, 'TIT2', bytes([0], 'Title', [0], 'junk'))))
    expect((r.tag.frames[0] as FrameOf<'text'>).values).toEqual(['Title'])
    expect(r.warnings.map((w) => w.code)).toEqual(['text-after-terminator'])
  })
  it('v2.3 UCS-2 with BOM', () => {
    expect(roundTrip(3, 'TPE1', bytes([1], utf16('Ärtist')), 'text').values).toEqual(['Ärtist'])
  })
  it('v2.2 three-character IDs', () => {
    expect(roundTrip(2, 'TT2', bytes([0], 'Title'), 'text').values).toEqual(['Title'])
  })
  it('refuses several values in v2.3', () => {
    const t = createTag(3, [createFrame('text', 'TPE1', { encoding: TextEncoding.Latin1, values: ['a', 'b'] }, 3)])
    expect(() => writeID3v2(t)).toThrow(/one string/)
  })
  it('unknown T*** and W*** frames use the family layout', () => {
    expect(roundTrip(4, 'TZZZ', bytes([0], 'x'), 'text').values).toEqual(['x'])
    expect(roundTrip(4, 'WZZZ', 'http://x/', 'url').url).toBe('http://x/')
  })
  it('TXXX and WXXX', () => {
    const t = roundTrip(4, 'TXXX', bytes([0], 'desc', [0], 'value'), 'user-text')
    expect([t.description, t.values]).toEqual(['desc', ['value']])
    const u = roundTrip(3, 'WXXX', bytes([1], utf16('d'), [0, 0], 'http://a/'), 'user-url')
    expect([u.description, u.url]).toEqual(['d', 'http://a/'])
  })
  it('IPLS pairs', () => {
    const f = roundTrip(3, 'IPLS', bytes([0], 'producer', [0], 'A', [0], 'mixer', [0], 'B', [0]), 'involved-people')
    expect(f.people).toEqual([
      ['producer', 'A'],
      ['mixer', 'B'],
    ])
  })
})

describe('content frames (task 09)', () => {
  it('UFID', () => {
    const f = roundTrip(4, 'UFID', bytes('http://www.id3.org/dummy/ufid.html', [0], [1, 2, 3]), 'ufid')
    expect([f.owner, [...f.identifier]]).toEqual(['http://www.id3.org/dummy/ufid.html', [1, 2, 3]])
  })
  it('ETCO with an $FF-extended event type', () => {
    const f = roundTrip(4, 'ETCO', bytes([2], [0x02], u32(1000), [0xff, 0xff, 0x10], u32(2000)), 'etco')
    expect(f.events).toEqual([
      { type: 2, timestamp: 1000 },
      { type: 0x10, ffPrefix: 2, timestamp: 2000 },
    ])
  })
  it('MLLT bit packing with 4+4, 12+12 and 20+12 bits', () => {
    const head = (bb: number, bm: number) => bytes([0, 1], [0, 0, 2], [0, 0, 3], [bb, bm])
    expect(roundTrip(4, 'MLLT', bytes(head(4, 4), [0x12, 0x34]), 'mllt').references).toEqual([
      { bytesDeviation: 1, millisecondsDeviation: 2 },
      { bytesDeviation: 3, millisecondsDeviation: 4 },
    ])
    expect(roundTrip(4, 'MLLT', bytes(head(12, 12), [0xab, 0xcd, 0xef]), 'mllt').references).toEqual([
      { bytesDeviation: 0xabc, millisecondsDeviation: 0xdef },
    ])
    expect(roundTrip(3, 'MLLT', bytes(head(20, 12), [0x12, 0x34, 0x5f, 0xff]), 'mllt').references).toEqual([
      { bytesDeviation: 0x12345, millisecondsDeviation: 0xfff },
    ])
  })
  it('SYTC with a two-byte tempo', () => {
    const f = roundTrip(4, 'SYTC', bytes([2], [120], u32(0), [0xff, 0x05], u32(500)), 'sytc')
    expect(f.tempos).toEqual([
      { bpm: 120, timestamp: 0 },
      { bpm: 260, timestamp: 500 },
    ])
  })
  it('USLT and COMM', () => {
    const l = roundTrip(4, 'USLT', bytes([0], 'eng', 'd', [0], 'line1\nline2'), 'uslt')
    expect([l.language, l.description, l.text]).toEqual(['eng', 'd', 'line1\nline2'])
    const c = roundTrip(2, 'COM', bytes([0], 'eng', [0], 'comment'), 'comment')
    expect([c.language, c.description, c.text]).toEqual(['eng', '', 'comment'])
  })
  it('SYLT: the "Strangers in the night" example from v2.4 §4.9', () => {
    const syllables = ['Strang', 'ers', ' in', ' the', ' night', '\nEx', 'chang', 'ing', 'glan', 'ces']
    const body = bytes([0], 'eng', [2, 1], [0], ...syllables.flatMap((s, i) => [bytes(s, [0]), u32(i * 100)]))
    const f = roundTrip(4, 'SYLT', body, 'sylt')
    expect(f.entries.map((e) => e.text)).toEqual(syllables)
    expect(f.entries[3]!.timestamp).toBe(300)
    const uf = roundTrip(
      3,
      'SYLT',
      bytes([1], 'eng', [2, 1], utf16(''), [0, 0], ...syllables.flatMap((s, i) => [bytes(utf16(s), [0, 0]), u32(i)])),
      'sylt',
    )
    expect(uf.entries.map((e) => e.text)).toEqual(syllables)
  })
  it('USER, OWNE and COMR (with and without logo)', () => {
    expect(roundTrip(4, 'USER', bytes([0], 'eng', 'terms'), 'user').text).toBe('terms')
    const o = roundTrip(4, 'OWNE', bytes([0], 'EUR9.99', [0], '20240101', 'Shop'), 'owne')
    expect([o.pricePaid, o.purchaseDate, o.seller]).toEqual(['EUR9.99', '20240101', 'Shop'])
    const base = bytes([0], 'USD1.00/EUR0.90', [0], '20251231', 'http://s/', [0], [3], 'Seller', [0], 'Desc', [0])
    const c1 = roundTrip(4, 'COMR', base, 'comr')
    expect([c1.prices, c1.receivedAs, c1.logo]).toEqual(['USD1.00/EUR0.90', 3, undefined])
    const c2 = roundTrip(3, 'COMR', bytes(base, 'image/png', [0], [1, 2]), 'comr')
    expect([c2.logoMimeType, [...c2.logo!]]).toEqual(['image/png', [1, 2]])
  })
})

describe('audio adjustment frames (task 10)', () => {
  it('RVA2: +2 dB is $04 00 and -2 dB is $FC 00 (v2.4 §4.11)', () => {
    expect(dbToFixed(2)).toBe(0x0400)
    expect(dbToFixed(-2)).toBe(-0x400)
    const f = roundTrip(4, 'RVA2', bytes('track', [0], [1, 0x04, 0x00, 16, 0x12, 0x34], [2, 0xfc, 0x00, 0]), 'rva2')
    expect(f.channels.map((c) => [c.channelType, fixedToDb(c.adjustment), c.peak])).toEqual([
      [1, 2, 0x1234],
      [2, -2, 0],
    ])
  })
  it('RVAD with 2, 4, 8, 10 and 12 values', () => {
    const v = (n: number) => Array.from({ length: n }, (_, i) => [0, i + 1]).flat()
    expect(roundTrip(3, 'RVAD', bytes([0b11], [16], v(2)), 'rvad').channels).toEqual([
      { channel: 'right', increment: true, change: 1 },
      { channel: 'left', increment: true, change: 2 },
    ])
    expect(roundTrip(3, 'RVAD', bytes([0], [16], v(4)), 'rvad').channels[1]).toEqual({ channel: 'left', increment: false, change: 2, peak: 4 })
    expect(roundTrip(3, 'RVAD', bytes([0b111111], [16], v(12)), 'rvad').channels.map((c) => c.channel)).toEqual([
      'right',
      'left',
      'rightBack',
      'leftBack',
      'center',
      'bass',
    ])
    expect(roundTrip(3, 'RVAD', bytes([0], [16], v(10)), 'rvad').channels[4]).toEqual({ channel: 'center', increment: false, change: 9, peak: 10 })
    expect(roundTrip(2, 'RVA', bytes([0b10], [8], [5, 6]), 'rvad').channels[0]).toEqual({ channel: 'right', increment: false, change: 5 })
  })
  it('EQUA with 16- and 12-bit adjustments, and EQU2', () => {
    expect(roundTrip(3, 'EQUA', bytes([16], [0x80, 0x64, 0x01, 0x00]), 'equa').bands).toEqual([{ increment: true, frequency: 100, adjustment: 256 }])
    expect(roundTrip(2, 'EQU', bytes([12], [0x00, 0x64, 0x0f, 0xff]), 'equa').bands).toEqual([{ increment: false, frequency: 100, adjustment: 0xfff }])
    const e = roundTrip(4, 'EQU2', bytes([1], 'id', [0], [0, 200, 0x04, 0x00]), 'equ2')
    expect(e.points).toEqual([{ frequency: 200, adjustment: 1024 }])
  })
  it('RVRB / REV', () => {
    const f = roundTrip(2, 'REV', [0, 10, 0, 20, 1, 2, 3, 4, 5, 6, 7, 8], 'rvrb')
    expect([f.reverbLeft, f.reverbRight, f.bouncesLeft, f.premixRightToLeft]).toEqual([10, 20, 1, 8])
  })
})

describe('other native frames (task 11)', () => {
  it('APIC and PIC', () => {
    const a = roundTrip(4, 'APIC', bytes([0], 'image/png', [0], [3], 'cover', [0], [0x89, 0x50]), 'picture')
    expect([a.mimeType, a.pictureType, a.description, [...a.data]]).toEqual(['image/png', 3, 'cover', [0x89, 0x50]])
    const p = roundTrip(2, 'PIC', bytes([0], 'PNG', [3], [0], [1]), 'picture')
    expect(p.mimeType).toBe('PNG')
    expect(pictureMimeType(p, 2)).toBe('image/png')
    expect(pictureMimeType({ mimeType: 'png' }, 3)).toBe('image/png')
    const l = roundTrip(3, 'APIC', bytes([0], '-->', [0], [3], [0], 'http://x/c.jpg'), 'picture')
    expect(pictureLinkUrl(l)).toBe('http://x/c.jpg')
  })
  it('GEO filename is Latin-1, GEOB filename follows the encoding', () => {
    const g2 = roundTrip(2, 'GEO', bytes([1], 'text/plain', [0], 'a.txt', [0], utf16('d'), [0, 0], [9]), 'geob')
    expect([g2.filename, g2.description]).toEqual(['a.txt', 'd'])
    const g3 = roundTrip(3, 'GEOB', bytes([1], 'text/plain', [0], utf16('a.txt'), [0, 0], utf16('d'), [0, 0], [9]), 'geob')
    expect(g3.filename).toBe('a.txt')
  })
  it('PCNT of 5 bytes and POPM with and without counter', () => {
    expect(roundTrip(4, 'PCNT', [1, 0, 0, 0, 0], 'pcnt').count).toBe(2n ** 32n)
    expect(roundTrip(4, 'POPM', bytes('a@b', [0], [196]), 'popm')).toMatchObject({ email: 'a@b', rating: 196 })
    expect(roundTrip(4, 'POPM', bytes('a@b', [0], [1], u32(7)), 'popm').counter).toBe(7n)
  })
  it('RBUF, AENC, CRA, CRM, POSS, ENCR, GRID, PRIV, SIGN, SEEK', () => {
    expect(roundTrip(4, 'RBUF', [0, 1, 0, 1, ...u32(9)], 'rbuf')).toMatchObject({ bufferSize: 256, embeddedInfo: true, offsetToNextTag: 9 })
    expect(roundTrip(4, 'AENC', bytes('o', [0], [0, 1, 0, 2, 7]), 'aenc')).toMatchObject({ owner: 'o', previewStart: 1, previewLength: 2 })
    expect(roundTrip(2, 'CRA', bytes('o', [0], [0, 1, 0, 2]), 'aenc').owner).toBe('o')
    expect(roundTrip(2, 'CRM', bytes('o', [0], 'why', [0], [1, 2]), 'crm').explanation).toBe('why')
    expect(roundTrip(4, 'POSS', [2, ...u32(1234)], 'poss').position).toBe(1234)
    expect(roundTrip(4, 'ENCR', bytes('o', [0], [0x80], [1]), 'encr').methodSymbol).toBe(0x80)
    expect(roundTrip(4, 'GRID', bytes('o', [0], [0x81]), 'grid').groupSymbol).toBe(0x81)
    expect(roundTrip(4, 'PRIV', bytes('o', [0], [1, 2]), 'priv').owner).toBe('o')
    expect(roundTrip(4, 'SIGN', [0x81, 1, 2], 'sign').groupSymbol).toBe(0x81)
    expect(roundTrip(4, 'SEEK', u32(4096), 'seek').minimumOffset).toBe(4096)
  })
  it('LINK: 4-byte IDs in v2.4, 3 in v2.2, both detected in v2.3 (D1)', () => {
    expect(roundTrip(4, 'LINK', bytes('TIT2', 'http://x/', [0]), 'link')).toMatchObject({ frameId: 'TIT2', url: 'http://x/' })
    expect(roundTrip(2, 'LNK', bytes('TT2', 'http://x/', [0]), 'link').frameId).toBe('TT2')
    expect(roundTrip(3, 'LINK', bytes('TIT2', 'http://x/', [0]), 'link').frameId).toBe('TIT2')
    expect(roundTrip(3, 'LINK', bytes('COM', 'http://x/', [0], 'eng', [0]), 'link')).toMatchObject({ frameId: 'COM', additional: ['eng'] })
  })
  it('ASPI and its formulas (v2.4 §4.30)', () => {
    const f = roundTrip(4, 'ASPI', [...u32(100), ...u32(1000), 0, 2, 8, 0, 128], 'aspi')
    expect(f.fractions).toEqual([0, 128])
    expect(aspiFraction(500, 1000, 8)).toBe(128)
    expect(aspiOffset(128, 1000, 8)).toBe(500)
    expect(aspiOffset(1, 1000, 8)).toBe(4) // 3.90625 rounded up
  })
  it('unknown frames are kept as raw bytes', () => {
    expect([...roundTrip(4, 'XABC', [1, 2, 3], 'unknown').data]).toEqual([1, 2, 3])
  })
})

describe('chapter and accessibility addenda (task 12)', () => {
  const tit2 = (s: string) => frame(4, 'TIT2', bytes([0], s))
  it('CHAP with embedded TIT2/TIT3 (Figure 1)', () => {
    const body = bytes('chp1', [0], u32(0), u32(5000), u32(0xffffffff), u32(0xffffffff), tit2('Chapter 1 - Loomings'), frame(4, 'TIT3', bytes([0], 'Anticipation of the hunt')))
    const f = roundTrip(4, 'CHAP', body, 'chap')
    expect([f.elementId, f.endTime, f.startOffset]).toEqual(['chp1', 5000, 0xffffffff])
    expect(f.frames.map((x) => (x as FrameOf<'text'>).values[0])).toEqual(['Chapter 1 - Loomings', 'Anticipation of the hunt'])
  })
  it('CTOC with children and TIT2 (Figure 2)', () => {
    const f = roundTrip(3, 'CTOC', bytes('toc', [0], [0b11], [2], 'chp1', [0], 'chp2', [0], frame(3, 'TIT2', bytes([0], 'Part 1'))), 'ctoc')
    expect([f.topLevel, f.ordered, f.childElementIds]).toEqual([true, true, ['chp1', 'chp2']])
    expect(f.frames).toHaveLength(1)
  })
  it('ATXT scrambling has period 127 and is its own inverse', () => {
    const zeros = new Uint8Array(254)
    const seq = scramble(zeros)
    expect(seq[0]).toBe(0xfe)
    expect([...seq.subarray(127)]).toEqual([...seq.subarray(0, 127)])
    expect(new Set(seq.subarray(0, 127)).size).toBe(127)
    const audio = Uint8Array.from({ length: 300 }, (_, i) => i & 0xff)
    expect(scramble(scramble(audio))).toEqual(audio)
    const f = roundTrip(4, 'ATXT', bytes([0], 'audio/ogg', [0], [1], 'Title', [0], scramble(Uint8Array.from([1, 2, 3]))), 'atxt')
    expect([f.scrambled, [...f.audio]]).toEqual([true, [1, 2, 3]])
  })
})

describe('unofficial frames (task 13)', () => {
  it('RGAD has the documented header bytes', () => {
    const t = createTag(3, [createFrame('rgad', 'RGAD', { peakAmplitude: 0, radioAdjustment: 0, audiophileAdjustment: 0 }, 3, { tagAlterPreservation: false })])
    const out = writeID3v2(t, { padding: 0 }).bytes
    // The page lists flags $40 00, i.e. class 3: preserved if the tag changes, discarded if the file changes.
    expect(hex(out.subarray(10, 20))).toBe('52 47 41 44 00 00 00 08 40 00')
  })
  it('XRVA uses the RVA2 layout in v2.3; TCMP is a text frame', () => {
    expect(roundTrip(3, 'XRVA', bytes('a', [0], [1, 0, 0, 0]), 'rva2').identification).toBe('a')
    expect(roundTrip(3, 'TCMP', bytes([0], '1'), 'text').values).toEqual(['1'])
    expect(roundTrip(2, 'TCP', bytes([0], '1'), 'text').values).toEqual(['1'])
  })
})

describe('frame flags and payload encoding (task 06)', () => {
  it('v2.3 compressed frame with decompressed size', () => {
    const t = createTag(3, [createFrame('text', 'TIT2', { encoding: 0, values: ['x'.repeat(200)] }, 3, { compression: true })])
    const out = writeID3v2(t, { padding: 0 }).bytes
    expect(out[19]).toBe(0x80) // format flags %i0000000
    expect([...out.subarray(20, 24)]).toEqual(u32(201)) // decompressed size
    const r = read(out)
    expect((r.tag.frames[0] as FrameOf<'text'>).values[0]).toHaveLength(200)
    expect(r.tag.frames[0]!.flags.compression).toBe(true)
  })
  it('v2.4 compression + DLI + grouping + unsync round trip', () => {
    const data = Uint8Array.from({ length: 300 }, (_, i) => (i % 3 === 0 ? 0xff : 0xe0))
    const t = createTag(4, [
      createFrame('grid', 'GRID', { owner: 'o', groupSymbol: 0x90, data: new Uint8Array(0) }),
      createFrame('priv', 'PRIV', { owner: 'x', data }, 4, { compression: true, groupId: 0x90, unsynchronisation: true }),
    ])
    const out = writeID3v2(t, { padding: 0 }).bytes
    const r = read(out)
    const p = r.tag.frames[1] as FrameOf<'priv'>
    expect(p.data).toEqual(data)
    expect(p.flags).toMatchObject({ compression: true, dataLengthIndicator: true, groupId: 0x90 })
    expect(writeID3v2(r.tag, { padding: 0 }).bytes).toEqual(out)
    // no false syncs anywhere in an unsynchronised frame
    const body = out.subarray(10)
    for (let i = 0; i + 1 < body.length; i++) if (body[i] === 0xff) expect(body[i + 1]! < 0xe0).toBe(true)
  })
  it('encrypted frames without a hook survive byte for byte', () => {
    // TIT2 with format flag m (encryption): method byte $80, then 3 encrypted bytes
    const data = tag(4, bytes(frame(4, 'ENCR', bytes('o', [0], [0x80])), 'TIT2', [0, 0, 0, 4], [0, 0x04], [0x80, 9, 9, 9]))
    const r = read(data)
    expect(r.tag.frames[1]).toMatchObject({ type: 'undecodable', reason: 'encrypted' })
    expect(writeID3v2(r.tag, { padding: 0 }).bytes).toEqual(data)
  })
  it('decrypts with a hook', () => {
    const data = tag(4, bytes('TIT2', [0, 0, 0, 4], [0, 0x04], [0x80], [0 ^ 1, 0x41 ^ 1, 0x42 ^ 1]))
    const r = read(data, { decrypt: (_m: number, d: Uint8Array) => d.map((b) => b ^ 1) })
    expect((r.tag.frames[0] as FrameOf<'text'>).values).toEqual(['AB'])
  })
  it('reads iTunes-style plain sizes in v2.4 (Compliance Issues)', () => {
    const long = 'x'.repeat(199)
    const bad = bytes('TIT2', u32(200), [0, 0], [0], long, 'TALB', [0, 0, 0, 2], [0, 0], [0], 'A')
    const r = read(tag(4, bad))
    expect(r.tag.frames.map((f) => f.id)).toEqual(['TIT2', 'TALB'])
    expect(r.warnings.map((w) => w.code)).toContain('frame-size-not-synchsafe')
    const strictless = read(tag(4, bad), { v24SizeFallback: false })
    expect(strictless.tag.frames.map((f) => f.id)).not.toEqual(['TIT2', 'TALB'])
  })
  it('clears the read-only bit when a read-only frame is changed', () => {
    const data = tag(4, frame(4, 'TIT2', bytes([0], 'a'), [0x10, 0]))
    const r = read(data)
    ;(r.tag.frames[0] as FrameOf<'text'>).values = ['b']
    const out = writeID3v2(r.tag, { padding: 0 })
    expect(out.bytes[18]).toBe(0)
    expect(out.warnings.map((w) => w.code)).toContain('frame-flags-cleared')
  })
})

describe('tag structure (tasks 05, 14, 15)', () => {
  it('v2.3 whole-tag unsynchronisation with CRC', () => {
    const t = createTag(3, [createFrame('priv', 'PRIV', { owner: 'o', data: Uint8Array.from([0xff, 0xe0, 0xff, 0x00]) }, 3)])
    t.flags.unsynchronisation = true
    t.extendedHeader = { version: 3, paddingSize: 0, crc: 0 }
    const out = writeID3v2(t, { padding: 4 }).bytes
    expect(out[5]! & 0xc0).toBe(0xc0)
    const r = read(out)
    expect(r.warnings).toEqual([])
    expect((r.tag.frames[0] as FrameOf<'priv'>).data).toEqual(Uint8Array.from([0xff, 0xe0, 0xff, 0x00]))
    expect(r.tag.extendedHeader).toMatchObject({ version: 3, paddingSize: 4 })
    expect(writeID3v2(r.tag).bytes).toEqual(out)
  })
  it('v2.4 footer, no padding', () => {
    const data = tag(4, frame(4, 'TIT2', bytes([0], 'a')), { flags: 0x10 })
    const r = read(data)
    expect(r.totalSize).toBe(data.length)
    expect(r.tag.flags.footer).toBe(true)
    expect(writeID3v2(r.tag).bytes).toEqual(data)
  })
  it('v2.4 extended header with CRC over frames and padding', () => {
    const t = createTag(4, [createFrame('text', 'TIT2', { encoding: 0, values: ['a'] })])
    t.extendedHeader = { version: 4, isUpdate: true, crc: 0 }
    const out = writeID3v2(t, { padding: 10 }).bytes
    const r = read(out)
    expect(r.warnings).toEqual([])
    expect(r.tag.extendedHeader).toMatchObject({ isUpdate: true })
  })
  it('v2.2 compressed tags and unknown versions are reported as unsupported', () => {
    expect(readID3v2(tag(2, frame(2, 'TT2', bytes([0], 'a')), { flags: 0x40 }))).toMatchObject({ unsupported: true, reason: 'v2.2-compression' })
    expect(readID3v2(bytes('ID3', [5, 0, 0], [0, 0, 0, 1], [0]))).toMatchObject({ unsupported: true, reason: 'version' })
  })
  it('a last frame ending exactly at the tag end is read (Winamp compliance issue)', () => {
    const r = read(tag(3, bytes(frame(3, 'TIT2', bytes([0], 'a')), frame(3, 'TALB', bytes([0], 'b')))))
    expect(r.tag.frames.map((f) => f.id)).toEqual(['TIT2', 'TALB'])
  })
  it('adds a padding byte when a v2.4 tag would end in $FF', () => {
    const t = createTag(4, [createFrame('priv', 'PRIV', { owner: 'o', data: Uint8Array.from([0xff]) })])
    const out = writeID3v2(t, { padding: 0 }).bytes
    expect(out[out.length - 1]).toBe(0)
  })
  it('refuses an empty tag', () => {
    expect(() => writeID3v2(createTag(4))).toThrow(/at least one frame/)
  })
  it('keeps the original size when the content still fits (auto padding)', () => {
    const data = tag(4, frame(4, 'TIT2', bytes([0], 'abc')), { padding: 100 })
    const r = read(data)
    ;(r.tag.frames[0] as FrameOf<'text'>).values = ['abcdef']
    expect(writeID3v2(r.tag, { originalSize: data.length }).bytes.length).toBe(data.length)
  })
  it('discards unknown frames flagged "discard if tag altered" when the tag changes', () => {
    const data = tag(4, bytes(frame(4, 'TIT2', bytes([0], 'a')), frame(4, 'XFOO', [1], [0x40, 0])))
    const r = read(data)
    expect(writeID3v2(r.tag, { padding: 0 }).bytes).toEqual(data)
    ;(r.tag.frames[0] as FrameOf<'text'>).values = ['b']
    const out = read(writeID3v2(r.tag).bytes)
    expect(out.tag.frames.map((f) => f.id)).toEqual(['TIT2'])
  })
})

describe('robustness', () => {
  it('never throws or hangs on mutated input (non-strict)', () => {
    const base = writeID3v2(
      createTag(4, [
        createFrame('text', 'TIT2', { encoding: 1, values: ['Title'] }),
        createFrame('comment', 'COMM', { encoding: 3, language: 'eng', description: '', text: 'c' }),
        createFrame('chap', 'CHAP', { elementId: 'c', startTime: 0, endTime: 1, startOffset: 0, endOffset: 0, frames: [] }),
        createFrame('picture', 'APIC', { encoding: 0, mimeType: 'image/png', pictureType: 3, description: '', data: new Uint8Array(20) }),
      ]),
      { padding: 16 },
    ).bytes
    let seed = 1
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    const start = Date.now()
    for (let i = 0; i < 3000; i++) {
      const m = base.slice()
      const n = 1 + Math.floor(rand() * 4)
      for (let k = 0; k < n; k++) m[Math.floor(rand() * m.length)] = Math.floor(rand() * 256)
      const r = readID3v2(m)
      if (r && !('unsupported' in r)) {
        try {
          writeID3v2(r.tag)
        } catch (e) {
          expect((e as Error).name).toBe('TagWriteError')
        }
      }
    }
    expect(Date.now() - start).toBeLessThan(10000)
  })
})

