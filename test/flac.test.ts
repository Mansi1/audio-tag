import { describe, expect, it } from 'vitest'
import { blobBytes, readFLACFromBlob, readFromBlob, writeFLACToBlob, writeToBlob } from '../src/browser'
import { concat, equalBytes } from '../src/core/bytes'
import {
  type Metadata,
  FLACWriteError,
  TagReadError,
  TagWriteError,
  detectFormat,
  read,
  readFLACFile,
  readFLACRandomAccess,
  readID3File,
  write,
  writeFLACFile,
  writeID3File,
} from '../src/index'
import type { RandomAccess } from '../src/file/partial-id3'
import { RFC_EXAMPLE_1, RFC_EXAMPLE_2, RFC_EXAMPLE_2_AUDIO, block, flac, frames, picture, streamInfo, vorbis } from './flac-helpers'

const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52, 0, 0, 1, 0, 0, 0, 0, 200, 8, 6, 0, 0, 0])

describe('RFC 9639 examples (task 30)', () => {
  it('reads example 2: streaminfo, seek table, Vorbis comment, padding', () => {
    expect(detectFormat(RFC_EXAMPLE_2)).toBe('flac')
    const r = readFLACFile(RFC_EXAMPLE_2)
    expect(r.warnings).toEqual([])
    // D.2.3
    expect(r.streamInfo).toMatchObject({ minBlockSize: 16, maxBlockSize: 16, minFrameSize: 23, maxFrameSize: 68, sampleRate: 44100, channels: 2, bitsPerSample: 16, totalSamples: 19 })
    // D.2.5
    expect(r.flac.vorbis).toEqual({ vendor: 'reference libFLAC 1.3.3 20190804', fields: [{ name: 'TITLE', value: 'שלום' }] })
    expect(r.metadata.title).toBe('שלום')
    expect(r.layout.blocks.map((b) => b.type)).toEqual([0, 3, 4, 1])
    expect(r.layout.audioStart).toBe(RFC_EXAMPLE_2_AUDIO)
  })

  it('reads example 1: streaminfo only', () => {
    const r = readFLACFile(RFC_EXAMPLE_1)
    expect(r.streamInfo).toMatchObject({ sampleRate: 44100, channels: 2, bitsPerSample: 16, totalSamples: 1 })
    expect(r.flac).toEqual({ pictures: [] })
    expect(r.metadata).toEqual({ length: 0 })
  })

  it('writes example 2 back unchanged, byte for byte', () => {
    expect(equalBytes(writeFLACFile(RFC_EXAMPLE_2, {}).bytes, RFC_EXAMPLE_2)).toBe(true)
    expect(equalBytes(writeFLACFile(RFC_EXAMPLE_2, { metadata: {} }).bytes, RFC_EXAMPLE_2)).toBe(true)
    expect(equalBytes(writeFLACFile(RFC_EXAMPLE_2, { metadata: { title: 'שלום' } }).bytes, RFC_EXAMPLE_2)).toBe(true)
  })

  it('a smaller comment takes its space from padding: in place, everything else unchanged', () => {
    const out = writeFLACFile(RFC_EXAMPLE_2, { metadata: { title: 'x' } })
    expect(out.inPlace).toBe(true)
    expect(out.bytes.length).toBe(RFC_EXAMPLE_2.length)
    expect(equalBytes(out.bytes.subarray(0, 0x40), RFC_EXAMPLE_2.subarray(0, 0x40))).toBe(true) // streaminfo and seek table
    expect(equalBytes(out.bytes.subarray(RFC_EXAMPLE_2_AUDIO), RFC_EXAMPLE_2.subarray(RFC_EXAMPLE_2_AUDIO))).toBe(true)
    const r = readFLACFile(out.bytes)
    expect(r.metadata.title).toBe('x')
    // the comment shrank by 7 bytes; the padding grew from 6 to 13 and is still last
    expect(r.layout.blocks.map((b) => [b.type, b.end - b.start - 4])).toEqual([
      [0, 34],
      [3, 18],
      [4, 51],
      [1, 13],
    ])
  })

  it('a comment that does not fit is written with new padding; the audio moves unchanged', () => {
    const out = writeFLACFile(RFC_EXAMPLE_2, { metadata: { title: 'y'.repeat(100) } })
    expect(out.inPlace).toBe(false)
    const r = readFLACFile(out.bytes)
    expect(r.metadata.title).toBe('y'.repeat(100))
    expect(r.layout.blocks.map((b) => b.type)).toEqual([0, 3, 4, 1])
    expect(r.layout.blocks[3]!.end - r.layout.blocks[3]!.start - 4).toBe(1024)
    // seek points are relative to the first frame (§8.5.1), so the seek table is copied as it is
    expect(equalBytes(out.bytes.subarray(0x2a, 0x40), RFC_EXAMPLE_2.subarray(0x2a, 0x40))).toBe(true)
    expect(equalBytes(out.bytes.subarray(r.layout.audioStart), RFC_EXAMPLE_2.subarray(RFC_EXAMPLE_2_AUDIO))).toBe(true)
    expect(writeFLACFile(RFC_EXAMPLE_2, { metadata: { title: 'y'.repeat(100) } }, { padding: 0 }).bytes.length).toBe(RFC_EXAMPLE_2.length + 92 - 10) // +92 comment, -10 padding block
  })

  it('adds a comment block to example 1, which has none', () => {
    const out = writeFLACFile(RFC_EXAMPLE_1, { metadata: { title: 'new' } })
    const r = readFLACFile(out.bytes)
    expect(r.flac.vorbis).toEqual({ vendor: 'audio-tag', fields: [{ name: 'TITLE', value: 'new' }] })
    expect(r.layout.blocks.map((b) => b.type)).toEqual([0, 4, 1])
    expect(equalBytes(out.bytes.subarray(r.layout.audioStart), RFC_EXAMPLE_1.subarray(42))).toBe(true)
    // nothing to write: no empty comment block is added
    expect(equalBytes(writeFLACFile(RFC_EXAMPLE_1, { metadata: { title: null } }).bytes, RFC_EXAMPLE_1)).toBe(true)
  })
})

describe('FLAC field mapping (F1, F2, F7)', () => {
  const full: Metadata = {
    title: 'Title ✓',
    subtitle: 'Live',
    grouping: 'Group',
    artist: ['A', 'B'],
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
    encoderSettings: 'flac 1.4',
    isrc: 'USRC17607839',
    language: ['eng'],
    mood: 'Calm',
    key: 'Am',
    bpm: 120,
    track: { no: 3, of: 12 },
    disc: { no: 1, of: 2 },
    genre: ['Rock', 'Pop'],
    recordingTime: '2003-04-05',
    releaseTime: '2003-05-01',
    originalReleaseTime: '1999',
    comments: [{ language: 'XXX', description: '', text: 'a comment' }],
    lyrics: [{ language: 'XXX', description: '', text: 'la la' }],
    pictures: [{ type: 3, mimeType: 'image/png', description: 'cover', data: png }],
    compilation: true,
    sort: { title: 'T', artist: 'Ar', album: 'Al', albumArtist: 'AA2', composer: 'Co' },
    userText: { CUSTOM: 'value', OTHER: 'x' },
  }

  it('round-trips every field FLAC can store', () => {
    const out = writeFLACFile(flac({ padding: 64 }), { metadata: full })
    const r = readFLACFile(out.bytes)
    expect(r.metadata).toEqual({ ...full, length: 10000 })
    // F5: width and height from the PNG header
    expect(r.flac.pictures[0]).toMatchObject({ type: 3, width: 256, height: 200, depth: 0, colors: 0 })
    // F2: repeated fields; Picard's names
    const names = r.flac.vorbis!.fields.map((f) => f.name)
    expect(names.filter((n) => n === 'ARTIST')).toHaveLength(2)
    expect(names).toEqual(expect.arrayContaining(['TRACKNUMBER', 'TRACKTOTAL', 'DISCNUMBER', 'DISCTOTAL', 'LABEL', 'DATE', 'ORIGINALDATE', 'ALBUMARTISTSORT']))
  })

  it('reads names case-insensitively, the v-comment.html names and n/m positions', () => {
    const r = readFLACFile(
      flac({
        comment: ['title=lower', 'ORGANIZATION=Org', 'DESCRIPTION=desc', 'TRACKNUMBER=3/12', 'DiscNumber=2', 'TOTALDISCS=4', 'ARTIST=X', 'artist=Y', 'WAVEFORMATEXTENSIBLE_CHANNEL_MASK=0x3', 'Custom=1', 'CUSTOM=2'],
      }),
    )
    expect(r.metadata).toMatchObject({
      title: 'lower',
      publisher: 'Org',
      comments: [{ text: 'desc' }],
      track: { no: 3, of: 12 },
      disc: { no: 2, of: 4 },
      artist: ['X', 'Y'],
      userText: { Custom: '1', CUSTOM: '2' },
    })
    // F7: the channel mask is technical
    expect(JSON.stringify(r.metadata)).not.toContain('CHANNEL_MASK')
  })

  it('replaces fields where they were, removes with null, and keeps the channel mask', () => {
    const file = flac({ comment: ['WAVEFORMATEXTENSIBLE_CHANNEL_MASK=0x3', 'artist=old', 'ALBUM=keep', 'OTHER=o'], padding: 100 })
    const out = writeFLACFile(file, { metadata: { artist: ['new'], userText: null, album: null } })
    expect(readFLACFile(out.bytes).flac.vorbis!.fields).toEqual([
      { name: 'WAVEFORMATEXTENSIBLE_CHANNEL_MASK', value: '0x3' },
      { name: 'ARTIST', value: 'new' },
    ])
    expect(out.inPlace).toBe(true)
  })

  it('refuses what FLAC cannot store (F6) and invalid names', () => {
    const f = flac()
    for (const metadata of [{ playCount: 1n }, { ratings: [] }, { userUrls: { a: 'https://x/' } }, { length: 5 }, { taggingTime: '2001' }]) {
      expect(() => writeFLACFile(f, { metadata })).toThrow(FLACWriteError)
    }
    expect(() => writeFLACFile(f, { metadata: { userText: { TITLE: 'x' } } })).toThrow(/mapped field/)
    expect(() => writeFLACFile(f, { metadata: { userText: { 'A=B': 'x' } } })).toThrow(/printable ASCII without "="/)
    expect(() => writeFLACFile(f, { flac: { vorbis: { vendor: '', fields: [{ name: 'ÄÖ', value: '' }] }, pictures: [] } })).toThrow(TagWriteError)
    const icon = { type: 1, mimeType: 'image/png', description: '', width: 32, height: 32, depth: 0, colors: 0, data: png }
    expect(() => writeFLACFile(f, { flac: { pictures: [icon, icon] } })).toThrow(/only one picture of type 1/)
  })
})

describe('FLAC pictures and structure', () => {
  it('keeps unchanged pictures byte for byte and removes them with null', () => {
    const pic = picture(3, 'image/jpeg', 'front', new Uint8Array([1, 2, 3]), 640, 480)
    const file = flac({ comment: ['TITLE=t'], pictures: [pic], padding: 10 })
    expect(equalBytes(writeFLACFile(file, { metadata: { title: 't' } }).bytes, file)).toBe(true)
    const changed = writeFLACFile(file, { metadata: { title: 'u' } })
    expect(readFLACFile(changed.bytes).flac.pictures[0]).toMatchObject({ width: 640, height: 480, description: 'front' })
    const removed = readFLACFile(writeFLACFile(file, { metadata: { pictures: null } }).bytes)
    expect(removed.flac.pictures).toEqual([])
    expect(removed.metadata.pictures).toBeUndefined()
  })

  it('keeps application and cuesheet blocks and their order (F8)', () => {
    const app = Uint8Array.from([0x74, 0x65, 0x73, 0x74, 9, 9, 9])
    const file = flac({ extra: [[2, app]], comment: ['TITLE=t'] })
    const r = readFLACFile(writeFLACFile(file, { metadata: { title: 'longer title than before' } }).bytes)
    expect(r.layout.blocks.map((b) => b.type)).toEqual([0, 2, 4, 1])
  })

  it('F3: keeps an ID3v2 tag in front of the stream and notes it', () => {
    const id3 = writeID3File(new Uint8Array(0), { metadata: { title: 'id3 title' } }).bytes
    const file = flac({ prefix: id3, comment: ['TITLE=flac title'], padding: 0 })
    expect(detectFormat(file)).toBe('flac')
    const r = read(file)
    expect(r.format).toBe('flac')
    expect(r.metadata.title).toBe('flac title')
    expect(r.warnings.map((w) => w.code)).toEqual(['flac-id3'])
    const out = write(file, { metadata: { title: 'changed' } })
    expect(equalBytes(out.bytes.subarray(0, id3.length), id3)).toBe(true)
    expect(read(out.bytes).metadata.title).toBe('changed')
    expect(readID3File(out.bytes).metadata.title).toBe('id3 title')
  })

  it('tolerates broken blocks, and throws in strict mode', () => {
    const broken = flac({ extra: [[4, Uint8Array.from([5, 0, 0, 0, 0x61])]] }) // vendor length 5, 1 byte present
    const r = readFLACFile(broken)
    expect(r.warnings.map((w) => w.code)).toContain('vorbis-truncated')
    expect(() => readFLACFile(broken, { strict: true })).toThrow(TagReadError)
    const truncated = flac({ comment: ['A=b'] }).subarray(0, 50)
    expect(readFLACFile(truncated).warnings.map((w) => w.code)).toContain('flac-truncated')
    expect(() => writeFLACFile(truncated, { metadata: { title: 'x' } })).toThrow(/truncated/)
    expect(() => readFLACFile(new Uint8Array(10))).toThrow(/not a FLAC file/)
    expect(() => writeFLACFile(Uint8Array.of(0xff, 0xfb, 0x90, 0), {})).toThrow(/not a FLAC file/)
  })

  it('refuses picture blocks over the 24-bit size limit', () => {
    const big = { type: 3, mimeType: 'image/png', description: '', width: 0, height: 0, depth: 0, colors: 0, data: new Uint8Array(0x1000000) }
    expect(() => writeFLACFile(flac(), { flac: { pictures: [big] } })).toThrow(/24-bit size field/)
  })

  it('a hand-built block matches what the library writes', () => {
    const file = flac({ comment: ['TITLE=a'], padding: 4 })
    const expected = concat([block(4, vorbis('test vendor', ['TITLE=b'])), block(1, new Uint8Array(4), true)])
    const out = writeFLACFile(file, { metadata: { title: 'b' } }).bytes
    expect(equalBytes(out.subarray(42, 42 + expected.length), expected)).toBe(true)
    expect(streamInfo().length).toBe(34)
  })
})

describe('FLAC partial I/O and the combined API', () => {
  const big = () => flac({ comment: ['TITLE=big'], padding: 512, audio: concat([frames(), new Uint8Array(20 * 1024 * 1024)]) })

  it('reads a large file touching only the metadata blocks', async () => {
    const file = big()
    let n = 0
    const src: RandomAccess = { size: file.length, read: async (o, len) => ((n += len), file.subarray(o, o + len)) }
    const r = await readFLACRandomAccess(src)
    expect(r.metadata.title).toBe('big')
    expect(n).toBeLessThan(4096)
  })

  it('writes large Blobs in place without copying the audio', async () => {
    const file = big()
    const blob = new Blob([file as Uint8Array<ArrayBuffer>], { type: 'audio/flac' })
    expect((await readFLACFromBlob(blob)).metadata.title).toBe('big')
    const out = await writeFLACToBlob(blob, { metadata: { title: 'changed', album: 'Album' } })
    expect(out.size).toBe(file.length)
    expect((await readFromBlob(out)).metadata).toMatchObject({ title: 'changed', album: 'Album' })
    const grown = await writeToBlob(blob, { metadata: { lyrics: [{ language: 'XXX', description: '', text: 'z'.repeat(5000) }] } })
    const bytes = await blobBytes(grown)
    expect(readFLACFile(bytes).metadata.lyrics?.[0]?.text).toHaveLength(5000)
    expect(equalBytes(bytes.subarray(bytes.length - 1000), file.subarray(file.length - 1000))).toBe(true)
  })

  it('read() and write() switch to FLAC and refuse ID3 and MP4 inputs', () => {
    const file = flac({ comment: ['TITLE=t'] })
    const r = read(file)
    expect(r.format).toBe('flac')
    if (r.format === 'flac') expect(r.flac.vorbis?.fields).toEqual([{ name: 'TITLE', value: 't' }]) // narrows to FLACReadResult
    expect(write(file, { metadata: { title: 'u' } }).format).toBe('flac')
    expect(() => write(file, { id3v1: null })).toThrow(/cannot be written into a FLAC file/)
    expect(() => write(file, { mp4: { userData: [] } })).toThrow(/only be written into an MP4 file/)
    expect(() => write(file, { metadata: { title: 'x' } }, { version: 3 })).toThrow(/version is an ID3 option and does not apply to FLAC files/)
    expect(() => write(Uint8Array.of(0xff, 0xfb, 0x90, 0, 0), { flac: { pictures: [] } })).toThrow(/only be written into a FLAC file/)
  })
})
