import { ascii, asciiString, concat, startsWith } from '../core/bytes.js'
import { decodeLatin1, encodeLatin1 } from '../core/encoding.js'
import { TagWriteError, WarningSink, type Warning } from '../core/errors.js'

// SPEC: docs/lyrics3/Lyrics3.txt and docs/lyrics3/Lyrics3v2.txt.
// Lyrics3 sits "between the audio and the ID3 tag". v1: "LYRICSBEGIN" + text + "LYRICSEND".
// v2.00: "LYRICSBEGIN" + fields + 6-digit size + "LYRICS200", each field being a 3-character ID,
// a 5-digit size and the data.
//
// SPEC discrepancies in Lyrics3v2.txt, and what we do:
// - The overview says a field has "six characters describing the size", but the field table
//   (`00003`, `99999`), the example (`IND00003`) and the reading steps ("Read 5 characters as a
//   number") all use 5. We use 5.
// - D2: the example's prose says "All the fields together (with the 'LYRICSBEGIN') is 001064
//   chars", but counting the example byte by byte (with [CR][LF] as two bytes and no other
//   newlines) gives 1065, which is what the published trailer `001065LYRICS200` says. We implement
//   the normative rule (size = bytes from "LYRICSBEGIN" up to the size field); the trailer is right
//   and the prose total is off by one.
// - The prose says "The indications field size is two bytes. They are two '1'", but the example
//   field is `IND00003` / `110` and the table says IND is "always three (3) characters big in
//   v2.00". We use 3.

export const LYRICS_BEGIN = 'LYRICSBEGIN'
export const LYRICS_END_V1 = 'LYRICSEND'
export const LYRICS_END_V2 = 'LYRICS200'
/** Length of "LYRICSEND" / "LYRICS200". */
export const LYRICS3_END_MARKER_SIZE = 9
// SPEC: Lyrics3.txt "The maximum length of the lyrics is 5100 bytes."
export const LYRICS3V1_MAX_SIZE = 5100
// SPEC: Lyrics3.txt "it shouldn't be larger than 4096 bytes."
export const LYRICS3V1_RECOMMENDED_SIZE = 4096

const ID3V1_SIZE = 128
const BEGIN_SIZE = LYRICS_BEGIN.length
const SIZE_DIGITS = 6
const FIELD_SIZE_DIGITS = 5
const FIELD_HEADER_SIZE = 3 + FIELD_SIZE_DIGITS
const CRLF = '\r\n'

// SPEC: Lyrics3v2.txt "Defined fields" table (ID / Max size).
export const LYRICS3V2_FIELD_MAX: Readonly<Record<string, number>> = {
  IND: 3,
  LYR: 99999,
  INF: 99999,
  AUT: 250,
  EAL: 250,
  EAR: 250,
  ETT: 250,
  IMG: 99999,
}
/** Largest size a 5-digit field size can express; applies to unknown fields. */
export const LYRICS3V2_FIELD_SIZE_LIMIT = 99999
/** Largest size the 6-digit tag size can express. */
export const LYRICS3V2_TAG_SIZE_LIMIT = 999999

export interface Lyrics3v1Tag {
  version: 1
  lyrics: string
}

export interface Lyrics3v2Field {
  /** Three-character field ID, e.g. "LYR". Unknown IDs are kept as is. */
  id: string
  /** ISO-8859-1 text; multi-line values use CR+LF. */
  value: string
}

export interface Lyrics3v2Tag {
  version: 2
  fields: Lyrics3v2Field[]
}

export type Lyrics3Tag = Lyrics3v1Tag | Lyrics3v2Tag

export interface Lyrics3ReadOptions {
  /** The first warning throws a {@link TagReadError}. */
  strict?: boolean
  /** Receives the warnings, including those raised when null is returned. */
  warnings?: WarningSink
}

export interface Lyrics3WriteOptions {
  /** Receives non-fatal notes (e.g. v1 lyrics longer than the recommended 4096 bytes). */
  warnings?: WarningSink
}

export interface Lyrics3Location {
  tag: Lyrics3Tag
  /** Offset of "LYRICSBEGIN". */
  start: number
  /** Offset just after "LYRICSEND" / "LYRICS200". */
  end: number
  warnings: Warning[]
}

function sinkOf(opts: Lyrics3ReadOptions): WarningSink {
  return opts.warnings ?? new WarningSink(opts.strict ?? false)
}

function indexOfMarker(data: Uint8Array, marker: string, from: number, to: number): number {
  for (let i = Math.max(0, from); i + marker.length <= to; i++) if (startsWith(data, marker, i)) return i
  return -1
}

function digits(data: Uint8Array, offset: number, n: number): number | undefined {
  if (offset < 0 || offset + n > data.length) return undefined
  let v = 0
  for (let i = 0; i < n; i++) {
    const c = data[offset + i]!
    if (c < 0x30 || c > 0x39) return undefined
    v = v * 10 + (c - 0x30)
  }
  return v
}

function pad(n: number, width: number): string {
  return String(n).padStart(width, '0')
}

// ---------------------------------------------------------------------------------------------
// Locating
// ---------------------------------------------------------------------------------------------

/**
 * Finds a Lyrics3 v1 or v2 tag in a whole file.
 *
 * SPEC: Lyrics3.txt "If the file has an ID3v1 Tag, the Lyrics 2 Tag's end will be 137 bytes from
 * the end of the file". "The end tag is located either 9 bytes from the end of a file with no
 * ID3v1 Tag, or 137 bytes from the end of a file containing ID3v1 Tag."
 */
export function findLyrics3(file: Uint8Array, opts: Lyrics3ReadOptions = {}): Lyrics3Location | null {
  const w = sinkOf(opts)
  const hasV1 = file.length >= ID3V1_SIZE && startsWith(file, 'TAG', file.length - ID3V1_SIZE)
  const end = hasV1 ? file.length - ID3V1_SIZE : file.length
  const markerStart = end - LYRICS3_END_MARKER_SIZE
  if (markerStart < 0) return null

  if (startsWith(file, LYRICS_END_V2, markerStart)) {
    if (!hasV1) {
      // SPEC: Lyrics3v2.txt "it resides between the audio and the ID3 tag, which must be present."
      w.warn('lyrics3-no-id3v1', 'Lyrics3 v2.00 tag without an ID3v1 tag after it', { offset: markerStart })
    }
    const r = locateV2(file, markerStart, w)
    return r && { ...r, end, warnings: w.list }
  }
  if (startsWith(file, LYRICS_END_V1, markerStart)) {
    if (!hasV1) {
      // SPEC: Lyrics3.txt "If no ID3 tag is present one must be attached", yet the same page
      // describes locating the end tag "9 bytes from the end of a file with no ID3v1 Tag".
      w.note('lyrics3-no-id3v1', 'Lyrics3 v1 tag without an ID3v1 tag after it', { offset: markerStart })
    }
    const r = locateV1(file, markerStart, w)
    return r && { ...r, end, warnings: w.list }
  }
  return null
}

function locateV1(file: Uint8Array, markerStart: number, w: WarningSink): { tag: Lyrics3v1Tag; start: number } | null {
  // SPEC: Lyrics3.txt "Once the end tag is located seek back 5100 bytes and then search forward
  // for the begin tag." Seeking back 5100 bytes from the end tag would land on the first lyrics
  // byte of a maximal (5100-byte) tag and miss its "LYRICSBEGIN", so the window also covers the
  // 11 bytes of the keyword itself.
  const from = markerStart - LYRICS3V1_MAX_SIZE - BEGIN_SIZE
  const start = indexOfMarker(file, LYRICS_BEGIN, from, markerStart)
  if (start === -1) {
    w.warn('lyrics3-no-begin', 'LYRICSEND found but no LYRICSBEGIN within 5100 bytes before it', {
      offset: markerStart,
    })
    return null
  }
  const tag = parseV1Text(file.subarray(start + BEGIN_SIZE, markerStart), start + BEGIN_SIZE, w)
  return { tag, start }
}

function locateV2(file: Uint8Array, markerStart: number, w: WarningSink): { tag: Lyrics3v2Tag; start: number } | null {
  // SPEC: Lyrics3v2.txt "Read the previous 6 bytes, which are text digits ... Seek back in the
  // file from the beginning of the tag size field, the number of bytes read in the previous step.
  // Read 11 bytes forward. These 11 bytes must read LYRICSBEGIN."
  const sizeStart = markerStart - SIZE_DIGITS
  const size = digits(file, sizeStart, SIZE_DIGITS)
  if (size === undefined) {
    w.warn('lyrics3-size', 'the 6 bytes before LYRICS200 are not digits', { offset: Math.max(0, sizeStart) })
    return null
  }
  let start = sizeStart - size
  if (!startsWith(file, LYRICS_BEGIN, start)) {
    // Tolerant reader: some writers followed the example's prose total, which is one short (D2).
    const alt = [start - 1, start + 1].find((s) => startsWith(file, LYRICS_BEGIN, s))
    if (alt === undefined) {
      w.warn('lyrics3-no-begin', `no LYRICSBEGIN ${size} bytes before the size field`, { offset: Math.max(0, start) })
      return null
    }
    w.warn('lyrics3-size-mismatch', `size ${size} is off by ${start - alt}; LYRICSBEGIN is ${sizeStart - alt} bytes before the size field`, {
      offset: alt,
    })
    start = alt
  }
  const fields = parseLyrics3v2Fields(file.subarray(start + BEGIN_SIZE, sizeStart), { warnings: w }, start + BEGIN_SIZE)
  return { tag: { version: 2, fields }, start }
}

// ---------------------------------------------------------------------------------------------
// Parsing
// ---------------------------------------------------------------------------------------------

/**
 * Parses a standalone Lyrics3 block: "LYRICSBEGIN" ... "LYRICSEND", or
 * "LYRICSBEGIN" ... size "LYRICS200". Returns null when the block is not one.
 */
export function parseLyrics3(
  block: Uint8Array,
  opts: Lyrics3ReadOptions = {},
): { tag: Lyrics3Tag; warnings: Warning[] } | null {
  const w = sinkOf(opts)
  if (!startsWith(block, LYRICS_BEGIN, 0)) return null
  const markerStart = block.length - LYRICS3_END_MARKER_SIZE
  if (markerStart < BEGIN_SIZE) return null
  if (startsWith(block, LYRICS_END_V1, markerStart)) {
    return { tag: parseV1Text(block.subarray(BEGIN_SIZE, markerStart), BEGIN_SIZE, w), warnings: w.list }
  }
  if (startsWith(block, LYRICS_END_V2, markerStart)) {
    const sizeStart = markerStart - SIZE_DIGITS
    const size = digits(block, sizeStart, SIZE_DIGITS)
    if (size === undefined || sizeStart < BEGIN_SIZE) {
      w.warn('lyrics3-size', 'the 6 bytes before LYRICS200 are not digits', { offset: Math.max(0, sizeStart) })
      return null
    }
    if (size !== sizeStart) {
      w.warn('lyrics3-size-mismatch', `size field says ${size} but LYRICSBEGIN is ${sizeStart} bytes before it`, {
        offset: sizeStart,
      })
    }
    const fields = parseLyrics3v2Fields(block.subarray(BEGIN_SIZE, sizeStart), { warnings: w }, BEGIN_SIZE)
    return { tag: { version: 2, fields }, warnings: w.list }
  }
  return null
}

function parseV1Text(text: Uint8Array, offset: number, w: WarningSink): Lyrics3v1Tag {
  // SPEC: Lyrics3.txt "A byte in the text must not have the binary value 255."
  const ff = text.indexOf(0xff)
  if (ff !== -1) w.warn('lyrics3-ff', 'Lyrics3 v1 text contains a $FF byte', { offset: offset + ff })
  // SPEC: Lyrics3.txt "The maximum length of the lyrics is 5100 bytes."
  if (text.length > LYRICS3V1_MAX_SIZE) {
    w.warn('lyrics3-v1-size', `Lyrics3 v1 text is ${text.length} bytes; the maximum is 5100`, { offset })
  }
  return { version: 1, lyrics: decodeLatin1(text) }
}

/**
 * Parses the field area of a Lyrics3 v2.00 tag (the bytes after "LYRICSBEGIN" and before the
 * 6-digit size). Unknown field IDs are kept, in order.
 *
 * SPEC: Lyrics3v2.txt "Read 3 chars, which are the field ID. Read 5 characters as a number which
 * contain the number of bytes of data for this field. If you already read LSZ bytes including the
 * 'LYRICSBEGIN' then stop reading fields."
 */
export function parseLyrics3v2Fields(
  data: Uint8Array,
  opts: Lyrics3ReadOptions = {},
  /** Offset of `data` in the file, for warning offsets. */
  baseOffset = 0,
): Lyrics3v2Field[] {
  const w = sinkOf(opts)
  const fields: Lyrics3v2Field[] = []
  let pos = 0
  while (pos < data.length) {
    if (pos + FIELD_HEADER_SIZE > data.length) {
      w.warn('lyrics3-trailing', `${data.length - pos} bytes after the last field`, { offset: baseOffset + pos })
      break
    }
    const id = asciiString(data.subarray(pos, pos + 3))
    const size = digits(data, pos + 3, FIELD_SIZE_DIGITS)
    if (size === undefined) {
      w.warn('lyrics3-field-size', `field ${JSON.stringify(id)} has a non-numeric size`, {
        offset: baseOffset + pos + 3,
        frameId: id,
      })
      break
    }
    const dataStart = pos + FIELD_HEADER_SIZE
    let dataEnd = dataStart + size
    if (dataEnd > data.length) {
      w.warn('lyrics3-field-overrun', `field ${id} is ${size} bytes but only ${data.length - dataStart} remain`, {
        offset: baseOffset + pos,
        frameId: id,
      })
      dataEnd = data.length
    }
    const raw = data.subarray(dataStart, dataEnd)
    checkFieldOnRead(id, raw, fields.length, baseOffset + pos, w)
    fields.push({ id, value: decodeLatin1(raw) })
    pos = dataEnd
  }
  // SPEC: Lyrics3v2.txt "There are no required fields in the tag, but at least one field must exist."
  if (fields.length === 0) w.warn('lyrics3-no-fields', 'Lyrics3 v2.00 tag has no fields', { offset: baseOffset })
  return fields
}

function checkFieldOnRead(id: string, raw: Uint8Array, index: number, offset: number, w: WarningSink): void {
  // SPEC: Lyrics3v2.txt "Fields can appear in any order in the tag, except the indication (IND)
  // field which must be the first field if used."
  if (id === 'IND' && index !== 0) w.warn('lyrics3-ind-order', 'IND is not the first field', { offset, frameId: id })
  const max = LYRICS3V2_FIELD_MAX[id]
  if (max !== undefined && raw.length > max) {
    w.warn('lyrics3-field-max', `field ${id} is ${raw.length} bytes; the maximum is ${max}`, { offset, frameId: id })
  }
  // SPEC: Lyrics3v2.txt "The data in a field can consist of ASCII characters in the range 01 to 254".
  const bad = raw.findIndex((b) => b === 0x00 || b === 0xff)
  if (bad !== -1) {
    w.warn('lyrics3-field-char', `field ${id} contains a $${raw[bad] === 0 ? '00' : 'FF'} byte`, {
      offset: offset + FIELD_HEADER_SIZE + bad,
      frameId: id,
    })
  }
}

// ---------------------------------------------------------------------------------------------
// Serialising
// ---------------------------------------------------------------------------------------------

/** Serialises a Lyrics3 tag, from "LYRICSBEGIN" through "LYRICSEND" / "LYRICS200". */
export function serializeLyrics3(tag: Lyrics3Tag, opts: Lyrics3WriteOptions = {}): Uint8Array {
  return tag.version === 1 ? serializeV1(tag, opts) : serializeV2(tag)
}

function serializeV1(tag: Lyrics3v1Tag, opts: Lyrics3WriteOptions): Uint8Array {
  const text = encodeLatin1(tag.lyrics)
  // SPEC: Lyrics3.txt "The keywords "LYRICSBEGIN" and "LYRICSEND" must not be present in the lyrics."
  for (const k of [LYRICS_BEGIN, LYRICS_END_V1]) {
    if (tag.lyrics.includes(k)) throw new TagWriteError('lyrics3-keyword', `Lyrics3 v1 text must not contain "${k}"`)
  }
  // SPEC: Lyrics3.txt "A byte in the text must not have the binary value 255."
  if (text.includes(0xff)) throw new TagWriteError('lyrics3-ff', 'Lyrics3 v1 text must not contain a $FF byte')
  // SPEC: Lyrics3.txt "The maximum length of the lyrics is 5100 bytes."
  if (text.length > LYRICS3V1_MAX_SIZE) {
    throw new TagWriteError('lyrics3-v1-size', `Lyrics3 v1 text is ${text.length} bytes; the maximum is 5100`)
  }
  // SPEC: Lyrics3.txt "it shouldn't be larger than 4096 bytes."
  if (text.length > LYRICS3V1_RECOMMENDED_SIZE) {
    opts.warnings?.note('lyrics3-v1-size', `Lyrics3 v1 text is ${text.length} bytes; it should not exceed 4096`)
  }
  return concat([ascii(LYRICS_BEGIN), text, ascii(LYRICS_END_V1)])
}

function serializeV2(tag: Lyrics3v2Tag): Uint8Array {
  // SPEC: Lyrics3v2.txt "at least one field must exist."
  if (tag.fields.length === 0) throw new TagWriteError('lyrics3-no-fields', 'Lyrics3 v2.00 tag needs at least one field')
  const parts: Uint8Array[] = [ascii(LYRICS_BEGIN)]
  let total = BEGIN_SIZE
  tag.fields.forEach((f, i) => {
    const id = encodeLatin1(f.id)
    if (id.length !== 3 || id.some((b) => b === 0x00 || b === 0xff)) {
      throw new TagWriteError('lyrics3-field-id', `field ID ${JSON.stringify(f.id)} must be 3 characters`)
    }
    // SPEC: "except the indication (IND) field which must be the first field if used."
    if (f.id === 'IND' && i !== 0) throw new TagWriteError('lyrics3-ind-order', 'IND must be the first field')
    const value = encodeLatin1(f.value)
    // SPEC: "The data in a field can consist of ASCII characters in the range 01 to 254".
    if (value.some((b) => b === 0x00 || b === 0xff)) {
      throw new TagWriteError('lyrics3-field-char', `field ${f.id} contains a $00 or $FF byte`)
    }
    const max = LYRICS3V2_FIELD_MAX[f.id] ?? LYRICS3V2_FIELD_SIZE_LIMIT
    if (value.length > max) {
      throw new TagWriteError('lyrics3-field-max', `field ${f.id} is ${value.length} bytes; the maximum is ${max}`)
    }
    parts.push(id, ascii(pad(value.length, FIELD_SIZE_DIGITS)), value)
    total += FIELD_HEADER_SIZE + value.length
  })
  // SPEC: "The size value includes the "LYRICSBEGIN" string, but does not include the 6 character
  // size descriptor and the trailing "LYRICS200" string."
  if (total > LYRICS3V2_TAG_SIZE_LIMIT) {
    throw new TagWriteError('lyrics3-size', `Lyrics3 v2.00 tag is ${total} bytes; the 6-digit size allows 999999`)
  }
  parts.push(ascii(pad(total, SIZE_DIGITS)), ascii(LYRICS_END_V2))
  return concat(parts)
}

// ---------------------------------------------------------------------------------------------
// Field accessors
// ---------------------------------------------------------------------------------------------

/** Value of the first field with this ID. */
export function getLyrics3Field(tag: Lyrics3v2Tag, id: string): string | undefined {
  return tag.fields.find((f) => f.id === id)?.value
}

/**
 * Sets (or with `undefined`, removes) a field, replacing the first one with this ID in place.
 * A new IND goes first; other new fields are appended.
 */
export function setLyrics3Field(tag: Lyrics3v2Tag, id: string, value: string | undefined): void {
  const i = tag.fields.findIndex((f) => f.id === id)
  if (value === undefined) {
    if (i !== -1) tag.fields.splice(i, 1)
  } else if (i !== -1) tag.fields[i] = { id, value }
  else if (id === 'IND') tag.fields.unshift({ id, value })
  else tag.fields.push({ id, value })
}

// ---------------------------------------------------------------------------------------------
// Timestamps
// ---------------------------------------------------------------------------------------------

export interface TimestampedLine {
  /** Every `[mm:ss]` stamp on the line, in seconds, in the order written. Empty when there is none. */
  times: number[]
  /** The line with its stamps removed. */
  text: string
}

// SPEC: "Timestamps are of the format '[mm:ss]' and may be embedded in the text at any location and
// may not contain spaces." The seconds are 00-59.
const STAMP = /\[(\d{2}):([0-5]\d)\]/g

/** Parses one `[mm:ss]` stamp to seconds, or undefined. */
export function parseTimestamp(stamp: string): number | undefined {
  const m = /^\[(\d{2}):([0-5]\d)\]$/.exec(stamp)
  return m ? Number(m[1]) * 60 + Number(m[2]) : undefined
}

/** Formats seconds (0..5999) as `[mm:ss]`. */
export function formatTimestamp(seconds: number): string {
  if (!Number.isInteger(seconds) || seconds < 0 || seconds > 99 * 60 + 59) {
    throw new TagWriteError('lyrics3-timestamp', `${seconds} s cannot be written as [mm:ss]`)
  }
  return `[${pad(Math.floor(seconds / 60), 2)}:${pad(seconds % 60, 2)}]`
}

/**
 * Splits lyrics into lines (CR+LF; a lone LF is tolerated) and pulls out the `[mm:ss]` stamps.
 * A line can carry several stamps ("a song can go back to the refrain several times"), and stamps
 * need not increase. A trailing CR+LF does not produce an extra empty line.
 */
export function parseTimestamps(text: string): TimestampedLine[] {
  const lines = text.split(/\r?\n/)
  if (lines.length > 1 && lines[lines.length - 1] === '') lines.pop()
  return lines.map((line) => {
    const times: number[] = []
    const rest = line.replace(STAMP, (_, mm: string, ss: string) => {
      times.push(Number(mm) * 60 + Number(ss))
      return ''
    })
    return { times, text: rest }
  })
}

// ---------------------------------------------------------------------------------------------
// IND
// ---------------------------------------------------------------------------------------------

export interface Lyrics3Indications {
  lyricsPresent: boolean
  timestampsPresent: boolean
  inhibitRandom: boolean
}

/**
 * SPEC: IND "The first byte indicates wether or not a lyrics field is present. "1" for present and
 * "0" for otherwise. The second character indicates if there is a timestamp in the lyrics. ... The
 * third character inhibits tracks for random selection - "1" if inhibited and "0" if not."
 * Missing characters read as "0"; characters beyond the third are ignored (a future standard may
 * make the field bigger).
 */
export function parseIndications(value: string): Lyrics3Indications {
  return {
    lyricsPresent: value[0] === '1',
    timestampsPresent: value[1] === '1',
    inhibitRandom: value[2] === '1',
  }
}

export function formatIndications(ind: Lyrics3Indications): string {
  const b = (x: boolean): string => (x ? '1' : '0')
  return b(ind.lyricsPresent) + b(ind.timestampsPresent) + b(ind.inhibitRandom)
}

// ---------------------------------------------------------------------------------------------
// IMG
// ---------------------------------------------------------------------------------------------

export interface Lyrics3Image {
  filename: string
  /** Up to 250 characters. */
  description?: string
  /** `[mm:ss]` as written. */
  timestamp?: string
}

// SPEC: IMG "Image lines include filename, description and timestamp separated by delimiter - two
// ASCII chars 124 ("||"). Description and timestamp are optional, but if timestamp is used, and
// there is no description, two delimiters ("||||") should be used between the filename and the
// timestamp. Multiple images are allowed by using a [CR][LF] delimiter between each image line.
// No [CR][LF] is needed after the last image line."
const IMG_SEP = '||'
const IMG_DESCRIPTION_MAX = 250

/** Parses an IMG field value. Empty lines are skipped. */
export function parseImages(value: string): Lyrics3Image[] {
  const out: Lyrics3Image[] = []
  for (const line of value.split(/\r?\n/)) {
    if (line === '') continue
    const [filename = '', description, timestamp] = line.split(IMG_SEP)
    const img: Lyrics3Image = { filename }
    if (description) img.description = description
    if (timestamp) img.timestamp = timestamp
    out.push(img)
  }
  return out
}

/** Formats an IMG field value. */
export function formatImages(images: readonly Lyrics3Image[]): string {
  return images
    .map((img) => {
      if (img.filename === '' || /\|\||[\r\n]/.test(img.filename)) {
        throw new TagWriteError('lyrics3-img', `image filename ${JSON.stringify(img.filename)} is empty or contains "||" or a newline`)
      }
      const desc = img.description ?? ''
      if (desc.length > IMG_DESCRIPTION_MAX) {
        throw new TagWriteError('lyrics3-img', `image description is ${desc.length} characters; the maximum is 250`)
      }
      if (/\|\||[\r\n]/.test(desc)) throw new TagWriteError('lyrics3-img', 'image description contains "||" or a newline')
      if (img.timestamp !== undefined) {
        if (parseTimestamp(img.timestamp) === undefined) {
          throw new TagWriteError('lyrics3-img', `image timestamp ${JSON.stringify(img.timestamp)} is not [mm:ss]`)
        }
        return img.filename + IMG_SEP + desc + IMG_SEP + img.timestamp
      }
      return desc ? img.filename + IMG_SEP + desc : img.filename
    })
    .join(CRLF)
}

/** The images of the IMG field, or [] when there is none. */
export function lyrics3Images(tag: Lyrics3v2Tag): Lyrics3Image[] {
  const v = getLyrics3Field(tag, 'IMG')
  return v === undefined ? [] : parseImages(v)
}

// ---------------------------------------------------------------------------------------------
// Extended EAL / EAR / ETT
// ---------------------------------------------------------------------------------------------

export interface ID3v1TextFields {
  title: string
  artist: string
  album: string
}

export type ExtendedFieldId = 'ETT' | 'EAR' | 'EAL'

const EXTENDED: ReadonlyArray<[ExtendedFieldId, keyof ID3v1TextFields]> = [
  ['ETT', 'title'],
  ['EAR', 'artist'],
  ['EAL', 'album'],
]
const ID3V1_FIELD_LENGTH = 30

export interface ResolvedExtendedFields extends ID3v1TextFields {
  /** Extended fields whose first 30 characters differ from the ID3v1 field. */
  mismatched: ExtendedFieldId[]
}

function sameAsId3v1(extended: string, id3v1: string): boolean {
  const head = extended.slice(0, ID3V1_FIELD_LENGTH)
  if (head === id3v1) return true
  // ID3v1 readers strip $00 padding and (by default) trailing spaces, so compare without them too.
  const trim = (s: string): string => s.replace(/[\0 ]+$/, '')
  return trim(head) === trim(id3v1)
}

/**
 * Picks the value to display for title, artist and album.
 *
 * SPEC: Lyrics3v2.txt "If these extended fields exist, make sure their first 30 chars are exactly
 * the same as the ones in the ID3v1 tag. If they are the same, display the extended field. If not,
 * display the one from the ID tag. These 'mismatched' extended fields, should be removed when
 * saving the lyrics tag."
 */
export function resolveExtendedFields(tag: Lyrics3v2Tag, id3v1: ID3v1TextFields): ResolvedExtendedFields {
  const out: ResolvedExtendedFields = { ...id3v1, mismatched: [] }
  for (const [id, key] of EXTENDED) {
    const v = getLyrics3Field(tag, id)
    if (v === undefined) continue
    if (sameAsId3v1(v, id3v1[key])) out[key] = v
    else out.mismatched.push(id)
  }
  return out
}

/** A copy of the tag without the mismatched extended fields ("should be removed when saving"). */
export function removeMismatchedExtended(tag: Lyrics3v2Tag, id3v1: ID3v1TextFields): Lyrics3v2Tag {
  const { mismatched } = resolveExtendedFields(tag, id3v1)
  return { version: 2, fields: tag.fields.filter((f) => !(mismatched as string[]).includes(f.id)) }
}

/**
 * The ID3v1 values implied by the extended fields: their first 30 characters.
 *
 * SPEC: "When saving the extended fields, make sure to copy the first 30 chars of each field to the
 * ID3 tag matching fields."
 */
export function extendedToId3v1(tag: Lyrics3v2Tag): Partial<ID3v1TextFields> {
  const out: Partial<ID3v1TextFields> = {}
  for (const [id, key] of EXTENDED) {
    const v = getLyrics3Field(tag, id)
    if (v !== undefined) out[key] = v.slice(0, ID3V1_FIELD_LENGTH)
  }
  return out
}

export interface SetExtendedOptions {
  /**
   * Also write extended fields of 30 characters or fewer. Default false.
   * SPEC: "It is recommended NOT to save extended fields at all, if they are not larger then 30 chars."
   */
  writeShortExtended?: boolean
}

/**
 * Sets ETT / EAR / EAL from full-length values and returns what to write into the ID3v1 tag
 * (the first 30 characters). Values of 30 characters or fewer remove the extended field unless
 * `writeShortExtended` is set. Keys left out of `values` are not touched.
 */
export function setExtendedFields(
  tag: Lyrics3v2Tag,
  values: Partial<ID3v1TextFields>,
  opts: SetExtendedOptions = {},
): Partial<ID3v1TextFields> {
  const out: Partial<ID3v1TextFields> = {}
  for (const [id, key] of EXTENDED) {
    const v = values[key]
    if (v === undefined) continue
    const long = v.length > ID3V1_FIELD_LENGTH
    setLyrics3Field(tag, id, long || (opts.writeShortExtended && v !== '') ? v : undefined)
    out[key] = v.slice(0, ID3V1_FIELD_LENGTH)
  }
  return out
}
