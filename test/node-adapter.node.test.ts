import { mkdtemp, readFile as fsRead, rm, stat, writeFile as fsWrite } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { concat, equalBytes } from '../src/core/bytes'
import { readID3File } from '../src/index'
import { readFile, readID3FromFile, readMP4FromFile, removeID3FromFile, writeFile, writeID3ToFile, writeMP4ToFile } from '../src/node'
import { createFrame, createTag } from '../src/id3v2/tag'
import { writeID3v2 } from '../src/id3v2/writer'

let dir: string
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'audio-tag-'))
})
afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

const audio = new Uint8Array(2 * 1024 * 1024).map((_, i) => (i * 7) & 0xff)
const tagBytes = writeID3v2(createTag(4, [createFrame('text', 'TIT2', { encoding: 0, values: ['a'] })]), { padding: 512 }).bytes

describe('Node adapter (task 21)', () => {
  it('writes in place when the tag fits, keeping the inode', async () => {
    const p = join(dir, 'a.mp3')
    await fsWrite(p, concat([tagBytes, audio]))
    const before = await stat(p)
    const r = await writeID3ToFile(p, { metadata: { title: 'b' } })
    expect(r.inPlace).toBe(true)
    const after = await stat(p)
    expect(after.ino).toBe(before.ino)
    expect(after.size).toBe(before.size)
    expect((await readID3FromFile(p)).metadata.title).toBe('b')
  })

  it('rewrites through a temporary file when the tag grows', async () => {
    const p = join(dir, 'b.mp3')
    await fsWrite(p, concat([tagBytes, audio]))
    const r = await writeID3ToFile(p, { metadata: { title: 'x'.repeat(4000) } })
    expect(r.inPlace).toBe(false)
    const bytes = new Uint8Array(await fsRead(p))
    const l = readID3File(bytes).layout
    expect(equalBytes(bytes.subarray(l.audio.start, l.audio.end), audio)).toBe(true)
    expect((await readID3FromFile(p)).metadata.title).toHaveLength(4000)
  })

  it('removes tags', async () => {
    const p = join(dir, 'c.mp3')
    await fsWrite(p, concat([tagBytes, audio]))
    await removeID3FromFile(p)
    expect(equalBytes(new Uint8Array(await fsRead(p)), audio)).toBe(true)
  })
})

describe('Node adapter with MP4 (task 29)', () => {
  it('writes in place when the change fits the free atom, and rewrites otherwise', async () => {
    const { m4a, sampleItems, chunksIntact } = await import('./mp4-helpers')
    const p = join(dir, 'song.m4a')
    const big = new Uint8Array(2 * 1024 * 1024)
    await fsWrite(p, concat([m4a({ items: sampleItems(), free: 4096 }), Uint8Array.from([0, 0, 0, 8, 0x66, 0x72, 0x65, 0x65]), big.subarray(8)]))
    const before = await stat(p)
    expect((await writeMP4ToFile(p, { metadata: { title: 'short' } })).inPlace).toBe(true)
    expect((await stat(p)).ino).toBe(before.ino)
    expect((await readMP4FromFile(p)).metadata.title).toBe('short')
    expect((await writeMP4ToFile(p, { metadata: { lyrics: [{ language: 'XXX', description: '', text: 'z'.repeat(10000) }] } })).inPlace).toBe(false)
    const bytes = new Uint8Array(await fsRead(p))
    expect(chunksIntact(bytes)).toBe(true)
    expect((await readMP4FromFile(p)).metadata.lyrics?.[0]?.text).toHaveLength(10000)
    // the combined functions pick MP4 by themselves
    expect((await writeFile(p, { metadata: { album: 'any' } })).inPlace).toBe(true)
    const any = await readFile(p)
    expect(any.format).toBe('mp4')
    expect(any.metadata.album).toBe('any')
    const after = new Uint8Array(await fsRead(p))
    // the ID3 functions leave the file alone
    await expect(writeID3ToFile(p, { metadata: { title: 'x' } })).rejects.toThrow(/detectFormat/)
    expect((await fsRead(p)).equals(after)).toBe(true) // toEqual walks a 2 MB array element by element for seconds
  })
})
