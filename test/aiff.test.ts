import { describe, expect, it } from 'vitest'
import { blobBytes, readAIFFFromBlob, readFromBlob, writeAIFFToBlob, writeToBlob } from '../src/browser'
import { concat, equalBytes } from '../src/core/bytes'
import {
  type Metadata,
  AIFFWriteError,
  TagReadError,
  createFrame,
  createTag,
  detectFormat,
  read,
  readAIFFFile,
  readAIFFRandomAccess,
  write,
  writeAIFFFile,
  writeID3File,
  writeID3v2,
} from '../src/index'
import type { RandomAccess } from '../src/file/partial-id3'
import { RATE_44100, appendixA, chunk, comm, comt, form, ssnd, text } from './aiff-helpers'

const id3Chunk = (title: string, padding = 0) =>
  chunk('ID3 ', writeID3v2(createTag(3, [createFrame('text', 'TIT2', { encoding: 0, values: [title] }, 3)]), { padding }).bytes)

describe('AIFF 1.3 Appendix A (task 31)', () => {
  it('reads the example: Common Chunk, and every other chunk kept', () => {
    const file = appendixA()
    expect(detectFormat(file)).toBe('aiff')
    // "ckSize 176516" in the Appendix A figure
    expect(new DataView(file.buffer).getUint32(4)).toBe(176516)
    const r = readAIFFFile(file)
    expect(r.warnings).toEqual([])
    expect(r.common).toEqual({ channels: 2, sampleFrames: 88200, sampleSize: 16, sampleRate: 44100 })
    expect(r.layout.chunks.map((c) => c.id)).toEqual(['COMM', 'MARK', 'INST', 'SSND'])
    expect(r.metadata).toEqual({ length: 2000 })
  })

  it('writes the example back unchanged, byte for byte', () => {
    const file = appendixA()
    for (const input of [{}, { metadata: {} }, { metadata: { title: null } }]) {
      const out = writeAIFFFile(file, input)
      expect(out.inPlace).toBe(true)
      expect(equalBytes(out.bytes, file)).toBe(true)
    }
  })

  it('A1: adds an ID3 chunk at the end of the FORM; the chunks before it do not move', () => {
    const file = appendixA()
    const out = writeAIFFFile(file, { metadata: { title: 'Loop', artist: ['Apple'] } })
    expect(out.inPlace).toBe(false)
    expect(equalBytes(out.bytes.subarray(8, file.length), file.subarray(8))).toBe(true) // everything after the FORM size
    const r = readAIFFFile(out.bytes)
    expect(r.layout.chunks.map((c) => c.id)).toEqual(['COMM', 'MARK', 'INST', 'SSND', 'ID3 '])
    expect(r.metadata).toMatchObject({ title: 'Loop', artist: ['Apple'], length: 2000 })
    expect(r.aiff.id3v2?.version.major).toBe(4)
    expect(new DataView(out.bytes.buffer).getUint32(4)).toBe(out.bytes.length - 8)
  })
})

describe('AIFF tags (A1-A4)', () => {
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
    playCount: 5n,
    userText: { CUSTOM: 'value' },
  }

  it('round-trips metadata through the ID3 chunk', () => {
    const r = readAIFFFile(writeAIFFFile(form([comm(1, 0, 16)]), { metadata: full }).bytes)
    expect(r.metadata).toEqual(full)
  })

  it('A2: reads the text chunks and the Comments Chunk as fallbacks; the ID3 chunk wins', () => {
    const file = form([
      comm(1, 0, 16),
      text('NAME', 'native name'),
      text('AUTH', 'native author'),
      text('(c) ', '1988 Apple Computer, Inc.'),
      comt([{ timeStamp: 3000000000, marker: 0, text: 'timed comment' }]),
      text('ANNO', 'an annotation'),
    ])
    const r = readAIFFFile(file)
    expect(r.aiff).toEqual({
      name: 'native name',
      author: 'native author',
      copyright: '1988 Apple Computer, Inc.',
      annotations: ['an annotation'],
      comments: [{ timeStamp: 3000000000, marker: 0, text: 'timed comment' }],
    })
    expect(r.metadata).toMatchObject({ title: 'native name', artist: ['native author'], copyright: '1988 Apple Computer, Inc.' })
    expect(r.metadata.comments?.map((c) => c.text)).toEqual(['timed comment', 'an annotation'])
    const withID3 = readAIFFFile(form([comm(1, 0, 16), text('NAME', 'native name'), id3Chunk('id3 title')]))
    expect(withID3.metadata.title).toBe('id3 title')
  })

  it('A2/A3: keeps NAME, AUTH and (c) in step with the ID3 chunk, ASCII only', () => {
    const file = form([comm(1, 0, 16), text('NAME', 'old'), text('AUTH', 'x'), ssnd(10)])
    const out = writeAIFFFile(file, { metadata: { title: 'new', artist: ['P', 'Q'] } })
    const r = readAIFFFile(out.bytes)
    expect(r.aiff).toMatchObject({ name: 'new', author: 'P, Q' })
    expect(r.aiff.id3v2).toBeDefined()
    expect(out.warnings).toEqual([])
    // a value that is not ASCII removes the text chunk, with a warning
    const u = writeAIFFFile(file, { metadata: { title: 'Ünïcode' } })
    expect(u.warnings.map((w) => w.code)).toEqual(['aiff-text-ascii'])
    const ru = readAIFFFile(u.bytes)
    expect(ru.aiff.name).toBeUndefined()
    expect(ru.metadata.title).toBe('Ünïcode')
    // null removes both
    const rn = readAIFFFile(writeAIFFFile(file, { metadata: { title: null } }).bytes)
    expect(rn.aiff.name).toBeUndefined()
    expect(rn.metadata.title).toBeUndefined()
    // no text chunk is created: they are only kept in step
    expect(readAIFFFile(writeAIFFFile(form([comm(1, 0, 16)]), { metadata: { title: 't' } }).bytes).aiff.name).toBeUndefined()
  })

  it('writes the text chunks and comments through the aiff input', () => {
    const file = form([comm(1, 0, 16), ssnd(3)])
    const out = writeAIFFFile(file, {
      aiff: { name: 'odd', author: 'Me', copyright: '2001 Me', annotations: ['a', 'b'], comments: [{ timeStamp: 1, marker: 0, text: 'abc' }] },
    })
    const r = readAIFFFile(out.bytes)
    expect(r.warnings).toEqual([])
    expect(r.aiff).toEqual({ name: 'odd', author: 'Me', copyright: '2001 Me', annotations: ['a', 'b'], comments: [{ timeStamp: 1, marker: 0, text: 'abc' }] })
    // odd sizes are padded: 'odd' (3 bytes) and the 3-byte SSND
    const name = r.layout.chunks.find((c) => c.id === 'NAME')!
    expect(name.size).toBe(3)
    expect(r.layout.chunks.find((c) => c.id === 'SSND')!.size).toBe(11)
    expect(() => writeAIFFFile(file, { aiff: { name: 'Ü', annotations: [], comments: [] } })).toThrow(AIFFWriteError)
  })

  it('an ID3 chunk that keeps its size is rewritten in place', () => {
    const file = form([comm(1, 0, 16), id3Chunk('first', 200), ssnd(100)])
    const out = writeAIFFFile(file, { metadata: { title: 'second' } })
    expect(out.inPlace).toBe(true)
    expect(out.bytes.length).toBe(file.length)
    expect(readAIFFFile(out.bytes).metadata.title).toBe('second')
    // the version of the existing tag is kept
    expect(readAIFFFile(out.bytes).aiff.id3v2?.version.major).toBe(3)
  })

  it('A4: keeps an ID3v2 tag in front of the FORM and notes it', () => {
    const id3 = writeID3File(new Uint8Array(0), { metadata: { title: 'outside' } }).bytes
    const file = concat([id3, appendixA()])
    expect(detectFormat(file)).toBe('aiff')
    const r = read(file)
    expect(r.format).toBe('aiff')
    expect(r.warnings.map((w) => w.code)).toEqual(['aiff-id3-prefix'])
    const out = write(file, { metadata: { title: 'inside' } }).bytes
    expect(equalBytes(out.subarray(0, id3.length), id3)).toBe(true)
    expect(read(out).metadata.title).toBe('inside')
  })

  it('reads id3 (lower case) chunks, AIFC files, and bytes after the FORM', () => {
    const lower = form([comm(1, 0, 16), chunk('id3 ', writeID3File(new Uint8Array(0), { metadata: { title: 'lower' } }).bytes)])
    expect(readAIFFFile(lower).metadata.title).toBe('lower')
    const aifc = form([chunk('FVER', [0xa2, 0x80, 0x51, 0x40]), chunk('COMM', [0, 2, 0, 0, 0, 10, 0, 16, ...RATE_44100, ...new TextEncoder().encode('NONE'), 0, 0]), ssnd(40)], 'AIFC')
    const r = readAIFFFile(aifc)
    expect(r.common?.sampleRate).toBe(44100)
    expect(r.layout.formType).toBe('AIFC')
    const tail = concat([appendixA(), new TextEncoder().encode('TAIL')])
    const out = writeAIFFFile(tail, { metadata: { title: 't' } }).bytes
    expect(new TextDecoder().decode(out.subarray(out.length - 4))).toBe('TAIL')
  })

  it('tolerates broken files, and throws in strict mode', () => {
    const truncated = appendixA().subarray(0, 100)
    const r = readAIFFFile(truncated)
    expect(r.warnings.map((w) => w.code)).toEqual(expect.arrayContaining(['aiff-form-size', 'aiff-truncated']))
    expect(() => readAIFFFile(truncated, { strict: true })).toThrow(TagReadError)
    expect(() => writeAIFFFile(truncated, { metadata: { title: 'x' } })).toThrow(/truncated/)
    expect(readAIFFFile(form([text('NAME', 'n')])).warnings.map((w) => w.code)).toContain('aiff-comm')
    expect(() => readAIFFFile(new Uint8Array(20))).toThrow(/not an AIFF file/)
  })
})

describe('AIFF partial I/O and the combined API', () => {
  const big = () => form([comm(2, 5_000_000, 16), text('NAME', 'big'), ssnd(20 * 1024 * 1024), id3Chunk('big', 512)])

  it('reads a large file without the sound data', async () => {
    const file = big()
    let n = 0
    const src: RandomAccess = { size: file.length, read: async (o, len) => ((n += len), file.subarray(o, o + len)) }
    const r = await readAIFFRandomAccess(src)
    expect(r.metadata.title).toBe('big')
    expect(n).toBeLessThan(4096)
  })

  it('writes large Blobs in place, and grows them without copying the sound data', async () => {
    const file = big()
    const blob = new Blob([file as Uint8Array<ArrayBuffer>], { type: 'audio/aiff' })
    expect((await readAIFFFromBlob(blob)).metadata.title).toBe('big')
    // same length as 'big', so the NAME chunk kept in step (A2) keeps its size too
    const same = await writeAIFFToBlob(blob, { metadata: { title: 'BIG' } })
    expect(same.size).toBe(file.length)
    const grown = await writeToBlob(blob, { metadata: { lyrics: [{ language: 'eng', description: '', text: 'z'.repeat(5000) }] } })
    const bytes = await blobBytes(grown)
    expect((await readFromBlob(grown)).metadata.lyrics?.[0]?.text).toHaveLength(5000)
    const ssndAt = 12 + 26 + 12
    expect(equalBytes(bytes.subarray(ssndAt, ssndAt + 1000), file.subarray(ssndAt, ssndAt + 1000))).toBe(true)
  })

  it('read() and write() switch to AIFF; id3v2 is the ID3 chunk; id3v1 and file-layout options are refused', () => {
    const file = form([comm(1, 0, 16)])
    const r = read(file)
    expect(r.format).toBe('aiff')
    if (r.format === 'aiff') expect(r.common?.channels).toBe(1) // narrows to AIFFReadResult
    const tag = createTag(4, [createFrame('text', 'TIT2', { encoding: 3, values: ['via id3v2'] })])
    expect(read(write(file, { id3v2: tag }).bytes).metadata.title).toBe('via id3v2')
    expect(read(write(file, { metadata: { title: 'v3' } }, { version: 3 }).bytes)).toMatchObject({ format: 'aiff', aiff: { id3v2: { version: { major: 3 } } } })
    expect(() => write(file, { id3v1: null })).toThrow(/cannot be written into an AIFF file/)
    expect(() => write(file, { metadata: {} }, { id3v2Location: 'append' })).toThrow(/does not apply to AIFF files/)
    expect(() => write(Uint8Array.of(0xff, 0xfb, 0x90, 0, 0), { aiff: { annotations: [], comments: [] } })).toThrow(/only be written into an AIFF file/)
  })
})
