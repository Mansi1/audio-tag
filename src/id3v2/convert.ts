import { type MajorVersion, TextEncoding, isAllowedEncoding } from '../core/encoding.js'
import { type Warning, WarningSink } from '../core/errors.js'
import { genreId, genreName } from '../id3v1/genres.js'
import type { ID3v1Tag } from '../id3v1/id3v1.js'
import { type FrameFlags, defaultFrameFlags } from './frame-header.js'
import { getDefinition, mapFrameId } from './frames/registry.js'
import { formatContentType, parseContentType, parseMediaType, parsePosition, parseTimestamp } from './frames/text-helpers.js'
import type { Frame, FrameOf } from './frames/types.js'
import { type ID3v2Tag, cloneFrame, createFrame } from './tag.js'

export interface ConvertOptions {
  /**
   * Going down to v2.2/v2.3, how several values in one text frame become one string:
   * '/' joins them (the separator v2.3 names for TCOM, TEXT, TOLY, TOPE and TPE1), 'first' keeps the first.
   */
  multiValue?: '/' | 'first'
  /**
   * Going up to v2.4, split "/"-separated v2.3 values of TCOM, TEXT, TOLY, TOPE and TPE1 into
   * separate values. Off by default because "/" can be part of a name (AC/DC).
   */
  splitSlashes?: boolean
  /** Going up to v2.4, re-encode all text as UTF-8. */
  upgradeToUtf8?: boolean
  /**
   * Going up to v2.4, IPLS involvements that name an instrument go to TMCL (musician credits);
   * everything else goes to TIPL. Without this list everything goes to TIPL.
   */
  instrumentNames?: readonly string[]
}

// SPEC: v2.3 §4.2.1 names "/" as the separator for these frames.
const SLASH_FRAMES = new Set(['TCOM', 'TEXT', 'TOLY', 'TOPE', 'TPE1', 'TCM', 'TXT', 'TOL', 'TOA', 'TP1'])

// v2.4-only text frames with no v2.3 counterpart are kept as TXXX with the ID as description.
const V24_ONLY_TO_TXXX = new Set(['TDEN', 'TDRL', 'TDTG', 'TMOO', 'TPRO', 'TSST'])

function convertFlags(flags: FrameFlags, to: MajorVersion): FrameFlags {
  if (to === 2) return defaultFrameFlags()
  const f: FrameFlags = { ...flags }
  if (to === 3) {
    f.unsynchronisation = false
    f.dataLengthIndicator = false
  }
  delete f.unknownStatusBits
  delete f.unknownFormatBits
  return f
}

function convertEncoding(enc: TextEncoding, to: MajorVersion, opts: ConvertOptions): TextEncoding {
  if (to === 4 && opts.upgradeToUtf8) return TextEncoding.UTF8
  if (isAllowedEncoding(enc, to)) return enc
  // SPEC: v2.2/v2.3 only know $00 and $01; UTF-16BE and UTF-8 text becomes UTF-16.
  return TextEncoding.UTF16
}

/** Picture format between v2.2 PIC ("PNG", "JPG") and v2.3/v2.4 APIC MIME types. */
export function imageFormatToMime(fmt: string): string {
  const f = fmt.trim().toUpperCase()
  if (f === '-->') return '-->'
  if (f === 'JPG') return 'image/jpeg'
  return `image/${f.toLowerCase()}`
}

export function mimeToImageFormat(mime: string): string {
  if (mime === '-->') return '-->'
  const sub = (mime.includes('/') ? mime.split('/')[1]! : mime).toUpperCase()
  if (sub === 'JPEG' || sub === 'PJPEG') return 'JPG'
  return sub.slice(0, 3).padEnd(3, ' ')
}

interface DateParts {
  year?: string
  ddmm?: string
  hhmm?: string
}

/**
 * Converts a tag to another ID3v2 version. The input is not modified. Information with no
 * equivalent in the target version is dropped, and every drop is listed in the warnings.
 * SPEC: v2.4 changes §3-5, id3guide "What's new in ID3v2.3".
 */
export function convertID3v2(tag: ID3v2Tag, to: MajorVersion, options: ConvertOptions = {}): { tag: ID3v2Tag; warnings: Warning[] } {
  const w = new WarningSink(false)
  const from = tag.version.major
  const out: ID3v2Tag = {
    version: { major: to, revision: from === to ? tag.version.revision : 0 },
    flags: { unsynchronisation: tag.flags.unsynchronisation },
    frames: convertFrames(tag.frames, from, to, options, w, true),
    padding: tag.padding,
  }
  if (to >= 3 && tag.flags.experimental) out.flags.experimental = true
  if (to === 4 && from === 4 && tag.flags.footer) out.flags.footer = true
  const ext = tag.extendedHeader
  if (ext && to === 3) out.extendedHeader = { version: 3, paddingSize: 0, ...(ext.crc !== undefined ? { crc: 0 } : {}) }
  if (ext && to === 4) {
    out.extendedHeader = ext.version === 4 ? { ...ext } : { version: 4, isUpdate: false, ...(ext.crc !== undefined ? { crc: 0 } : {}) }
  }
  if (ext?.version === 4 && to === 3 && (ext.isUpdate || ext.restrictions)) {
    w.note('convert-dropped', 'the update flag and tag restrictions have no v2.3 equivalent')
  }
  return { tag: out, warnings: w.list }
}

function convertFrames(frames: readonly Frame[], from: MajorVersion, to: MajorVersion, opts: ConvertOptions, w: WarningSink, topLevel: boolean): Frame[] {
  if (from === to) return frames.map((f) => cloneFrame(f))
  const out: Frame[] = []
  const dates: DateParts = {}
  const drop = (f: Frame, why: string) => w.note('convert-dropped', `${f.id} dropped: ${why}`, { frameId: f.id })

  for (const f of frames) {
    const flags = convertFlags(f.flags, to)
    // --- frames with special handling -------------------------------------------------------
    if (f.type === 'text' && from < 4 && to === 4 && topLevel) {
      const base = f.id.length === 3 ? mapFrameId(f.id, 2, 3) : f.id
      // SPEC: v2.4 changes §4: TYER, TDAT, TIME and TRDA are replaced by TDRC, TORY by TDOR.
      if (base === 'TYER') {
        dates.year = f.values[0] ?? ''
        continue
      }
      if (base === 'TDAT') {
        dates.ddmm = f.values[0] ?? ''
        continue
      }
      if (base === 'TIME') {
        dates.hhmm = f.values[0] ?? ''
        continue
      }
      if (base === 'TRDA') {
        out.push(createFrame('user-text', 'TXXX', { encoding: convertEncoding(f.encoding, to, opts), description: 'TRDA', values: f.values }, 4))
        w.note('convert-moved', 'TRDA has no v2.4 frame; kept as TXXX "TRDA"', { frameId: f.id })
        continue
      }
      if (base === 'TORY') {
        out.push({ type: 'text', id: 'TDOR', flags, encoding: convertEncoding(f.encoding, to, opts), values: [f.values[0] ?? ''] })
        continue
      }
      if (base === 'TSIZ') {
        drop(f, 'TSIZ is deprecated in v2.4 (changes §4)')
        continue
      }
    }
    if (f.type === 'text' && from === 4 && to < 4) {
      if (f.id === 'TDRC') {
        out.push(...tdrcToV23(f, to, flags, opts, w))
        continue
      }
      if (f.id === 'TDOR') {
        const t = parseTimestamp(f.values[0] ?? '')
        if (t) out.push({ type: 'text', id: to === 2 ? 'TOR' : 'TORY', flags, encoding: convertEncoding(f.encoding, to, opts), values: [String(t.year).padStart(4, '0')] })
        else drop(f, 'not a valid timestamp')
        continue
      }
      if (f.id === 'TIPL' || f.id === 'TMCL') {
        out.push(mergeIpls(out, f, to, opts, flags))
        continue
      }
      if (V24_ONLY_TO_TXXX.has(f.id)) {
        out.push(createFrame('user-text', to === 2 ? 'TXX' : 'TXXX', { encoding: convertEncoding(f.encoding, to, opts), description: f.id, values: [joinValues(f.values, f.id, opts, w)] }, to))
        w.note('convert-moved', `${f.id} has no v2.${to} frame; kept as TXXX "${f.id}"`, { frameId: f.id })
        continue
      }
    }
    if (f.type === 'involved-people' && to === 4) {
      // SPEC: v2.4 changes §4 IPLS is replaced by TMCL and TIPL.
      const instruments = new Set((opts.instrumentNames ?? []).map((s) => s.toLowerCase()))
      const tipl: string[] = []
      const tmcl: string[] = []
      for (const [role, name] of f.people) (instruments.has(role.toLowerCase()) ? tmcl : tipl).push(role, name)
      const enc = convertEncoding(f.encoding, to, opts)
      if (tipl.length) out.push({ type: 'text', id: 'TIPL', flags, encoding: enc, values: tipl })
      if (tmcl.length) out.push({ type: 'text', id: 'TMCL', flags, encoding: enc, values: tmcl })
      continue
    }
    if (f.type === 'rva2' && from === 4 && to === 3) {
      out.push({ ...cloneFrame(f), id: 'XRVA', flags })
      w.note('convert-moved', 'RVA2 written as the unofficial XRVA frame for v2.3', { frameId: f.id })
      continue
    }
    if (f.type === 'rva2' && from === 3 && to === 4 && f.id === 'XRVA') {
      out.push({ ...cloneFrame(f), id: 'RVA2', flags })
      continue
    }

    // --- generic mapping by ID ---------------------------------------------------------------
    if (f.type === 'undecodable') {
      drop(f, 'it could not be decoded, so it cannot be converted')
      continue
    }
    if (f.type === 'unknown') {
      if (from === 2 || to === 2) drop(f, 'unknown frames cannot change ID length')
      else out.push({ ...cloneFrame(f), flags })
      continue
    }
    const id = mapFrameId(f.id, from, to)
    if (!id) {
      drop(f, `no equivalent frame in v2.${to}`)
      continue
    }
    const def = getDefinition(id, to)
    if (!def || def.type !== f.type) {
      drop(f, `no equivalent frame in v2.${to}`)
      continue
    }
    const g = cloneFrame(f) as Frame
    g.id = id
    g.flags = flags
    if ('encoding' in g) g.encoding = convertEncoding(g.encoding, to, opts)
    if (g.type === 'text') convertTextValues(g, f.id, from, to, opts, w)
    if (g.type === 'user-text' && to < 4 && g.values.length > 1) g.values = [joinValues(g.values, g.id, opts, w)]
    if (g.type === 'picture') g.mimeType = to === 2 ? mimeToImageFormat(from === 2 ? imageFormatToMime(g.mimeType) : g.mimeType) : from === 2 ? imageFormatToMime(g.mimeType) : g.mimeType
    if (g.type === 'link') {
      const linked = mapFrameId(g.frameId, from, to)
      if (!linked) {
        drop(f, `linked frame ${g.frameId} has no v2.${to} equivalent`)
        continue
      }
      g.frameId = linked
    }
    if (g.type === 'chap' || g.type === 'ctoc') g.frames = convertFrames(f.type === 'chap' || f.type === 'ctoc' ? f.frames : [], from, to, opts, w, false)
    out.push(g)
  }

  if (dates.year !== undefined || dates.ddmm !== undefined || dates.hhmm !== undefined) {
    const tdrc = datesToTdrc(dates)
    if (tdrc) out.push(createFrame('text', 'TDRC', { encoding: TextEncoding.Latin1, values: [tdrc] }, 4))
    else w.note('convert-dropped', `TYER/TDAT/TIME "${dates.year ?? ''}/${dates.ddmm ?? ''}/${dates.hhmm ?? ''}" is not a valid date`)
  }
  return out
}

function joinValues(values: readonly string[], id: string, opts: ConvertOptions, w: WarningSink): string {
  if (values.length <= 1) return values[0] ?? ''
  if (opts.multiValue === 'first') {
    w.note('convert-values', `${id}: only the first of ${values.length} values kept`, { frameId: id })
    return values[0]!
  }
  return values.join('/')
}

function convertTextValues(g: FrameOf<'text'>, oldId: string, from: MajorVersion, to: MajorVersion, opts: ConvertOptions, w: WarningSink): void {
  const base4 = to === 4 ? g.id : (mapFrameId(g.id, to, 4) ?? g.id)
  if (base4 === 'TCON') {
    g.values = formatContentType(parseContentType(g.values, from), to)
    return
  }
  if (base4 === 'TMED' && to === 4) {
    // SPEC: v2.3 references are in parentheses, v2.4 values are bare ("VID/PAL/VHS").
    g.values = g.values.flatMap((v) => {
      const m = parseMediaType(v)
      return [...m.references, ...(m.refinement ? [m.refinement.trim()] : [])]
    })
    return
  }
  if (base4 === 'TMED' && from === 4) {
    const refs = g.values.filter((v) => parseMediaType(v).references.length).map((v) => `(${v})`)
    const text = g.values.filter((v) => !parseMediaType(v).references.length)
    g.values = [refs.join('') + text.join('/')]
    return
  }
  if (to === 4 && opts.splitSlashes && SLASH_FRAMES.has(oldId)) {
    g.values = g.values.flatMap((v) => v.split('/'))
    return
  }
  if (to < 4 && g.values.length > 1) g.values = [joinValues(g.values, g.id, opts, w)]
}

function datesToTdrc(d: DateParts): string | undefined {
  if (!d.year || !/^[0-9]{4}$/.test(d.year)) return undefined
  let s = d.year
  if (d.ddmm && /^[0-9]{4}$/.test(d.ddmm)) {
    s += `-${d.ddmm.slice(2, 4)}-${d.ddmm.slice(0, 2)}`
    if (d.hhmm && /^[0-9]{4}$/.test(d.hhmm)) s += `T${d.hhmm.slice(0, 2)}:${d.hhmm.slice(2, 4)}`
  }
  return parseTimestamp(s) ? s : d.year
}

function tdrcToV23(f: FrameOf<'text'>, to: MajorVersion, flags: FrameFlags, opts: ConvertOptions, w: WarningSink): Frame[] {
  const t = parseTimestamp(f.values[0] ?? '')
  if (!t) {
    w.note('convert-dropped', `TDRC "${f.values[0]}" is not a valid timestamp`, { frameId: f.id })
    return []
  }
  const enc = convertEncoding(f.encoding, to, opts)
  const id = (v3: string, v2: string) => (to === 2 ? v2 : v3)
  const p = (n: number) => String(n).padStart(2, '0')
  const out: Frame[] = [{ type: 'text', id: id('TYER', 'TYE'), flags, encoding: enc, values: [String(t.year).padStart(4, '0')] }]
  if (t.month !== undefined && t.day !== undefined) {
    out.push({ type: 'text', id: id('TDAT', 'TDA'), flags, encoding: enc, values: [p(t.day) + p(t.month)] })
  }
  if (t.hour !== undefined && t.minute !== undefined) {
    out.push({ type: 'text', id: id('TIME', 'TIM'), flags, encoding: enc, values: [p(t.hour) + p(t.minute)] })
  }
  if (t.second !== undefined) w.note('convert-precision', 'TDRC seconds have no v2.3 field', { frameId: f.id })
  return out
}

/** TIPL and TMCL both become (one) IPLS/IPL frame. */
function mergeIpls(out: Frame[], f: FrameOf<'text'>, to: MajorVersion, opts: ConvertOptions, flags: FrameFlags): Frame {
  const id = to === 2 ? 'IPL' : 'IPLS'
  const idx = out.findIndex((x) => x.id === id)
  const people: [string, string][] = []
  for (let i = 0; i < f.values.length; i += 2) people.push([f.values[i]!, f.values[i + 1] ?? ''])
  if (idx >= 0) {
    const existing = out.splice(idx, 1)[0] as FrameOf<'involved-people'>
    return { ...existing, people: [...existing.people, ...people] }
  }
  return { type: 'involved-people', id, flags, encoding: convertEncoding(f.encoding, to, opts), people }
}

/**
 * Derives an ID3v1.1 tag from an ID3v2 tag: title, artist, album, year, the first comment with an
 * empty description, the track number and the first genre that is in the ID3v1 list.
 */
export function id3v1FromID3v2(tag: ID3v2Tag): ID3v1Tag {
  const major = tag.version.major
  const text = (id4: string): string | undefined => {
    const id = major === 4 ? id4 : mapFrameId(id4, 4, major) ?? (major === 3 ? id4 : undefined)
    const f = tag.frames.find((x) => x.id === id && x.type === 'text') as FrameOf<'text'> | undefined
    return f?.values[0]
  }
  const year = major === 4 ? text('TDRC')?.slice(0, 4) : tag.frames.find((x): x is FrameOf<'text'> => x.type === 'text' && (x.id === 'TYER' || x.id === 'TYE'))?.values[0]
  const comment = tag.frames.find((x): x is FrameOf<'comment'> => x.type === 'comment' && x.description === '')
  const trackStr = tag.frames.find((x): x is FrameOf<'text'> => x.type === 'text' && (x.id === 'TRCK' || x.id === 'TRK'))?.values[0]
  const tcon = tag.frames.find((x): x is FrameOf<'text'> => x.type === 'text' && (x.id === 'TCON' || x.id === 'TCO'))
  let genre = 255
  if (tcon) {
    for (const it of parseContentType(tcon.values, major)) {
      if (it.kind === 'genre' && it.id < 256) {
        genre = it.id
        break
      }
      if (it.kind === 'text') {
        const id = genreId(it.value)
        if (id !== undefined) {
          genre = id
          break
        }
      }
    }
  }
  const track = trackStr ? parsePosition(trackStr).number : undefined
  const v1: ID3v1Tag = {
    version: track && track <= 255 ? '1.1' : '1.0',
    title: text('TIT2') ?? '',
    artist: text('TPE1') ?? '',
    album: text('TALB') ?? '',
    year: year ?? '',
    comment: comment?.text ?? '',
    genre,
  }
  if (track && track <= 255) v1.track = track
  return v1
}

/** Builds an ID3v2 tag of the given version from an ID3v1 tag. */
export function id3v2FromID3v1(v1: ID3v1Tag, major: MajorVersion = 4): ID3v2Tag {
  const frames: Frame[] = []
  const id = (id4: string): string => {
    const v3 = id4 === 'TDRC' ? 'TYER' : id4
    return major === 4 ? id4 : major === 3 ? v3 : mapFrameId(v3, 3, 2)!
  }
  const txt = (id4: string, value: string) => {
    if (value) frames.push(createFrame('text', id(id4), { encoding: TextEncoding.Latin1, values: [value] }, major))
  }
  txt('TIT2', v1.title)
  txt('TPE1', v1.artist)
  txt('TALB', v1.album)
  txt('TDRC', v1.year)
  if (v1.track) txt('TRCK', String(v1.track))
  if (v1.genre !== 255) txt('TCON', formatContentType([{ kind: 'genre', id: v1.genre, name: genreName(v1.genre) }], major)[0]!)
  if (v1.comment) {
    frames.push(createFrame('comment', major === 2 ? 'COM' : 'COMM', { encoding: TextEncoding.Latin1, language: 'XXX', description: '', text: v1.comment }, major))
  }
  return { version: { major, revision: 0 }, flags: { unsynchronisation: false }, frames, padding: 0 }
}
