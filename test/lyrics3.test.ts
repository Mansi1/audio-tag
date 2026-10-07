import { describe, expect, it } from 'vitest'
import { TagReadError, TagWriteError, WarningSink } from '../src/core/errors'
import { serializeID3v1 } from '../src/id3v1/id3v1'
import {
  type Lyrics3v2Tag,
  extendedToId3v1,
  findLyrics3,
  formatImages,
  formatIndications,
  formatTimestamp,
  getLyrics3Field,
  lyrics3Images,
  parseImages,
  parseIndications,
  parseLyrics3,
  parseLyrics3v2Fields,
  parseTimestamp,
  parseTimestamps,
  removeMismatchedExtended,
  resolveExtendedFields,
  serializeLyrics3,
  setExtendedFields,
  setLyrics3Field,
} from '../src/lyrics3/lyrics3'
import { bytes } from './helpers'

// The example from docs/lyrics3/Lyrics3v2.txt, reproduced byte for byte: each [CR][LF] becomes
// "\r\n" and no other newline is added ("unless a [CR][LF] is at the end of the line, no [CR] or
// [LF] should be added between lines").
const EXAMPLE_LINES = [
  'LYRICSBEGIN',
  'IND00003',
  '110',
  'EAL00041',
  'Album name that is larger then 30 chars !',
  'EAR00050',
  'Artist name or band that is larger then 30 chars !',
  'ETT00042',
  'Track name which is larger then 30 chars !',
  'INF00090',
  'This track was actually recorded in several places around the world\r\n',
  'and mixed at the US\r\n',
  'AUT00048',
  'The lyrics were written by someone.. is it you ?',
  'IMG00086',
  'album_cover.jpg||Album cover||[00:10]\r\n',
  'jumping.jpg||He jumps at the audience!||[01:00]',
  'LYR00630',
  "[00:02]Let's talk about time\r\n",
  "[00:02]tickin' away every day\r\n",
  "[00:05]so wake on up before it's gone away\r\n",
  '[00:10]catch the 411 and stay up like the sun\r\n',
  "[00:20]remind yourself what's done and done\r\n",
  '[00:32]so let yesterday stay with the bygones\r\n',
  '[00:40]keep your body and soul and your mind on\r\n',
  '[00:55]the right track infact you gotta stay on\r\n',
  '[01:20]the real black\r\n',
  '\r\n',
  'Chorus:\r\n',
  '[01:25][05:45]Time is tickin\' away\r\n',
  "[01:42][05:55]you've gotta - live your life -\r\n",
  '[02:11][06:24]day by day\r\n',
  '[02:26][06:35]happy or sad, good or bad\r\n',
  '[02:31][06:42]life is too short\r\n',
  "[02:58][07:13]you've gotta - keep your head -\r\n",
  '[03:01][07:19](Repeat)\r\n',
  '001065LYRICS200',
]
const EXAMPLE = EXAMPLE_LINES.join('')
const EXAMPLE_BYTES = bytes(EXAMPLE)
const LYR = EXAMPLE_LINES.slice(18, 36).join('')

const ID3V1 = serializeID3v1({
  title: 'Track name which is larger the',
  artist: 'Artist name or band that is la',
  album: 'Album name that is larger then',
})
const AUDIO = bytes([0xff, 0xfb, 0x90, 0x64], new Uint8Array(200))

function file(...parts: Uint8Array[]): Uint8Array {
  return bytes(...parts)
}

describe('Lyrics3 v2.00 spec example', () => {
  it('has the size the normative rule gives (D2)', () => {
    // SPEC: "The size value includes the "LYRICSBEGIN" string, but does not include the 6 character
    // size descriptor and the trailing "LYRICS200" string."
    const sizeFieldAt = EXAMPLE.length - 15
    expect(EXAMPLE.slice(sizeFieldAt)).toBe('001065LYRICS200')
    const computed = sizeFieldAt // bytes from LYRICSBEGIN up to the size field
    // 11 + 8 field headers * 8 bytes + 3+41+50+42+90+48+86+630 bytes of data
    expect(computed).toBe(11 + 8 * 8 + 3 + 41 + 50 + 42 + 90 + 48 + 86 + 630)
    expect(computed).toBe(1065)
    // The published trailer is correct. It is the prose total ("All the fields together (with the
    // 'LYRICSBEGIN') is 001064 chars") that is off by one.
    expect(Number(EXAMPLE.slice(sizeFieldAt, sizeFieldAt + 6))).toBe(computed)
    expect(1064).toBe(computed - 1)
  })

  it('parses with no warnings and every field matches', () => {
    const r = findLyrics3(file(AUDIO, EXAMPLE_BYTES, ID3V1))!
    expect(r.warnings).toEqual([])
    expect(r.start).toBe(AUDIO.length)
    expect(r.end).toBe(AUDIO.length + EXAMPLE_BYTES.length)
    const tag = r.tag as Lyrics3v2Tag
    expect(tag.version).toBe(2)
    expect(tag.fields.map((f) => f.id)).toEqual(['IND', 'EAL', 'EAR', 'ETT', 'INF', 'AUT', 'IMG', 'LYR'])
    expect(tag.fields.map((f) => f.value.length)).toEqual([3, 41, 50, 42, 90, 48, 86, 630])
    expect(getLyrics3Field(tag, 'IND')).toBe('110')
    expect(getLyrics3Field(tag, 'EAL')).toBe('Album name that is larger then 30 chars !')
    expect(getLyrics3Field(tag, 'EAR')).toBe('Artist name or band that is larger then 30 chars !')
    expect(getLyrics3Field(tag, 'ETT')).toBe('Track name which is larger then 30 chars !')
    expect(getLyrics3Field(tag, 'INF')).toBe(
      'This track was actually recorded in several places around the world\r\nand mixed at the US\r\n',
    )
    expect(getLyrics3Field(tag, 'AUT')).toBe('The lyrics were written by someone.. is it you ?')
    expect(getLyrics3Field(tag, 'IMG')).toBe(
      'album_cover.jpg||Album cover||[00:10]\r\njumping.jpg||He jumps at the audience!||[01:00]',
    )
    expect(getLyrics3Field(tag, 'LYR')).toBe(LYR)
  })

  it('round trips byte for byte', () => {
    const r = parseLyrics3(EXAMPLE_BYTES)!
    expect(r.warnings).toEqual([])
    expect(serializeLyrics3(r.tag)).toEqual(EXAMPLE_BYTES)
  })

  it('IND "110": lyrics present, timestamps present, random not inhibited', () => {
    expect(parseIndications('110')).toEqual({ lyricsPresent: true, timestampsPresent: true, inhibitRandom: false })
    expect(formatIndications(parseIndications('110'))).toBe('110')
  })

  it('IMG lines', () => {
    const tag = parseLyrics3(EXAMPLE_BYTES)!.tag as Lyrics3v2Tag
    const imgs = lyrics3Images(tag)
    expect(imgs).toEqual([
      { filename: 'album_cover.jpg', description: 'Album cover', timestamp: '[00:10]' },
      { filename: 'jumping.jpg', description: 'He jumps at the audience!', timestamp: '[01:00]' },
    ])
    expect(formatImages(imgs)).toBe(getLyrics3Field(tag, 'IMG'))
  })

  it('LYR timestamps', () => {
    const lines = parseTimestamps(LYR)
    expect(lines).toHaveLength(18)
    expect(lines[0]).toEqual({ times: [2], text: "Let's talk about time" })
    expect(lines[1]).toEqual({ times: [2], text: "tickin' away every day" })
    expect(lines[8]).toEqual({ times: [80], text: 'the real black' })
    expect(lines[9]).toEqual({ times: [], text: '' })
    expect(lines[10]).toEqual({ times: [], text: 'Chorus:' })
    expect(lines[11]).toEqual({ times: [85, 345], text: "Time is tickin' away" })
    expect(lines[17]).toEqual({ times: [181, 439], text: '(Repeat)' })
    expect(lines.map((l) => l.times[0])).toEqual([
      2, 2, 5, 10, 20, 32, 40, 55, 80, undefined, undefined, 85, 102, 131, 146, 151, 178, 181,
    ])
  })

  it('extended fields match the ID3v1 example values (30-character truncations)', () => {
    const tag = parseLyrics3(EXAMPLE_BYTES)!.tag as Lyrics3v2Tag
    // SPEC: "The ID3v1 tag that comes after this example should have : Album field: 'Album name that
    // is larger then' Artist field: 'Artist name or band that is la' Title field: 'Track name which
    // is larger the'"
    expect(extendedToId3v1(tag)).toEqual({
      title: 'Track name which is larger the',
      artist: 'Artist name or band that is la',
      album: 'Album name that is larger then',
    })
    const id3v1 = { ...extendedToId3v1(tag) } as { title: string; artist: string; album: string }
    expect(resolveExtendedFields(tag, id3v1)).toEqual({
      title: 'Track name which is larger then 30 chars !',
      artist: 'Artist name or band that is larger then 30 chars !',
      album: 'Album name that is larger then 30 chars !',
      mismatched: [],
    })
  })
})

describe('Lyrics3 v2.00 locating', () => {
  it('reads a v2 tag without ID3v1 with a warning', () => {
    const r = findLyrics3(file(AUDIO, EXAMPLE_BYTES))!
    expect(r.tag.version).toBe(2)
    expect(r.warnings.map((w) => w.code)).toEqual(['lyrics3-no-id3v1'])
    expect(() => findLyrics3(file(AUDIO, EXAMPLE_BYTES), { strict: true })).toThrow(TagReadError)
  })

  it('tolerates a size that is off by one, with a warning', () => {
    const bad = bytes(EXAMPLE.replace('001065LYRICS200', '001064LYRICS200'))
    const r = findLyrics3(file(AUDIO, bad, ID3V1))!
    expect(r.start).toBe(AUDIO.length)
    expect(r.warnings.map((w) => w.code)).toEqual(['lyrics3-size-mismatch'])
    expect((r.tag as Lyrics3v2Tag).fields).toHaveLength(8)
  })

  it('returns null when there is no tag', () => {
    expect(findLyrics3(file(AUDIO, ID3V1))).toBeNull()
    expect(findLyrics3(new Uint8Array(3))).toBeNull()
  })

  it('reports a bad size field', () => {
    const sink = new WarningSink()
    expect(findLyrics3(file(AUDIO, bytes('LYRICSBEGININD000031100x1065LYRICS200'), ID3V1), { warnings: sink })).toBeNull()
    expect(sink.list.map((w) => w.code)).toEqual(['lyrics3-size'])
  })
})

describe('Lyrics3 v2.00 fields', () => {
  it('round trips unknown fields in order', () => {
    const tag: Lyrics3v2Tag = {
      version: 2,
      fields: [
        { id: 'IND', value: '001' },
        { id: 'XYZ', value: 'future data' },
        { id: 'AUT', value: 'Someone' },
        { id: 'QQQ', value: '' },
      ],
    }
    const out = serializeLyrics3(tag)
    expect(new TextDecoder().decode(out)).toBe(
      'LYRICSBEGININD00003001XYZ00011future dataAUT00007SomeoneQQQ00000000064LYRICS200',
    )
    const back = parseLyrics3(out)!
    expect(back.warnings).toEqual([])
    expect(back.tag).toEqual(tag)
    expect(serializeLyrics3(back.tag)).toEqual(out)
  })

  it('warns when IND is not first, and the writer refuses it', () => {
    const data = bytes('AUT00001aIND00003110')
    const sink = new WarningSink()
    const fields = parseLyrics3v2Fields(data, { warnings: sink })
    expect(fields).toEqual([
      { id: 'AUT', value: 'a' },
      { id: 'IND', value: '110' },
    ])
    expect(sink.list.map((w) => w.code)).toEqual(['lyrics3-ind-order'])
    expect(() => serializeLyrics3({ version: 2, fields })).toThrow(TagWriteError)
  })

  it('setLyrics3Field puts a new IND first', () => {
    const tag: Lyrics3v2Tag = { version: 2, fields: [{ id: 'LYR', value: 'x' }] }
    setLyrics3Field(tag, 'IND', '100')
    setLyrics3Field(tag, 'AUT', 'me')
    expect(tag.fields.map((f) => f.id)).toEqual(['IND', 'LYR', 'AUT'])
    setLyrics3Field(tag, 'AUT', undefined)
    expect(tag.fields.map((f) => f.id)).toEqual(['IND', 'LYR'])
  })

  it('errors on oversized fields', () => {
    const one = (id: string, n: number): Lyrics3v2Tag => ({ version: 2, fields: [{ id, value: 'a'.repeat(n) }] })
    expect(() => serializeLyrics3(one('IND', 4))).toThrow(/maximum is 3/)
    for (const id of ['AUT', 'EAL', 'EAR', 'ETT']) {
      expect(() => serializeLyrics3(one(id, 250))).not.toThrow()
      expect(() => serializeLyrics3(one(id, 251))).toThrow(/maximum is 250/)
    }
    expect(() => serializeLyrics3(one('LYR', 99999))).not.toThrow()
    expect(() => serializeLyrics3(one('LYR', 100000))).toThrow(/maximum is 99999/)
    expect(() => serializeLyrics3(one('XYZ', 100000))).toThrow(/maximum is 99999/)
  })

  it('errors when the 6-digit total overflows', () => {
    const fields = Array.from({ length: 11 }, () => ({ id: 'LYR', value: 'a'.repeat(99999) }))
    expect(() => serializeLyrics3({ version: 2, fields })).toThrow(/999999/)
  })

  it('errors on no fields, bad characters and bad IDs', () => {
    expect(() => serializeLyrics3({ version: 2, fields: [] })).toThrow(TagWriteError)
    expect(() => serializeLyrics3({ version: 2, fields: [{ id: 'LYR', value: 'aÿb' }] })).toThrow(/\$FF/)
    expect(() => serializeLyrics3({ version: 2, fields: [{ id: 'LYR', value: 'a\0b' }] })).toThrow(TagWriteError)
    expect(() => serializeLyrics3({ version: 2, fields: [{ id: 'LYR', value: 'Ā' }] })).toThrow(TagWriteError)
    expect(() => serializeLyrics3({ version: 2, fields: [{ id: 'LY', value: 'a' }] })).toThrow(TagWriteError)
  })

  it('warns on oversized fields, overruns and empty tags when reading', () => {
    const sink = new WarningSink()
    parseLyrics3v2Fields(bytes('AUT00251', 'a'.repeat(251)), { warnings: sink })
    parseLyrics3v2Fields(bytes('LYR00010abc'), { warnings: sink })
    parseLyrics3v2Fields(new Uint8Array(0), { warnings: sink })
    expect(sink.list.map((w) => w.code)).toEqual(['lyrics3-field-max', 'lyrics3-field-overrun', 'lyrics3-no-fields'])
  })
})

describe('Lyrics3 v1', () => {
  const lyrics = '[00:01]Hello\r\n[00:05][01:05]World'
  const v1 = bytes('LYRICSBEGIN', lyrics, 'LYRICSEND')

  it('serialises', () => {
    expect(serializeLyrics3({ version: 1, lyrics })).toEqual(v1)
  })

  it('is found before an ID3v1 tag', () => {
    const r = findLyrics3(file(AUDIO, v1, ID3V1))!
    expect(r.tag).toEqual({ version: 1, lyrics })
    expect(r.start).toBe(AUDIO.length)
    expect(r.end).toBe(AUDIO.length + v1.length)
    expect(r.warnings).toEqual([])
  })

  it('is found at the end of a file without ID3v1, with a note', () => {
    const r = findLyrics3(file(AUDIO, v1))!
    expect(r.tag).toEqual({ version: 1, lyrics })
    expect(r.end).toBe(AUDIO.length + v1.length)
    expect(r.warnings.map((w) => w.code)).toEqual(['lyrics3-no-id3v1'])
  })

  it('finds a maximal 5100-byte tag', () => {
    const big = 'a'.repeat(5100)
    const r = findLyrics3(file(bytes('LYRICSBEGIN'), AUDIO, serializeLyrics3({ version: 1, lyrics: big }), ID3V1))!
    expect(r.start).toBe(11 + AUDIO.length)
    expect(r.tag).toEqual({ version: 1, lyrics: big })
  })

  it('does not search further back than 5100 bytes', () => {
    const sink = new WarningSink()
    const data = file(bytes('LYRICSBEGIN', 'a'.repeat(5101), 'LYRICSEND'), ID3V1)
    expect(findLyrics3(data, { warnings: sink })).toBeNull()
    expect(sink.list.map((w) => w.code)).toEqual(['lyrics3-no-begin'])
  })

  it('enforces the writer rules', () => {
    expect(() => serializeLyrics3({ version: 1, lyrics: 'a LYRICSEND b' })).toThrow(/LYRICSEND/)
    expect(() => serializeLyrics3({ version: 1, lyrics: 'LYRICSBEGIN' })).toThrow(/LYRICSBEGIN/)
    expect(() => serializeLyrics3({ version: 1, lyrics: 'ÿ' })).toThrow(/\$FF/)
    expect(() => serializeLyrics3({ version: 1, lyrics: 'a'.repeat(5101) })).toThrow(/5100/)
    const sink = new WarningSink()
    serializeLyrics3({ version: 1, lyrics: 'a'.repeat(4097) }, { warnings: sink })
    expect(sink.list.map((w) => w.code)).toEqual(['lyrics3-v1-size'])
    serializeLyrics3({ version: 1, lyrics: 'a'.repeat(4096) }, { warnings: sink })
    expect(sink.list).toHaveLength(1)
  })

  it('warns on a $FF byte when reading', () => {
    const r = parseLyrics3(bytes('LYRICSBEGINa', [0xff], 'LYRICSEND'))!
    expect(r.warnings.map((w) => w.code)).toEqual(['lyrics3-ff'])
  })
})

describe('timestamps', () => {
  it('parses and formats [mm:ss]', () => {
    expect(parseTimestamp('[01:25]')).toBe(85)
    expect(parseTimestamp('[1:25]')).toBeUndefined()
    expect(parseTimestamp('[01: 25]')).toBeUndefined()
    expect(parseTimestamp('[01:60]')).toBeUndefined()
    expect(formatTimestamp(85)).toBe('[01:25]')
    expect(() => formatTimestamp(100 * 60)).toThrow(TagWriteError)
  })
  it('finds stamps anywhere in a line, in any order', () => {
    expect(parseTimestamps('la [00:30]la[00:10]\nnext')).toEqual([
      { times: [30, 10], text: 'la la' },
      { times: [], text: 'next' },
    ])
  })
})

describe('IMG', () => {
  it('handles the optional parts and the "||||" form', () => {
    const value = 'a.jpg\r\nb.jpg||desc\r\nc.jpg||||[00:10]\r\nimages\\d.jpg||x||[01:00]'
    const imgs = parseImages(value)
    expect(imgs).toEqual([
      { filename: 'a.jpg' },
      { filename: 'b.jpg', description: 'desc' },
      { filename: 'c.jpg', timestamp: '[00:10]' },
      { filename: 'images\\d.jpg', description: 'x', timestamp: '[01:00]' },
    ])
    expect(formatImages(imgs)).toBe(value)
  })
  it('rejects long descriptions and bad timestamps', () => {
    expect(() => formatImages([{ filename: 'a', description: 'x'.repeat(250) }])).not.toThrow()
    expect(() => formatImages([{ filename: 'a', description: 'x'.repeat(251) }])).toThrow(/250/)
    expect(() => formatImages([{ filename: 'a', timestamp: '0:10' }])).toThrow(TagWriteError)
    expect(() => formatImages([{ filename: 'a||b' }])).toThrow(TagWriteError)
  })
})

describe('extended fields', () => {
  const tag = (): Lyrics3v2Tag => parseLyrics3(EXAMPLE_BYTES)!.tag as Lyrics3v2Tag

  it('marks extended fields whose first 30 characters differ from ID3v1', () => {
    const id3v1 = { title: 'Something else', artist: 'Artist name or band that is la', album: 'Album name that is larger then' }
    const r = resolveExtendedFields(tag(), id3v1)
    expect(r.title).toBe('Something else')
    expect(r.artist).toBe('Artist name or band that is larger then 30 chars !')
    expect(r.mismatched).toEqual(['ETT'])
    expect(removeMismatchedExtended(tag(), id3v1).fields.map((f) => f.id)).toEqual([
      'IND', 'EAL', 'EAR', 'INF', 'AUT', 'IMG', 'LYR',
    ])
  })

  it('skips short extended fields unless writeShortExtended is set', () => {
    const t: Lyrics3v2Tag = { version: 2, fields: [{ id: 'LYR', value: 'x' }] }
    const v1 = setExtendedFields(t, { title: 'Short', artist: 'A'.repeat(31) })
    expect(v1).toEqual({ title: 'Short', artist: 'A'.repeat(30) })
    expect(t.fields.map((f) => f.id)).toEqual(['LYR', 'EAR'])
    setExtendedFields(t, { title: 'Short' }, { writeShortExtended: true })
    expect(getLyrics3Field(t, 'ETT')).toBe('Short')
  })
})
