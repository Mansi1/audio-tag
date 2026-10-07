// One read() and write() for every supported file: a switch on detectFormat() sends each format to
// its API: api-id3.ts (MPEG audio), api-mp4.ts, api-flac.ts, api-ogg.ts, api-aiff.ts and api-riff.ts.
// Unrecognised data throws UnknownFormatError. Use the per-format APIs directly when the format is
// known (bare tags, for example): an import of only the ID3 functions then bundles no code for the
// other formats.
import { TagWriteError, UnknownFormatError, type Warning, assertNever } from '../core/errors.js'
import { type AudioFormat, detectFormat } from '../file/detect.js'
import type { LocateOptions } from '../file/layout.js'
import type { AIFFTags } from '../aiff/file.js'
import type { FLACTags, FLACWriteOptions } from '../flac/file.js'
import type { MetadataUpdate } from '../metadata/metadata.js'
import type { MP4WriteOptions } from '../mp4/file.js'
import type { MP4Tags } from '../mp4/meta.js'
import type { OggTags } from '../ogg/file.js'
import type { RIFFTags } from '../riff/file.js'
import { type AIFFFileWriteOptions, type AIFFReadResult, type AIFFWriteInput, readAIFFFile, writeAIFFFile } from './api-aiff.js'
import { type FLACReadResult, type FLACWriteInput, readFLACFile, writeFLACFile } from './api-flac.js'
import { type ID3ReadResult, type ID3WriteInput, type ID3WriteOptions, readID3File, writeID3File } from './api-id3.js'
import { type MP4ReadResult, type MP4WriteInput, readMP4File, writeMP4File } from './api-mp4.js'
import { type OggFileWriteOptions, type OggReadResult, type OggWriteInput, readOggFile, writeOggFile } from './api-ogg.js'
import { type RIFFFileWriteOptions, type RIFFReadResult, type RIFFWriteInput, readRIFFFile, writeRIFFFile } from './api-riff.js'

/** Formats whose tags read()/write() handle: every detected format but 'unknown'. */
export type SupportedFormat = Exclude<AudioFormat, 'unknown'>

/** The result of read(): narrow it with `format`; each format has its own result. */
export type ReadResult = (ID3ReadResult & { format: 'mpeg' }) | MP4ReadResult | FLACReadResult | OggReadResult | AIFFReadResult | RIFFReadResult

/** Input for write(): `metadata` works for every format; the other fields only for their own. */
export interface WriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** ID3 files, and the ID3 chunk of AIFF and WAV files. */
  id3v2?: ID3WriteInput['id3v2']
  /** ID3 files only. */
  id3v1?: ID3WriteInput['id3v1']
  /** ID3 files only. */
  lyrics3?: ID3WriteInput['lyrics3']
  /** MP4 files only. */
  mp4?: MP4Tags
  /** FLAC files only. */
  flac?: FLACTags
  /** Ogg files only. */
  ogg?: OggTags
  /** AIFF files only. */
  aiff?: AIFFTags
  /** WAV files only. */
  riff?: RIFFTags
}

/**
 * Options for write(). `padding` and `strict` apply to every format. The ID3 options apply to ID3
 * files; for AIFF and WAV files, those of the ID3 chunk's tag (version, unsynchronisation, ...);
 * and none for MP4, FLAC and Ogg files, which refuse them.
 */
export type WriteOptions = ID3WriteOptions

export interface WriteResult {
  format: SupportedFormat
  bytes: Uint8Array
  /** The file length and the audio position did not change. */
  inPlace: boolean
  warnings: Warning[]
}

/** Reads the tags of any supported file, by detectFormat(). Anything else throws UnknownFormatError. */
export function read(data: Uint8Array, options: LocateOptions = {}): ReadResult {
  const format = detectFormat(data)
  const strict = options.strict ? { strict: true } : {}
  switch (format) {
    case 'mpeg':
      return { ...readID3File(data, options), format }
    case 'mp4':
      return readMP4File(data, strict)
    case 'flac':
      return readFLACFile(data, strict)
    case 'ogg':
      return readOggFile(data, strict)
    case 'aiff':
      return readAIFFFile(data, strict)
    case 'riff':
      return readRIFFFile(data, strict)
    case 'unknown':
      throw unknownFormat()
    default:
      return assertNever(format)
  }
}

/** Writes tags into any supported file and returns the new file bytes (the input is not modified). */
export function write(data: Uint8Array, input: WriteInput, options: WriteOptions = {}): WriteResult {
  const format = detectFormat(data)
  const done = (r: { bytes: Uint8Array; inPlace: boolean; warnings: Warning[] }): WriteResult => ({ format: format as SupportedFormat, bytes: r.bytes, inPlace: r.inPlace, warnings: r.warnings })
  switch (format) {
    case 'mpeg':
      return done(writeID3File(data, toID3Input(input), options))
    case 'mp4':
      return done(writeMP4File(data, toMP4Input(input), toMP4Options(options)))
    case 'flac':
      return done(writeFLACFile(data, toFLACInput(input), toFLACOptions(options)))
    case 'ogg':
      return done(writeOggFile(data, toOggInput(input), toOggOptions(options)))
    case 'aiff':
      return done(writeAIFFFile(data, toAIFFInput(input), toAIFFOptions(options)))
    case 'riff':
      return done(writeRIFFFile(data, toRIFFInput(input), toRIFFOptions(options)))
    case 'unknown':
      throw unknownFormat()
    default:
      return assertNever(format)
  }
}

/** Data that is no recognised audio format: no MPEG frame sync, MP4 atom or container header at the start. */
export function unknownFormat(): UnknownFormatError {
  return new UnknownFormatError('unknown audio format: the data starts with no MPEG frame, MP4 atom or container header; use readID3File()/writeID3File() for bare tags')
}

const ID3_INPUTS = ['id3v2', 'id3v1', 'lyrics3'] as const
const ID3_OPTIONS = ['version', 'id3v1', 'id3v2Location', 'appendFrame', 'locate', 'originalSize', 'unsynchronisation', 'alteration', 'encrypt', 'compressionLevel', 'littleEndian'] as const
type Native = 'mp4' | 'flac' | 'ogg' | 'aiff' | 'riff'
const NAMES: Record<Native, string> = { mp4: 'MP4', flac: 'FLAC', ogg: 'Ogg', aiff: 'AIFF', riff: 'WAV' }
const A_FILE: Record<Native, string> = { mp4: 'an MP4 file', flac: 'a FLAC file', ogg: 'an Ogg file', aiff: 'an AIFF file', riff: 'a WAV file' }
/** ID3 inputs each format takes: AIFF and WAV keep an ID3v2 tag in their ID3 chunk (A7, W8). */
const ID3_INPUTS_OF: Record<Native, readonly string[]> = { mp4: [], flac: [], ogg: [], aiff: ['id3v2'], riff: ['id3v2'] }
/** ID3 options each format takes; the rest are refused rather than silently ignored. */
const ID3_OPTIONS_OF: Record<Native, readonly string[]> = {
  mp4: [],
  flac: [],
  ogg: [],
  aiff: ['version', 'unsynchronisation', 'alteration', 'encrypt', 'compressionLevel', 'littleEndian', 'originalSize'],
  riff: ['version', 'unsynchronisation', 'alteration', 'encrypt', 'compressionLevel', 'littleEndian', 'originalSize'],
}

/** Refuses the inputs of every format but `format` ('id3' for the ID3 fields). */
function refuseOthers(input: WriteInput, format: Native | 'id3'): void {
  const target = format === 'id3' ? 'an ID3 file' : A_FILE[format]
  const hint = format === 'id3' ? 'use "metadata" or the ID3 fields' : `use "metadata" or "${format}"`
  if (format !== 'id3') {
    for (const k of ID3_INPUTS) {
      if (input[k] !== undefined && !ID3_INPUTS_OF[format].includes(k)) throw new TagWriteError(`${format}-id3-input`, `"${k}" cannot be written into ${target}; ${hint}`)
    }
  }
  for (const other of ['mp4', 'flac', 'ogg', 'aiff', 'riff'] as const) {
    if (other !== format && input[other] !== undefined) {
      throw new TagWriteError(`${format}-${other}-input`, `"${other}" can only be written into ${A_FILE[other]}; ${hint}`)
    }
  }
}

/** The MP4 part of a write input. */
export function toMP4Input(input: WriteInput): MP4WriteInput {
  refuseOthers(input, 'mp4')
  const out: MP4WriteInput = {}
  if (input.metadata) out.metadata = input.metadata
  if (input.mp4) out.mp4 = input.mp4
  return out
}

/** The FLAC part of a write input. */
export function toFLACInput(input: WriteInput): FLACWriteInput {
  refuseOthers(input, 'flac')
  const out: FLACWriteInput = {}
  if (input.metadata) out.metadata = input.metadata
  if (input.flac) out.flac = input.flac
  return out
}

/** The Ogg part of a write input. */
export function toOggInput(input: WriteInput): OggWriteInput {
  refuseOthers(input, 'ogg')
  const out: OggWriteInput = {}
  if (input.metadata) out.metadata = input.metadata
  if (input.ogg) out.ogg = input.ogg
  return out
}

/** The AIFF part of a write input: `id3v2` is the ID3 chunk's tag. */
export function toAIFFInput(input: WriteInput): AIFFWriteInput {
  refuseOthers(input, 'aiff')
  const out: AIFFWriteInput = {}
  if (input.metadata) out.metadata = input.metadata
  if (input.aiff) out.aiff = input.aiff
  if (input.id3v2 !== undefined) out.id3v2 = input.id3v2
  return out
}

/** The WAV part of a write input: `id3v2` is the ID3 chunk's tag. */
export function toRIFFInput(input: WriteInput): RIFFWriteInput {
  refuseOthers(input, 'riff')
  const out: RIFFWriteInput = {}
  if (input.metadata) out.metadata = input.metadata
  if (input.riff) out.riff = input.riff
  if (input.id3v2 !== undefined) out.id3v2 = input.id3v2
  return out
}

/** The ID3 part of a write input. */
export function toID3Input(input: WriteInput): ID3WriteInput {
  refuseOthers(input, 'id3')
  const out: ID3WriteInput = {}
  if (input.metadata) out.metadata = input.metadata
  for (const k of ID3_INPUTS) if (input[k] !== undefined) (out as Record<string, unknown>)[k] = input[k]
  return out
}

/** Writer options for MP4 or FLAC; ID3-only options are refused rather than silently ignored. */
function nativeOptions(options: WriteOptions, format: Native): MP4WriteOptions & FLACWriteOptions {
  const id3Only = ID3_OPTIONS.filter((k) => options[k] !== undefined && !ID3_OPTIONS_OF[format].includes(k))
  if (id3Only.length) {
    throw new TagWriteError(`${format}-id3-option`, `${id3Only.join(', ')} ${id3Only.length > 1 ? 'are ID3 options and do' : 'is an ID3 option and does'} not apply to ${NAMES[format]} files`)
  }
  const out: MP4WriteOptions & FLACWriteOptions = {}
  if (typeof options.padding === 'number') out.padding = options.padding
  if (options.strict) out.strict = true
  return out
}

export function toMP4Options(options: WriteOptions): MP4WriteOptions {
  return nativeOptions(options, 'mp4')
}

export function toFLACOptions(options: WriteOptions): FLACWriteOptions {
  return nativeOptions(options, 'flac')
}

/** Ogg files take only `strict`; ID3 options are refused, and `padding` has no meaning for Ogg pages. */
export function toOggOptions(options: WriteOptions): OggFileWriteOptions {
  const { strict } = nativeOptions(options, 'ogg')
  return strict ? { strict } : {}
}

/** Options for the ID3 chunk of an AIFF (or WAV) file; the ID3 file-layout options are refused (A7). */
export function toAIFFOptions(options: WriteOptions, format: 'aiff' | 'riff' = 'aiff'): AIFFFileWriteOptions {
  nativeOptions(options, format)
  const { id3v1: _, id3v2Location: __, appendFrame: ___, locate: ____, originalSize: _____, ...rest } = options
  return rest
}

/** Options for the ID3 chunk of a WAV file; the ID3 file-layout options are refused (W8). */
export function toRIFFOptions(options: WriteOptions): RIFFFileWriteOptions {
  return toAIFFOptions(options, 'riff')
}
