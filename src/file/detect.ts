import { asciiString, startsWith } from '../core/bytes.js'
import { decodeSynchsafe } from '../core/synchsafe.js'
import { isTagHeader } from '../id3v2/header.js'

export type AudioFormat = 'mpeg' | 'mp4' | 'flac' | 'ogg' | 'riff' | 'aiff' | 'unknown'

const MP4_TOP_LEVEL = new Set(['ftyp', 'moov', 'mdat', 'free', 'skip', 'wide', 'pnot'])

/** Skips ID3v2 tags at the start (some taggers prepend them even to FLAC files). */
export function afterID3v2(data: Uint8Array): number {
  let pos = 0
  while (isTagHeader(data, pos)) {
    const footer = data[pos + 3] === 4 && (data[pos + 5]! & 0x10) !== 0
    pos += 10 + decodeSynchsafe(data, pos + 6) + (footer ? 10 : 0)
  }
  return pos
}

/** Recognises the container from its first bytes. Only a hint: it never throws. */
export function detectFormat(data: Uint8Array): AudioFormat {
  // SPEC: QTFF File_type_compatibility_atom: 'ftyp' "must be the first significant atom in the file".
  if (data.length >= 8 && asciiString(data.subarray(4, 8)) === 'ftyp') return 'mp4'
  if (data.length >= 8 && MP4_TOP_LEVEL.has(asciiString(data.subarray(4, 8)))) {
    const size = ((data[0]! << 24) | (data[1]! << 16) | (data[2]! << 8) | data[3]!) >>> 0
    if (size === 0 || size === 1 || size >= 8) return 'mp4'
  }
  const p = afterID3v2(data)
  if (startsWith(data, 'fLaC', p)) return 'flac'
  if (startsWith(data, 'OggS', p)) return 'ogg'
  if (startsWith(data, 'RIFF', p) && startsWith(data, 'WAVE', p + 8)) return 'riff'
  if (startsWith(data, 'FORM', p) && (startsWith(data, 'AIFF', p + 8) || startsWith(data, 'AIFC', p + 8))) return 'aiff'
  if (p > 0) return 'mpeg'
  // MPEG audio frame sync: 11 set bits
  if (data.length >= 2 && data[0] === 0xff && (data[1]! & 0xe0) === 0xe0) return 'mpeg'
  return 'unknown'
}

export const FORMAT_NAMES: Record<AudioFormat, string> = {
  mpeg: 'MPEG audio',
  mp4: 'MP4/M4A',
  flac: 'FLAC',
  ogg: 'Ogg',
  riff: 'WAV',
  aiff: 'AIFF',
  unknown: 'unknown',
}

/** Where a non-ID3 container keeps its tags, for the "not ID3" warning. */
export const NATIVE_TAGS: Partial<Record<AudioFormat, string>> = {
  mp4: 'MP4 metadata atoms (moov/udta/meta/ilst)',
  flac: 'Vorbis comments in a METADATA_BLOCK',
  ogg: 'Vorbis comments',
  riff: 'RIFF INFO chunks (or an "id3 " chunk)',
  aiff: 'AIFF chunks (or an "ID3 " chunk)',
}
