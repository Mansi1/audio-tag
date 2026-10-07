// Lyrics3 -> the friendly Metadata view (read only; Lyrics3 is written as a whole tag).
import type { ID3v1Tag } from '../id3v1/id3v1.js'
import type { Metadata } from '../metadata/metadata.js'
import { type Lyrics3Tag, getLyrics3Field, resolveExtendedFields } from './lyrics3.js'

/**
 * Friendly view of a Lyrics3 tag: the v2 extended title/artist/album fields and the lyrics. With
 * the file's ID3v1 tag, the extended fields are resolved against it (they extend its 30-byte fields).
 */
export function getLyrics3Metadata(lyrics3: Lyrics3Tag, id3v1?: ID3v1Tag): Metadata {
  const m: Metadata = {}
  if (lyrics3.version === 2) {
    const ext = id3v1
      ? resolveExtendedFields(lyrics3, id3v1)
      : { title: getLyrics3Field(lyrics3, 'ETT'), artist: getLyrics3Field(lyrics3, 'EAR'), album: getLyrics3Field(lyrics3, 'EAL') }
    if (ext.title) m.title = ext.title
    if (ext.artist) m.artist = [ext.artist]
    if (ext.album) m.album = ext.album
  }
  const text = lyrics3.version === 1 ? lyrics3.lyrics : getLyrics3Field(lyrics3, 'LYR')
  if (text) m.lyrics = [{ language: 'XXX', description: 'Lyrics3', text }]
  return m
}
