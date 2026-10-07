import { describe, expect, it } from 'vitest'
import { getID3v1Metadata } from '../src/id3v1/mapping'
import { getID3v2Metadata } from '../src/id3v2/mapping'
import { createFrame, createTag } from '../src/id3v2/tag'
import { getLyrics3Metadata } from '../src/lyrics3/mapping'
import { getMetadata } from '../src/metadata/metadata'
import type { ID3v1Tag } from '../src/id3v1/id3v1'

const v1: ID3v1Tag = { version: '1.1', title: 'v1 title', artist: 'v1 artist', album: '', year: '1999', comment: 'c', track: 3, genre: 17 }

describe('per-format metadata mapping', () => {
  it('maps an ID3v1 tag, leaving out empty fields', () => {
    expect(getID3v1Metadata(v1)).toEqual({
      title: 'v1 title',
      artist: ['v1 artist'],
      recordingTime: '1999',
      comments: [{ language: 'XXX', description: '', text: 'c' }],
      track: { no: 3 },
      genre: ['Rock'],
    })
    expect(getID3v1Metadata({ ...v1, title: '', artist: '', year: '', comment: '', genre: 255 }).genre).toBeUndefined()
  })

  it('maps a Lyrics3 tag, resolving extended fields against ID3v1', () => {
    expect(getLyrics3Metadata({ version: 1, lyrics: 'la la' })).toEqual({ lyrics: [{ language: 'XXX', description: 'Lyrics3', text: 'la la' }] })
    const v2 = { version: 2 as const, fields: [{ id: 'ETT', value: 'v1 title extended' }, { id: 'EAL', value: 'Album' }] }
    expect(getLyrics3Metadata(v2)).toEqual({ title: 'v1 title extended', album: 'Album' })
    expect(getLyrics3Metadata(v2, v1).artist).toEqual(['v1 artist'])
  })

  it('maps an ID3v2 tag on its own', () => {
    const tag = createTag(4, [createFrame('text', 'TIT2', { encoding: 3, values: ['v2 title'] })])
    expect(getID3v2Metadata(tag)).toEqual({ title: 'v2 title' })
  })

  it('getMetadata merges by precedence: ID3v2, Lyrics3, ID3v1', () => {
    const tag = createTag(4, [createFrame('text', 'TIT2', { encoding: 3, values: ['v2 title'] })])
    const id3v1 = { ...v1, artist: 'A'.repeat(30) }
    const ly = {
      version: 2 as const,
      fields: [
        { id: 'EAR', value: `${'A'.repeat(30)} extended` },
        // first 30 chars differ from the (empty) ID3v1 album: ignored per Lyrics3v2.txt
        { id: 'EAL', value: 'Mismatched album' },
        { id: 'LYR', value: 'words' },
      ],
    }
    const m = getMetadata(tag, id3v1, ly)
    expect(m.title).toBe('v2 title')
    expect(m.artist).toEqual([`${'A'.repeat(30)} extended`])
    expect(m.album).toBeUndefined()
    expect(m.lyrics?.[0]?.text).toBe('words')
    expect(m.track).toEqual({ no: 3 })
  })
})
