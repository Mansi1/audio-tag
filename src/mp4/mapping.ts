import { genreName } from '../id3v1/genres.js'
import type { Metadata, MetadataUpdate, Picture } from '../metadata/metadata.js'
import { MP4WriteError } from './atoms.js'
import type { MP4Item, MP4Tags, QuickTimeItem } from './meta.js'
import { DataType, type MP4Value, decodePair, encodePair, imageMime, imageType, intValue, textValue, valueInt, valueText } from './values.js'

// Field <-> atom mapping. Sources: ExifTool ItemList, mutagen, and Picard's
// tag mapping (spec/mp4/picard-id3-mp4-mapping.md) for the freeform "----:com.apple.iTunes:*" names.

const FF = (name: string) => `----:com.apple.iTunes:${name}`

/** Single text fields: the atom written, then fallbacks that are only read. */
const STRING_FIELDS: Record<string, string[]> = {
  title: ['©nam'],
  albumArtist: ['aART'],
  album: ['©alb'],
  conductor: ['©con', FF('CONDUCTOR')],
  grouping: ['©grp'],
  subtitle: [FF('SUBTITLE'), '©st3'],
  remixer: [FF('REMIXER')],
  publisher: [FF('LABEL'), '©pub'],
  copyright: ['cprt'],
  encodedBy: ['©enc'],
  encoderSettings: ['©too'], // M1
  isrc: [FF('ISRC')],
  mood: [FF('MOOD')],
  key: [FF('initialkey')],
  setSubtitle: [FF('DISCSUBTITLE')],
  recordingTime: ['©day'],
  releaseTime: [FF('RELEASEDATE')],
}

const LIST_FIELDS: Record<string, string[]> = {
  artist: ['©ART'],
  composer: ['©wrt', '©com'],
  lyricist: [FF('LYRICIST')],
  language: [FF('LANGUAGE')],
}

const SORT_FIELDS: Record<string, string> = { title: 'sonm', artist: 'soar', album: 'soal', albumArtist: 'soaa', composer: 'soco' }

/** Fields that have no MP4 representation; writing them is an error. */
const UNSUPPORTED = ['ratings', 'playCount', 'length', 'encodingTime', 'taggingTime', 'originalReleaseTime'] as const

const ITUNES_NS = '----:com.apple.iTunes:'

/**
 * M8: userUrls are freeform items whose values use data type 15, "URL: absolute, in UTF-8
 * characters" (iTunes data types, spec/mp4/mutagen-mp4.md). That type is what tells them apart
 * from userText (type 1, UTF-8) when reading.
 */
function isUrlItem(it: MP4Item): boolean {
  return it.values.length > 0 && it.values.every((v) => v.type === DataType.URL)
}

function isUserItem(it: MP4Item): boolean {
  return it.key.startsWith(ITUNES_NS) && !MAPPED_KEYS.has(it.key)
}

const MAPPED_KEYS = new Set<string>([
  ...Object.values(STRING_FIELDS).flat(),
  ...Object.values(LIST_FIELDS).flat(),
  ...Object.values(SORT_FIELDS),
  '©gen', 'gnre', 'tmpo', 'trkn', 'disk', '©cmt', '©lyr', 'covr', 'cpil',
])

function texts(item: MP4Item | undefined): string[] {
  return (item?.values ?? []).map(valueText).filter((t): t is string => t !== undefined)
}

// QuickTime 'mdta' keys (QTFF QuickTime_metadata_keys.md) and udta text atoms (User_data_atoms.md),
// read with lower precedence (M6).
const QT_STRING: Record<string, string> = {
  'com.apple.quicktime.title': 'title',
  'com.apple.quicktime.album': 'album',
  'com.apple.quicktime.copyright': 'copyright',
  'com.apple.quicktime.publisher': 'publisher',
  'com.apple.quicktime.software': 'encoderSettings',
  'com.apple.quicktime.creationdate': 'recordingTime',
  'com.apple.quicktime.year': 'recordingTime',
}
const UDTA_STRING: Record<string, string> = { '©nam': 'title', '©cpy': 'copyright', '©day': 'recordingTime', '©snm': 'subtitle', '©swr': 'encoderSettings' }
const UDTA_LIST: Record<string, string> = { '©prf': 'artist', '©com': 'composer', '©wrt': 'lyricist' }

/** Friendly metadata from MP4 tags: iTunes items first, then QuickTime 'mdta', then udta text. */
export function getMP4Metadata(tags: MP4Tags): Metadata {
  const m: Metadata = {}
  const rec = m as Record<string, unknown>
  const items = new Map<string, MP4Item>()
  for (const it of tags.itunes?.items ?? []) if (!items.has(it.key)) items.set(it.key, it)

  for (const [field, keys] of Object.entries(STRING_FIELDS)) {
    for (const k of keys) {
      const v = texts(items.get(k))
      if (v.length) {
        rec[field] = v.join('; ')
        break
      }
    }
  }
  for (const [field, keys] of Object.entries(LIST_FIELDS)) {
    for (const k of keys) {
      const v = texts(items.get(k))
      if (v.length) {
        rec[field] = v
        break
      }
    }
  }
  const gen = texts(items.get('©gen'))
  if (gen.length) m.genre = gen
  else {
    // SPEC (de facto, M4): 'gnre' holds the ID3v1 genre index + 1.
    const g = items.get('gnre')?.values[0]
    const n = g ? valueInt(g) : undefined
    if (typeof n === 'number' && n >= 1 && genreName(n - 1)) m.genre = [genreName(n - 1)!]
  }
  const bpm = items.get('tmpo')?.values[0]
  if (bpm) {
    const n = valueInt(bpm)
    if (typeof n === 'number') m.bpm = n
  }
  for (const [field, key] of [
    ['track', 'trkn'],
    ['disc', 'disk'],
  ] as const) {
    const v = items.get(key)?.values[0]
    const p = v ? decodePair(v) : undefined
    if (p) m[field] = { no: p.no, ...(p.of ? { of: p.of } : {}) }
  }
  const cmt = texts(items.get('©cmt'))
  if (cmt.length) m.comments = cmt.map((text) => ({ language: 'XXX', description: '', text }))
  const lyr = texts(items.get('©lyr'))
  if (lyr.length) m.lyrics = lyr.map((text) => ({ language: 'XXX', description: '', text }))
  const covr = items.get('covr')
  if (covr) {
    const pics: Picture[] = covr.values
      .filter((v) => imageMime(v.type))
      .map((v) => ({ type: 3, mimeType: imageMime(v.type)!, description: '', data: v.data }))
    if (pics.length) m.pictures = pics
  }
  const cpil = items.get('cpil')?.values[0]
  if (cpil) m.compilation = valueInt(cpil) === 1
  const sort: NonNullable<Metadata['sort']> = {}
  for (const [field, key] of Object.entries(SORT_FIELDS)) {
    const v = texts(items.get(key))[0]
    if (v) sort[field as keyof typeof sort] = v
  }
  if (Object.keys(sort).length) m.sort = sort
  const user: Record<string, string> = {}
  const urls: Record<string, string> = {}
  for (const it of tags.itunes?.items ?? []) {
    if (!isUserItem(it)) continue
    const v = texts(it)
    if (!v.length) continue
    if (isUrlItem(it)) urls[it.key.slice(ITUNES_NS.length)] = v[0]!
    else user[it.key.slice(ITUNES_NS.length)] = v.join('; ')
  }
  if (Object.keys(user).length) m.userText = user
  if (Object.keys(urls).length) m.userUrls = urls

  // Lower precedence: QuickTime metadata, then user data text.
  for (const it of tags.quicktime?.items ?? []) applyQuickTimeItem(m, it)
  for (const t of tags.userData) {
    const text = t.entries[0]?.text
    if (!text) continue
    const f = UDTA_STRING[t.type]
    if (f && rec[f] === undefined) rec[f] = text
    const l = UDTA_LIST[t.type]
    if (l && rec[l] === undefined) rec[l] = t.entries.map((e) => e.text)
  }
  return m
}

function applyQuickTimeItem(m: Metadata, it: QuickTimeItem): void {
  const rec = m as Record<string, unknown>
  const text = it.values.map(valueText).find((t) => t !== undefined)
  const field = QT_STRING[it.key]
  if (field && text !== undefined && rec[field] === undefined) rec[field] = text
  if (it.key === 'com.apple.quicktime.artist' && text && !m.artist) m.artist = [text]
  if (it.key === 'com.apple.quicktime.genre' && text && !m.genre) m.genre = [text]
  if (it.key === 'com.apple.quicktime.comment' && text && !m.comments) m.comments = [{ language: 'XXX', description: '', text }]
  if (it.key === 'com.apple.quicktime.artwork' && !m.pictures) {
    const pics = it.values.filter((v) => imageMime(v.type)).map((v) => ({ type: 3, mimeType: imageMime(v.type)!, description: '', data: v.data }))
    if (pics.length) m.pictures = pics
  }
}

/**
 * Applies metadata changes to MP4 tags (iTunes items). Fields set to undefined are left alone;
 * null or an empty array removes them. The input is not modified.
 */
export function applyMP4Metadata(tags: MP4Tags, metadata: MetadataUpdate): MP4Tags {
  const has = (k: string) => Object.prototype.hasOwnProperty.call(metadata, k) && (metadata as Record<string, unknown>)[k] !== undefined
  const val = (k: string) => (metadata as Record<string, unknown>)[k]
  for (const f of UNSUPPORTED) {
    if (has(f) && val(f) !== null) throw new MP4WriteError('mp4-unsupported-field', `"${f}" cannot be stored in MP4 metadata`)
  }
  const items: MP4Item[] = (tags.itunes?.items ?? []).map((i) => ({ ...i, values: [...i.values] }))
  const set = (writeKey: string, readKeys: readonly string[], values: MP4Value[] | null) => {
    // remove every key the field is read from, then write the canonical one
    const idx = items.findIndex((i) => readKeys.includes(i.key))
    const kept = items.filter((i) => !readKeys.includes(i.key))
    if (values && values.length) {
      const item: MP4Item = { key: writeKey, values }
      kept.splice(idx < 0 ? kept.length : Math.min(idx, kept.length), 0, item)
    }
    items.length = 0
    items.push(...kept)
  }
  const text = (s: string) => textValue(s)

  for (const [field, keys] of Object.entries(STRING_FIELDS)) {
    if (has(field)) set(keys[0]!, keys, val(field) === null ? null : [text(val(field) as string)])
  }
  for (const [field, keys] of Object.entries(LIST_FIELDS)) {
    if (has(field)) set(keys[0]!, keys, val(field) === null ? null : (val(field) as string[]).map(text))
  }
  // M4: write genres as '©gen' text; 'gnre' is dropped when the genre is set.
  if (has('genre')) set('©gen', ['©gen', 'gnre'], val('genre') === null ? null : (val('genre') as string[]).map(text))
  if (has('bpm')) set('tmpo', ['tmpo'], val('bpm') === null ? null : [intValue(Math.round(val('bpm') as number), 2)])
  for (const [field, key] of [
    ['track', 'trkn'],
    ['disc', 'disk'],
  ] as const) {
    if (!has(field)) continue
    const p = val(field) as { no?: number; of?: number } | null
    set(key, [key], p === null || p.no === undefined ? null : [encodePair(p.no, p.of ?? 0, key)])
  }
  if (has('comments')) set('©cmt', ['©cmt'], ((val('comments') as Metadata['comments']) ?? []).map((c) => text(c.text)))
  if (has('lyrics')) set('©lyr', ['©lyr'], ((val('lyrics') as Metadata['lyrics']) ?? []).map((c) => text(c.text)))
  if (has('pictures')) {
    set('covr', ['covr'], ((val('pictures') as Picture[] | null) ?? []).map((p) => ({ type: imageType(p.mimeType), locale: 0, data: p.data })))
  }
  if (has('compilation')) set('cpil', ['cpil'], val('compilation') === null ? null : [intValue(val('compilation') ? 1 : 0, 1)])
  if (has('sort')) {
    const s = (val('sort') as Metadata['sort'] | null) ?? {}
    for (const [field, key] of Object.entries(SORT_FIELDS)) {
      const v = (s as Record<string, string | undefined>)[field]
      if (val('sort') === null || Object.prototype.hasOwnProperty.call(s, field)) set(key, [key], v ? [text(v)] : null)
    }
  }
  if (has('userText')) {
    const u = (val('userText') as Record<string, string> | null) ?? {}
    const old = items.filter((i) => isUserItem(i) && !isUrlItem(i)).map((i) => i.key)
    for (const k of old) set(k, [k], null)
    for (const [d, v] of Object.entries(u)) set(FF(d), [FF(d)], [text(v)])
  }
  if (has('userUrls')) {
    const u = (val('userUrls') as Record<string, string> | null) ?? {}
    const old = items.filter((i) => isUserItem(i) && isUrlItem(i)).map((i) => i.key)
    for (const k of old) set(k, [k], null)
    for (const [d, url] of Object.entries(u)) {
      // SPEC (de facto): type 15 is an *absolute* URL.
      if (!/^[A-Za-z][A-Za-z0-9+.-]*:\S+$/.test(url)) throw new MP4WriteError('mp4-url', `userUrls["${d}"]: "${url}" is not an absolute URL`)
      // One freeform item per name: a link cannot share its description with a userText value.
      if (items.some((i) => i.key === FF(d) && !isUrlItem(i))) {
        throw new MP4WriteError('mp4-url-conflict', `userUrls["${d}"] and userText["${d}"] would share the atom ${FF(d)}`)
      }
      set(FF(d), [FF(d)], [textValue(url, DataType.URL)])
    }
  }
  return { ...tags, itunes: { items } }
}

