import { describe, expect, it } from 'vitest'
import { concat, equalBytes } from '../src/core/bytes'
import { blobBytes, readID3FromBlob, writeID3ToBlob } from '../src/browser'
import { type Metadata, readID3File, writeID3File } from '../src/index'
import { type RandomAccess, readID3RandomAccess } from '../src/file/partial-id3'
import { serializeID3v1 } from '../src/id3v1/id3v1'
import { createFrame, createTag } from '../src/id3v2/tag'
import { writeID3v2 } from '../src/id3v2/writer'
import { serializeLyrics3 } from '../src/lyrics3/lyrics3'

const audio = (n: number) => new Uint8Array(n).fill(0xaa)

const full: Metadata = {
  title: 'Title ✓',
  subtitle: 'Live',
  grouping: 'Group',
  artist: ['A'],
  albumArtist: 'AA',
  album: 'Album',
  setSubtitle: 'Disc A',
  composer: ['C'],
  lyricist: ['L'],
  conductor: 'Cond',
  remixer: 'Rmx',
  publisher: 'Pub',
  copyright: '2001 Someone',
  encodedBy: 'Enc',
  encoderSettings: 'LAME',
  isrc: 'USRC17607839',
  language: ['eng'],
  mood: 'Sad',
  key: 'Dbm',
  bpm: 120,
  length: 180000,
  track: { no: 4, of: 9 },
  disc: { no: 1, of: 2 },
  genre: ['Rock', 'Eurodisco'],
  recordingTime: '1999-12-31T23:59',
  originalReleaseTime: '1980',
  comments: [{ language: 'eng', description: '', text: 'nice' }],
  lyrics: [{ language: 'eng', description: '', text: 'la\nla' }],
  pictures: [{ type: 3, mimeType: 'image/png', description: 'cover', data: Uint8Array.from([0x89, 0x50, 0x4e, 0x47]) }],
  ratings: [{ email: 'me@x', rating: 255, counter: 3n }],
  playCount: 7n,
  compilation: true,
  sort: { title: 'T', artist: 'Ar', album: 'Al', albumArtist: 'AA2', composer: 'Co' },
  userText: { MusicBrainz: 'abc' },
  userUrls: { home: 'http://x/' },
}

describe('high-level API (task 20)', () => {
  for (const version of [2, 3, 4] as const) {
    it(`every field round-trips through v2.${version}`, () => {
      const r = writeID3File(audio(100), { metadata: full }, { version })
      const back = readID3File(r.bytes)
      expect(back.id3v2!.version.major).toBe(version)
      const expected = { ...full }
      if (version < 4) expected.originalReleaseTime = '1980' // TORY keeps the year only
      expect(back.metadata).toEqual(expected)
    })
  }

  it('precedence: ID3v2, then Lyrics3 extended fields, then ID3v1', () => {
    const v1 = serializeID3v1({ title: 'v1 title', artist: 'Artist name that is longer tha', album: 'v1 album', year: '1990', genre: 17 })
    const ly = serializeLyrics3({ version: 2, fields: [{ id: 'EAR', value: 'Artist name that is longer than thirty chars' }] })
    const v2 = writeID3v2(createTag(4, [createFrame('text', 'TIT2', { encoding: 0, values: ['v2 title'] })])).bytes
    const m = readID3File(concat([v2, audio(10), ly, v1])).metadata
    expect(m.title).toBe('v2 title')
    expect(m.artist).toEqual(['Artist name that is longer than thirty chars'])
    expect(m.album).toBe('v1 album')
    expect(m.recordingTime).toBe('1990')
    expect(m.genre).toEqual(['Rock'])
  })

  it('updates an existing ID3v1 tag, removes fields with null', () => {
    const file = concat([audio(10), serializeID3v1({ title: 'old', year: '2000' })])
    const r = readID3File(writeID3File(file, { metadata: { title: 'new', artist: ['x'] } }).bytes)
    expect(r.id3v1?.title).toBe('new')
    expect(r.id3v2?.version.major).toBe(4)
    const r2 = readID3File(writeID3File(writeID3File(file, { metadata: { title: 'a', album: 'b' } }).bytes, { metadata: { album: null } }).bytes)
    expect(r2.metadata.album).toBeUndefined()
    expect(r2.metadata.title).toBe('a')
  })

  it('a file with only ID3v1 keeps its values when a field is written', () => {
    const file = concat([audio(10), serializeID3v1({ title: 'T', artist: 'Artist', album: 'Album', year: '2003', track: 12, genre: 7 })])
    const r = readID3File(writeID3File(file, { metadata: { title: 'New' } }).bytes)
    expect(r.id3v1).toEqual({ version: '1.1', title: 'New', artist: 'Artist', album: 'Album', year: '2003', comment: '', track: 12, genre: 7 })
    expect(r.metadata).toMatchObject({ title: 'New', artist: ['Artist'], album: 'Album', recordingTime: '2003', track: { no: 12 }, genre: ['Hip-Hop'] })
    expect(r.id3v2!.frames.map((f) => f.id).sort()).toEqual(['TALB', 'TCON', 'TDRC', 'TIT2', 'TPE1', 'TRCK'])
  })

  it('keeps untouched frames byte for byte', () => {
    const t = createTag(3, [
      createFrame('text', 'TIT2', { encoding: 0, values: ['a'] }, 3),
      createFrame('rvad', 'RVAD', { bitsUsed: 16, channels: [{ channel: 'right', increment: true, change: 1 }, { channel: 'left', increment: true, change: 2 }] }, 3),
    ])
    const file = concat([writeID3v2(t).bytes, audio(10)])
    const out = readID3File(writeID3File(file, { metadata: { album: 'x' } }).bytes)
    expect(out.id3v2!.frames.map((f) => f.id)).toEqual(['TIT2', 'RVAD', 'TALB'])
  })
})

describe('partial reading (task 21)', () => {
  function bigFile() {
    const head = writeID3v2(createTag(4, [createFrame('text', 'TIT2', { encoding: 0, values: ['big'] })])).bytes
    return concat([head, audio(3 * 1024 * 1024), serializeLyrics3({ version: 2, fields: [{ id: 'LYR', value: 'x' }] }), serializeID3v1({ title: 'v1' })])
  }

  it('reads a large file touching only the tag regions', async () => {
    const file = bigFile()
    let bytesRead = 0
    const src: RandomAccess = {
      size: file.length,
      read: async (o, n) => {
        bytesRead += n
        return file.subarray(o, o + n)
      },
    }
    const r = await readID3RandomAccess(src)
    expect(r.metadata.title).toBe('big')
    expect(r.id3v1?.title).toBe('v1')
    expect(r.lyrics3).toBeDefined()
    expect(bytesRead).toBeLessThan(20 * 1024)
    const whole = readID3File(file)
    expect(r.layout.audio).toEqual(whole.layout.audio)
    expect(r.layout.id3v1).toEqual(whole.layout.id3v1)
  })

  it('reads and writes Blobs and Files', async () => {
    const file = bigFile()
    const blob = new Blob([file as Uint8Array<ArrayBuffer>], { type: 'audio/mpeg' })
    expect((await readID3FromBlob(blob)).metadata.title).toBe('big')
    const out = await writeID3ToBlob(blob, { metadata: { title: 'changed', album: 'x'.repeat(5000) } })
    expect(out.type).toBe('audio/mpeg')
    const bytes = await blobBytes(out)
    const r = readID3File(bytes)
    expect(r.metadata.title).toBe('changed')
    expect(r.id3v1?.title).toBe('changed')
    expect(equalBytes(bytes.subarray(r.layout.audio.start, r.layout.audio.end), file.subarray(readID3File(file).layout.audio.start, readID3File(file).layout.audio.end))).toBe(true)
    if (typeof File !== 'undefined') {
      const f = new File([file as Uint8Array<ArrayBuffer>], 'song.mp3', { type: 'audio/mpeg' })
      const g = await writeID3ToBlob(f, { metadata: { title: 't' } })
      expect(g).toBeInstanceOf(File)
      expect((g as File).name).toBe('song.mp3')
    }
  })
})
