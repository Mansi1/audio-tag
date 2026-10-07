import { describe, expect, it } from 'vitest'
import { readFromBlob, writeToBlob, blobBytes } from '../src/browser'
import { concat } from '../src/core/bytes'
import { TagWriteError, UnknownFormatError, read, readID3File, readMP4File, serializeID3v1, write, writeID3File } from '../src/index'
import { m4a, sampleItems } from './mp4-helpers'

const mp3 = () => concat([new Uint8Array([0xff, 0xfb, 0x90, 0x00]), new Uint8Array(400)])
const big = () => new Uint8Array(3 * 1024 * 1024)

describe('read() and write() for any file (switch on detectFormat)', () => {
  it('reads MP4 files as MP4 metadata and everything else as ID3', () => {
    const r4 = read(m4a({ items: sampleItems() }))
    expect(r4.format).toBe('mp4')
    if (r4.format === 'mp4') expect(r4.mp4.itunes?.items.length).toBeGreaterThan(0) // narrows to MP4ReadResult
    expect(r4).toEqual(readMP4File(m4a({ items: sampleItems() })))

    const r3 = read(mp3())
    expect(r3.format).toBe('mpeg')
    if (r3.format === 'mpeg') expect(r3.layout.audio.end).toBe(404) // narrows to the ID3 result
    expect(r3).toEqual(readID3File(mp3()))
  })

  it('writes the same metadata into both formats', () => {
    for (const file of [mp3(), m4a({ items: sampleItems(), free: 4096 })]) {
      const out = write(file, { metadata: { title: 'Same', artist: ['Both'] } })
      const back = read(out.bytes)
      expect(out.format).toBe(back.format)
      expect(back.metadata.title).toBe('Same')
      expect(back.metadata.artist).toEqual(['Both'])
    }
  })

  it('refuses inputs and options that belong to the other format', () => {
    const f = m4a()
    expect(() => write(f, { id3v1: null })).toThrow(TagWriteError)
    expect(() => write(f, { metadata: { title: 'x' } }, { version: 3 })).toThrow(/version is an ID3 option/)
    expect(() => write(mp3(), { mp4: { userData: [] } })).toThrow(/only be written into an MP4 file/)
    // padding means the same thing for both
    expect(read(write(f, { metadata: { title: 'x' } }, { padding: 64 }).bytes).metadata.title).toBe('x')
  })

  it('reads and writes large Blobs of either format without loading the audio', async () => {
    for (const [bytes, format] of [
      [concat([m4a({ items: sampleItems(), free: 64 }), new Uint8Array([0, 0, 0, 8, 0x66, 0x72, 0x65, 0x65]), big().subarray(8)]), 'mp4'],
      [concat([mp3(), big()]), 'mpeg'],
    ] as const) {
      const blob = new Blob([bytes as Uint8Array<ArrayBuffer>])
      const out = await writeToBlob(blob, { metadata: { album: 'Blob album' } })
      const r = await readFromBlob(out)
      expect(r.format).toBe(format)
      expect(r.metadata.album).toBe('Blob album')
      expect(read(await blobBytes(out)).metadata.album).toBe('Blob album')
    }
  })

  it('throws UnknownFormatError for data that is no audio format, and never changes it', async () => {
    const v1 = serializeID3v1({ version: '1.1', title: 'bare', artist: '', album: '', year: '', comment: '', genre: 255 })
    const unknown = [
      Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, ...new Array(100).fill(0)]), // JPEG
      Uint8Array.from([0x89, 0x50, 0x4e, 0x47, ...new Array(100).fill(0)]), // PNG
      new TextEncoder().encode('plain text, not audio'),
      new Uint8Array(0),
      v1, // a bare ID3v1 tag: no audio around it
    ]
    for (const data of unknown) {
      expect(() => read(data)).toThrow(UnknownFormatError)
      expect(() => write(data, { metadata: { title: 'x' } })).toThrow(/unknown audio format/)
      await expect(writeToBlob(new Blob([data as Uint8Array<ArrayBuffer>]), { metadata: { title: 'x' } })).rejects.toMatchObject({ code: 'format-unknown' })
    }
    // bare tags still work through the ID3 functions
    expect(readID3File(v1).metadata.title).toBe('bare')
    expect(readID3File(writeID3File(new Uint8Array(0), { metadata: { title: 'new' } }).bytes).metadata.title).toBe('new')
  })
})
