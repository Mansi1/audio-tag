import { isBytes } from '../core/bytes.js'
import { allowedEncodings, type MajorVersion, TextEncoding } from '../core/encoding.js'
import { WarningSink } from '../core/errors.js'
import { describeRestrictions, serializeExtendedHeaderV24, type TagRestrictions } from './extended-header.js'
import { encodeFrameForWrite } from './frame-io.js'
import { pictureMimeType } from './frames/codecs-misc.js'
import { getDefinition, mapFrameId, uniquenessOf } from './frames/registry.js'
import type { Frame, FrameOf } from './frames/types.js'
import type { ID3v2Tag } from './tag.js'

/** One problem found by {@link validateID3v2}. */
export interface Issue {
  /** 'error': breaks a MUST / "must" / "may only" / format definition; 'warning': a SHOULD or recommendation. */
  level: 'error' | 'warning'
  code: string
  message: string
  frameId?: string
  /** Where the rule comes from, e.g. "v2.4 frames §4.14". */
  spec: string
}

// --- Image size sniffing ------------------------------------------------------------------------

export interface ImageSize {
  width: number
  height: number
}

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]

/** Width and height from a PNG IHDR chunk (PNG spec: signature, then IHDR as the first chunk). */
export function pngSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 24) return undefined
  for (let i = 0; i < 8; i++) if (data[i] !== PNG_SIGNATURE[i]) return undefined
  // bytes 8-11: chunk length, 12-15: "IHDR", 16-19: width, 20-23: height (big-endian)
  if (data[12] !== 0x49 || data[13] !== 0x48 || data[14] !== 0x44 || data[15] !== 0x52) return undefined
  const u32 = (o: number) => ((data[o]! << 24) | (data[o + 1]! << 16) | (data[o + 2]! << 8) | data[o + 3]!) >>> 0
  return { width: u32(16), height: u32(20) }
}

/** Width and height from the first JPEG SOFn marker ($C0-$CF except DHT $C4, JPG $C8, DAC $CC). */
export function jpegSize(data: Uint8Array): ImageSize | undefined {
  if (data.length < 4 || data[0] !== 0xff || data[1] !== 0xd8) return undefined
  let i = 2
  while (i < data.length) {
    if (data[i] !== 0xff) return undefined
    while (data[i] === 0xff) i++ // fill bytes
    const marker = data[i++]
    if (marker === undefined) return undefined
    // standalone markers carry no length: TEM, RSTn
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    if (marker === 0xd9 || marker === 0xda) return undefined // EOI / SOS before any SOF
    if (i + 1 >= data.length) return undefined
    const len = (data[i]! << 8) | data[i + 1]!
    if (len < 2) return undefined
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      // length(2) precision(1) height(2) width(2)
      if (i + 7 > data.length) return undefined
      return { height: (data[i + 3]! << 8) | data[i + 4]!, width: (data[i + 5]! << 8) | data[i + 6]! }
    }
    i += len
  }
  return undefined
}

function imageSize(data: Uint8Array): ImageSize | undefined {
  return pngSize(data) ?? jpegSize(data)
}

// --- Spec references ----------------------------------------------------------------------------

function fref(major: MajorVersion, section: string): string {
  return major === 4 ? `v2.4 frames §${section}` : `v2.${major} §${section}`
}

/** Where strings, encodings and the language field are defined. */
function stringsRef(major: MajorVersion): string {
  return major === 4 ? 'v2.4 structure §4' : major === 3 ? 'v2.3 §3.3' : 'v2.2 §3.2'
}

function frameRef(f: Frame, major: MajorVersion): string {
  const def = getDefinition(f.id, major)
  const s = def?.sections[major]
  if (def?.origin === 'chapters-addendum') return `chapters addendum §${s ?? '3'}`
  if (def?.origin === 'accessibility-addendum') return `accessibility addendum §${s ?? '4'}`
  if (s) return fref(major, s)
  if (f.type === 'text') return fref(major, '4.2')
  if (f.type === 'url') return fref(major, '4.3')
  return fref(major, '4')
}

/** Section of a frame by its v2.4 / v2.3 / v2.2 numbering. */
function sec(major: MajorVersion, s4: string, s3: string, s2: string = s3): string {
  return fref(major, major === 4 ? s4 : major === 3 ? s3 : s2)
}

// --- Small helpers ------------------------------------------------------------------------------

class Issues {
  readonly list: Issue[] = []
  add(level: Issue['level'], code: string, message: string, spec: string, frameId?: string): void {
    const i: Issue = { level, code, message, spec }
    if (frameId !== undefined) i.frameId = frameId
    this.list.push(i)
  }
  error(code: string, message: string, spec: string, frameId?: string): void {
    this.add('error', code, message, spec, frameId)
  }
  warn(code: string, message: string, spec: string, frameId?: string): void {
    this.add('warning', code, message, spec, frameId)
  }
}

const isDecoded = (f: Frame) => f.type !== 'unknown' && f.type !== 'undecodable'

/** The ID a frame has in v2.3/v2.4, so v2.2 frames share the same rules ("TYE" → "TYER"). */
function canonicalId(f: Frame, major: MajorVersion): string | undefined {
  const def = getDefinition(f.id, major)
  // only IDs declared for this version, not the T***/W*** family fallbacks
  if (!def || def.ids[major] !== f.id || def.type !== f.type) return undefined
  return major === 2 ? mapFrameId(f.id, 2, 3) : f.id
}

const hexByte = (n: number) => `$${n.toString(16).toUpperCase().padStart(2, '0')}`
const chars = (s: string) => Array.from(s).length

/** Stable serialisation of a frame's content (everything but the flags), for "same content" checks. */
function contentKey(f: Frame): string {
  const ser = (v: unknown): string => {
    if (isBytes(v)) return `b[${Array.from(v).join(',')}]`
    if (typeof v === 'bigint') return `n${v.toString()}`
    if (Array.isArray(v)) return `[${v.map(ser).join(',')}]`
    if (v && typeof v === 'object') {
      const o = v as Record<string, unknown>
      return `{${Object.keys(o)
        .filter((k) => o[k] !== undefined)
        .sort()
        .map((k) => `${k}:${ser(o[k])}`)
        .join(',')}}`
    }
    return JSON.stringify(v) ?? 'undefined'
  }
  const { flags: _flags, ...rest } = f
  return ser(rest)
}

function daysInMonth(year: number | undefined, month: number): number {
  if (month === 2) return year === undefined || (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 29 : 28
  return [4, 6, 9, 11].includes(month) ? 30 : 31
}

/** YYYYMMDD, a real calendar date. */
function isYyyymmdd(s: string): boolean {
  const m = /^(\d{4})(\d{2})(\d{2})$/.exec(s)
  if (!m) return false
  const y = +m[1]!
  const mo = +m[2]!
  const d = +m[3]!
  return mo >= 1 && mo <= 12 && d >= 1 && d <= daysInMonth(y, mo)
}

/** SPEC: v2.4 structure §4: yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm, yyyy-MM-ddTHH:mm:ss. */
function isTimestamp(s: string): boolean {
  const m = /^(\d{4})(?:-(\d{2})(?:-(\d{2})(?:T(\d{2})(?::(\d{2})(?::(\d{2}))?)?)?)?)?$/.exec(s)
  if (!m) return false
  const y = +m[1]!
  if (m[2] !== undefined) {
    const mo = +m[2]
    if (mo < 1 || mo > 12) return false
    if (m[3] !== undefined && (+m[3] < 1 || +m[3] > daysInMonth(y, mo))) return false
  }
  if (m[4] !== undefined && +m[4] > 23) return false
  if (m[5] !== undefined && +m[5] > 59) return false
  if (m[6] !== undefined && +m[6] > 59) return false
  return true
}

/** "CUR" + numerical string with "." as decimal separator (OWNE / COMR). */
const PRICE = /^([A-Z]{3})(\d+(?:\.\d*)?|\.\d+)$/

// --- String fields ------------------------------------------------------------------------------

type StringKind =
  /** <text string>: ISO-8859-1, $20-$FF, no newline. */
  | 'latin1'
  /** <text string according to encoding>. */
  | 'encoded'
  /** URL: always ISO-8859-1. */
  | 'url'

interface StringField {
  name: string
  value: string
  kind: StringKind
  /** <full text string>: newlines allowed. */
  full?: boolean
}

function stringFields(f: Frame, major: MajorVersion): StringField[] {
  const e = (name: string, value: string, full = false): StringField => ({ name, value, kind: 'encoded', full })
  const l = (name: string, value: string): StringField => ({ name, value, kind: 'latin1' })
  const u = (name: string, value: string): StringField => ({ name, value, kind: 'url' })
  switch (f.type) {
    case 'text':
      return f.values.map((v, i) => e(`value ${i + 1}`, v))
    case 'user-text':
      return [e('description', f.description), ...f.values.map((v, i) => e(`value ${i + 1}`, v))]
    case 'url':
      return [u('URL', f.url)]
    case 'user-url':
      return [e('description', f.description), u('URL', f.url)]
    case 'involved-people':
      return f.people.flatMap(([a, b], i) => [e(`involvement ${i + 1}`, a), e(`involvee ${i + 1}`, b)])
    case 'ufid':
    case 'aenc':
    case 'encr':
    case 'grid':
    case 'priv':
      return [l('owner identifier', f.owner)]
    case 'crm':
      return [l('owner identifier', f.owner), l('explanation', f.explanation)]
    case 'uslt':
    case 'comment':
      // SPEC: v2.4 §4.8/§4.10 "Newline characters are allowed" in the text (<full text string>)
      return [e('content descriptor', f.description), e('text', f.text, true)]
    case 'sylt':
      // SPEC: v2.4 §4.9 "Newline characters are allowed in all "SYLT" frames"
      return [e('content descriptor', f.description, true), ...f.entries.map((x, i) => e(`sync ${i + 1}`, x.text, true))]
    case 'user':
      // SPEC: v2.4 §4.22 / v2.3 §4.23 "Newlines are allowed in the text."
      return [e('text', f.text, true)]
    case 'rva2':
    case 'equ2':
      return [l('identification', f.identification)]
    case 'picture': {
      const out = [l(major === 2 ? 'image format' : 'MIME type', f.mimeType), e('description', f.description)]
      if (f.mimeType === '-->') out.push(u('URL', latin1Prefix(f.data)))
      return out
    }
    case 'geob':
      return [l('MIME type', f.mimeType), e('filename', f.filename), e('description', f.description)]
    case 'popm':
      return [l('email', f.email)]
    case 'link':
      return [u('URL', f.url), ...f.additional.map((a, i) => l(`additional data ${i + 1}`, a))]
    case 'owne':
      return [l('price paid', f.pricePaid), l('date of purchase', f.purchaseDate), e('seller', f.seller)]
    case 'comr': {
      const out = [l('price string', f.prices), l('valid until', f.validUntil), u('contact URL', f.contactUrl), e('seller', f.seller), e('description', f.description)]
      if (f.logoMimeType !== undefined) out.push(l('picture MIME type', f.logoMimeType))
      return out
    }
    case 'chap':
      return [l('element ID', f.elementId)]
    case 'ctoc':
      return [l('element ID', f.elementId), ...f.childElementIds.map((c, i) => l(`child element ID ${i + 1}`, c))]
    case 'atxt':
      return [l('MIME type', f.mimeType), e('equivalent text', f.equivalentText)]
    default:
      return []
  }
}

function latin1Prefix(b: Uint8Array): string {
  let s = ''
  for (const c of b) {
    if (c === 0) break
    s += String.fromCharCode(c)
  }
  return s
}

function encodingOf(f: Frame): TextEncoding | undefined {
  return 'encoding' in f ? f.encoding : undefined
}

// --- Validation ---------------------------------------------------------------------------------

/**
 * Checks a tag against the rules of its version and the addenda. Errors break a MUST, "must",
 * "may only" or a format definition; warnings break a SHOULD or a recommendation.
 */
export function validateID3v2(tag: ID3v2Tag): Issue[] {
  const major = tag.version.major
  const out = new Issues()
  const all = flatten(tag.frames)

  checkContainer(tag.frames, major, out)
  for (const f of all) checkFrame(f, major, out)
  checkCrossFrame(tag.frames, all, major, out)
  checkChapters(all, major, out)
  const ext = tag.extendedHeader
  if (major === 4 && ext?.version === 4 && ext.restrictions) checkRestrictions(tag, all, ext.restrictions, out)
  return out.list
}

/** Every frame, including frames embedded in CHAP and CTOC. */
function flatten(frames: readonly Frame[]): Frame[] {
  const out: Frame[] = []
  for (const f of frames) {
    out.push(f)
    if (f.type === 'chap' || f.type === 'ctoc') out.push(...flatten(f.frames))
  }
  return out
}

/** Uniqueness inside one frame list (the tag, or the sub-frames of one CHAP/CTOC). */
function checkContainer(frames: readonly Frame[], major: MajorVersion, out: Issues): void {
  const seen = new Map<string, Frame>()
  const encrSymbols = new Map<number, Frame>()
  const gridSymbols = new Map<number, Frame>()
  const pictureTypes = new Map<number, Frame>()
  for (const f of frames) {
    if (f.type === 'chap' || f.type === 'ctoc') checkContainer(f.frames, major, out)
    if (!isDecoded(f)) continue
    const def = getDefinition(f.id, major)
    if (!def || def.type !== f.type) continue
    // SPEC: chapters addendum §3.1/§3.2: element IDs are unique across CHAP and CTOC (checkChapters)
    if (f.type === 'chap' || f.type === 'ctoc') continue
    const u = uniquenessOf(def, major)
    let key: string | undefined
    let msg = ''
    if (u.kind === 'single') {
      key = f.id
      msg = `there may only be one ${f.id} frame in a tag`
    } else if (u.kind === 'key') {
      const k = u.key(f)
      key = `${f.id}\0${k}`
      msg = `only one ${f.id} frame may have the same ${u.describe} (${JSON.stringify(k)})`
    } else if (u.kind === 'content') {
      key = `${f.id}\0${contentKey(f)}`
      msg = `two ${f.id} frames have the same content`
    }
    if (key !== undefined) {
      if (seen.has(key)) out.error('duplicate-frame', msg, frameRef(f, major), f.id)
      else seen.set(key, f)
    }
    // SPEC: v2.4 §4.25/§4.26, v2.3 §4.26/§4.27: "only one containing the same symbol and only one
    // containing the same owner identifier" (the owner part comes from the registry).
    if (f.type === 'encr' || f.type === 'grid') {
      const map = f.type === 'encr' ? encrSymbols : gridSymbols
      const sym = f.type === 'encr' ? f.methodSymbol : f.groupSymbol
      if (map.has(sym)) out.error('duplicate-frame', `only one ${f.id} frame may have the symbol ${hexByte(sym)}`, frameRef(f, major), f.id)
      else map.set(sym, f)
    }
    // SPEC: v2.4 §4.14, v2.3 §4.15, v2.2 §4.15: "There may only be one picture with the picture
    // type declared as picture type $01 and $02 respectively."
    if (f.type === 'picture' && (f.pictureType === 1 || f.pictureType === 2)) {
      if (pictureTypes.has(f.pictureType)) {
        out.error('duplicate-picture-type', `only one picture may have picture type ${hexByte(f.pictureType)}`, frameRef(f, major), f.id)
      } else pictureTypes.set(f.pictureType, f)
    }
  }
}

function checkFrame(f: Frame, major: MajorVersion, out: Issues): void {
  if (!isDecoded(f)) return
  const ref = frameRef(f, major)
  const id = f.id

  // Text encoding allowed for the version
  const enc = encodingOf(f)
  if (enc !== undefined && !(allowedEncodings(major) as readonly number[]).includes(enc)) {
    out.error('encoding-version', `text encoding ${hexByte(enc)} is not defined in ID3v2.${major}`, stringsRef(major), id)
  }

  checkStrings(f, major, out)

  switch (f.type) {
    case 'text':
      checkTextFormat(f, major, out)
      break
    case 'ufid':
      if (f.owner === '') {
        // SPEC: v2.3/v2.4 §4.1 "The 'Owner identifier' must be non-empty"; v2.2 §4.1 says a frame
        // with an empty owner "should be ignored, and preferably be removed".
        if (major === 2) out.warn('ufid-owner-empty', 'owner identifier is empty; the frame should be ignored', ref, id)
        else out.error('ufid-owner-empty', 'owner identifier must be non-empty', ref, id)
      }
      if (f.identifier.length > 64) out.error('ufid-identifier-size', `identifier is ${f.identifier.length} bytes, at most 64 allowed`, ref, id)
      break
    case 'comment':
    case 'uslt':
    case 'sylt':
    case 'user':
      checkLanguage(f.language, f, major, out)
      // SPEC: v2.4 §4.9 / v2.3 §4.10 / v2.2 §4.10 "All time stamps should be sorted in
      // chronological order."
      if (f.type === 'sylt') checkSorted(f.entries.map((e) => e.timestamp), f, major, out, false)
      break
    case 'etco':
      checkSorted(f.events.map((e) => e.timestamp), f, major, out, major === 4)
      break
    case 'sytc':
      checkSorted(f.tempos.map((e) => e.timestamp), f, major, out, major === 4)
      break
    case 'mllt':
      // SPEC: v2.4 §4.6 / v2.3 §4.7 / v2.2 §4.7 "must be a multiple of four"
      if ((f.bitsForBytesDeviation + f.bitsForMillisecondsDeviation) % 4 !== 0) {
        out.error('mllt-bits', `bits for bytes + milliseconds deviation (${f.bitsForBytesDeviation} + ${f.bitsForMillisecondsDeviation}) must be a multiple of 4`, ref, id)
      }
      break
    case 'equ2':
      checkFrequencies(f.points.map((p) => p.frequency), f, major, out)
      break
    case 'equa':
      // SPEC: v2.3/v2.2 §4.13 "This value may not be $00."
      if (f.adjustmentBits === 0) out.error('equa-bits', 'adjustment bits may not be $00', ref, id)
      checkFrequencies(f.bands.map((b) => b.frequency), f, major, out)
      break
    case 'rvad':
      // SPEC: v2.3/v2.2 §4.12 "This value may not be $00."
      if (f.bitsUsed === 0) out.error('rvad-bits', 'bits used for volume description may not be $00', ref, id)
      break
    case 'popm':
      if (!Number.isInteger(f.rating) || f.rating < 0 || f.rating > 255) out.error('popm-rating', `rating ${f.rating} is outside 0-255`, ref, id)
      break
    case 'picture':
      checkPicture(f, major, out)
      break
    case 'owne':
      if (!PRICE.test(f.pricePaid)) {
        out.error('owne-price', `price paid "${f.pricePaid}" is not a currency code followed by a numerical string`, ref, id)
      }
      if (!isYyyymmdd(f.purchaseDate)) out.error('owne-date', `date of purchase "${f.purchaseDate}" is not a valid YYYYMMDD date`, ref, id)
      break
    case 'comr':
      checkCommercial(f, major, out)
      break
    case 'encr':
    case 'grid': {
      const sym = f.type === 'encr' ? f.methodSymbol : f.groupSymbol
      // SPEC: v2.3 §4.26/§4.27 "Values below $80 are reserved."; v2.4 §4.25/§4.26 "in the range
      // $80-F0. All other values are reserved."
      if (sym < 0x80 || (major === 4 && sym > 0xf0)) {
        out.error('symbol-range', `symbol ${hexByte(sym)} is reserved; use ${major === 4 ? '$80-$F0' : '$80 or above'}`, ref, id)
      }
      break
    }
    default:
      break
  }
}

function checkStrings(f: Frame, major: MajorVersion, out: Issues): void {
  const enc = encodingOf(f)
  const ref = stringsRef(major)
  for (const s of stringFields(f, major)) {
    const isLatin1 = s.kind !== 'encoded' || enc === TextEncoding.Latin1
    // one issue per field: the first offending character
    for (const ch of s.value) {
      const c = ch.codePointAt(0)!
      if (isLatin1 && c > 0xff) {
        out.error(s.kind === 'url' ? 'url-latin1' : 'latin1-range', `${s.name} contains U+${c.toString(16).toUpperCase()}, which is not ISO-8859-1`, ref, f.id)
        break
      }
      if (c >= 0x20) continue
      if (c === 0x0a && s.full) continue
      if (c === 0x0a) {
        // SPEC: "If nothing else is said newline character is forbidden."
        out.error(s.kind === 'url' ? 'url-control-char' : 'newline-forbidden', `${s.name} contains a newline, which is not allowed here`, ref, f.id)
      } else if (isLatin1) {
        // SPEC: ISO-8859-1 strings are "characters in the range $20 - $FF"; a newline is "$0A only".
        out.error(s.kind === 'url' ? 'url-control-char' : 'control-char', `${s.name} contains control character ${hexByte(c)}`, ref, f.id)
      } else {
        // The $20-$FF range is only stated for ISO-8859-1 strings.
        out.warn('control-char', `${s.name} contains control character U+${c.toString(16).toUpperCase().padStart(4, '0')}`, ref, f.id)
      }
      break
    }
  }
}

const NUMERIC = new Set(['TBPM', 'TLEN', 'TDLY', 'TSIZ', 'TYER', 'TDAT', 'TIME', 'TORY'])
const TIMESTAMPS = new Set(['TDEN', 'TDOR', 'TDRC', 'TDRL', 'TDTG'])

function checkTextFormat(f: FrameOf<'text'>, major: MajorVersion, out: Issues): void {
  const cid = canonicalId(f, major)
  if (!cid) return
  const ref = frameRef(f, major)
  const id = f.id
  const values = f.values
  const bad = (code: string, what: string) => (v: string) => out.error(code, `"${v}" is not ${what}`, ref, id)

  if (NUMERIC.has(cid)) {
    for (const v of values) if (!/^\d+$/.test(v)) bad('numeric-string', 'a numeric string')(v)
    // SPEC: v2.3 §3.3 / v2.2 §3.2 "All numeric strings ... are always encoded as ISO-8859-1."
    if (major < 4 && f.encoding !== TextEncoding.Latin1) {
      out.warn('numeric-encoding', 'numeric strings are always encoded as ISO-8859-1', stringsRef(major), id)
    }
  }
  switch (cid) {
    case 'TYER':
    case 'TORY':
      // SPEC: v2.3 TYER "always four characters long"; TORY "formatted as in the TYER frame"
      // (the v2.2 TOR entry says "TDY", read as TYE).
      for (const v of values) if (!/^\d{4}$/.test(v)) bad('year-format', 'a four-digit year')(v)
      break
    case 'TDAT':
      for (const v of values) {
        const m = /^(\d{2})(\d{2})$/.exec(v)
        if (!m || +m[2]! < 1 || +m[2]! > 12 || +m[1]! < 1 || +m[1]! > daysInMonth(undefined, +m[2]!)) bad('date-format', 'a valid DDMM date')(v)
      }
      break
    case 'TIME':
      for (const v of values) {
        const m = /^(\d{2})(\d{2})$/.exec(v)
        if (!m || +m[1]! > 23 || +m[2]! > 59) bad('time-format', 'a valid HHMM time')(v)
      }
      break
    case 'TRCK':
    case 'TPOS':
      // SPEC: v2.4 §4.2.1 "a numeric string ... MAY be extended with a "/" character and a numeric string"
      for (const v of values) if (!/^\d+(\/\d+)?$/.test(v)) bad('number-format', 'a numeric string optionally followed by "/" and a numeric string')(v)
      break
    case 'TCOP':
    case 'TPRO':
      // SPEC: v2.4 §4.2.4 / v2.3 TCOP / v2.2 TCR "must begin with a year and a space character"
      for (const v of values) if (!/^\d{4} /.test(v)) bad('copyright-format', 'a string beginning with a year and a space')(v)
      break
    case 'TKEY':
      // SPEC: maximum three characters; keys A-G, half keys "b"/"#", minor "m"; off key "o" only.
      for (const v of values) if (!/^([A-G][b#]?m?|o)$/.test(v)) bad('key-format', 'a key such as "C", "F#", "Dbm" or "o"')(v)
      break
    case 'TSRC':
      // SPEC: "should contain the International Standard Recording Code (12 characters)"; ISO 3901
      // allows 0-9 and A-Z only (spec/id3v2/reference/ISO-3901-ISRC.md).
      for (const v of values) if (!/^[A-Z0-9]{12}$/.test(v)) out.warn('isrc-format', `"${v}" is not a 12-character ISRC`, ref, id)
      break
    case 'TLAN':
      // SPEC: "should contain the languages ... three characters according to ISO-639-2"
      for (const v of values) if (!/^[A-Za-z]{3}$/.test(v)) out.warn('language-format', `"${v}" is not a three-letter ISO-639-2 code`, ref, id)
      break
    default:
      if (major === 4 && TIMESTAMPS.has(cid)) {
        // SPEC: v2.4 structure §4; "For durations, use the slash character as described in 8601".
        for (const v of values) {
          const parts = v.split('/')
          if (parts.length > 2 || !parts.every(isTimestamp)) {
            out.error('timestamp-format', `"${v}" is not a timestamp (yyyy[-MM[-dd[THH[:mm[:ss]]]]])`, `${ref}, v2.4 structure §4`, id)
          }
        }
      }
  }
}

function checkLanguage(lang: string, f: Frame, major: MajorVersion, out: Issues): void {
  const ref = stringsRef(major)
  if (!/^[A-Za-z]{3}$/.test(lang)) {
    out.error('language-format', `language "${lang}" is not a three-letter ISO-639-2 code`, ref, f.id)
  } else if (major === 4 && lang !== 'XXX' && lang !== lang.toLowerCase()) {
    // SPEC: v2.4 structure §4 "The language should be represented in lower case. If the language
    // is not known the string "XXX" should be used."
    out.warn('language-case', `language "${lang}" should be lower case (or "XXX" when unknown)`, ref, f.id)
  }
}

function checkSorted(stamps: number[], f: Frame, major: MajorVersion, out: Issues, must: boolean): void {
  for (let i = 1; i < stamps.length; i++) {
    if (stamps[i]! < stamps[i - 1]!) {
      const text = `time stamps are not in chronological order (${stamps[i - 1]} before ${stamps[i]})`
      if (must) out.error('not-chronological', text, frameRef(f, major), f.id)
      else out.warn('not-chronological', text, frameRef(f, major), f.id)
      return
    }
  }
}

/** EQU2 / EQUA: "ordered by frequency and one frequency should only be described once". */
function checkFrequencies(freqs: number[], f: Frame, major: MajorVersion, out: Issues): void {
  const ref = frameRef(f, major)
  for (let i = 1; i < freqs.length; i++) {
    if (freqs[i]! < freqs[i - 1]!) {
      out.warn('frequency-order', 'adjustment points should be ordered by frequency', ref, f.id)
      break
    }
  }
  if (new Set(freqs).size !== freqs.length) out.warn('frequency-duplicate', 'a frequency should only be described once', ref, f.id)
}

function checkPicture(f: FrameOf<'picture'>, major: MajorVersion, out: Issues): void {
  const ref = frameRef(f, major)
  // SPEC: v2.3 §4.15 / v2.2 §4.15 "The description has a maximum length of 64 characters"
  // (dropped in v2.4).
  if (major < 4 && chars(f.description) > 64) out.error('picture-description-length', `description is ${chars(f.description)} characters, at most 64 allowed`, ref, f.id)
  // SPEC: picture type $01 "32x32 pixels 'file icon' (PNG only)"
  if (f.pictureType === 1 && f.mimeType !== '-->') {
    const mime = pictureMimeType(f, major)
    const size = pngSize(f.data)
    if (mime !== 'image/png' || !size) out.error('file-icon-format', 'picture type $01 (file icon) must be a PNG', ref, f.id)
    else if (size.width !== 32 || size.height !== 32) out.error('file-icon-size', `picture type $01 (file icon) must be 32x32 pixels, got ${size.width}x${size.height}`, ref, f.id)
  }
}

function checkCommercial(f: FrameOf<'comr'>, major: MajorVersion, out: Issues): void {
  const ref = frameRef(f, major)
  const currencies = new Set<string>()
  for (const p of f.prices.split('/')) {
    const m = PRICE.exec(p)
    if (!m) {
      out.error('comr-price', `price "${p}" is not a currency code followed by a numerical string`, ref, f.id)
      continue
    }
    // SPEC: "there may only be one currency of each type"
    if (currencies.has(m[1]!)) out.error('comr-currency-duplicate', `currency ${m[1]} appears more than once`, ref, f.id)
    currencies.add(m[1]!)
  }
  if (!isYyyymmdd(f.validUntil)) out.error('comr-date', `valid until "${f.validUntil}" is not a valid YYYYMMDD date`, ref, f.id)
  if (f.logoMimeType !== undefined && f.logoMimeType !== '') {
    // SPEC: "In the event that the MIME media type name is omitted, "image/" will be implied.
    // Currently only "image/png" and "image/jpeg" are allowed."
    const mime = f.logoMimeType.includes('/') ? f.logoMimeType : `image/${f.logoMimeType}`
    if (mime !== 'image/png' && mime !== 'image/jpeg') out.error('comr-logo-format', `seller logo MIME type "${f.logoMimeType}" is not image/png or image/jpeg`, ref, f.id)
  }
}

function checkCrossFrame(top: readonly Frame[], all: readonly Frame[], major: MajorVersion, out: Issues): void {
  const has = (cid: string) => top.some((f) => canonicalId(f, major) === cid)
  for (const f of top) {
    const cid = canonicalId(f, major)
    // SPEC: v2.4 §4.4 "the presence of a valid "TRCK" frame is REQUIRED"; v2.3 §4.5; v2.2 §4.5
    // "This frame requires a present and valid "TRK" frame."
    if (cid === 'MCDI' && !has('TRCK')) out.error('mcdi-requires-trck', `${f.id} requires a ${major === 2 ? 'TRK' : 'TRCK'} frame`, frameRef(f, major), f.id)
    // SPEC: v2.4 §4.30 "The presence of an ASPI frame requires the existence of a TLEN frame"
    if (cid === 'ASPI' && !has('TLEN')) out.error('aspi-requires-tlen', 'ASPI requires a TLEN frame', frameRef(f, major), f.id)
  }
  if (major === 2) return

  const encrRef = sec(major, '4.25', '4.26')
  const gridRef = sec(major, '4.26', '4.27')
  const methods = new Set<number>()
  const groups = new Set<number>()
  for (const f of all) {
    if (f.flags.encryptionMethod !== undefined) methods.add(f.flags.encryptionMethod)
    if (f.flags.groupId !== undefined) groups.add(f.flags.groupId)
  }
  const registered = (type: 'encr' | 'grid') =>
    new Set(all.flatMap((f) => (f.type === 'encr' && type === 'encr' ? [f.methodSymbol] : f.type === 'grid' && type === 'grid' ? [f.groupSymbol] : [])))
  const encr = registered('encr')
  const grid = registered('grid')
  for (const f of all) {
    // SPEC: "the encryption method must be registered in the tag with this frame" (ENCR) and "a
    // group identifier must be registered in the tag with this frame" (GRID).
    const m = f.flags.encryptionMethod
    if (m !== undefined && !encr.has(m)) out.error('encryption-unregistered', `encryption method ${hexByte(m)} has no ENCR frame`, encrRef, f.id)
    const g = f.flags.groupId
    if (g !== undefined && !grid.has(g)) out.error('group-unregistered', `group ${hexByte(g)} has no GRID frame`, gridRef, f.id)
    // SPEC: "The method must be used somewhere in the tag." / "The group symbol must be used
    // somewhere in the tag."
    if (f.type === 'encr' && !methods.has(f.methodSymbol)) out.error('encryption-unused', `encryption method ${hexByte(f.methodSymbol)} is not used by any frame`, encrRef, f.id)
    if (f.type === 'grid' && !groups.has(f.groupSymbol)) out.error('group-unused', `group symbol ${hexByte(f.groupSymbol)} is not used by any frame`, gridRef, f.id)
  }
}

function checkChapters(all: readonly Frame[], major: MajorVersion, out: Issues): void {
  const elements = all.filter((f): f is FrameOf<'chap'> | FrameOf<'ctoc'> => f.type === 'chap' || f.type === 'ctoc')
  if (elements.length === 0) return
  const CHAP = 'chapters addendum §3.1'
  const CTOC = 'chapters addendum §3.2'
  const byId = new Map<string, FrameOf<'chap'> | FrameOf<'ctoc'>>()
  for (const f of elements) {
    // SPEC: "each must have an Element ID that is unique with respect to any other "CHAP" frame or
    // "CTOC" frame in the tag"
    if (byId.has(f.elementId)) out.error('duplicate-element-id', `element ID "${f.elementId}" is used by more than one CHAP/CTOC frame`, f.type === 'chap' ? CHAP : CTOC, f.id)
    else byId.set(f.elementId, f)
    // SPEC: Notes 3: "It is recommended that "CHAP" and "CTOC" frames should include a TIT2 sub-frame"
    if (!f.frames.some((s) => s.id === 'TIT2')) out.warn('chapter-title', `${f.id} "${f.elementId}" should include a TIT2 sub-frame`, 'chapters addendum §4', f.id)
  }
  const tocs = elements.filter((f): f is FrameOf<'ctoc'> => f.type === 'ctoc')
  const children = new Set(tocs.flatMap((t) => t.childElementIds))
  const topLevel = tocs.filter((t) => t.topLevel)
  // SPEC: "Only one "CTOC" frame in an ID3v2 tag can have this bit set to 1."
  if (topLevel.length > 1) out.error('ctoc-top-level', `${topLevel.length} CTOC frames have the top-level bit set; only one may`, CTOC, 'CTOC')
  for (const t of tocs) {
    // SPEC: "The Entry count ... must be greater than zero."
    if (t.childElementIds.length === 0) out.error('ctoc-empty', `CTOC "${t.elementId}" has no child element IDs`, CTOC, t.id)
    // SPEC: the top-level CTOC "is not a child of any other "CTOC" frame"
    if (t.topLevel && children.has(t.elementId)) out.error('ctoc-top-level-child', `top-level CTOC "${t.elementId}" is a child of another CTOC`, CTOC, t.id)
    // SPEC: child element IDs "match the Element IDs of other "CHAP" and "CTOC" frames in the tag"
    for (const c of t.childElementIds) {
      if (!byId.has(c)) out.error('ctoc-child-missing', `CTOC "${t.elementId}" lists child "${c}", which is not a CHAP or CTOC element ID`, CTOC, t.id)
    }
  }
  // The table of contents is a tree: no CTOC may reach itself through its children.
  const state = new Map<string, 1 | 2>()
  let cycle: string | undefined
  const visit = (id: string): void => {
    if (cycle !== undefined) return
    const t = byId.get(id)
    if (!t || t.type !== 'ctoc') return
    const s = state.get(id)
    if (s === 2) return
    if (s === 1) {
      cycle = id
      return
    }
    state.set(id, 1)
    for (const c of t.childElementIds) visit(c)
    state.set(id, 2)
  }
  for (const t of tocs) visit(t.elementId)
  if (cycle !== undefined) out.error('ctoc-cycle', `the table of contents has a cycle through "${cycle}"`, CTOC, 'CTOC')
}

function checkRestrictions(tag: ID3v2Tag, all: readonly Frame[], r: TagRestrictions, out: Issues): void {
  const REF = 'v2.4 structure §3.2'
  const lim = describeRestrictions(r)

  // p: frame count and total tag size
  if (tag.frames.length > lim.maxFrames) out.error('restriction-frame-count', `${tag.frames.length} frames, the tag restrictions allow ${lim.maxFrames}`, REF)
  const size = tagSize(tag)
  if (size === undefined) out.warn('restriction-tag-size-unknown', 'the tag size could not be computed (a frame cannot be encoded)', REF)
  else if (size > lim.maxTagSize) out.error('restriction-tag-size', `the tag is ${size} bytes, the tag restrictions allow ${lim.maxTagSize}`, REF)

  for (const f of all) {
    if (!isDecoded(f)) continue
    // q: "Strings are only encoded with ISO-8859-1 or UTF-8."
    const enc = encodingOf(f)
    if (lim.encodings && enc !== undefined && !lim.encodings.includes(enc)) {
      out.error('restriction-encoding', `text encoding ${hexByte(enc)} is not ISO-8859-1 or UTF-8`, REF, f.id)
    }
    // r: "No string is longer than N characters. ... If a text frame consists of more than one
    // string, the sum of the strungs is restricted as stated."
    const max = lim.maxStringLength
    if (max !== undefined) {
      const fields = stringFields(f, 4)
      const lengths: [string, number][] = []
      if (f.type === 'text' || f.type === 'user-text') {
        lengths.push(['text', f.values.reduce((n, v) => n + chars(v), 0)])
        for (const s of fields) if (s.name === 'description') lengths.push([s.name, chars(s.value)])
      } else for (const s of fields) lengths.push([s.name, chars(s.value)])
      for (const [name, n] of lengths) {
        if (n > max) out.error('restriction-string-length', `${name} is ${n} characters, the tag restrictions allow ${max}`, REF, f.id)
      }
    }
    // s and t: images
    const image = f.type === 'picture' && f.mimeType !== '-->' ? { mime: pictureMimeType(f, 4), data: f.data, icon: f.pictureType === 1 } : f.type === 'comr' && f.logo && f.logo.length > 0 ? { mime: logoMime(f.logoMimeType ?? ''), data: f.logo, icon: false } : undefined
    if (!image) continue
    if (lim.imageMimeTypes && !lim.imageMimeTypes.includes(image.mime)) {
      out.error('restriction-image-format', `image type "${image.mime}" is not PNG or JPEG`, REF, f.id)
    }
    if (lim.maxImageSize !== undefined || lim.exactImageSize !== undefined) {
      const dim = imageSize(image.data)
      if (!dim) {
        out.warn('restriction-image-size-unknown', 'the image size could not be read (not a PNG or JPEG)', REF, f.id)
      } else if (lim.maxImageSize !== undefined && (dim.width > lim.maxImageSize || dim.height > lim.maxImageSize)) {
        out.error('restriction-image-size', `image is ${dim.width}x${dim.height}, the tag restrictions allow ${lim.maxImageSize}x${lim.maxImageSize} or smaller`, REF, f.id)
      } else if (lim.exactImageSize !== undefined && (dim.width !== lim.exactImageSize || dim.height !== lim.exactImageSize)) {
        // SPEC: "exactly 64x64 pixels, unless required otherwise": the $01 file icon is required
        // to be 32x32 (v2.4 frames §4.14).
        if (!(image.icon && dim.width === 32 && dim.height === 32)) {
          out.error('restriction-image-size', `image is ${dim.width}x${dim.height}, the tag restrictions require exactly ${lim.exactImageSize}x${lim.exactImageSize}`, REF, f.id)
        }
      }
    }
  }
}

function logoMime(m: string): string {
  return m.includes('/') ? m : `image/${m.toLowerCase()}`
}

/** Header + extended header + frames + padding + footer, as the writer would emit the frames. */
function tagSize(tag: ID3v2Tag): number | undefined {
  const w = new WarningSink(false)
  let n = 10
  const ext = tag.extendedHeader
  if (ext?.version === 4) n += serializeExtendedHeaderV24(ext).length
  const unsync = tag.flags.unsynchronisation ? true : ('preserve' as const)
  try {
    for (const f of tag.frames) n += encodeFrameForWrite(f, 4, w, { unsynchronisation: unsync }).length
  } catch {
    return undefined
  }
  n += tag.flags.footer ? 10 : tag.padding
  return n
}
