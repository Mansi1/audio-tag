// High-level API for FLAC files (Vorbis comments and pictures), the counterpart of api-id3.ts and
// api-mp4.ts. Each refuses the other formats; read()/write() in api.ts pick one by detectFormat().
import { TagReadError, type Warning, WarningSink } from '../core/errors.js'
import { detectFormat } from '../file/detect.js'
import { applySegments } from '../file/segments.js'
import { type FLACLayout, FLACWriteError, type StreamInfo } from '../flac/blocks.js'
import { type FLACTags, type FLACWriteOptions, planFLACWrite, readFLACHead } from '../flac/file.js'
import { applyFLACMetadata, getFLACMetadata } from '../flac/mapping.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'

export interface FLACReadResult {
  format: 'flac'
  /** The Vorbis comment block and the picture blocks. */
  flac: FLACTags
  /** Stream properties from the streaminfo block (sample rate, channels, length, ...). */
  streamInfo?: StreamInfo
  /** Friendly view of the Vorbis comments and pictures; `length` comes from streaminfo. */
  metadata: Metadata
  layout: FLACLayout
  warnings: Warning[]
}

export interface FLACWriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the FLAC tags entirely. Applied before `metadata`. */
  flac?: FLACTags
}

export interface FLACFileWriteResult {
  bytes: Uint8Array
  /** The file length and the audio position did not change. */
  inPlace: boolean
  warnings: Warning[]
}

export type { FLACWriteOptions }

const NOT_FLAC = 'not a FLAC file; check the format with detectFormat() and use the matching functions, or read()/write()'

/** Reads the Vorbis comments and pictures of a FLAC file. Throws for other formats (see detectFormat). */
export function readFLACFile(data: Uint8Array, options: { strict?: boolean } = {}): FLACReadResult {
  if (detectFormat(data) !== 'flac') throw new TagReadError('format-not-flac', NOT_FLAC)
  return flacResult(readFLACHead(data, new WarningSink(options.strict ?? false)))
}

export function flacResult(r: ReturnType<typeof readFLACHead>): FLACReadResult {
  const out: FLACReadResult = { format: 'flac', flac: r.tags, metadata: getFLACMetadata(r.tags, r.streamInfo), layout: r.layout, warnings: r.warnings }
  if (r.streamInfo) out.streamInfo = r.streamInfo
  return out
}

/**
 * Writes Vorbis comments and pictures into a FLAC file and returns the new file bytes (the input is
 * not modified). Throws for other formats (see detectFormat).
 */
export function writeFLACFile(data: Uint8Array, input: FLACWriteInput, options: FLACWriteOptions = {}): FLACFileWriteResult {
  if (detectFormat(data) !== 'flac') throw new FLACWriteError('format-not-flac', NOT_FLAC)
  const r = planFLACWrite(data, data.length, flacInput(readFLACHead(data).tags, input), options)
  return { bytes: applySegments(data, r.segments), inPlace: r.inPlace, warnings: r.warnings }
}

/** The FLAC tags to write: `input.flac` (or the current tags) with `input.metadata` applied. */
export function flacInput(current: FLACTags, input: FLACWriteInput): FLACTags {
  const tags = input.flac ?? current
  return input.metadata ? applyFLACMetadata(tags, input.metadata) : tags
}
