import { describe, expect, it } from 'vitest'
import { blobBytes, readFromBlob, readRIFFFromBlob, writeToBlob, writeRIFFToBlob } from '../src/browser'
import { concat, equalBytes } from '../src/core/bytes'
import {
  type Metadata,
  TagReadError,
  RIFFWriteError,
  createFrame,
  createTag,
  detectFormat,
  read,
  readRIFFFile,
  readRIFFRandomAccess,
  write,
  writeID3File,
  writeID3v2,
  writeRIFFFile,
} from '../src/index'
import type { RandomAccess } from '../src/file/partial-id3'
import { chunk, data, fmt, info, oCanada, riff } from './riff-helpers'

const id3Chunk = (title: string, padding = 0, id = 'id3 ') =>
  chunk(id, writeID3v2(createTag(3, [createFrame('text', 'TIT2', { encoding: 0, values: [title] }, 3)]), { padding }).bytes)
const le32 = (b: Uint8Array, pos: number) => new DataView(b.buffer, b.byteOffset).getUint32(pos, true)

describe('the RIFF spec example (task 32)', () => {
  it('reads RIFF(WAVE INFO(INAM("O Canada"Z)) fmt(1, 1, 44100, 132300, 3, 20) data)', () => {
    const file = oCanada()
    expect(detectFormat(file)).toBe('riff')
    const r = readRIFFFile(file)
    expect(r.warnings).toEqual([])
    expect(r.riff).toEqual({ info: [{ id: 'INAM', value: 'O Canada' }] })
    expect(r.audio).toEqual({ format: { formatTag: 1, channels: 1, sampleRate: 44100, byteRate: 132300, blockAlign: 3, bitsPerSample: 20 }, dataSize: 264600 })
    expect(r.metadata).toEqual({ title: 'O Canada', length: 2000 })
    // "O Canada" plus its NUL is 9 bytes: a pad byte follows (W5)
    expect(r.layout.chunks.map((c) => [c.id, c.size])).toEqual([
      ['LIST', 22],
      ['fmt ', 16],
      ['data', 264600],
    ])
  })

  it('writes the example back unchanged, byte for byte', () => {
    const file = oCanada()
    for (const input of [{}, { metadata: {} }, { metadata: { album: null } }]) {
      const out = writeRIFFFile(file, input)
      expect(out.inPlace).toBe(true)
      expect(equalBytes(out.bytes, file)).toBe(true)
    }
  })

  it('W1: adds an id3 chunk after the sound data; nothing before it moves', () => {
    const plain = riff([fmt(1, 1, 44100, 132300, 3, 20), data(264600)])
    const p = writeRIFFFile(plain, { metadata: { album: 'Anthems' } }).bytes
    expect(equalBytes(p.subarray(8, plain.length), plain.subarray(8))).toBe(true)
    expect(le32(p, 4)).toBe(p.length - 8)
    expect(readRIFFFile(p).layout.chunks.map((c) => c.id)).toEqual(['fmt ', 'data', 'id3 '])

    const out = writeRIFFFile(oCanada(), { metadata: { album: 'Anthems' } })
    const r = readRIFFFile(out.bytes)
    expect(r.layout.chunks.map((c) => c.id)).toEqual(['LIST', 'fmt ', 'data', 'id3 '])
    expect(r.metadata).toMatchObject({ title: 'O Canada', album: 'Anthems', length: 2000 })
    // the INFO list is kept in step (W2)
    expect(r.riff.info).toEqual([
      { id: 'INAM', value: 'O Canada' },
      { id: 'IPRD', value: 'Anthems' },
    ])
  })
})

describe('WAV tags (W1-W7)', () => {
  const full: Metadata = {
    title: 'Title ✓',
    artist: ['A', 'B'],
    album: 'Album',
    composer: ['C'],
    track: { no: 3, of: 12 },
    genre: ['Rock'],
    recordingTime: '2003-04-05',
    comments: [{ language: 'eng', description: '', text: 'a comment' }],
    pictures: [{ type: 3, mimeType: 'image/png', description: 'cover', data: new Uint8Array([1, 2, 3]) }],
    ratings: [{ email: 'a@b', rating: 200 }],
    userText: { CUSTOM: 'value' },
  }

  it('round-trips metadata through the id3 chunk', () => {
    const r = readRIFFFile(writeRIFFFile(riff([fmt(1, 2, 8000, 32000, 4, 16)]), { metadata: full }).bytes)
    expect(r.metadata).toEqual(full)
    expect(r.riff.info).toBeUndefined() // no INFO list is created
  })

  it('W2: reads the INFO list as a fallback; the ID3 chunk wins', () => {
    const file = riff([
      fmt(1, 1, 8000, 8000, 1, 8),
      info([
        ['INAM', 'info title'],
        ['IART', 'info artist'],
        ['IPRD', 'info album'],
        ['ICMT', 'info comment'],
        ['ICRD', '1553-05-03'],
        ['IGNR', 'Classical'],
        ['ITRK', '4/9'],
        ['ISFT', 'WaveEdit'],
        ['IENG', 'Smith, John; Adams, Joe'],
      ]),
      data(8000),
    ])
    expect(readRIFFFile(file).metadata).toEqual({
      title: 'info title',
      artist: ['info artist'],
      album: 'info album',
      comments: [{ language: 'XXX', description: '', text: 'info comment' }],
      recordingTime: '1553-05-03',
      genre: ['Classical'],
      track: { no: 4, of: 9 },
      encoderSettings: 'WaveEdit',
      length: 1000,
    })
    const withID3 = riff([fmt(1, 1, 8000, 8000, 1, 8), info([['INAM', 'info title']]), id3Chunk('id3 title')])
    expect(readRIFFFile(withID3).metadata.title).toBe('id3 title')
  })

  it('W2-W4: keeps the INFO list in step, "; " for several values, ISO-8859-1 only', () => {
    const file = riff([fmt(1, 1, 8000, 8000, 1, 8), info([['INAM', 'old'], ['IENG', 'kept']]), data(10)])
    const out = writeRIFFFile(file, { metadata: { title: 'new', artist: ['P', 'Q'], comments: [{ language: 'eng', description: '', text: 'c' }], track: { no: 2 } } })
    expect(out.warnings).toEqual([])
    expect(readRIFFFile(out.bytes).riff.info).toEqual([
      { id: 'INAM', value: 'new' },
      { id: 'IENG', value: 'kept' },
      { id: 'IART', value: 'P; Q' },
      { id: 'ICMT', value: 'c' },
      { id: 'ITRK', value: '2' },
    ])
    // ISO-8859-1 is fine; other text is left out of the INFO list, with a warning
    expect(readRIFFFile(writeRIFFFile(file, { metadata: { title: 'Çé' } }).bytes).riff.info?.[0]).toEqual({ id: 'INAM', value: 'Çé' })
    const u = writeRIFFFile(file, { metadata: { title: 'Ünï ✓' } })
    expect(u.warnings.map((w) => w.code)).toEqual(['riff-info-latin1'])
    const ru = readRIFFFile(u.bytes)
    expect(ru.riff.info).toEqual([{ id: 'IENG', value: 'kept' }])
    expect(ru.metadata.title).toBe('Ünï ✓')
    // null removes the entry and the ID3 frame
    const rn = readRIFFFile(writeRIFFFile(file, { metadata: { title: null } }).bytes)
    expect(rn.riff.info).toEqual([{ id: 'IENG', value: 'kept' }])
    expect(rn.metadata.title).toBeUndefined()
  })

  it('W4: decodes ISO-8859-1, UTF-8 by CSET 65001, and undeclared UTF-8 with a warning', () => {
    const utf8 = new TextEncoder().encode('Ünï ✓')
    const latin = riff([info([['INAM', Uint8Array.of(0xc7, 0xe9)]])])
    expect(readRIFFFile(latin).metadata.title).toBe('Çé')
    const cset = riff([chunk('CSET', [0xe9, 0xfd, 0, 0, 0, 0, 0, 0]), info([['INAM', utf8]])])
    const r = readRIFFFile(cset)
    expect(r.metadata.title).toBe('Ünï ✓')
    expect(r.warnings.map((w) => w.code)).not.toContain('riff-info-utf8')
    const undeclared = readRIFFFile(riff([fmt(1, 1, 8000, 8000, 1, 8), info([['INAM', utf8]])]))
    expect(undeclared.metadata.title).toBe('Ünï ✓')
    expect(undeclared.warnings.map((w) => w.code)).toEqual(['riff-info-utf8'])
  })

  it('writes an INFO list through the riff input, and keeps later INFO lists', () => {
    const file = riff([fmt(1, 1, 8000, 8000, 1, 8), data(3)])
    const out = writeRIFFFile(file, { riff: { info: [{ id: 'INAM', value: 'given' }] } })
    const r = readRIFFFile(out.bytes)
    expect(r.riff.info).toEqual([{ id: 'INAM', value: 'given' }])
    expect(r.layout.chunks.map((c) => c.id)).toEqual(['fmt ', 'data', 'LIST'])
    expect(() => writeRIFFFile(file, { riff: { info: [{ id: 'TOOLONG', value: '' }] } })).toThrow(RIFFWriteError)
    const two = riff([info([['INAM', 'first']]), info([['INAM', 'second']]), fmt(1, 1, 8000, 8000, 1, 8)])
    const r2 = readRIFFFile(two)
    expect(r2.metadata.title).toBe('first')
    expect(r2.warnings.map((w) => w.code)).toContain('riff-info-count')
    const out2 = writeRIFFFile(two, { metadata: { title: 'changed' } }).bytes
    expect(equalBytes(out2.subarray(out2.length - 26), two.subarray(26, 52))).toBe(false) // first list changed...
    expect(readRIFFFile(out2).layout.chunks.filter((c) => c.id === 'LIST')).toHaveLength(2) // ...the second is kept
  })

  it('an id3 chunk that keeps its size is rewritten in place; ID3 (upper case) is read', () => {
    const file = riff([fmt(1, 1, 8000, 8000, 1, 8), id3Chunk('first', 200), data(100)])
    const out = writeRIFFFile(file, { metadata: { title: 'second' } })
    expect(out.inPlace).toBe(true)
    expect(readRIFFFile(out.bytes).metadata.title).toBe('second')
    expect(readRIFFFile(out.bytes).riff.id3v2?.version.major).toBe(3)
    expect(readRIFFFile(riff([id3Chunk('upper', 0, 'ID3 ')])).metadata.title).toBe('upper')
  })

  it('W7: keeps an ID3v2 tag in front of the RIFF form and bytes after it', () => {
    const id3 = writeID3File(new Uint8Array(0), { metadata: { title: 'outside' } }).bytes
    const file = concat([id3, oCanada(), new TextEncoder().encode('TAIL')])
    const r = read(file)
    expect(r.format).toBe('riff')
    expect(r.warnings.map((w) => w.code)).toEqual(['riff-id3-prefix'])
    const out = write(file, { metadata: { title: 'inside' } }).bytes
    expect(equalBytes(out.subarray(0, id3.length), id3)).toBe(true)
    expect(new TextDecoder().decode(out.subarray(out.length - 4))).toBe('TAIL')
    expect(read(out).metadata.title).toBe('inside')
  })

  it('tolerates broken files, and throws in strict mode', () => {
    const truncated = oCanada().subarray(0, 100)
    const r = readRIFFFile(truncated)
    expect(r.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['riff-riff-size', 'riff-truncated']))
    expect(() => readRIFFFile(truncated, { strict: true })).toThrow(TagReadError)
    expect(() => writeRIFFFile(truncated, { metadata: { title: 'x' } })).toThrow(/truncated/)
    expect(readRIFFFile(riff([info([['INAM', 'n']])])).warnings.map((w) => w.code)).toContain('riff-fmt')
    expect(() => readRIFFFile(new Uint8Array(20))).toThrow(/not a WAV file/)
  })
})

describe('WAV partial I/O and the combined API', () => {
  const big = () => riff([fmt(1, 2, 44100, 176400, 4, 16), info([['INAM', 'big']]), data(20 * 1024 * 1024), id3Chunk('big', 512)])

  it('reads a large file without the sound data', async () => {
    const file = big()
    let n = 0
    const src: RandomAccess = { size: file.length, read: async (o, len) => ((n += len), file.subarray(o, o + len)) }
    const r = await readRIFFRandomAccess(src)
    expect(r.metadata.title).toBe('big')
    expect(n).toBeLessThan(4096)
  })

  it('writes large Blobs in place, and grows them without copying the sound data', async () => {
    const file = big()
    const blob = new Blob([file as Uint8Array<ArrayBuffer>], { type: 'audio/wav' })
    expect((await readRIFFFromBlob(blob)).metadata.title).toBe('big')
    // same length as 'big', so the INAM entry kept in step (W2) keeps its size too
    const same = await writeRIFFToBlob(blob, { metadata: { title: 'BIG' } })
    expect(same.size).toBe(file.length)
    const grown = await writeToBlob(blob, { metadata: { lyrics: [{ language: 'eng', description: '', text: 'z'.repeat(5000) }] } })
    expect((await readFromBlob(grown)).metadata.lyrics?.[0]?.text).toHaveLength(5000)
    const bytes = await blobBytes(grown)
    const dataAt = 12 + 24 + 22
    expect(equalBytes(bytes.subarray(dataAt, dataAt + 1000), file.subarray(dataAt, dataAt + 1000))).toBe(true)
  })

  it('read() and write() switch to WAV; id3v2 is the id3 chunk; id3v1 and file-layout options are refused', () => {
    const file = oCanada()
    const r = read(file)
    expect(r.format).toBe('riff')
    if (r.format === 'riff') expect(r.audio?.format.bitsPerSample).toBe(20) // narrows to RIFFReadResult
    const tag = createTag(4, [createFrame('text', 'TIT2', { encoding: 3, values: ['via id3v2'] })])
    expect(read(write(file, { id3v2: tag }).bytes).metadata.title).toBe('via id3v2')
    expect(() => write(file, { lyrics3: null })).toThrow(/cannot be written into a WAV file/)
    expect(() => write(file, { metadata: {} }, { id3v1: 'always' })).toThrow(/does not apply to WAV files/)
    expect(() => write(Uint8Array.of(0xff, 0xfb, 0x90, 0, 0), { riff: {} })).toThrow(/only be written into a WAV file/)
  })
})
