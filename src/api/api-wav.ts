// High-level API for WAV files (the ID3 chunk and the INFO list), the counterpart of api-id3.ts,
// api-mp4.ts, api-flac.ts and api-aiff.ts. read()/write() in api.ts pick one by detectFormat().
import type { MajorVersion } from '../core/encoding.js'
import { TagReadError, type Warning, WarningSink } from '../core/errors.js'
import { applySegments } from '../file/segments.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import { type WAVLayout, WAVWriteError } from '../wav/chunks.js'
import { type ReadWAVResult, type WAVAudio, type WAVTags, type WAVWriteOptions, planWAVWrite, readWAVChunks, wavLayout } from '../wav/file.js'
import { applyWAVMetadata, getWAVMetadata } from '../wav/mapping.js'

export interface WAVReadResult {
  format: 'wav'
  /** The INFO list and the ID3 chunk's tag. */
  wav: WAVTags
  /** The format chunk, and the sizes the length comes from. */
  audio?: WAVAudio
  /** Friendly view: the ID3 chunk first, then the INFO list; `length` from fmt/data/fact. */
  metadata: Metadata
  layout: WAVLayout
  warnings: Warning[]
}

export interface WAVWriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the WAV tags (INFO list, ID3 chunk) entirely. Applied before `metadata`. */
  wav?: WAVTags
  /** Replace the ID3 chunk's tag (null removes the chunk). Applied before `metadata`. */
  id3v2?: ID3v2Tag | null
}

export interface WAVFileWriteOptions extends WAVWriteOptions {
  /** ID3v2 version of a new ID3 chunk (or to convert the existing one to). Default: the existing tag's, else 4. */
  version?: MajorVersion
}

export interface WAVFileWriteResult {
  bytes: Uint8Array
  /** The file length did not change and nothing moved. */
  inPlace: boolean
  warnings: Warning[]
}

const NOT_WAV = 'not a WAV file; check the format with detectFormat() and use the matching functions, or read()/write()'

/** Reads the tags of a WAV file. Throws for other formats (see detectFormat). */
export function readWAVFile(data: Uint8Array, options: { strict?: boolean } = {}): WAVReadResult {
  const w = new WarningSink(options.strict ?? false)
  const layout = wavLayout(data, w)
  if (!layout) throw new TagReadError('format-not-wav', NOT_WAV)
  return wavResult(readWAVChunks(layout, w))
}

export function wavResult(r: ReadWAVResult): WAVReadResult {
  const out: WAVReadResult = { format: 'wav', wav: r.tags, metadata: getWAVMetadata(r.tags, r.audio), layout: r.layout, warnings: r.warnings }
  if (r.audio) out.audio = r.audio
  return out
}

/** Writes tags into a WAV file and returns the new bytes. Throws for other formats. */
export function writeWAVFile(data: Uint8Array, input: WAVWriteInput, options: WAVFileWriteOptions = {}): WAVFileWriteResult {
  const layout = wavLayout(data, new WarningSink())
  if (!layout) throw new WAVWriteError('format-not-wav', NOT_WAV)
  const r = planWAVFile(layout, readWAVChunks(layout).tags, input, options)
  return { bytes: applySegments(data, r.segments), inPlace: r.inPlace, warnings: r.warnings }
}

/** Applies a write input to the current tags and plans the write (shared with the random-access writer). */
export function planWAVFile(layout: WAVLayout, current: WAVTags, input: WAVWriteInput, options: WAVFileWriteOptions): ReturnType<typeof planWAVWrite> {
  const { version, ...rest } = options
  let tags = input.wav ?? current
  if (input.id3v2 !== undefined) {
    tags = { ...tags }
    if (input.id3v2) tags.id3v2 = input.id3v2
    else delete tags.id3v2
  }
  const warnings: Warning[] = []
  if (input.metadata) {
    const a = applyWAVMetadata(tags, input.metadata, version)
    tags = a.tags
    warnings.push(...a.warnings)
  }
  const r = planWAVWrite(layout, tags, rest)
  return { ...r, warnings: [...warnings, ...r.warnings] }
}
