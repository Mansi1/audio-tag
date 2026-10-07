// High-level API for MP4/M4A files, the counterpart of api-id3.ts. The two are separate: check
// a file's format with detectFormat() and call the matching one; each refuses the other's files.
import { TagReadError, type Warning } from '../core/errors.js'
import { detectFormat } from '../file/detect.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import { MP4WriteError } from '../mp4/atoms.js'
import { type MP4Layout, type MP4WriteOptions, applySegments, readMP4, writeMP4 } from '../mp4/file.js'
import { applyMP4Metadata, getMP4Metadata } from '../mp4/mapping.js'
import type { MP4Tags } from '../mp4/meta.js'

export interface MP4ReadResult {
  format: 'mp4'
  /** MP4/M4A metadata: iTunes items, QuickTime metadata, user data text. */
  mp4: MP4Tags
  /** Friendly view: iTunes items, then QuickTime metadata, then user data. */
  metadata: Metadata
  layout: MP4Layout
  warnings: Warning[]
}

export interface MP4WriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the MP4 metadata entirely. Applied before `metadata`. */
  mp4?: MP4Tags
}

export interface MP4FileWriteResult {
  bytes: Uint8Array
  /** The file length and the audio position did not change. */
  inPlace: boolean
  warnings: Warning[]
}

const NOT_MP4 = 'not an MP4/M4A file; check the format with detectFormat() and use readID3File()/writeID3File() for ID3 tags'

/** Reads the metadata of an MP4/M4A file. Throws for other formats (see detectFormat). */
export function readMP4File(data: Uint8Array, options: { strict?: boolean } = {}): MP4ReadResult {
  if (detectFormat(data) !== 'mp4') throw new TagReadError('format-not-mp4', NOT_MP4)
  const m = readMP4(data, options.strict ? { strict: true } : {})
  return { format: 'mp4', mp4: m.tags, metadata: getMP4Metadata(m.tags), layout: m.layout, warnings: m.warnings }
}

/**
 * Writes metadata into an MP4/M4A file and returns the new file bytes (the input is not modified).
 * Throws for other formats (see detectFormat).
 */
export function writeMP4File(data: Uint8Array, input: MP4WriteInput, options: MP4WriteOptions = {}): MP4FileWriteResult {
  if (detectFormat(data) !== 'mp4') throw new MP4WriteError('format-not-mp4', NOT_MP4)
  const r = writeMP4(data, mp4Input(readMP4(data).tags, input), options)
  return { bytes: applySegments(data, r.segments), inPlace: r.inPlace, warnings: r.warnings }
}

/** The MP4 tags to write: `input.mp4` (or the current tags) with `input.metadata` applied. */
export function mp4Input(current: MP4Tags, input: MP4WriteInput): MP4Tags {
  const tags = input.mp4 ?? current
  return input.metadata ? applyMP4Metadata(tags, input.metadata) : tags
}
