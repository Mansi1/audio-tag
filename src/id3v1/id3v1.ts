import { startsWith } from '../core/bytes.js'
import { decodeLatin1, encodeLatin1, isValidUtf8 } from '../core/encoding.js'
import { TagWriteError, WarningSink, type Warning } from '../core/errors.js'
import { GENRE_NONE, genreName } from './genres.js'

// SPEC: spec/id3v1/ID3v1.md and v2.2 Appendix A. The tag is the last 128 bytes of the file:
//   0..2 "TAG" | 3..32 title | 33..62 artist | 63..92 album | 93..96 year | 97..126 comment | 127 genre
// ID3v1.1 (A.4): comment is 28 chars, byte 125 is $00 and byte 126 is the track number.

export const ID3V1_SIZE = 128

export interface ID3v1Tag {
  version: '1.0' | '1.1'
  title: string
  artist: string
  album: string
  year: string
  comment: string
  /** 1..255, ID3v1.1 only. */
  track?: number
  /** Index into the genre list; 255 means none. */
  genre: number
}

export interface ID3v1ReadOptions {
  strict?: boolean
  /** Trim trailing spaces, which some taggers use instead of $00 padding. Default true. */
  trimSpaces?: boolean
  /** The spec says ISO-Latin-1. "auto" decodes valid UTF-8 with high bytes as UTF-8. */
  charset?: 'latin1' | 'utf8' | 'auto'
}

export interface ID3v1WriteOptions {
  /** Truncation and non-Latin-1 characters throw instead of warning. */
  strict?: boolean
  warnings?: WarningSink
}

const utf8 = new TextDecoder('utf-8')

function field(
  data: Uint8Array,
  start: number,
  len: number,
  name: string,
  opts: Required<ID3v1ReadOptions>,
  w: WarningSink,
): string {
  const raw = data.subarray(start, start + len)
  let end = raw.indexOf(0)
  if (end === -1) end = len
  else if (raw.subarray(end).some((b) => b !== 0)) {
    // SPEC: fields are padded with $00; anything after the first $00 is junk (test suite 7, 8).
    w.note('id3v1-junk', `junk after the terminator in ${name}`, { offset: start + end })
  }
  const bytes = raw.subarray(0, end)
  let s: string
  const high = bytes.some((b) => b >= 0x80)
  if (opts.charset === 'utf8' || (opts.charset === 'auto' && high && isValidUtf8(bytes))) s = utf8.decode(bytes)
  else s = decodeLatin1(bytes)
  return opts.trimSpaces ? s.replace(/ +$/, '') : s
}

/** Parses 128 bytes; returns null when they do not start with "TAG" (case sensitive). */
export function parseID3v1(
  data: Uint8Array,
  options: ID3v1ReadOptions = {},
): { tag: ID3v1Tag; warnings: Warning[] } | null {
  if (data.length < ID3V1_SIZE) return null
  const d = data.length === ID3V1_SIZE ? data : data.subarray(data.length - ID3V1_SIZE)
  // SPEC: v2.2 A.2 "This has to be uppercase!"
  if (!startsWith(d, 'TAG')) return null
  const opts: Required<ID3v1ReadOptions> = {
    strict: options.strict ?? false,
    trimSpaces: options.trimSpaces ?? true,
    charset: options.charset ?? 'latin1',
  }
  const w = new WarningSink(opts.strict)

  const title = field(d, 3, 30, 'title', opts, w)
  const artist = field(d, 33, 30, 'artist', opts, w)
  const album = field(d, 63, 30, 'album', opts, w)
  const yearRaw = d.subarray(93, 97)
  const year = field(d, 93, 4, 'year', { ...opts, trimSpaces: false }, w)
  if (!/^[0-9]{4}$/.test(decodeLatin1(yearRaw))) {
    w.warn('id3v1-year', `year "${decodeLatin1(yearRaw).replace(/\0/g, '\\0')}" is not four digits`, { offset: 93 })
  }

  // SPEC: v2.2 A.4. "In such cases where the 29th byte is not the null character or when the
  // 30th is a null character, the tracknumber is to be considered undefined."
  const isV11 = d[125] === 0 && d[126] !== 0
  const comment = isV11 ? field(d, 97, 28, 'comment', opts, w) : field(d, 97, 30, 'comment', opts, w)
  const genre = d[127]!
  if (genre !== GENRE_NONE && genreName(genre) === undefined) {
    w.warn('id3v1-genre', `genre ${genre} is not in the genre list`, { offset: 127 })
  } else if (genre >= 80 && genre !== GENRE_NONE) {
    // Only 0-79 were in the original ID3v1 list; 80+ are Winamp extensions other readers may lack.
    w.note('id3v1-genre-extension', `genre ${genre} is a Winamp extension`, { offset: 127 })
  }

  const tag: ID3v1Tag = { version: isV11 ? '1.1' : '1.0', title, artist, album, year, comment, genre }
  if (isV11) tag.track = d[126]!
  return { tag, warnings: w.list }
}

function put(out: Uint8Array, s: string, start: number, len: number, name: string, opts: ID3v1WriteOptions): void {
  const bytes = encodeLatin1(s, { lenient: !opts.strict, ...(opts.warnings ? { warnings: opts.warnings } : {}) })
  if (bytes.length > len) {
    if (opts.strict) throw new TagWriteError('id3v1-too-long', `${name} is longer than ${len} bytes`)
    opts.warnings?.note('id3v1-truncated', `${name} truncated to ${len} bytes`)
  }
  out.set(bytes.subarray(0, len), start)
}

/** Serialises a tag to 128 bytes. A track number of 1..255 produces ID3v1.1. */
export function serializeID3v1(tag: Partial<ID3v1Tag>, opts: ID3v1WriteOptions = {}): Uint8Array {
  const out = new Uint8Array(ID3V1_SIZE)
  out.set([0x54, 0x41, 0x47], 0)
  put(out, tag.title ?? '', 3, 30, 'title', opts)
  put(out, tag.artist ?? '', 33, 30, 'artist', opts)
  put(out, tag.album ?? '', 63, 30, 'album', opts)
  put(out, tag.year ?? '', 93, 4, 'year', opts)
  const track = tag.track ?? 0
  if (!Number.isInteger(track) || track < 0 || track > 255) {
    throw new TagWriteError('id3v1-track', `track ${track} must be 0..255`)
  }
  if (track > 0) {
    put(out, tag.comment ?? '', 97, 28, 'comment', opts)
    out[125] = 0
    out[126] = track
  } else {
    put(out, tag.comment ?? '', 97, 30, 'comment', opts)
  }
  const genre = tag.genre ?? GENRE_NONE
  if (!Number.isInteger(genre) || genre < 0 || genre > 255) {
    throw new TagWriteError('id3v1-genre', `genre ${genre} must be 0..255`)
  }
  out[127] = genre
  return out
}

/** True when the last 128 bytes of `file` start with "TAG". */
export function hasID3v1(file: Uint8Array): boolean {
  return file.length >= ID3V1_SIZE && startsWith(file, 'TAG', file.length - ID3V1_SIZE)
}
