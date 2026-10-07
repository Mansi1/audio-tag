import type { MajorVersion } from '../core/encoding.js'
import type { Warning } from '../core/errors.js'
import { TagWriteError } from '../core/errors.js'
import { type FileLayout, type LocateOptions, type WriteTagsOptions, type WriteTagsResult, readTags, writeTags } from '../file/layout.js'
import type { ID3v1Tag } from '../id3v1/id3v1.js'
import { convertID3v2, id3v1FromID3v2, id3v2FromID3v1 } from '../id3v2/convert.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import type { Lyrics3Tag } from '../lyrics3/lyrics3.js'
import { type AudioFormat, detectFormat } from '../file/detect.js'
import { applyMetadata } from '../id3v2/mapping.js'
import { type Metadata, type MetadataUpdate, getMetadata } from '../metadata/metadata.js'

export interface ID3ReadResult {
  /** Container format, from the file's first bytes. */
  format: AudioFormat
  /** The effective ID3v2 tag (all ID3v2 tags in the file merged per v2.4 structure §5). */
  id3v2?: ID3v2Tag
  id3v1?: ID3v1Tag
  lyrics3?: Lyrics3Tag
  /** Friendly view: ID3v2 first, then Lyrics3, then ID3v1. */
  metadata: Metadata
  layout: FileLayout
  warnings: Warning[]
}

/**
 * Reads the ID3 tags (ID3v2, ID3v1, Lyrics3) of an audio file or a bare tag. Other containers get
 * a "format-not-id3" warning; use detectFormat() first, and readMP4File() for MP4/M4A files.
 */
export function readID3File(data: Uint8Array, options: LocateOptions = {}): ID3ReadResult {
  const r = readTags(data, options)
  const out: ID3ReadResult = { format: r.format, metadata: getMetadata(r.id3v2, r.id3v1, r.lyrics3), layout: r.layout, warnings: r.warnings }
  if (r.id3v2) out.id3v2 = r.id3v2
  if (r.id3v1) out.id3v1 = r.id3v1
  if (r.lyrics3) out.lyrics3 = r.lyrics3
  return out
}

export interface ID3WriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the ID3v2 tag entirely (null removes it). Applied before `metadata`. */
  id3v2?: ID3v2Tag | null
  id3v1?: ID3v1Tag | null
  lyrics3?: Lyrics3Tag | null
}

export interface ID3WriteOptions extends WriteTagsOptions {
  /** ID3v2 version to write. Default: the file's version, or 4 for a new tag. */
  version?: MajorVersion
  /**
   * ID3v1: 'keep' (default) updates an existing ID3v1 tag from the new ID3v2 values, 'always'
   * also adds one when missing, 'never' leaves the ID3v1 tag untouched.
   */
  id3v1?: 'keep' | 'always' | 'never'
}

export const MP4_NOT_ID3 = 'This is an MP4/M4A file, which has no ID3 tags; check the format with detectFormat() and use writeMP4File() or write() for MP4 files'

/**
 * Writes ID3 tags into a file and returns the new file bytes (the input is not modified). MP4/M4A
 * files are refused: use detectFormat() first, and writeMP4File() for them.
 */
export function writeID3File(data: Uint8Array, input: ID3WriteInput, options: ID3WriteOptions = {}): WriteTagsResult {
  if (detectFormat(data) === 'mp4') {
    throw new TagWriteError('format-mp4', MP4_NOT_ID3)
  }
  const current = readTags(data, options.locate)
  let tag = input.id3v2 === null ? undefined : (input.id3v2 ?? current.id3v2)
  const version = options.version ?? tag?.version.major ?? 4
  // A file with only ID3v1 gets an ID3v2 tag that starts from the ID3v1 values.
  if (!tag && input.id3v2 === undefined && input.metadata && current.id3v1) tag = id3v2FromID3v1(current.id3v1, version)
  const warnings: Warning[] = []
  if (tag && tag.version.major !== version) {
    const c = convertID3v2(tag, version)
    tag = c.tag
    warnings.push(...c.warnings)
  }
  if (input.metadata) tag = applyMetadata(tag, input.metadata, version)

  const tags: Parameters<typeof writeTags>[1] = {}
  if (input.id3v2 === null && !input.metadata) tags.id3v2 = null
  else if (tag && (input.id3v2 !== undefined || input.metadata || version !== current.id3v2?.version.major)) {
    tags.id3v2 = tag.frames.length ? tag : null
  }
  if (input.id3v1 !== undefined) tags.id3v1 = input.id3v1
  else {
    const mode = options.id3v1 ?? 'keep'
    if (tag && tags.id3v2 && (mode === 'always' || (mode === 'keep' && current.id3v1))) {
      tags.id3v1 = mergeID3v1(current.id3v1, id3v1FromID3v2(tag), input.metadata ?? {})
    }
  }
  if (input.lyrics3 !== undefined) tags.lyrics3 = input.lyrics3
  const r = writeTags(data, tags, options)
  return { ...r, warnings: [...warnings, ...r.warnings] }
}

/**
 * ID3v1 values derived from ID3v2 win; fields ID3v2 does not provide keep their old value, unless
 * the matching metadata field was removed (set to null).
 */
function mergeID3v1(old: ID3v1Tag | undefined, derived: ID3v1Tag, metadata: NonNullable<ID3WriteInput['metadata']>): ID3v1Tag {
  if (!old) return derived
  const removed = (k: keyof Metadata) => metadata[k] === null
  const pick = (d: string, o: string, k: keyof Metadata) => d || (removed(k) ? '' : o)
  const track = derived.track ?? (removed('track') ? undefined : old.track)
  const out: ID3v1Tag = {
    version: track ? '1.1' : '1.0',
    title: pick(derived.title, old.title, 'title'),
    artist: pick(derived.artist, old.artist, 'artist'),
    album: pick(derived.album, old.album, 'album'),
    year: pick(derived.year, old.year, 'recordingTime'),
    comment: pick(derived.comment, old.comment, 'comments'),
    genre: derived.genre !== 255 || removed('genre') ? derived.genre : old.genre,
  }
  if (track) out.track = track
  return out
}
