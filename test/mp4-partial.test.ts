import { describe, expect, it } from 'vitest'
import { blobBytes, readID3FromBlob, readMP4FromBlob, writeMP4ToBlob, writeID3ToBlob } from '../src/browser'
import { concat } from '../src/core/bytes'
import type { RandomAccess } from '../src/file/partial-id3'
import { readID3RandomAccess } from '../src/file/partial-id3'
import { readMP4RandomAccess } from '../src/file/partial-mp4'
import { readMP4File } from '../src/index'
import { box, chunksIntact, m4a, sampleItems } from './mp4-helpers'

const big = () => box('free', new Uint8Array(20 * 1024 * 1024))

function counting(file: Uint8Array): { src: RandomAccess; read: () => number } {
  let n = 0
  return {
    src: { size: file.length, read: async (o, len) => ((n += len), file.subarray(o, o + len)) },
    read: () => n,
  }
}

describe('MP4 partial I/O (task 29)', () => {
  it('reads a large file touching only the atom headers and moov', async () => {
    for (const file of [concat([m4a({ items: sampleItems() }), big()]), m4a({ items: sampleItems(), moovAtEnd: true, extraTopLevel: [big()] })]) {
      const c = counting(file)
      const r = await readMP4RandomAccess(c.src)
      expect(r.format).toBe('mp4')
      expect(r.metadata.title).toBe("Baby Boy (Maurice's Nu Soul Mix)")
      expect(c.read()).toBeLessThan(64 * 1024)
    }
  })

  it('writes through Blob segments without copying the media', async () => {
    const file = concat([m4a({ items: sampleItems(), free: 64 }), big()])
    const blob = new Blob([file as Uint8Array<ArrayBuffer>], { type: 'audio/mp4' })
    expect((await readMP4FromBlob(blob)).metadata.album).toBe('Baby Boy')
    const out = await writeMP4ToBlob(blob, { metadata: { title: 'x'.repeat(3000), album: 'New album' } })
    expect(out.type).toBe('audio/mp4')
    const bytes = await blobBytes(out)
    const r = readMP4File(bytes)
    expect(r.metadata.title).toHaveLength(3000)
    expect(r.metadata.album).toBe('New album')
    expect(chunksIntact(bytes)).toBe(true)
  })

  it('the ID3 functions refuse large MP4 files instead of prepending a tag', async () => {
    const file = concat([m4a({ items: sampleItems() }), big()])
    const r = await readID3RandomAccess(counting(file).src)
    expect(r.format).toBe('mp4')
    expect(r.warnings.map((w) => w.code)).toContain('format-not-id3')
    expect(r.layout.audio).toEqual({ start: 0, end: file.length })
    const blob = new Blob([file as Uint8Array<ArrayBuffer>])
    await expect(writeID3ToBlob(blob, { metadata: { title: 'x' } })).rejects.toThrow(/detectFormat/)
    await expect(readID3FromBlob(blob)).resolves.toMatchObject({ format: 'mp4' })
  })
})
