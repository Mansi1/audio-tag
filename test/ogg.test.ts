import { describe, expect, it } from 'vitest'
import { blobBytes, readFromBlob, readOggFromBlob, writeOggToBlob, writeToBlob } from '../src/browser'
import { concat, equalBytes } from '../src/core/bytes'
import {
  type Metadata,
  NotImplementedError,
  OggWriteError,
  TagReadError,
  decodeBase64,
  detectFormat,
  encodeBase64,
  oggCrc,
  parsePage,
  read,
  readOggFile,
  readOggRandomAccess,
  write,
  writeID3File,
  writeOggFile,
} from '../src/index'
import type { RandomAccess } from '../src/file/partial-id3'
import { bitwiseCrc, flacBlock, flacFirst, opusHead, opusTags, page, stream, vorbisComment, vorbisFile, vorbisId, vorbisSetup, comment } from './ogg-helpers'

/** Every page: a valid CRC (checked with the independent bitwise CRC) and contiguous sequence numbers per stream. */
function checkPages(file: Uint8Array): { sequence: number; granule: bigint; data: Uint8Array }[] {
  const out: { sequence: number; granule: bigint; data: Uint8Array }[] = []
  const next = new Map<number, number>()
  let pos = 0
  while (pos < file.length && file[pos] === 0x4f) {
    const p = parsePage(file, pos)!
    const copy = file.slice(p.start, p.end)
    copy.fill(0, 22, 26)
    expect(bitwiseCrc(copy)).toBe(p.crc)
    expect(p.sequence).toBe(next.get(p.serial) ?? 0)
    next.set(p.serial, p.sequence + 1)
    out.push({ sequence: p.sequence, granule: p.granule, data: file.subarray(p.dataStart, p.end) })
    pos = p.end
  }
  return out
}

describe('Ogg pages (task 33)', () => {
  it('computes the RFC 3533 CRC like the bitwise reference, and base64 like RFC 4648', () => {
    const data = Uint8Array.from({ length: 1000 }, (_, i) => (i * 131) & 0xff)
    expect(oggCrc(data)).toBe(bitwiseCrc(data))
    // RFC 4648 §10 test vectors
    for (const [plain, coded] of [['', ''], ['f', 'Zg=='], ['fo', 'Zm8='], ['foo', 'Zm9v'], ['foob', 'Zm9vYg=='], ['fooba', 'Zm9vYmE='], ['foobar', 'Zm9vYmFy']] as const) {
      expect(encodeBase64(new TextEncoder().encode(plain))).toBe(coded)
      expect(new TextDecoder().decode(decodeBase64(coded))).toBe(plain)
    }
    expect(decodeBase64('Zm9v\nYg==')).toBeUndefined()
  })
})

describe('Ogg Vorbis', () => {
  it('reads the comment header and the length', () => {
    const file = vorbisFile(['TITLE=Song', 'ARTIST=A', 'ARTIST=B'], { samplesPerPacket: 44100 })
    expect(detectFormat(file)).toBe('ogg')
    const r = readOggFile(file)
    expect(r.warnings).toEqual([])
    expect(r.ogg.codec).toBe('vorbis')
    expect(r.stream).toMatchObject({ codec: 'vorbis', sampleRate: 44100, serial: 0x1234 })
    expect(r.metadata).toEqual({ title: 'Song', artist: ['A', 'B'], length: 2000 })
  })

  it('writes an unchanged file back byte for byte', () => {
    const file = vorbisFile(['TITLE=Song'])
    for (const input of [{}, { metadata: {} }, { metadata: { title: 'Song' } }, { metadata: { album: null } }]) {
      const out = writeOggFile(file, input)
      expect(out.inPlace).toBe(true)
      expect(equalBytes(out.bytes, file)).toBe(true)
    }
  })

  it('G4: rewrites only the header pages; the audio pages are copied', () => {
    const file = vorbisFile(['TITLE=Song'])
    const out = writeOggFile(file, { metadata: { title: 'A much longer title', album: 'Album' } })
    const before = checkPages(file)
    const after = checkPages(out.bytes)
    expect(after).toHaveLength(before.length)
    expect(equalBytes(out.bytes.subarray(0, 58), file.subarray(0, 58))).toBe(true) // the identification page
    expect(equalBytes(out.bytes.subarray(out.bytes.length - 60), file.subarray(file.length - 60))).toBe(true) // audio pages
    expect(after.map((p) => p.granule)).toEqual(before.map((p) => p.granule))
    const r = readOggFile(out.bytes)
    expect(r.metadata).toMatchObject({ title: 'A much longer title', album: 'Album' })
    // the setup header is unchanged
    expect(r.layout.headerPages).toHaveLength(2)
  })

  it('G5: a large cover needs more pages; every following page is renumbered', () => {
    const file = vorbisFile(['TITLE=Song'])
    const cover = Uint8Array.from({ length: 100_000 }, (_, i) => (i * 7) & 0xff)
    const out = writeOggFile(file, { metadata: { pictures: [{ type: 3, mimeType: 'image/jpeg', description: 'front', data: cover }] } })
    expect(out.warnings.map((w) => w.code)).toEqual(['ogg-renumbered'])
    const pages = checkPages(out.bytes)
    expect(pages.length).toBeGreaterThan(checkPages(file).length)
    // pages that no packet ends on have granule -1 (RFC 3533)
    expect(pages.some((p) => p.granule === 0xffffffffffffffffn)).toBe(true)
    // the audio packets and their granule positions are unchanged
    expect(pages.slice(-2).map((p) => [Array.from(p.data), p.granule])).toEqual([
      [[1, 2, 3, 4, 5], 1000n],
      [[6, 7, 8], 2000n],
    ])
    const r = readOggFile(out.bytes)
    expect(r.ogg.pictures[0]).toMatchObject({ type: 3, mimeType: 'image/jpeg', description: 'front' })
    expect(equalBytes(r.ogg.pictures[0]!.data, cover)).toBe(true)
    expect(r.ogg.vorbis.fields).toEqual([{ name: 'TITLE', value: 'Song' }]) // METADATA_BLOCK_PICTURE is not a plain field
    // and back: removing the cover shrinks the header again
    const back = writeOggFile(out.bytes, { metadata: { pictures: null } })
    checkPages(back.bytes)
    expect(readOggFile(back.bytes).ogg.pictures).toEqual([])
  })

  it('round-trips every field the comment can store', () => {
    const full: Metadata = {
      title: 'Title ✓',
      artist: ['A', 'B'],
      album: 'Album',
      albumArtist: 'AA',
      composer: ['C'],
      track: { no: 3, of: 12 },
      disc: { no: 1, of: 2 },
      genre: ['Rock'],
      recordingTime: '2003-04-05',
      comments: [{ language: 'XXX', description: '', text: 'a comment' }],
      lyrics: [{ language: 'XXX', description: '', text: 'la la' }],
      pictures: [{ type: 3, mimeType: 'image/png', description: 'cover', data: Uint8Array.of(1, 2, 3) }],
      compilation: true,
      sort: { artist: 'Ar' },
      userText: { CUSTOM: 'value' },
    }
    const r = readOggFile(writeOggFile(vorbisFile([]), { metadata: full }).bytes)
    expect(r.metadata).toEqual({ ...full, length: Math.round((2000 * 1000) / 44100) }) // last granule 2000 at 44.1 kHz
    expect(() => writeOggFile(vorbisFile([]), { metadata: { playCount: 1n } })).toThrow(/cannot be stored/)
  })

  it('G3: keeps a METADATA_BLOCK_PICTURE that is not base64 as a plain field', () => {
    const r = readOggFile(vorbisFile(['METADATA_BLOCK_PICTURE=not base64!']))
    expect(r.warnings.map((w) => w.code)).toEqual(['ogg-picture'])
    expect(r.ogg.pictures).toEqual([])
    expect(r.ogg.vorbis.fields).toEqual([{ name: 'METADATA_BLOCK_PICTURE', value: 'not base64!' }])
  })
})

describe('Ogg Opus and FLAC in Ogg', () => {
  it('Opus: OpusTags, the length with pre-skip, and trailing data (RFC 7845 §5.2)', () => {
    const kept = stream([opusHead(312), opusTags('libopus', ['TITLE=Opus'], [1, 9, 9])], { samplesPerPacket: 48000 + 312 / 2 })
    const r = readOggFile(kept)
    expect(r.ogg.codec).toBe('opus')
    expect(r.stream).toMatchObject({ sampleRate: 48000, preSkip: 312 })
    expect(r.metadata).toEqual({ title: 'Opus', length: 2000 })
    const out = writeOggFile(kept, { metadata: { title: 'Changed' } }).bytes
    checkPages(out)
    expect(readOggFile(out).metadata.title).toBe('Changed')
    // data whose first byte has LSB 1 is kept; LSB 0 is padding and dropped
    const commentOf = (f: Uint8Array) => readOggFile(f).layout.headerPages[1]!
    expect(Array.from(out.subarray(commentOf(out).end - 3, commentOf(out).end))).toEqual([1, 9, 9])
    const padded = stream([opusHead(), opusTags('libopus', ['TITLE=Opus'], [0, 0, 0, 0])])
    const p = writeOggFile(padded, { metadata: { title: 'Changed' } }).bytes
    expect(p.length).toBe(padded.length + 3 - 4)
  })

  it('FLAC in Ogg: the comment block packet, streaminfo and the length', () => {
    const file = stream([flacFirst(1), flacBlock(4, comment('ref', ['TITLE=Flac']), true)], { samplesPerPacket: 44100 })
    const r = readOggFile(file)
    expect(r.ogg.codec).toBe('flac')
    expect(r.stream.streamInfo).toMatchObject({ sampleRate: 44100, channels: 2, bitsPerSample: 16 })
    expect(r.metadata).toEqual({ title: 'Flac', length: 2000 })
    const out = writeOggFile(file, { metadata: { title: 'Changed', album: 'A' } }).bytes
    checkPages(out)
    const r2 = readOggFile(out)
    expect(r2.metadata).toMatchObject({ title: 'Changed', album: 'A' })
    // the last-block flag of the comment block is kept
    expect(r2.layout.headerPages).toHaveLength(2)
    // header count 0 (unknown): read up to the block with the last-block flag
    const unknownCount = stream([flacFirst(0), flacBlock(4, comment('ref', ['TITLE=T']), false), flacBlock(1, [0, 0], true)])
    expect(readOggFile(unknownCount).metadata.title).toBe('T')
  })

  it('G1: other codecs are not implemented; broken files', () => {
    const speex = stream([Uint8Array.from([...new TextEncoder().encode('Speex   '), 1, 2, 3]), Uint8Array.of(0)])
    expect(() => readOggFile(speex)).toThrow(NotImplementedError)
    const file = vorbisFile(['TITLE=Song'])
    expect(() => readOggFile(file.subarray(0, 70))).toThrow(TagReadError)
    const bad = file.slice()
    bad[58 + 27 + 2 + 20] = bad[58 + 27 + 2 + 20]! ^ 0xff // inside the comment page's data (page at 58, 2 segments)
    expect(readOggFile(bad).warnings.map((w) => w.code)).toContain('ogg-crc')
    expect(() => readOggFile(bad, { strict: true })).toThrow(TagReadError)
    expect(() => readOggFile(new Uint8Array(30))).toThrow(/not an Ogg file/)
  })

  it('G7: an ID3v2 tag in front is kept; interleaved streams can be read but not written', () => {
    const id3 = writeID3File(new Uint8Array(0), { metadata: { title: 'outside' } }).bytes
    const file = concat([id3, vorbisFile(['TITLE=inside'])])
    const r = read(file)
    expect(r.format).toBe('ogg')
    expect(r.warnings.map((w) => w.code)).toEqual(['ogg-id3-prefix'])
    const out = write(file, { metadata: { title: 'changed' } }).bytes
    expect(equalBytes(out.subarray(0, id3.length), id3)).toBe(true)
    expect(read(out).metadata.title).toBe('changed')

    const a = vorbisId()
    const other = page(0x02, 0n, 99, 0, [3], Uint8Array.of(1, 2, 3))
    const first = page(0x02, 0n, 1, 0, [a.length], a)
    const c = vorbisComment('v', ['TITLE=x'])
    const s = vorbisSetup(10)
    const rest = page(0, 0n, 1, 1, [c.length, s.length], concat([c, s]))
    const interleaved = concat([first, other, rest])
    expect(readOggFile(interleaved).metadata.title).toBe('x')
    expect(() => writeOggFile(interleaved, { metadata: { title: 'y' } })).toThrow(OggWriteError)
  })
})

describe('Ogg partial I/O and the combined API', () => {
  const big = () => vorbisFile(['TITLE=big'], { audio: Array.from({ length: 400 }, (_, i) => new Uint8Array(50_000).fill(i & 0xff)) })

  it('reads a large file touching only the header pages and the end', async () => {
    const file = big()
    let n = 0
    const src: RandomAccess = { size: file.length, read: async (o, len) => ((n += len), file.subarray(o, o + len)) }
    const r = await readOggRandomAccess(src)
    expect(r.metadata.title).toBe('big')
    expect(r.metadata.length).toBe(Math.round((400 * 1000 * 1000) / 44100))
    expect(n).toBeLessThan(200 * 1024)
  })

  it('writes large Blobs, with and without renumbering', async () => {
    const file = big()
    const blob = new Blob([file as Uint8Array<ArrayBuffer>], { type: 'audio/ogg' })
    expect((await readOggFromBlob(blob)).metadata.title).toBe('big')
    const small = await blobBytes(await writeOggToBlob(blob, { metadata: { album: 'Album' } }))
    checkPages(small)
    expect((await readFromBlob(new Blob([small as Uint8Array<ArrayBuffer>]))).metadata).toMatchObject({ title: 'big', album: 'Album' })
    const cover = new Uint8Array(200_000).fill(9)
    const grown = await blobBytes(await writeToBlob(blob, { metadata: { pictures: [{ type: 3, mimeType: 'image/png', description: '', data: cover }] } }))
    checkPages(grown)
    expect(read(grown).metadata.pictures?.[0]?.data.length).toBe(200_000)
  })

  it('read() and write() switch to Ogg and refuse other inputs and options', () => {
    const file = vorbisFile(['TITLE=t'])
    const r = read(file)
    expect(r.format).toBe('ogg')
    if (r.format === 'ogg') expect(r.ogg.codec).toBe('vorbis') // narrows to OggReadResult
    expect(write(file, { metadata: { title: 'u' } }).format).toBe('ogg')
    expect(() => write(file, { id3v2: null })).toThrow(/cannot be written into an Ogg file/)
    expect(() => write(file, { metadata: {} }, { version: 3 })).toThrow(/does not apply to Ogg files/)
    expect(() => write(Uint8Array.of(0xff, 0xfb, 0x90, 0, 0), { ogg: { vorbis: { vendor: '', fields: [] }, pictures: [] } })).toThrow(/only be written into an Ogg file/)
  })
})
