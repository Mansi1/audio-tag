import { describe, expect, it } from 'vitest'
import { equalBytes } from '../src/core/bytes'
import { WarningSink } from '../src/core/errors'
import { detectFormat } from '../src/file/detect'
import { TagReadError, TagWriteError, readID3File, readMP4File, writeID3File, writeMP4File } from '../src/index'
import { metaIsFull, readAtomHeader, readAtoms } from '../src/mp4/atoms'
import { applySegments, readMP4, writeMP4 } from '../src/mp4/file'
import { getMP4Metadata } from '../src/mp4/mapping'
import { type MP4Tags, udtaEntry } from '../src/mp4/meta'
import { DataType, decodeMacRoman, decodePair, packLanguage, textValue, unpackLanguage, valueInt, valueText } from '../src/mp4/values'
import { bytes, u32 } from './helpers'
import { CHUNKS, box, chunksIntact, data, fullBox, m4a, sampleItems } from './mp4-helpers'

const write4 = (file: Uint8Array, tags: MP4Tags, opts = {}) => {
  const r = writeMP4(file, tags, opts)
  return { ...r, bytes: applySegments(file, r.segments) }
}

describe('format detection (task 23)', () => {
  it('recognises containers', () => {
    expect(detectFormat(m4a())).toBe('mp4')
    expect(detectFormat(bytes('fLaC', [0, 0, 0, 34]))).toBe('flac')
    expect(detectFormat(bytes('ID3', [4, 0, 0], [0, 0, 0, 2], [0, 0], 'fLaC'))).toBe('flac')
    expect(detectFormat(bytes('OggS', [0]))).toBe('ogg')
    expect(detectFormat(bytes('RIFF', u32(4), 'WAVE'))).toBe('riff')
    expect(detectFormat(bytes('FORM', u32(4), 'AIFF'))).toBe('aiff')
    expect(detectFormat(bytes([0xff, 0xfb, 0x90, 0]))).toBe('mpeg')
    expect(detectFormat(bytes('hello'))).toBe('unknown')
  })
  it('explains why a non-ID3 file has no ID3 tags', () => {
    const r = readID3File(bytes('fLaC', new Array(200).fill(0)))
    expect(r.format).toBe('flac')
    expect(r.warnings.map((w) => w.code)).toContain('format-not-id3')
  })
})

describe('atoms (task 24)', () => {
  it('reads 32-bit, 64-bit and size-0 headers', () => {
    const d = bytes(u32(12), 'free', [0, 0, 0, 0], u32(1), 'mdat', u32(0), u32(20), [1, 2, 3, 4], u32(0), 'skip', [9, 9])
    const hs = readAtoms(d, 0, d.length, undefined, true)
    expect(hs.map((h) => [h.type, h.end - h.start, h.sizeField])).toEqual([
      ['free', 12, 'normal'],
      ['mdat', 20, 'extended'],
      ['skip', 10, 'to-end'],
    ])
  })
  it('warns on truncated or impossible sizes and never reads out of bounds', () => {
    const w = new WarningSink()
    expect(readAtomHeader(bytes(u32(100), 'moov'), 0, 8, w)).toBeNull()
    expect(readAtomHeader(bytes(u32(4), 'moov'), 0, 8, w)).toBeNull()
    expect(w.list.map((x) => x.code)).toEqual(['mp4-atom-size', 'mp4-atom-size'])
  })
  it('detects plain and full meta atoms (M2)', () => {
    const full = fullBox('meta', fullBox('hdlr', u32(0), 'mdir', u32(0), u32(0), u32(0), [0]))
    const plain = box('meta', fullBox('hdlr', u32(0), 'mdta', u32(0), u32(0), u32(0), [0]))
    expect(metaIsFull(full, readAtomHeader(full, 0, full.length)!)).toBe(true)
    expect(metaIsFull(plain, readAtomHeader(plain, 0, plain.length)!)).toBe(false)
  })
  it('never throws on mutated files', () => {
    const base = m4a({ items: sampleItems(), free: 64 })
    let seed = 7
    const rand = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff)
    for (let i = 0; i < 2000; i++) {
      const m = base.slice()
      for (let k = 0; k < 3; k++) m[Math.floor(rand() * m.length)] = Math.floor(rand() * 256)
      const r = readMP4(m)
      getMP4Metadata(r.tags)
    }
  })
})

describe('values (task 26)', () => {
  it('packs ISO 639-2/T language codes (Language_code_values.md example)', () => {
    expect(packLanguage('jpn')).toBe(0x2a0e)
    expect(unpackLanguage(0x2a0e)).toBe('jpn')
    expect(unpackLanguage(0)).toBeUndefined()
  })
  it('decodes the sample file layouts', () => {
    expect(decodePair({ type: 0, locale: 0, data: Uint8Array.from([0, 0, 0, 2, 0, 4, 0, 0]) })).toEqual({ no: 2, of: 4 })
    expect(valueInt({ type: DataType.SignedInt, locale: 0, data: Uint8Array.from([0xff, 0xfe]) })).toBe(-2)
    expect(valueText(textValue('Beyoncé'))).toBe('Beyoncé')
    expect(valueText(textValue('Ünïcode', DataType.UTF16))).toBe('Ünïcode')
  })
  it('has a full Mac Roman table', () => {
    expect(decodeMacRoman(Uint8Array.from([0x80, 0x8e, 0xa9, 0xff]))).toBe('Äé©ˇ')
  })
})

describe('reading MP4 metadata (tasks 25, 28)', () => {
  it('reads the rebuilt sample file exactly as AVFoundation did', () => {
    const r = readMP4File(m4a({ items: sampleItems(), free: 4096 }))
    expect(r.format).toBe('mp4')
    expect(r.warnings).toEqual([])
    expect(r.metadata).toEqual({
      title: "Baby Boy (Maurice's Nu Soul Mix)",
      artist: ['Beyoncé feat. Sean Paul'],
      albumArtist: 'Beyoncé',
      album: 'Baby Boy',
      encoderSettings: 'iTunes v6.0.2.23, QuickTime 7.0.4',
      recordingTime: '2003',
      genre: ['R&B'],
      bpm: 0,
      track: { no: 2, of: 4 },
      disc: { no: 1, of: 1 },
      pictures: [{ type: 3, mimeType: 'image/jpeg', description: '', data: Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]) }],
      compilation: false,
      userText: { iTunNORM: ' 00000c46 00000a35' },
    })
  })

  it('reads QuickTime mdta metadata with keys, itif, name, mhdr and two locales', () => {
    const key = (k: string) => bytes(u32(8 + k.length), 'mdta', k)
    const keys = fullBox('keys', u32(2), key('com.apple.quicktime.title'), key('com.apple.quicktime.artist'))
    const item1 = box(String.fromCharCode(0, 0, 0, 1), fullBox('itif', u32(5)), fullBox('name', 'main title'), box('data', u32(1), u32((0x4742 << 16) | packLanguage('eng')), 'Hello'), data(1, 'Hallo'))
    const item2 = box(String.fromCharCode(0, 0, 0, 2), data(1, 'Someone'))
    const meta = box('meta', fullBox('hdlr', u32(0), 'mdta', u32(0), u32(0), u32(0), [0]), fullBox('mhdr', u32(6)), keys, box('ilst', item1, item2))
    const file = m4a({ noMeta: true, moovMeta: meta })
    const r = readMP4(file)
    expect(r.warnings).toEqual([])
    expect(r.tags.quicktime!.nextItemId).toBe(6)
    expect(r.tags.quicktime!.items[0]).toMatchObject({ key: 'com.apple.quicktime.title', itemId: 5, name: 'main title' })
    expect(r.tags.quicktime!.items[0]!.values.map(valueText)).toEqual(['Hello', 'Hallo'])
    expect(getMP4Metadata(r.tags)).toMatchObject({ title: 'Hello', artist: ['Someone'] })
    expect(equalBytes(write4(file, r.tags).bytes, file)).toBe(true)
  })

  it('reads udta international text (ISO and Mac language codes, UTF-16 BOM)', () => {
    const entry = (lang: number, text: number[] | Uint8Array | string) => {
      const t = bytes(text)
      return bytes([(t.length + 4) >> 8, (t.length + 4) & 0xff, lang >> 8, lang & 0xff], t)
    }
    const nam = box('©nam', entry(packLanguage('eng'), 'Título'.split('').map(() => 0)).slice(0, 0), entry(packLanguage('eng'), new TextEncoder().encode('Título')), entry(0, [0x54, 0x8e]))
    const cpy = box('©cpy', entry(packLanguage('eng'), [0xfe, 0xff, 0, 0x41]))
    const file = m4a({ noMeta: true, udta: [nam, cpy] })
    const r = readMP4(file)
    expect(equalBytes(write4(file, r.tags).bytes, file)).toBe(true)
    expect(r.tags.userData.map((t) => [t.type, t.entries.map((e) => e.text)])).toEqual([
      ['©nam', ['Título', 'Té']],
      ['©cpy', ['A']],
    ])
    expect(getMP4Metadata(r.tags)).toMatchObject({ title: 'Título', copyright: 'A' })
  })
})

describe('writing MP4 files (task 27)', () => {
  const sample = () => m4a({ items: sampleItems(), free: 4096 })

  it('writes an unchanged file back byte for byte', () => {
    const f = sample()
    const r = write4(f, readMP4(f).tags)
    expect(r.inPlace).toBe(true)
    expect(equalBytes(r.bytes, f)).toBe(true)
  })

  it('absorbs growth in the free atom after moov (in place)', () => {
    const f = sample()
    const tags = readMP4(f).tags
    tags.itunes!.items.find((i) => i.key === '©nam')!.values = [textValue('x'.repeat(1000))]
    const r = write4(f, tags)
    expect(r.inPlace).toBe(true)
    expect(r.bytes.length).toBe(f.length)
    expect(chunksIntact(r.bytes)).toBe(true)
    expect(getMP4Metadata(readMP4(r.bytes).tags).title).toHaveLength(1000)
  })

  it('shifts every chunk offset when moov outgrows the free space', () => {
    const f = m4a({ items: sampleItems(), free: 16 })
    const tags = readMP4(f).tags
    tags.itunes!.items.push({ key: '©lyr', values: [textValue('la '.repeat(3000))] })
    const r = write4(f, tags, { padding: 512 })
    expect(r.inPlace).toBe(false)
    expect(r.bytes.length).toBeGreaterThan(f.length)
    expect(chunksIntact(r.bytes)).toBe(true)
    expect(readMP4(r.bytes).layout.atoms.map((a) => a.type)).toEqual(['ftyp', 'moov', 'free', 'mdat'])
  })

  it('shrinking into free space keeps the audio in place', () => {
    const f = m4a({ items: sampleItems(), free: 16 })
    const tags = readMP4(f).tags
    tags.itunes!.items = tags.itunes!.items.filter((i) => i.key !== 'covr' && i.key !== '©too')
    const r = write4(f, tags)
    expect(r.inPlace).toBe(true)
    expect(chunksIntact(r.bytes)).toBe(true)
  })

  it('handles co64 offsets and moov at the end', () => {
    for (const opts of [{ wideOffsets: true }, { moovAtEnd: true }]) {
      const f = m4a({ items: sampleItems(), ...opts })
      const tags = readMP4(f).tags
      tags.itunes!.items.push({ key: '©lyr', values: [textValue('y'.repeat(5000))] })
      const r = write4(f, tags)
      expect(chunksIntact(r.bytes)).toBe(true)
      expect(getMP4Metadata(readMP4(r.bytes).tags).lyrics?.[0]?.text).toHaveLength(5000)
    }
  })

  it('upgrades stco to co64 when an offset would overflow 32 bits', () => {
    const f = m4a({ items: [] })
    // turn the last chunk offset into a huge value that lies "behind" moov
    const dv = new DataView(f.buffer)
    let at = -1
    for (let i = 0; i < f.length - 4; i++) if (String.fromCharCode(...f.subarray(i, i + 4)) === 'stco') at = i
    dv.setUint32(at + 12 + 4 * (CHUNKS - 1), 0xfffffff0) // the last entry
    const tags = readMP4(f).tags
    tags.itunes = { items: [{ key: '©nam', values: [textValue('t')] }] }
    const out = write4(f, tags, { padding: 64 }).bytes
    const types = new Set<string>()
    for (let i = 0; i < out.length - 4; i++) types.add(String.fromCharCode(...out.subarray(i, i + 4)))
    expect(types.has('co64')).toBe(true)
    expect(types.has('stco')).toBe(false)
  })

  it('creates udta/meta/ilst when the file has none', () => {
    const f = m4a({ noMeta: true })
    const out = writeMP4File(f, { metadata: { title: 'New', track: { no: 1, of: 9 }, genre: ['Jazz'] } })
    const r = readMP4File(out.bytes)
    expect(r.metadata).toMatchObject({ title: 'New', track: { no: 1, of: 9 }, genre: ['Jazz'] })
    expect(chunksIntact(out.bytes)).toBe(true)
  })

  it('refuses to move a fragmented file', () => {
    const f = m4a({ items: [], extraTopLevel: [box('moof', box('mfhd', [0, 0, 0, 0, 0, 0, 0, 1]))] })
    const tags = readMP4(f).tags
    tags.itunes = { items: [{ key: '©nam', values: [textValue('t'.repeat(200))] }] }
    expect(() => writeMP4(f, tags)).toThrow(/fragmented/)
  })
})

describe('metadata API for MP4 (task 28)', () => {
  const full = {
    title: 'T ✓',
    artist: ['A', 'B'],
    albumArtist: 'AA',
    album: 'Al',
    composer: ['C'],
    lyricist: ['L'],
    conductor: 'Co',
    grouping: 'G',
    subtitle: 'S',
    remixer: 'R',
    publisher: 'P',
    copyright: '2001 X',
    encodedBy: 'E',
    encoderSettings: 'ES',
    isrc: 'USRC17607839',
    language: ['eng'],
    mood: 'Sad',
    key: 'Dbm',
    setSubtitle: 'Disc A',
    recordingTime: '1999-12-31',
    releaseTime: '2000',
    bpm: 128,
    track: { no: 3, of: 10 },
    disc: { no: 1, of: 2 },
    genre: ['Rock', 'Shoegaze'],
    comments: [{ language: 'XXX', description: '', text: 'nice' }],
    lyrics: [{ language: 'XXX', description: '', text: 'la\nla' }],
    pictures: [{ type: 3, mimeType: 'image/png', description: '', data: Uint8Array.from([0x89, 0x50, 0x4e, 0x47]) }],
    compilation: true,
    sort: { title: 'Ts', artist: 'As', album: 'Als', albumArtist: 'AAs', composer: 'Cs' },
    userText: { MusicBrainz: 'abc' },
    userUrls: { Spotify: 'https://open.spotify.com/track/abc', YouTube: 'https://www.youtube.com/watch?v=xyz' },
  }

  it('every mappable field round-trips', () => {
    const out = writeMP4File(m4a({ items: sampleItems(), free: 4096 }), { metadata: { ...full, userText: { ...full.userText, iTunNORM: ' 00000c46 00000a35' } } })
    const m = readMP4File(out.bytes).metadata
    expect(m).toEqual({ ...full, userText: { MusicBrainz: 'abc', iTunNORM: ' 00000c46 00000a35' } })
    expect(chunksIntact(out.bytes)).toBe(true)
  })

  it('rejects fields MP4 cannot store', () => {
    expect(() => writeMP4File(m4a(), { metadata: { playCount: 1n } })).toThrow(/playCount/)
  })

  it('keeps ID3 and MP4 apart: each API refuses the other format and points to detectFormat', () => {
    const mp3 = bytes([0xff, 0xfb, 0x90, 0], new Array(100).fill(0))
    expect(() => readMP4File(mp3)).toThrow(TagReadError)
    expect(() => readMP4File(mp3)).toThrow(/detectFormat/)
    expect(() => writeMP4File(mp3, { metadata: { title: 'x' } })).toThrow(/detectFormat/)
    expect(() => writeID3File(m4a(), { metadata: { title: 'x' } })).toThrow(TagWriteError)
    expect(() => writeID3File(m4a(), { metadata: { title: 'x' } })).toThrow(/detectFormat/)
    const r = readID3File(m4a({ items: sampleItems() }))
    expect(r.format).toBe('mp4')
    expect(r.warnings.map((w) => w.code)).toContain('format-not-id3')
  })

  it('removing a field removes its atoms (and gnre with genre)', () => {
    const f = m4a({ items: sampleItems(), free: 4096 })
    const out = readMP4File(writeMP4File(f, { metadata: { genre: null, album: null } }).bytes)
    expect(out.metadata.genre).toBeUndefined()
    expect(out.metadata.album).toBeUndefined()
    expect(out.mp4!.itunes!.items.map((i) => i.key)).not.toContain('gnre')
  })

  it('stores userUrls as freeform atoms with data type 15 (M8), separate from userText', () => {
    const f = m4a({ items: sampleItems(), free: 4096 })
    const out = readMP4File(writeMP4File(f, { metadata: { userUrls: { Spotify: 'https://open.spotify.com/track/1' }, userText: { Note: 'hi' } } }).bytes)
    const item = out.mp4!.itunes!.items.find((i) => i.key === '----:com.apple.iTunes:Spotify')!
    expect(item.values.map((v) => v.type)).toEqual([DataType.URL])
    expect(out.metadata.userUrls).toEqual({ Spotify: 'https://open.spotify.com/track/1' })
    // like TXXX for MP3, userText replaces the whole set of text values (iTunNORM included)
    expect(out.metadata.userText).toEqual({ Note: 'hi' })
    // replacing the links leaves the text values alone, and null removes the links
    const again = readMP4File(writeMP4File(writeMP4File(f, { metadata: { userUrls: { A: 'https://a/' }, userText: { Note: 'hi' } } }).bytes, { metadata: { userUrls: null } }).bytes)
    expect(again.metadata.userUrls).toBeUndefined()
    expect(again.metadata.userText).toMatchObject({ Note: 'hi' })
  })

  it('rejects relative URLs and a link sharing its name with a text value', () => {
    const f = m4a({ items: sampleItems() })
    expect(() => writeMP4File(f, { metadata: { userUrls: { Spotify: 'open.spotify.com/track/1' } } })).toThrow(/absolute URL/)
    expect(() => writeMP4File(f, { metadata: { userUrls: { iTunNORM: 'https://x/' } } })).toThrow(/share the atom/)
  })

  it('the same userUrls work for MP3 (WXXX) and M4A', async () => {
    const { concat } = await import('../src/core/bytes')
    const links = { Spotify: 'https://open.spotify.com/track/1', YouTube: 'https://youtu.be/2' }
    const mp3 = concat([new Uint8Array([0xff, 0xfb, 0x90, 0x00]), new Uint8Array(100)])
    expect(readID3File(writeID3File(mp3, { metadata: { userUrls: links } }).bytes).metadata.userUrls).toEqual(links)
    expect(readMP4File(writeMP4File(m4a(), { metadata: { userUrls: links } }).bytes).metadata.userUrls).toEqual(links)
  })

  it('writes and reads udta text entries', () => {
    const f = m4a({ noMeta: true })
    const tags = readMP4(f).tags
    tags.userData.push({ type: '©nam', entries: [udtaEntry('Título', 'spa')] })
    const out = write4(f, tags).bytes
    expect(getMP4Metadata(readMP4(out).tags).title).toBe('Título')
  })
})
