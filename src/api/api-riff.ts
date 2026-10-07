// High-level API for WAV files (the ID3 chunk and the INFO list), the counterpart of api-id3.ts,
// api-mp4.ts, api-flac.ts and api-aiff.ts. read()/write() in api.ts pick one by detectFormat().
import type { MajorVersion } from '../core/encoding.js'
import { TagReadError, type Warning, WarningSink } from '../core/errors.js'
import { applySegments } from '../file/segments.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import { type RIFFLayout, RIFFWriteError } from '../riff/chunks.js'
import { type ReadRIFFResult, type RIFFAudio, type RIFFTags, type RIFFWriteOptions, planRIFFWrite, readRIFFChunks, riffLayout } from '../riff/file.js'
import { applyRIFFMetadata, getRIFFMetadata } from '../riff/mapping.js'

export interface RIFFReadResult {
  format: 'riff'
  /** The INFO list and the ID3 chunk's tag. */
  riff: RIFFTags
  /** The format chunk, and the sizes the length comes from. */
  audio?: RIFFAudio
  /** Friendly view: the ID3 chunk first, then the INFO list; `length` from fmt/data/fact. */
  metadata: Metadata
  layout: RIFFLayout
  warnings: Warning[]
}

export interface RIFFWriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the WAV tags (INFO list, ID3 chunk) entirely. Applied before `metadata`. */
  riff?: RIFFTags
  /** Replace the ID3 chunk's tag (null removes the chunk). Applied before `metadata`. */
  id3v2?: ID3v2Tag | null
}

export interface RIFFFileWriteOptions extends RIFFWriteOptions {
  /** ID3v2 version of a new ID3 chunk (or to convert the existing one to). Default: the existing tag's, else 4. */
  version?: MajorVersion
}

export interface RIFFFileWriteResult {
  bytes: Uint8Array
  /** The file length did not change and nothing moved. */
  inPlace: boolean
  warnings: Warning[]
}

const NOT_RIFF = 'not a WAV file; check the format with detectFormat() and use the matching functions, or read()/write()'

/** Reads the tags of a WAV file. Throws for other formats (see detectFormat). */
export function readRIFFFile(data: Uint8Array, options: { strict?: boolean } = {}): RIFFReadResult {
  const w = new WarningSink(options.strict ?? false)
  const layout = riffLayout(data, w)
  if (!layout) throw new TagReadError('format-not-riff', NOT_RIFF)
  return riffResult(readRIFFChunks(layout, w))
}

export function riffResult(r: ReadRIFFResult): RIFFReadResult {
  const out: RIFFReadResult = { format: 'riff', riff: r.tags, metadata: getRIFFMetadata(r.tags, r.audio), layout: r.layout, warnings: r.warnings }
  if (r.audio) out.audio = r.audio
  return out
}

/** Writes tags into a WAV file and returns the new bytes. Throws for other formats. */
export function writeRIFFFile(data: Uint8Array, input: RIFFWriteInput, options: RIFFFileWriteOptions = {}): RIFFFileWriteResult {
  const layout = riffLayout(data, new WarningSink())
  if (!layout) throw new RIFFWriteError('format-not-riff', NOT_RIFF)
  const r = planRIFFFile(layout, readRIFFChunks(layout).tags, input, options)
  return { bytes: applySegments(data, r.segments), inPlace: r.inPlace, warnings: r.warnings }
}

/** Applies a write input to the current tags and plans the write (shared with the random-access writer). */
export function planRIFFFile(layout: RIFFLayout, current: RIFFTags, input: RIFFWriteInput, options: RIFFFileWriteOptions): ReturnType<typeof planRIFFWrite> {
  const { version, ...rest } = options
  let tags = input.riff ?? current
  if (input.id3v2 !== undefined) {
    tags = { ...tags }
    if (input.id3v2) tags.id3v2 = input.id3v2
    else delete tags.id3v2
  }
  const warnings: Warning[] = []
  if (input.metadata) {
    const a = applyRIFFMetadata(tags, input.metadata, version)
    tags = a.tags
    warnings.push(...a.warnings)
  }
  const r = planRIFFWrite(layout, tags, rest)
  return { ...r, warnings: [...warnings, ...r.warnings] }
}
