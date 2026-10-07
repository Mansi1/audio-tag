import { jpegSize, pngSize } from '../id3v2/validate.js'
import { parsePosition } from '../id3v2/frames/text-helpers.js'
import type { Metadata, MetadataUpdate, Picture } from '../metadata/metadata.js'
import { type FLACPicture, FLACWriteError, type StreamInfo } from './blocks.js'
import type { FLACTags } from './file.js'
import type { VorbisField } from './vorbis.js'

// Field <-> Vorbis comment name mapping. Names are written as listed first
// (Picard's Vorbis column, spec/mp4/picard-tag-mapping.rst.md); the others are only read.

/** Single text fields. */
const STRING_FIELDS: Record<string, string[]> = {
  title: ['TITLE'],
  subtitle: ['SUBTITLE'],
  grouping: ['GROUPING'],
  albumArtist: ['ALBUMARTIST'],
  album: ['ALBUM'],
  setSubtitle: ['DISCSUBTITLE'],
  conductor: ['CONDUCTOR'],
  remixer: ['REMIXER'],
  publisher: ['LABEL', 'ORGANIZATION'],
  copyright: ['COPYRIGHT'],
  encodedBy: ['ENCODEDBY'],
  encoderSettings: ['ENCODERSETTINGS'],
  isrc: ['ISRC'],
  mood: ['MOOD'],
  key: ['KEY'],
  recordingTime: ['DATE'],
  releaseTime: ['RELEASEDATE'],
  originalReleaseTime: ['ORIGINALDATE'],
}

/** F2: repeated fields. */
const LIST_FIELDS: Record<string, string[]> = {
  artist: ['ARTIST'],
  composer: ['COMPOSER'],
  lyricist: ['LYRICIST'],
  language: ['LANGUAGE'],
  genre: ['GENRE'],
}

const SORT_FIELDS: Record<string, string> = { title: 'TITLESORT', artist: 'ARTISTSORT', album: 'ALBUMSORT', albumArtist: 'ALBUMARTISTSORT', composer: 'COMPOSERSORT' }

const POSITION_FIELDS = {
  track: { number: 'TRACKNUMBER', totals: ['TRACKTOTAL', 'TOTALTRACKS'] },
  disc: { number: 'DISCNUMBER', totals: ['DISCTOTAL', 'TOTALDISCS'] },
} as const

const TEXT_LISTS = { comments: ['COMMENT', 'DESCRIPTION'], lyrics: ['LYRICS'] } as const

/** F6: no Vorbis name; writing them is an error. */
const UNSUPPORTED = ['ratings', 'playCount', 'encodingTime', 'taggingTime', 'userUrls', 'length'] as const

/** F7: technical, never shown as userText and never removed. */
const CHANNEL_MASK = 'WAVEFORMATEXTENSIBLE_CHANNEL_MASK'

const MAPPED = new Set<string>([
  ...Object.values(STRING_FIELDS).flat(),
  ...Object.values(LIST_FIELDS).flat(),
  ...Object.values(SORT_FIELDS),
  ...Object.values(POSITION_FIELDS).flatMap((p) => [p.number, ...p.totals]),
  ...Object.values(TEXT_LISTS).flat(),
  'BPM',
  'COMPILATION',
  CHANNEL_MASK,
])

const upper = (s: string) => s.toUpperCase()

/** Values of the first name in `names` that the comment has (names compare case-insensitively, §8.6). */
function values(fields: readonly VorbisField[], names: readonly string[]): string[] {
  for (const n of names) {
    const v = fields.filter((f) => upper(f.name) === n).map((f) => f.value)
    if (v.length) return v
  }
  return []
}

/** Friendly metadata from FLAC tags; `length` comes from streaminfo. */
export function getFLACMetadata(tags: FLACTags, streamInfo?: StreamInfo): Metadata {
  const m: Metadata = {}
  const rec = m as Record<string, unknown>
  const fields = tags.vorbis?.fields ?? []
  for (const [field, names] of Object.entries(STRING_FIELDS)) {
    const v = values(fields, names).filter((s) => s !== '')
    if (v.length) rec[field] = v.join('; ')
  }
  for (const [field, names] of Object.entries(LIST_FIELDS)) {
    const v = values(fields, names).filter((s) => s !== '')
    if (v.length) rec[field] = v
  }
  const bpm = Number(values(fields, ['BPM'])[0])
  if (values(fields, ['BPM']).length && Number.isFinite(bpm)) m.bpm = bpm
  for (const [field, p] of Object.entries(POSITION_FIELDS)) {
    // F1: "n/m" in the number field is read too.
    const pos = parsePosition(values(fields, [p.number])[0] ?? '')
    const total = Number(values(fields, p.totals)[0])
    const of = Number.isInteger(total) && total > 0 ? total : pos.total
    if (pos.number !== undefined || of !== undefined) rec[field] = { ...(pos.number !== undefined ? { no: pos.number } : {}), ...(of !== undefined ? { of } : {}) }
  }
  for (const [field, names] of Object.entries(TEXT_LISTS)) {
    const v = values(fields, names)
    if (v.length) rec[field] = v.map((text) => ({ language: 'XXX', description: '', text }))
  }
  const cpil = values(fields, ['COMPILATION'])[0]
  if (cpil !== undefined) m.compilation = cpil === '1'
  const sort: NonNullable<Metadata['sort']> = {}
  for (const [field, name] of Object.entries(SORT_FIELDS)) {
    const v = values(fields, [name])[0]
    if (v) sort[field as keyof typeof sort] = v
  }
  if (Object.keys(sort).length) m.sort = sort
  const user: Record<string, string[]> = {}
  for (const f of fields) if (!MAPPED.has(upper(f.name))) (user[f.name] ??= []).push(f.value)
  if (Object.keys(user).length) m.userText = Object.fromEntries(Object.entries(user).map(([k, v]) => [k, v.join('; ')]))
  if (tags.pictures.length) m.pictures = tags.pictures.map((p) => ({ type: p.type, mimeType: p.mimeType, description: p.description, data: p.data }))
  if (streamInfo && streamInfo.sampleRate > 0 && streamInfo.totalSamples > 0) m.length = Math.round((streamInfo.totalSamples * 1000) / streamInfo.sampleRate)
  return m
}

/** F5: a picture block for a friendly picture; width and height from JPEG/PNG headers. */
function toFLACPicture(p: Picture): FLACPicture {
  const size = jpegSize(p.data) ?? pngSize(p.data)
  return { type: p.type, mimeType: p.mimeType, description: p.description, width: size?.width ?? 0, height: size?.height ?? 0, depth: 0, colors: 0, data: p.data }
}

/**
 * Applies metadata changes to FLAC tags. Fields set to undefined are left alone; null or an empty
 * array removes them. The input is not modified. A file without a comment block gets one.
 */
export function applyFLACMetadata(tags: FLACTags, metadata: MetadataUpdate): FLACTags {
  const has = (k: string) => Object.prototype.hasOwnProperty.call(metadata, k) && (metadata as Record<string, unknown>)[k] !== undefined
  const val = (k: string) => (metadata as Record<string, unknown>)[k]
  for (const f of UNSUPPORTED) {
    if (has(f) && val(f) !== null) throw new FLACWriteError('flac-unsupported-field', `"${f}" cannot be stored in FLAC metadata`)
  }
  const fields: VorbisField[] = (tags.vorbis?.fields ?? []).map((f) => ({ ...f }))
  // Remove every name the field is read from, then write the first one where the old ones were.
  const set = (names: readonly string[], vs: readonly string[] | null) => {
    const idx = fields.findIndex((f) => names.includes(upper(f.name)))
    const kept = fields.filter((f) => !names.includes(upper(f.name)))
    const add = (vs ?? []).map((value) => ({ name: names[0]!, value }))
    kept.splice(idx < 0 ? kept.length : Math.min(idx, kept.length), 0, ...add)
    fields.length = 0
    fields.push(...kept)
  }
  for (const [field, names] of Object.entries(STRING_FIELDS)) if (has(field)) set(names, val(field) === null ? null : [val(field) as string])
  for (const [field, names] of Object.entries(LIST_FIELDS)) if (has(field)) set(names, val(field) as string[] | null)
  if (has('bpm')) set(['BPM'], val('bpm') === null ? null : [String(Math.round(val('bpm') as number))])
  for (const [field, p] of Object.entries(POSITION_FIELDS)) {
    if (!has(field)) continue
    const v = val(field) as { no?: number; of?: number } | null
    set([p.number], v?.no === undefined ? null : [String(v.no)])
    set(p.totals, v?.of === undefined ? null : [String(v.of)])
  }
  for (const [field, names] of Object.entries(TEXT_LISTS)) {
    if (has(field)) set(names, ((val(field) as Metadata['comments'] | null) ?? []).map((c) => c.text))
  }
  if (has('compilation')) set(['COMPILATION'], val('compilation') === null ? null : [val('compilation') ? '1' : '0'])
  if (has('sort')) {
    const s = (val('sort') as Metadata['sort'] | null) ?? {}
    for (const [field, name] of Object.entries(SORT_FIELDS)) {
      const v = (s as Record<string, string | undefined>)[field]
      if (val('sort') === null || Object.prototype.hasOwnProperty.call(s, field)) set([name], v ? [v] : null)
    }
  }
  if (has('userText')) {
    const u = (val('userText') as Record<string, string> | null) ?? {}
    for (const k of Object.keys(u)) {
      if (MAPPED.has(upper(k))) throw new FLACWriteError('flac-user-field', `userText["${k}"] uses the name of a mapped field; set that field instead`)
    }
    const old = [...new Set(fields.filter((f) => !MAPPED.has(upper(f.name))).map((f) => upper(f.name)))]
    for (const n of old) set([n], null)
    for (const [k, v] of Object.entries(u)) set([upper(k)], [v])
  }
  let pictures = tags.pictures
  if (has('pictures')) {
    // Unchanged pictures keep their block fields (width, height, depth, colours).
    const old = [...tags.pictures]
    pictures = ((val('pictures') as Picture[] | null) ?? []).map((p) => {
      const i = old.findIndex((o) => o.type === p.type && o.mimeType === p.mimeType && o.description === p.description && o.data === p.data)
      return i >= 0 ? old.splice(i, 1)[0]! : toFLACPicture(p)
    })
  }
  // A file without a comment block only gets one when there is something to put in it.
  const out: FLACTags = { pictures }
  if (tags.vorbis || fields.length) out.vorbis = { vendor: tags.vorbis?.vendor ?? 'audio-tag', fields }
  return out
}
