import { describe, expect, it } from 'vitest'
import { GENRES, genreId, genreName } from '../src/id3v1/genres'
import { hasID3v1, parseID3v1, serializeID3v1 } from '../src/id3v1/id3v1'

describe('genres', () => {
  it('has 0-147 with sources', () => {
    expect(GENRES).toHaveLength(148)
    expect(genreName(0)).toBe('Blues')
    expect(genreName(79)).toBe('Hard Rock')
    expect(genreName(80)).toBe('Folk')
    expect(genreName(125)).toBe('Dance Hall')
    expect(genreName(147)).toBe('Synthpop')
    expect(genreName(148)).toBeUndefined()
    expect(GENRES[79]!.source).toBe('id3v1')
    expect(GENRES[125]!.source).toBe('winamp-v2.3-appendix')
    expect(GENRES[126]!.source).toBe('winamp-test-suite')
  })
  it('looks up names case-insensitively, including the v2.3 spelling', () => {
    expect(genreId('hip-hop')).toBe(7)
    expect(genreId('Psychadelic')).toBe(67)
  })
})

describe('ID3v1 serialisation', () => {
  it('writes v1.1 when a track is set', () => {
    const bytes = serializeID3v1({ title: 'T', comment: 'c', track: 12, genre: 7 })
    expect(bytes[125]).toBe(0)
    expect(bytes[126]).toBe(12)
    const r = parseID3v1(bytes)!
    expect(r.tag).toMatchObject({ version: '1.1', title: 'T', comment: 'c', track: 12, genre: 7 })
  })
  it('writes v1.0 with a 30-byte comment when there is no track', () => {
    const r = parseID3v1(serializeID3v1({ comment: 'x'.repeat(30), year: '1999' }))!
    expect(r.tag.version).toBe('1.0')
    expect(r.tag.comment).toHaveLength(30)
  })
  it('truncates long fields, or throws in strict mode', () => {
    expect(parseID3v1(serializeID3v1({ title: 'a'.repeat(40) }))!.tag.title).toHaveLength(30)
    expect(() => serializeID3v1({ title: 'a'.repeat(40) }, { strict: true })).toThrow()
  })
  it('detects a tag at the end of a file', () => {
    const file = new Uint8Array(1000)
    file.set(serializeID3v1({ title: 'x' }), 872)
    expect(hasID3v1(file)).toBe(true)
    expect(parseID3v1(file)!.tag.title).toBe('x')
  })
})
