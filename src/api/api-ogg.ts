// High-level API for Ogg files (Vorbis, Opus and FLAC comment headers), the counterpart of the other
// per-format APIs. read()/write() in api.ts pick one by detectFormat().
import { TagReadError, type Warning, WarningSink } from '../core/errors.js'
import { detectFormat } from '../file/detect.js'
import { applySegments } from '../file/segments.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import { NeedMoreData, type OggLayout, type OggStream, type OggTags, type ReadOggResult, lastGranule, planOggWrite, readOggHead } from '../ogg/file.js'
import { applyOggMetadata, getOggMetadata } from '../ogg/mapping.js'
import { OggWriteError } from '../ogg/page.js'

export interface OggReadResult {
  format: 'ogg'
  /** The codec, the comment (without pictures) and the METADATA_BLOCK_PICTURE pictures. */
  ogg: OggTags & { codec: OggStream['codec'] }
  stream: OggStream
  /** Friendly view of the comment; `length` from the last granule position. */
  metadata: Metadata
  layout: OggLayout
  warnings: Warning[]
}

export interface OggWriteInput {
  /** Fields to change; undefined leaves a field alone, null removes it. */
  metadata?: MetadataUpdate
  /** Replace the comment and pictures entirely. Applied before `metadata`. */
  ogg?: OggTags
}

export interface OggFileWriteOptions {
  strict?: boolean
}

export interface OggFileWriteResult {
  bytes: Uint8Array
  /** The file length did not change and nothing moved. */
  inPlace: boolean
  warnings: Warning[]
}

const NOT_OGG = 'not an Ogg file; check the format with detectFormat() and use the matching functions, or read()/write()'

function head(data: Uint8Array, w: WarningSink): ReadOggResult {
  try {
    return readOggHead(data, w)
  } catch (e) {
    if (e instanceof NeedMoreData) throw new TagReadError('ogg-truncated', 'the file ends inside the Ogg header pages')
    throw e
  }
}

/** Reads the comment header of an Ogg Vorbis, Opus or FLAC file. Throws for other formats. */
export function readOggFile(data: Uint8Array, options: { strict?: boolean } = {}): OggReadResult {
  if (!isOgg(data)) throw new TagReadError('format-not-ogg', NOT_OGG)
  const r = head(data, new WarningSink(options.strict ?? false))
  return oggResult(r, lastGranule(data.subarray(r.layout.headerEnd), r.stream.serial))
}

function isOgg(data: Uint8Array): boolean {
  return detectFormat(data) === 'ogg'
}

export function oggResult(r: ReadOggResult, granule: bigint | undefined): OggReadResult {
  return {
    format: 'ogg',
    ogg: { codec: r.stream.codec, ...r.tags },
    stream: r.stream,
    metadata: getOggMetadata(r.tags, r.stream, granule),
    layout: r.layout,
    warnings: r.warnings,
  }
}

/** Writes tags into an Ogg file and returns the new bytes. Throws for other formats. */
export function writeOggFile(data: Uint8Array, input: OggWriteInput, options: OggFileWriteOptions = {}): OggFileWriteResult {
  if (!isOgg(data)) throw new OggWriteError('format-not-ogg', NOT_OGG)
  const r = head(data, new WarningSink(options.strict ?? false))
  const p = planOggWrite(data, data.length, r, oggInput(r.tags, input))
  return { bytes: applySegments(data, p.segments), inPlace: p.inPlace, warnings: p.warnings }
}

/** The Ogg tags to write: `input.ogg` (or the current tags) with `input.metadata` applied. */
export function oggInput(current: OggTags, input: OggWriteInput): OggTags {
  const tags = input.ogg ?? current
  return input.metadata ? applyOggMetadata(tags, input.metadata) : tags
}
