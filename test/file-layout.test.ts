import { describe, expect, it } from 'vitest'
import { concat, equalBytes } from '../src/core/bytes'
import { serializeID3v1 } from '../src/id3v1/id3v1'
import { locateTags, mergeTags, readTags, stripTags, writeTags } from '../src/file/layout'
import type { FrameOf } from '../src/id3v2/frames/types'
import { type ID3v2Tag, createFrame, createTag } from '../src/id3v2/tag'
import { writeID3v2 } from '../src/id3v2/writer'
import { serializeLyrics3 } from '../src/lyrics3/lyrics3'

// "Audio" made of $FF bytes, so any false-sync problem at a tag boundary shows up.
const audio = new Uint8Array(5000).fill(0xff)
audio[0] = 0xff
audio[1] = 0xfb

const title = (s: string, major: 2 | 3 | 4 = 4) => createFrame('text', major === 2 ? 'TT2' : 'TIT2', { encoding: 0, values: [s] }, major)
const tagWith = (...frames: ReturnType<typeof title>[]) => createTag(4, frames)
const titleOf = (t: ID3v2Tag | undefined) => (t?.frames.find((f) => f.id === 'TIT2') as FrameOf<'text'> | undefined)?.values[0]

describe('locating tags (task 17)', () => {
  it('prepended tag only', () => {
    const file = concat([writeID3v2(tagWith(title('a'))).bytes, audio])
    const l = locateTags(file)
    expect(l.id3v2).toHaveLength(1)
    expect(l.audio).toEqual({ start: file.length - audio.length, end: file.length })
  })

  it('appended v2.4 tag with footer, plus ID3v1', () => {
    const t = tagWith(title('end'))
    t.flags.footer = true
    const file = concat([audio, writeID3v2(t).bytes, serializeID3v1({ title: 'v1' })])
    const r = readTags(file)
    expect(r.layout.id3v2[0]!.position).toBe('appended')
    expect(titleOf(r.id3v2)).toBe('end')
    expect(r.id3v1?.title).toBe('v1')
    expect(r.layout.audio).toEqual({ start: 0, end: audio.length })
  })

  it('Lyrics3 v1 and v2 between the audio and ID3v1', () => {
    for (const ly of [
      { version: 1 as const, lyrics: '[00:01]la la' },
      { version: 2 as const, fields: [{ id: 'LYR', value: 'la la' }] },
    ]) {
      const file = concat([audio, serializeLyrics3(ly), serializeID3v1({ title: 'v1' })])
      const r = readTags(file)
      expect(r.lyrics3).toEqual(ly)
      expect(r.layout.audio.end).toBe(audio.length)
    }
  })

  it('two stacked prepended tags: the second replaces the first, unless it is an update', () => {
    const first = writeID3v2(tagWith(title('old'), createFrame('text', 'TALB', { encoding: 0, values: ['album'] }))).bytes
    const plain = writeID3v2(tagWith(title('new'))).bytes
    const r1 = readTags(concat([first, plain, audio]))
    expect(r1.layout.id3v2).toHaveLength(2)
    expect(r1.id3v2!.frames.map((f) => f.id)).toEqual(['TIT2'])

    const upd = tagWith(title('new'))
    upd.extendedHeader = { version: 4, isUpdate: true }
    const r2 = readTags(concat([first, writeID3v2(upd).bytes, audio]))
    expect(r2.id3v2!.frames.map((f) => f.id).sort()).toEqual(['TALB', 'TIT2'])
    expect(titleOf(r2.id3v2)).toBe('new')
  })

  it('mergeTags keeps keyed frames with other keys', () => {
    const c = (d: string, t: string) => createFrame('comment', 'COMM', { encoding: 0, language: 'eng', description: d, text: t })
    const a = createTag(4, [c('', 'x'), c('k', 'y')])
    const b = createTag(4, [c('k', 'z')])
    b.extendedHeader = { version: 4, isUpdate: true }
    expect(mergeTags([a, b])!.frames.map((f) => (f as FrameOf<'comment'>).text)).toEqual(['x', 'z'])
  })
})

describe('writing tags into files (task 17)', () => {
  const base = concat([writeID3v2(tagWith(title('a')), { padding: 200 }).bytes, audio, serializeID3v1({ title: 'v1' })])

  it('rewrites in place when the new tag fits', () => {
    const r = writeTags(base, { id3v2: tagWith(title('b')) })
    expect(r.inPlace).toBe(true)
    expect(r.bytes.length).toBe(base.length)
    expect(titleOf(readTags(r.bytes).id3v2)).toBe('b')
  })

  it('grows the file when the tag does not fit, keeping the audio intact', () => {
    const r = writeTags(base, { id3v2: tagWith(title('x'.repeat(1000))) })
    expect(r.inPlace).toBe(false)
    const l = locateTags(r.bytes)
    expect(equalBytes(r.bytes.subarray(l.audio.start, l.audio.end), audio)).toBe(true)
    expect(readTags(r.bytes).id3v1?.title).toBe('v1')
  })

  it('appends a v2.4 tag with a footer before Lyrics3 and ID3v1', () => {
    const withLyrics = writeTags(base, { lyrics3: { version: 2, fields: [{ id: 'LYR', value: 'x' }] } }).bytes
    const r = writeTags(withLyrics, { id3v2: tagWith(title('end')) }, { id3v2Location: 'append' })
    const l = locateTags(r.bytes)
    expect(l.id3v2.map((t) => t.position)).toEqual(['appended'])
    expect(l.id3v2[0]!.tag.flags.footer).toBe(true)
    expect(l.id3v2[0]!.end).toBe(l.lyrics3!.start)
    expect(equalBytes(r.bytes.subarray(l.audio.start, l.audio.end), audio)).toBe(true)
  })

  it("'both': prepended tag with SEEK plus an appended update tag (§5 option 2)", () => {
    const t = tagWith(title('t'))
    t.frames.push(createFrame('picture', 'APIC', { encoding: 0, mimeType: 'image/png', pictureType: 3, description: '', data: new Uint8Array(100) }))
    const r = writeTags(base, { id3v2: t }, { id3v2Location: 'both' })
    const l = locateTags(r.bytes)
    expect(l.id3v2.map((x) => x.position)).toEqual(['prepended', 'appended'])
    expect(l.id3v2[0]!.tag.frames.map((f) => f.id)).toEqual(['TIT2', 'SEEK'])
    const merged = readTags(r.bytes).id3v2!
    expect(merged.frames.map((f) => f.id).sort()).toEqual(['APIC', 'SEEK', 'TIT2'])
    expect(equalBytes(r.bytes.subarray(l.audio.start, l.audio.end), audio)).toBe(true)
  })

  it('refuses to append v2.3 tags and Lyrics3 without ID3v1', () => {
    expect(() => writeTags(audio, { id3v2: createTag(3, [title('a', 3)]) }, { id3v2Location: 'append' })).toThrow(/footer/)
    expect(() => writeTags(audio, { lyrics3: { version: 1, lyrics: 'x' } })).toThrow(/ID3v1/)
  })

  it('stripping and writing leaves the audio bytes unchanged', () => {
    const stripped = stripTags(base)
    expect(equalBytes(stripped, audio)).toBe(true)
    const again = writeTags(stripped, { id3v2: tagWith(title('z')), id3v1: { title: 'q', artist: '', album: '', year: '', comment: '', genre: 255, version: '1.0' } }).bytes
    const l = locateTags(again)
    expect(equalBytes(again.subarray(l.audio.start, l.audio.end), audio)).toBe(true)
    expect(stripTags(again)).toEqual(audio)
  })

  it('writing nothing changes nothing', () => {
    expect(writeTags(base, {}).bytes).toEqual(base)
    expect(writeTags(base, { id3v2: readTags(base).id3v2! }).bytes).toEqual(base)
  })
})
