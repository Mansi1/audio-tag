// ID3v1 -> the friendly Metadata view (writing goes through ID3v2, see id3v1FromID3v2).
import type { Metadata } from '../metadata/metadata.js'
import { genreName } from './genres.js'
import type { ID3v1Tag } from './id3v1.js'

/** Friendly view of an ID3v1 tag; empty fields are left out. */
export function getID3v1Metadata(id3v1: ID3v1Tag): Metadata {
  const m: Metadata = {}
  if (id3v1.title) m.title = id3v1.title
  if (id3v1.artist) m.artist = [id3v1.artist]
  if (id3v1.album) m.album = id3v1.album
  if (/^[0-9]{4}$/.test(id3v1.year)) m.recordingTime = id3v1.year
  if (id3v1.comment) m.comments = [{ language: 'XXX', description: '', text: id3v1.comment }]
  if (id3v1.track) m.track = { no: id3v1.track }
  const genre = id3v1.genre !== 255 ? genreName(id3v1.genre) : undefined
  if (genre) m.genre = [genre]
  return m
}
