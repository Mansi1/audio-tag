// Browser helpers: read and write the tags of MPEG (ID3), MP4/M4A, FLAC, Ogg, AIFF and WAV files in
// Blob/File objects without loading the audio. readFromBlob/writeToBlob handle any file; the
// per-format versions handle one format.
import type { ReadResult, WriteInput, WriteOptions } from './api/api.js'
import type { ID3ReadResult, ID3WriteInput, ID3WriteOptions } from './api/api-id3.js'
import type { AIFFFileWriteOptions, AIFFReadResult, AIFFWriteInput } from './api/api-aiff.js'
import type { FLACReadResult, FLACWriteInput } from './api/api-flac.js'
import type { OggFileWriteOptions, OggReadResult, OggWriteInput } from './api/api-ogg.js'
import type { RIFFFileWriteOptions, RIFFReadResult, RIFFWriteInput } from './api/api-riff.js'
import type { MP4ReadResult, MP4WriteInput } from './api/api-mp4.js'
import type { LocateOptions } from './file/layout.js'
import { planWrite, readRandomAccess } from './file/partial.js'
import { planID3FileWrite, readID3RandomAccess } from './file/partial-id3.js'
import { planAIFFFileWrite, readAIFFRandomAccess } from './file/partial-aiff.js'
import { planFLACFileWrite, readFLACRandomAccess } from './file/partial-flac.js'
import { planMP4FileWrite, readMP4RandomAccess } from './file/partial-mp4.js'
import { planOggFileWrite, readOggRandomAccess } from './file/partial-ogg.js'
import { planRIFFFileWrite, readRIFFRandomAccess } from './file/partial-riff.js'
import type { FLACWriteOptions } from './flac/file.js'
import type { MP4WriteOptions } from './mp4/file.js'
import { blobBytes, readBlob, writeBlob } from './platform/blob.js'

export * from './index.js'
export { blobBytes }

/** Reads the tags of any supported Blob or File (by detectFormat: MP4, FLAC, Ogg, AIFF, WAV or ID3). */
export function readFromBlob(blob: Blob, options: LocateOptions = {}): Promise<ReadResult> {
  return readBlob(readRandomAccess, blob, options)
}

/** Writes tags into any supported Blob or File and returns a new one, as the per-format functions do. */
export function writeToBlob<B extends Blob>(blob: B, input: WriteInput, options: WriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planWrite, blob, input, options)
}

/** Reads the ID3 tags of a Blob or File. Large files are read only around their tags. */
export function readID3FromBlob(blob: Blob, options: LocateOptions = {}): Promise<ID3ReadResult> {
  return readBlob(readID3RandomAccess, blob, options)
}

/**
 * Writes ID3 tags and returns a new Blob (a File when given a File, keeping its name and type).
 * The audio is referenced with Blob.slice, never copied into memory.
 */
export function writeID3ToBlob<B extends Blob>(blob: B, input: ID3WriteInput, options: ID3WriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planID3FileWrite, blob, input, options)
}

/** Reads the metadata of an MP4/M4A Blob or File. Large files are read only around the movie atom. */
export function readMP4FromBlob(blob: Blob, options: { strict?: boolean } = {}): Promise<MP4ReadResult> {
  return readBlob(readMP4RandomAccess, blob, options)
}

/**
 * Writes MP4/M4A metadata and returns a new Blob (a File when given a File, keeping its name and
 * type). The media data is referenced with Blob.slice, never copied into memory.
 */
export function writeMP4ToBlob<B extends Blob>(blob: B, input: MP4WriteInput, options: MP4WriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planMP4FileWrite, blob, input, options)
}

/** Reads the Vorbis comments and pictures of a FLAC Blob or File. Only the metadata blocks are read. */
export function readFLACFromBlob(blob: Blob, options: { strict?: boolean } = {}): Promise<FLACReadResult> {
  return readBlob(readFLACRandomAccess, blob, options)
}

/**
 * Writes FLAC Vorbis comments and pictures and returns a new Blob (a File when given a File,
 * keeping its name and type). The audio is referenced with Blob.slice, never copied into memory.
 */
export function writeFLACToBlob<B extends Blob>(blob: B, input: FLACWriteInput, options: FLACWriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planFLACFileWrite, blob, input, options)
}

/** Reads the tags of an AIFF Blob or File (ID3 chunk and text chunks). The sound data is not read. */
export function readAIFFFromBlob(blob: Blob, options: { strict?: boolean } = {}): Promise<AIFFReadResult> {
  return readBlob(readAIFFRandomAccess, blob, options)
}

/**
 * Writes AIFF tags and returns a new Blob (a File when given a File, keeping its name and type).
 * The sound data is referenced with Blob.slice, never copied into memory.
 */
export function writeAIFFToBlob<B extends Blob>(blob: B, input: AIFFWriteInput, options: AIFFFileWriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planAIFFFileWrite, blob, input, options)
}

/** Reads the tags of a WAV Blob or File (ID3 chunk and INFO list). The sound data is not read. */
export function readRIFFFromBlob(blob: Blob, options: { strict?: boolean } = {}): Promise<RIFFReadResult> {
  return readBlob(readRIFFRandomAccess, blob, options)
}

/**
 * Writes WAV tags and returns a new Blob (a File when given a File, keeping its name and type).
 * The sound data is referenced with Blob.slice, never copied into memory.
 */
export function writeRIFFToBlob<B extends Blob>(blob: B, input: RIFFWriteInput, options: RIFFFileWriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planRIFFFileWrite, blob, input, options)
}

/** Reads the comment header of an Ogg (Vorbis, Opus, FLAC) Blob or File. The audio pages are not read. */
export function readOggFromBlob(blob: Blob, options: { strict?: boolean } = {}): Promise<OggReadResult> {
  return readBlob(readOggRandomAccess, blob, options)
}

/**
 * Writes Ogg comments and returns a new Blob (a File when given a File, keeping its name and type).
 * The audio pages are referenced with Blob.slice, unless they must be renumbered.
 */
export function writeOggToBlob<B extends Blob>(blob: B, input: OggWriteInput, options: OggFileWriteOptions = {}): Promise<B extends File ? File : Blob> {
  return writeBlob(planOggFileWrite, blob, input, options)
}
