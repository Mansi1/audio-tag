// High-level API for AIFF and AIFF-C files (the ID3 chunk and the text chunks), the counterpart of
// api-id3.ts, api-mp4.ts and api-flac.ts. read()/write() in api.ts pick one by detectFormat().
import { type AIFFLayout, AIFFWriteError, type CommonChunk } from '../aiff/chunks.js'
import { type AIFFTags, type AIFFWriteOptions, type ReadAIFFResult, aiffLayout, planAIFFWrite, readAIFFChunks } from '../aiff/file.js'
import { applyAIFFMetadata, getAIFFMetadata } from '../aiff/mapping.js'
import type { MajorVersion } from '../core/encoding.js'
import { TagReadError, type Warning, WarningSink } from '../core/errors.js'
import { applySegments } from '../file/segments.js'
import type { ID3v2Tag } from '../id3v2/tag.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'

export interface AIFFReadResult {
  format: 'aiff'
  /** The text chunks, the Comments Chunk and the ID3 chunk's tag. */
  aiff: AIFFTags
  /** Channels, sample frames, sample size and sample rate from the Common Chunk. */
  common?: CommonChunk
  /** Friendly view: the ID3 chunk first, then the text chunks; `length` from the Common Chunk. */
  metadata: Metadata
  layout: AIFFLayout
  warnings: Warning[]
}

export interface AIFFWriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the AIFF tags (text chunks, comments, ID3 chunk) entirely. Applied before `metadata`. */
  aiff?: AIFFTags
  /** Replace the ID3 chunk's tag (null removes the chunk). Applied before `metadata`. */
  id3v2?: ID3v2Tag | null
}

export interface AIFFFileWriteOptions extends AIFFWriteOptions {
  /** ID3v2 version of a new ID3 chunk (or to convert the existing one to). Default: the existing tag's, else 4. */
  version?: MajorVersion
}

export interface AIFFFileWriteResult {
  bytes: Uint8Array
  /** The file length did not change and nothing moved. */
  inPlace: boolean
  warnings: Warning[]
}

const NOT_AIFF = 'not an AIFF file; check the format with detectFormat() and use the matching functions, or read()/write()'

/** Reads the tags of an AIFF or AIFF-C file. Throws for other formats (see detectFormat). */
export function readAIFFFile(data: Uint8Array, options: { strict?: boolean } = {}): AIFFReadResult {
  const w = new WarningSink(options.strict ?? false)
  const layout = aiffLayout(data, w)
  if (!layout) throw new TagReadError('format-not-aiff', NOT_AIFF)
  return aiffResult(readAIFFChunks(layout, w))
}

export function aiffResult(r: ReadAIFFResult): AIFFReadResult {
  const out: AIFFReadResult = { format: 'aiff', aiff: r.tags, metadata: getAIFFMetadata(r.tags, r.common), layout: r.layout, warnings: r.warnings }
  if (r.common) out.common = r.common
  return out
}

/** Writes tags into an AIFF or AIFF-C file and returns the new bytes. Throws for other formats. */
export function writeAIFFFile(data: Uint8Array, input: AIFFWriteInput, options: AIFFFileWriteOptions = {}): AIFFFileWriteResult {
  const layout = aiffLayout(data, new WarningSink())
  if (!layout) throw new AIFFWriteError('format-not-aiff', NOT_AIFF)
  const r = planAIFFFile(layout, readAIFFChunks(layout).tags, input, options)
  return { bytes: applySegments(data, r.segments), inPlace: r.inPlace, warnings: r.warnings }
}

/** Applies a write input to the current tags and plans the write (shared with the random-access writer). */
export function planAIFFFile(layout: AIFFLayout, current: AIFFTags, input: AIFFWriteInput, options: AIFFFileWriteOptions): ReturnType<typeof planAIFFWrite> {
  const { version, ...rest } = options
  let tags = input.aiff ?? current
  if (input.id3v2 !== undefined) {
    tags = { ...tags }
    if (input.id3v2) tags.id3v2 = input.id3v2
    else delete tags.id3v2
  }
  const warnings: Warning[] = []
  if (input.metadata) {
    const a = applyAIFFMetadata(tags, input.metadata, version)
    tags = a.tags
    warnings.push(...a.warnings)
  }
  const r = planAIFFWrite(layout, tags, rest)
  return { ...r, warnings: [...warnings, ...r.warnings] }
}
