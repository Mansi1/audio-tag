// audio-tag: spec-exact ID3v1, ID3v1.1, ID3v2.2, ID3v2.3, ID3v2.4 and Lyrics3 reader/writer, plus
// MP4/M4A metadata, FLAC and Ogg comments, and AIFF and WAV chunks. The core works on Uint8Array only
// and runs in browsers and Node alike. read()/write() handle any file by switching on
// detectFormat(); the ID3, MP4, FLAC, Ogg, AIFF and WAV functions handle one format each, and
// tree-shaking keeps the unused ones out of a bundle.

export const VERSION = '0.1.0'

// High-level API
export { readID3File, writeID3File, type ID3ReadResult, type ID3WriteInput, type ID3WriteOptions } from './api/api-id3.js'
export { getMetadata, yearOf, type Metadata, type MetadataUpdate, type Picture } from './metadata/metadata.js'
export { applyMetadata, getID3v2Metadata } from './id3v2/mapping.js'
export { getID3v1Metadata } from './id3v1/mapping.js'
export { getLyrics3Metadata } from './lyrics3/mapping.js'

// Files: locating, merging, stripping, writing
export {
  locateTags,
  mergeTags,
  readTags,
  stripTags,
  writeTags,
  type FileLayout,
  type LocateOptions,
  type LocatedID3v2,
  type ReadTagsResult,
  type WriteTagsInput,
  type WriteTagsOptions,
  type WriteTagsResult,
} from './file/layout.js'

// ID3v1
export { GENRES, GENRE_NONE, genreId, genreName, type Genre, type GenreSource } from './id3v1/genres.js'
export {
  ID3V1_SIZE,
  hasID3v1,
  parseID3v1,
  serializeID3v1,
  type ID3v1ReadOptions,
  type ID3v1Tag,
  type ID3v1WriteOptions,
} from './id3v1/id3v1.js'

// ID3v2
export { readID3v2, isUnsupported, type ReadOptions, type ReadResult as ID3v2ReadResult, type UnsupportedTag } from './id3v2/reader.js'
export { validateID3v2, jpegSize, pngSize, type Issue } from './id3v2/validate.js'
export { writeID3v2, type WriteOptions as ID3v2WriteOptions, type WriteResult as ID3v2WriteResult } from './id3v2/writer.js'
export { cloneFrame, createFrame, createTag, getFrame, getFrames, getText, type ID3v2Tag } from './id3v2/tag.js'
export { convertID3v2, id3v1FromID3v2, id3v2FromID3v1, imageFormatToMime, mimeToImageFormat, type ConvertOptions } from './id3v2/convert.js'
export type { TagHeaderFlags } from './id3v2/header.js'
export {
  describeRestrictions,
  type ExtendedHeader,
  type ExtendedHeaderV23,
  type ExtendedHeaderV24,
  type TagRestrictions,
} from './id3v2/extended-header.js'
export { defaultFrameFlags, type FrameFlags } from './id3v2/frame-header.js'
export type { DecryptHook, EncryptHook } from './id3v2/frame-codec.js'
export type * from './id3v2/frames/types.js'
export {
  FRAME_DEFINITIONS,
  declaredIds,
  getDefinition,
  mapFrameId,
  type FrameDefinition,
  type Uniqueness,
} from './id3v2/frames/registry.js'
export * from './id3v2/frames/tables.js'
export * from './id3v2/frames/text-helpers.js'
export { formatTimestamp, parseTimestamp } from './id3v2/frames/text-helpers.js'
export { dbToFixed, fixedToDb } from './id3v2/frames/codecs-audio.js'
export { aspiFraction, aspiOffset, pictureLinkUrl, pictureMimeType } from './id3v2/frames/codecs-misc.js'
export { atxtNeedsUnsync, decodeReplayGain, scramble } from './id3v2/frames/codecs-addenda.js'

// Lyrics3
export * from './lyrics3/lyrics3.js'
// both modules have timestamp helpers; the Lyrics3 [mm:ss] ones are renamed
export { formatTimestamp as formatLyrics3Timestamp, parseTimestamp as parseLyrics3Timestamp } from './lyrics3/lyrics3.js'

// Partial (random-access) reading and writing, used by the browser and Node entries
export { planID3FileWrite, readID3RandomAccess, type PlannedWrite, type RandomAccess, type Segment } from './file/partial-id3.js'
export { detectFormat, type AudioFormat } from './file/detect.js'

// Core
export { TextEncoding, type MajorVersion } from './core/encoding.js'
export { NotImplementedError, TagReadError, TagWriteError, UnknownFormatError, type Warning } from './core/errors.js'

// High-level API for any file (switches on detectFormat)
export { read, write, type ReadResult, type SupportedFormat, type WriteInput, type WriteOptions, type WriteResult } from './api/api.js'
export { planWrite, readRandomAccess } from './file/partial.js'

// High-level MP4 API
export { mp4Input, readMP4File, writeMP4File, type MP4FileWriteResult, type MP4ReadResult, type MP4WriteInput } from './api/api-mp4.js'
export { planMP4FileWrite, readMP4RandomAccess } from './file/partial-mp4.js'

// MP4 / M4A metadata
export { MP4WriteError, type AtomHeader } from './mp4/atoms.js'
export { planMP4Write, readMP4, readMP4Parts, writeMP4, type MP4Layout, type MP4WriteOptions, type MP4WriteResult, type ReadMP4Result } from './mp4/file.js'
export { applyMP4Metadata, getMP4Metadata } from './mp4/mapping.js'
export { udtaEntry, type MP4Item, type MP4Tags, type QuickTimeItem, type QuickTimeMeta, type UserDataText } from './mp4/meta.js'
export { DataType, decodeLocale, decodePair, encodePair, imageMime, imageType, intValue, packLanguage, textValue, unpackLanguage, valueFloat, valueInt, valueText, type MP4Value } from './mp4/values.js'

// High-level FLAC API
export { flacInput, readFLACFile, writeFLACFile, type FLACFileWriteResult, type FLACReadResult, type FLACWriteInput } from './api/api-flac.js'
export { planFLACFileWrite, readFLACRandomAccess } from './file/partial-flac.js'

// FLAC metadata blocks, Vorbis comments and pictures
export { BlockType, FLACWriteError, MAX_BLOCK_SIZE, parsePicture, parseStreamInfo, serializePicture, type FLACLayout, type FLACPicture, type StreamInfo } from './flac/blocks.js'
export { planFLACWrite, readFLAC, readFLACHead, type FLACTags, type FLACWriteOptions, type FLACWriteResult, type ReadFLACResult } from './flac/file.js'
export { applyFLACMetadata, getFLACMetadata } from './flac/mapping.js'
export { isValidFieldName, parseVorbisComment, serializeVorbisComment, type VorbisComment, type VorbisField } from './flac/vorbis.js'

// High-level AIFF API
export { aiffResult, planAIFFFile, readAIFFFile, writeAIFFFile, type AIFFFileWriteOptions, type AIFFFileWriteResult, type AIFFReadResult, type AIFFWriteInput } from './api/api-aiff.js'
export { planAIFFFileWrite, readAIFFRandomAccess } from './file/partial-aiff.js'

// AIFF chunks
export { AIFFWriteError, extended, parseComments, parseCommon, serializeComments, type AIFFComment, type AIFFLayout, type Chunk as AIFFChunk, type CommonChunk } from './aiff/chunks.js'
export { aiffLayout, planAIFFWrite, readAIFFChunks, type AIFFTags, type AIFFWriteOptions, type AIFFWriteResult, type ReadAIFFResult } from './aiff/file.js'
export { applyAIFFMetadata, getAIFFMetadata } from './aiff/mapping.js'

// High-level WAV API
export { planWAVFile, readWAVFile, wavResult, writeWAVFile, type WAVFileWriteOptions, type WAVFileWriteResult, type WAVReadResult, type WAVWriteInput } from './api/api-wav.js'
export { planWAVFileWrite, readWAVRandomAccess } from './file/partial-wav.js'

// WAV (RIFF) chunks and the INFO list
export { WAVWriteError, parseFormat, parseInfo, serializeInfo, type InfoEntry, type WAVFormat, type WAVLayout, type Chunk as WAVChunk } from './wav/chunks.js'
export { planWAVWrite, readWAVChunks, wavLayout, type ReadWAVResult, type WAVAudio, type WAVTags, type WAVWriteOptions, type WAVWriteResult } from './wav/file.js'
export { applyWAVMetadata, getWAVMetadata } from './wav/mapping.js'

// High-level Ogg API
export { oggInput, oggResult, readOggFile, writeOggFile, type OggFileWriteOptions, type OggFileWriteResult, type OggReadResult, type OggWriteInput } from './api/api-ogg.js'
export { planOggFileWrite, readOggRandomAccess } from './file/partial-ogg.js'

// Ogg pages and comment headers
export { OggWriteError, PageFlag, paginate, parsePage, serializePage, verifyPage, type OggPage, type PageSpec } from './ogg/page.js'
export { lastGranule, planOggWrite, readOggHead, type OggCodec, type OggLayout, type OggStream, type OggTags, type OggWriteResult, type ReadOggResult } from './ogg/file.js'
export { oggCrc } from './ogg/crc.js'
export { applyOggMetadata, getOggMetadata } from './ogg/mapping.js'
export { decodeBase64, encodeBase64 } from './core/base64.js'

// Files as segments: new bytes and byte ranges of the original
export { applySegments } from './file/segments.js'
