// Node helpers: read and write the tags of MPEG (ID3), MP4/M4A, FLAC, Ogg, AIFF and WAV files on disk
// without loading the audio. readFile/writeFile handle any file; the per-format versions handle one
// format.
import type { ReadResult, WriteInput, WriteOptions } from './api/api.js'
import type { ID3ReadResult, ID3WriteInput, ID3WriteOptions } from './api/api-id3.js'
import type { AIFFFileWriteOptions, AIFFReadResult, AIFFWriteInput } from './api/api-aiff.js'
import type { FLACReadResult, FLACWriteInput } from './api/api-flac.js'
import type { OggFileWriteOptions, OggReadResult, OggWriteInput } from './api/api-ogg.js'
import type { WAVFileWriteOptions, WAVReadResult, WAVWriteInput } from './api/api-wav.js'
import type { MP4ReadResult, MP4WriteInput } from './api/api-mp4.js'
import type { LocateOptions } from './file/layout.js'
import { planWrite, readRandomAccess } from './file/partial.js'
import { planID3FileWrite, readID3RandomAccess } from './file/partial-id3.js'
import { planAIFFFileWrite, readAIFFRandomAccess } from './file/partial-aiff.js'
import { planFLACFileWrite, readFLACRandomAccess } from './file/partial-flac.js'
import { planMP4FileWrite, readMP4RandomAccess } from './file/partial-mp4.js'
import { planOggFileWrite, readOggRandomAccess } from './file/partial-ogg.js'
import { planWAVFileWrite, readWAVRandomAccess } from './file/partial-wav.js'
import type { FLACWriteOptions } from './flac/file.js'
import type { MP4WriteOptions } from './mp4/file.js'
import { type FileWriteResult, readPath, removalInput, writePath } from './platform/file.js'

export * from './index.js'

/** Reads the tags of any supported file (by detectFormat: MP4, FLAC, Ogg, AIFF, WAV or ID3). */
export function readFile(path: string, options: LocateOptions = {}): Promise<ReadResult> {
  return readPath(readRandomAccess, path, options)
}

/** Writes tags into any supported file, in place when possible, as the per-format functions do. */
export function writeFile(path: string, input: WriteInput, options: WriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planWrite, path, input, options)
}

/** Reads the ID3 tags of a file. Large files are read only around their tags. */
export function readID3FromFile(path: string, options: LocateOptions = {}): Promise<ID3ReadResult> {
  return readPath(readID3RandomAccess, path, options)
}

/**
 * Writes ID3 tags into a file. When the new head fits in the old tag (padding), only the head is
 * overwritten in place; otherwise the file is rewritten to a temporary file that replaces the
 * original atomically.
 */
export function writeID3ToFile(path: string, input: ID3WriteInput, options: ID3WriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planID3FileWrite, path, input, options)
}

/** Removes the chosen ID3 tag types from a file. */
export function removeID3FromFile(path: string, which: { id3v2?: boolean; id3v1?: boolean; lyrics3?: boolean } = { id3v2: true, id3v1: true, lyrics3: true }): Promise<FileWriteResult> {
  return writePath(planID3FileWrite, path, removalInput(which), {})
}

/** Reads the metadata of an MP4/M4A file. Large files are read only around the movie atom. */
export function readMP4FromFile(path: string, options: { strict?: boolean } = {}): Promise<MP4ReadResult> {
  return readPath(readMP4RandomAccess, path, options)
}

/**
 * Writes MP4/M4A metadata into a file: in place when it fits in the existing free space, otherwise
 * through a temporary file that replaces the original atomically.
 */
export function writeMP4ToFile(path: string, input: MP4WriteInput, options: MP4WriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planMP4FileWrite, path, input, options)
}

/** Reads the Vorbis comments and pictures of a FLAC file. Only the metadata blocks are read. */
export function readFLACFromFile(path: string, options: { strict?: boolean } = {}): Promise<FLACReadResult> {
  return readPath(readFLACRandomAccess, path, options)
}

/**
 * Writes FLAC Vorbis comments and pictures into a file: in place when they fit in the old metadata
 * and padding, otherwise through a temporary file that replaces the original atomically.
 */
export function writeFLACToFile(path: string, input: FLACWriteInput, options: FLACWriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planFLACFileWrite, path, input, options)
}

/** Reads the tags of an AIFF file (ID3 chunk and text chunks). The sound data is not read. */
export function readAIFFFromFile(path: string, options: { strict?: boolean } = {}): Promise<AIFFReadResult> {
  return readPath(readAIFFRandomAccess, path, options)
}

/**
 * Writes AIFF tags into a file: in place when nothing moves (the ID3 chunk keeps its size),
 * otherwise through a temporary file that replaces the original atomically.
 */
export function writeAIFFToFile(path: string, input: AIFFWriteInput, options: AIFFFileWriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planAIFFFileWrite, path, input, options)
}

/** Reads the tags of a WAV file (ID3 chunk and INFO list). The sound data is not read. */
export function readWAVFromFile(path: string, options: { strict?: boolean } = {}): Promise<WAVReadResult> {
  return readPath(readWAVRandomAccess, path, options)
}

/**
 * Writes WAV tags into a file: in place when nothing moves (the ID3 chunk keeps its size),
 * otherwise through a temporary file that replaces the original atomically.
 */
export function writeWAVToFile(path: string, input: WAVWriteInput, options: WAVFileWriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planWAVFileWrite, path, input, options)
}

/** Reads the comment header of an Ogg (Vorbis, Opus, FLAC) file. The audio pages are not read. */
export function readOggFromFile(path: string, options: { strict?: boolean } = {}): Promise<OggReadResult> {
  return readPath(readOggRandomAccess, path, options)
}

/**
 * Writes Ogg comments into a file: in place when the header pages keep their size, otherwise through
 * a temporary file that replaces the original atomically.
 */
export function writeOggToFile(path: string, input: OggWriteInput, options: OggFileWriteOptions = {}): Promise<FileWriteResult> {
  return writePath(planOggFileWrite, path, input, options)
}
