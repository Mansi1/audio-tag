// The friendly Metadata view shared by every tag format. Each format maps its own tags to and from
// it (id3v2/mapping.ts, id3v1/mapping.ts, lyrics3/mapping.ts, mp4/mapping.ts); this module only
// defines the view and merges the ID3-family views by precedence.
import type { ID3v1Tag } from '../id3v1/id3v1.js'
import { getID3v1Metadata } from '../id3v1/mapping.js'
import { parseTimestamp } from '../id3v2/frames/text-helpers.js'
import { getID3v2Metadata } from '../id3v2/mapping.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import type { Lyrics3Tag } from '../lyrics3/lyrics3.js'
import { getLyrics3Metadata } from '../lyrics3/mapping.js'

export interface Picture {
  /** APIC picture type, see PICTURE_TYPES. 3 = front cover. */
  type: number
  mimeType: string
  description: string
  data: Uint8Array
}

export interface Metadata {
  title?: string
  subtitle?: string
  grouping?: string
  artist?: string[]
  albumArtist?: string
  album?: string
  setSubtitle?: string
  composer?: string[]
  lyricist?: string[]
  conductor?: string
  remixer?: string
  publisher?: string
  copyright?: string
  encodedBy?: string
  encoderSettings?: string
  isrc?: string
  language?: string[]
  mood?: string
  key?: string
  bpm?: number
  /** Length in milliseconds (TLEN). */
  length?: number
  track?: { no?: number; of?: number }
  disc?: { no?: number; of?: number }
  /** Genre names; ID3v1 numbers are resolved to names. */
  genre?: string[]
  /** ISO-8601 subset (v2.4 structure §4); "yyyy" etc. */
  recordingTime?: string
  releaseTime?: string
  originalReleaseTime?: string
  encodingTime?: string
  taggingTime?: string
  comments?: { language: string; description: string; text: string }[]
  lyrics?: { language: string; description: string; text: string }[]
  pictures?: Picture[]
  ratings?: { email: string; rating: number; counter?: bigint }[]
  playCount?: bigint
  compilation?: boolean
  sort?: { title?: string; artist?: string; album?: string; albumArtist?: string; composer?: string }
  /** TXXX values by description. */
  userText?: Record<string, string>
  /** WXXX URLs by description. */
  userUrls?: Record<string, string>
}

/** Fields to change in a write: undefined leaves a field alone, null removes it. */
export type MetadataUpdate = { [K in keyof Metadata]?: Metadata[K] | null }

/** Friendly view of an ID3v2 tag, with ID3v1 and Lyrics3 as fallbacks (in that order of precedence: ID3v2, Lyrics3, ID3v1). */
export function getMetadata(tag?: ID3v2Tag, id3v1?: ID3v1Tag, lyrics3?: Lyrics3Tag): Metadata {
  const m: Metadata = tag ? getID3v2Metadata(tag) : {}
  // Lyrics3, then ID3v1, fill what ID3v2 did not provide.
  if (lyrics3) fill(m, getLyrics3Metadata(lyrics3, id3v1))
  if (id3v1) fill(m, getID3v1Metadata(id3v1))
  return m
}

function fill(m: Metadata, from: Metadata): void {
  const out = m as Record<string, unknown>
  for (const [k, v] of Object.entries(from)) if (out[k] === undefined || out[k] === '') out[k] = v
}

/** The year of the recording time, if any. */
export function yearOf(m: Metadata): number | undefined {
  const t = m.recordingTime ? parseTimestamp(m.recordingTime) : undefined
  return t?.year
}
