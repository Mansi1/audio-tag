// ID3v2 frames <-> the friendly Metadata view. Sibling of mp4/mapping.ts; metadata/metadata.ts
// merges this with the Lyrics3 and ID3v1 views.
import { type MajorVersion, TextEncoding, pickEncoding } from '../core/encoding.js'
import type { Metadata, MetadataUpdate, Picture } from '../metadata/metadata.js'
import { imageFormatToMime, mimeToImageFormat } from './convert.js'
import { mapFrameId } from './frames/registry.js'
import { contentTypeFromNames, contentTypeNames, formatContentType, formatPosition, parseContentType, parsePosition, parseTimestamp } from './frames/text-helpers.js'
import type { Frame, FrameOf } from './frames/types.js'
import { type ID3v2Tag, createFrame, createTag } from './tag.js'

type Kind = 'string' | 'list' | 'number' | 'position' | 'time'

// v2.4 frame ID for each simple text field. Other versions are mapped through the registry; fields
// with no frame in a version are stored as TXXX with the v2.4 ID as description (see convert.ts).
const TEXT_FIELDS: Record<string, [string, Kind]> = {
  title: ['TIT2', 'string'],
  subtitle: ['TIT3', 'string'],
  grouping: ['TIT1', 'string'],
  artist: ['TPE1', 'list'],
  albumArtist: ['TPE2', 'string'],
  album: ['TALB', 'string'],
  setSubtitle: ['TSST', 'string'],
  composer: ['TCOM', 'list'],
  lyricist: ['TEXT', 'list'],
  conductor: ['TPE3', 'string'],
  remixer: ['TPE4', 'string'],
  publisher: ['TPUB', 'string'],
  copyright: ['TCOP', 'string'],
  encodedBy: ['TENC', 'string'],
  encoderSettings: ['TSSE', 'string'],
  isrc: ['TSRC', 'string'],
  language: ['TLAN', 'list'],
  mood: ['TMOO', 'string'],
  key: ['TKEY', 'string'],
  bpm: ['TBPM', 'number'],
  length: ['TLEN', 'number'],
  track: ['TRCK', 'position'],
  disc: ['TPOS', 'position'],
  releaseTime: ['TDRL', 'time'],
  encodingTime: ['TDEN', 'time'],
  taggingTime: ['TDTG', 'time'],
}
const SORT_FIELDS: Record<string, string> = { title: 'TSOT', artist: 'TSOP', album: 'TSOA', albumArtist: 'TSO2', composer: 'TSOC' }

function idFor(id4: string, major: MajorVersion): string | undefined {
  return major === 4 ? id4 : mapFrameId(id4, 4, major)
}

function textFrame(tag: ID3v2Tag, id4: string): string[] | undefined {
  const major = tag.version.major
  const id = idFor(id4, major)
  if (id) {
    const f = tag.frames.find((x): x is FrameOf<'text'> => x.type === 'text' && x.id === id)
    if (f) return f.values
  }
  const txxx = tag.frames.find((x): x is FrameOf<'user-text'> => x.type === 'user-text' && x.description === id4)
  return txxx?.values
}

function v23Time(tag: ID3v2Tag): string | undefined {
  const major = tag.version.major
  const get3 = (v3: string) => {
    const id = major === 2 ? mapFrameId(v3, 3, 2)! : v3
    return (tag.frames.find((x) => x.type === 'text' && x.id === id) as FrameOf<'text'> | undefined)?.values[0]
  }
  const year = get3('TYER')
  if (!year) return undefined
  let s = year
  const ddmm = get3('TDAT')
  const hhmm = get3('TIME')
  if (ddmm && /^[0-9]{4}$/.test(ddmm)) {
    s += `-${ddmm.slice(2)}-${ddmm.slice(0, 2)}`
    if (hhmm && /^[0-9]{4}$/.test(hhmm)) s += `T${hhmm.slice(0, 2)}:${hhmm.slice(2)}`
  }
  return parseTimestamp(s) ? s : year
}

const REVERSE_TXXX: Record<string, true> = { TDEN: true, TDRL: true, TDTG: true, TMOO: true, TPRO: true, TSST: true, TRDA: true }

/** Friendly view of an ID3v2 tag alone (see getMetadata for the view with ID3v1/Lyrics3 fallbacks). */
export function getID3v2Metadata(tag: ID3v2Tag): Metadata {
  const m: Metadata = {}
  const major = tag.version.major
  for (const [field, [id4, kind]] of Object.entries(TEXT_FIELDS)) {
    const v = textFrame(tag, id4)
    if (!v || v.length === 0 || (v.length === 1 && v[0] === '')) continue
    const rec = m as Record<string, unknown>
    if (kind === 'list') rec[field] = v
    else if (kind === 'number') {
      const n = Number(v[0])
      if (Number.isFinite(n)) rec[field] = n
    } else if (kind === 'position') {
      const p = parsePosition(v[0]!)
      rec[field] = { ...(p.number !== undefined ? { no: p.number } : {}), ...(p.total !== undefined ? { of: p.total } : {}) }
    } else rec[field] = v.join(major === 4 ? '; ' : '')
  }
  const tcon = textFrame(tag, 'TCON')
  if (tcon) m.genre = contentTypeNames(parseContentType(tcon, major))
  if (major === 4) {
    const rec = textFrame(tag, 'TDRC')?.[0]
    if (rec) m.recordingTime = rec
    const orig = textFrame(tag, 'TDOR')?.[0]
    if (orig) m.originalReleaseTime = orig
  } else {
    const rec = v23Time(tag)
    if (rec) m.recordingTime = rec
    const ory = (tag.frames.find((x) => x.type === 'text' && (x.id === 'TORY' || x.id === 'TOR')) as FrameOf<'text'> | undefined)?.values[0]
    if (ory) m.originalReleaseTime = ory
  }
  const comments = tag.frames.filter((f): f is FrameOf<'comment'> => f.type === 'comment')
  if (comments.length) m.comments = comments.map((c) => ({ language: c.language, description: c.description, text: c.text }))
  const lyrics = tag.frames.filter((f): f is FrameOf<'uslt'> => f.type === 'uslt')
  if (lyrics.length) m.lyrics = lyrics.map((c) => ({ language: c.language, description: c.description, text: c.text }))
  const pics = tag.frames.filter((f): f is FrameOf<'picture'> => f.type === 'picture')
  if (pics.length) {
    m.pictures = pics.map((p) => ({
      type: p.pictureType,
      mimeType: major === 2 ? imageFormatToMime(p.mimeType) : p.mimeType.includes('/') || p.mimeType === '-->' ? p.mimeType : `image/${p.mimeType.toLowerCase()}`,
      description: p.description,
      data: p.data,
    }))
  }
  const pops = tag.frames.filter((f): f is FrameOf<'popm'> => f.type === 'popm')
  if (pops.length) m.ratings = pops.map((p) => ({ email: p.email, rating: p.rating, ...(p.counter !== undefined ? { counter: p.counter } : {}) }))
  const pcnt = tag.frames.find((f): f is FrameOf<'pcnt'> => f.type === 'pcnt')
  if (pcnt) m.playCount = pcnt.count
  const tcmp = textFrame(tag, 'TCMP')?.[0]
  if (tcmp !== undefined) m.compilation = tcmp === '1'
  const sort: NonNullable<Metadata['sort']> = {}
  for (const [k, id4] of Object.entries(SORT_FIELDS)) {
    const v = textFrame(tag, id4)?.[0]
    if (v) sort[k as keyof typeof sort] = v
  }
  if (Object.keys(sort).length) m.sort = sort
  const txxx = tag.frames.filter((f): f is FrameOf<'user-text'> => f.type === 'user-text' && !(f.description in REVERSE_TXXX))
  if (txxx.length) m.userText = Object.fromEntries(txxx.map((f) => [f.description, f.values.join('; ')]))
  const wxxx = tag.frames.filter((f): f is FrameOf<'user-url'> => f.type === 'user-url')
  if (wxxx.length) m.userUrls = Object.fromEntries(wxxx.map((f) => [f.description, f.url]))
  return m
}

/**
 * Applies metadata to a tag (or a new tag of `major`). Fields set to undefined are left alone;
 * fields set to null (or an empty array) are removed. Frames for other fields keep their bytes.
 */
export function applyMetadata(tag: ID3v2Tag | undefined, metadata: MetadataUpdate, major: MajorVersion = tag?.version.major ?? 4): ID3v2Tag {
  const t: ID3v2Tag = tag ? { ...tag, frames: [...tag.frames] } : createTag(major)
  if (tag && tag.version.major !== major) throw new Error('applyMetadata: convert the tag with convertID3v2 first')
  const enc = (values: string | readonly string[]) => pickEncoding(values, major)
  const remove = (pred: (f: Frame) => boolean) => {
    t.frames = t.frames.filter((f) => !pred(f))
  }
  const setText = (id4: string, values: string[] | null) => {
    const id = idFor(id4, major)
    remove((f) => (id !== undefined && f.id === id) || (f.type === 'user-text' && f.description === id4))
    if (!values || values.length === 0) return
    const vals = major === 4 ? values : [values.join('/')]
    if (id) t.frames.push(createFrame('text', id, { encoding: enc(vals), values: vals }, major))
    else t.frames.push(createFrame('user-text', major === 2 ? 'TXX' : 'TXXX', { encoding: enc(vals), description: id4, values: vals }, major))
  }
  const has = (k: string) => Object.prototype.hasOwnProperty.call(metadata, k) && (metadata as Record<string, unknown>)[k] !== undefined
  const val = (k: string) => (metadata as Record<string, unknown>)[k]

  for (const [field, [id4, kind]] of Object.entries(TEXT_FIELDS)) {
    if (!has(field)) continue
    const v = val(field)
    if (v === null) setText(id4, null)
    else if (kind === 'list') setText(id4, v as string[])
    else if (kind === 'number') setText(id4, [String(Math.round(v as number))])
    else if (kind === 'position') {
      const p = v as { no?: number; of?: number }
      setText(id4, p.no === undefined ? null : [formatPosition(p.no, p.of)])
    } else setText(id4, [v as string])
  }
  if (has('genre')) {
    const g = val('genre') as string[] | null
    setText('TCON', g && g.length ? formatContentType(contentTypeFromNames(g), major) : null)
  }
  if (has('recordingTime')) setTime(t, 'TDRC', val('recordingTime') as string | null, major, setText, remove)
  if (has('originalReleaseTime')) setTime(t, 'TDOR', val('originalReleaseTime') as string | null, major, setText, remove)
  if (has('comments') || has('lyrics')) {
    for (const [key, type, id4] of [
      ['comments', 'comment', 'COMM'],
      ['lyrics', 'uslt', 'USLT'],
    ] as const) {
      if (!has(key)) continue
      remove((f) => f.type === type)
      for (const c of (val(key) as Metadata['comments']) ?? []) {
        t.frames.push(createFrame(type, idFor(id4, major)!, { encoding: enc([c.description, c.text]), language: c.language, description: c.description, text: c.text }, major))
      }
    }
  }
  if (has('pictures')) {
    remove((f) => f.type === 'picture')
    for (const p of (val('pictures') as Picture[] | null) ?? []) {
      t.frames.push(
        createFrame('picture', idFor('APIC', major)!, { encoding: enc(p.description), mimeType: major === 2 ? mimeToImageFormat(p.mimeType) : p.mimeType, pictureType: p.type, description: p.description, data: p.data }, major),
      )
    }
  }
  if (has('ratings')) {
    remove((f) => f.type === 'popm')
    for (const r of (val('ratings') as Metadata['ratings'] | null) ?? []) {
      t.frames.push(createFrame('popm', idFor('POPM', major)!, { email: r.email, rating: r.rating, ...(r.counter !== undefined ? { counter: r.counter } : {}) }, major))
    }
  }
  if (has('playCount')) {
    remove((f) => f.type === 'pcnt')
    const c = val('playCount') as bigint | null
    if (c !== null) t.frames.push(createFrame('pcnt', idFor('PCNT', major)!, { count: c }, major))
  }
  if (has('compilation')) setText('TCMP', val('compilation') ? ['1'] : null)
  if (has('sort')) {
    const s = (val('sort') as Metadata['sort'] | null) ?? {}
    for (const [k, id4] of Object.entries(SORT_FIELDS)) {
      const v = (s as Record<string, string | undefined>)[k]
      if (val('sort') === null || Object.prototype.hasOwnProperty.call(s, k)) setText(id4, v ? [v] : null)
    }
  }
  if (has('userText')) {
    const u = (val('userText') as Record<string, string> | null) ?? {}
    remove((f) => f.type === 'user-text' && !(f.description in REVERSE_TXXX))
    for (const [d, v] of Object.entries(u)) t.frames.push(createFrame('user-text', major === 2 ? 'TXX' : 'TXXX', { encoding: enc([d, v]), description: d, values: [v] }, major))
  }
  if (has('userUrls')) {
    const u = (val('userUrls') as Record<string, string> | null) ?? {}
    remove((f) => f.type === 'user-url')
    for (const [d, url] of Object.entries(u)) t.frames.push(createFrame('user-url', major === 2 ? 'WXX' : 'WXXX', { encoding: enc(d), description: d, url }, major))
  }
  return t
}

/** v2.4 stores times in TDRC/TDOR; v2.2/v2.3 split them into TYER/TDAT/TIME and TORY. */
function setTime(
  t: ID3v2Tag,
  id4: 'TDRC' | 'TDOR',
  value: string | null,
  major: MajorVersion,
  setText: (id4: string, v: string[] | null) => void,
  remove: (pred: (f: Frame) => boolean) => void,
): void {
  if (major === 4) {
    setText(id4, value ? [value] : null)
    return
  }
  const id = (v3: string) => (major === 2 ? mapFrameId(v3, 3, 2)! : v3)
  const ids = id4 === 'TDRC' ? ['TYER', 'TDAT', 'TIME'].map(id) : [id('TORY')]
  remove((f) => ids.includes(f.id))
  if (!value) return
  const ts = parseTimestamp(value)
  if (!ts) throw new Error(`"${value}" is not a valid timestamp (yyyy[-MM[-dd[THH[:mm[:ss]]]]])`)
  const p = (n: number) => String(n).padStart(2, '0')
  const push = (v3: string, v: string): void => void t.frames.push(createFrame('text', id(v3), { encoding: TextEncoding.Latin1, values: [v] }, major))
  if (id4 === 'TDOR') {
    push('TORY', String(ts.year).padStart(4, '0'))
    return
  }
  push('TYER', String(ts.year).padStart(4, '0'))
  if (ts.month !== undefined && ts.day !== undefined) push('TDAT', p(ts.day) + p(ts.month))
  if (ts.hour !== undefined && ts.minute !== undefined) push('TIME', p(ts.hour) + p(ts.minute))
}
