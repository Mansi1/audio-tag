import { concat, equalBytes, startsWith } from '../core/bytes.js'
import { decodeBase64, encodeBase64 } from '../core/base64.js'
import { NotImplementedError, type Warning, WarningSink } from '../core/errors.js'
import { afterID3v2 } from '../file/detect.js'
import type { Segment } from '../file/segments.js'
import { type FLACPicture, type StreamInfo, parsePicture, parseStreamInfo, serializePicture } from '../flac/blocks.js'
import { type VorbisComment, parseVorbisComment, serializeVorbisComment } from '../flac/vorbis.js'
import { type OggPage, OggWriteError, PageFlag, paginate, parsePage, renumberPage, verifyPage } from './page.js'

export type OggCodec = 'vorbis' | 'opus' | 'flac'

export interface OggTags {
  /** The comment without the METADATA_BLOCK_PICTURE fields (those are `pictures`). */
  vorbis: VorbisComment
  /** METADATA_BLOCK_PICTURE fields, decoded (G3). */
  pictures: FLACPicture[]
}

export interface OggStream {
  codec: OggCodec
  serial: number
  /** Vorbis identification header sample rate, FLAC streaminfo sample rate, or 48000 for Opus. */
  sampleRate: number
  /** Opus pre-skip, in 48 kHz samples. */
  preSkip?: number
  /** FLAC-in-Ogg streaminfo. */
  streamInfo?: StreamInfo
}

export interface OggLayout {
  /** Offset of the first page: after any ID3v2 tags in front of the stream (G7). */
  start: number
  /** The pages of the stream up to the one where the last header packet ends. */
  headerPages: OggPage[]
  /** Index of the comment packet among the header packets. */
  commentPacket: number
  /** End of the last header page. */
  headerEnd: number
  /** Pages of other streams sit between the header pages: the file cannot be written (G7). */
  interleaved: boolean
}

export interface ReadOggResult {
  tags: OggTags
  stream: OggStream
  layout: OggLayout
  /** The comment packet as stored. */
  commentPacket: Uint8Array
  /** All header packets as stored. */
  packets: Uint8Array[]
  warnings: Warning[]
}

const PICTURE_FIELD = 'METADATA_BLOCK_PICTURE'

/** Thrown by readOggHead when `head` does not yet hold all header pages. */
export class NeedMoreData extends Error {
  override name = 'NeedMoreData'
}

/** G1: the codec of the first packet, and how many header packets it has (0 = until the last FLAC block). */
function codecOf(first: Uint8Array): { codec: OggCodec; count: number; comment: number } | undefined {
  if (startsWith(first, '\x01vorbis')) return { codec: 'vorbis', count: 3, comment: 1 }
  if (startsWith(first, 'OpusHead')) return { codec: 'opus', count: 2, comment: 1 }
  // SPEC: RFC 9639 §10.1: 0x7F "FLAC", version 1.0, the number of header packets (big-endian, 0 = unknown).
  if (first[0] === 0x7f && startsWith(first, 'FLAC', 1)) return { codec: 'flac', count: 1 + ((first[7]! << 8) | first[8]!), comment: -1 }
  return undefined
}

/** The comment of a comment packet, and what surrounds it (G2). */
function splitComment(codec: OggCodec, packet: Uint8Array): { comment: Uint8Array; prefix: Uint8Array; suffix: Uint8Array } {
  if (codec === 'vorbis') {
    // SPEC: Vorbis I §5: "\x03vorbis", the comment, then the framing bit.
    return { prefix: packet.subarray(0, 7), comment: packet.subarray(7, packet.length - 1), suffix: packet.subarray(packet.length - 1) }
  }
  if (codec === 'opus') {
    // SPEC: RFC 7845 §5.2: "OpusTags", the comment, then optional binary data.
    const body = packet.subarray(8)
    const end = commentLength(body)
    return { prefix: packet.subarray(0, 8), comment: body.subarray(0, end), suffix: body.subarray(end) }
  }
  return { prefix: packet.subarray(0, 4), comment: packet.subarray(4), suffix: new Uint8Array(0) }
}

/** Bytes a Vorbis comment occupies at the start of `b` (vendor, count, fields). */
function commentLength(b: Uint8Array): number {
  const u32 = (p: number) => (p + 4 <= b.length ? (b[p]! | (b[p + 1]! << 8) | (b[p + 2]! << 16) | (b[p + 3]! << 24)) >>> 0 : Infinity)
  let pos = 4 + u32(0)
  const count = u32(pos)
  pos += 4
  for (let i = 0; i < count && pos <= b.length; i++) pos += 4 + u32(pos)
  return Math.min(pos, b.length)
}

/** The comment packet for `tags` (G2, G3). */
function buildComment(codec: OggCodec, original: Uint8Array, tags: OggTags): Uint8Array {
  const { prefix, suffix } = splitComment(codec, original)
  const fields = [...tags.vorbis.fields, ...tags.pictures.map((p) => ({ name: PICTURE_FIELD, value: encodeBase64(serializePicture(p)) }))]
  const comment = serializeVorbisComment({ vendor: tags.vorbis.vendor, fields })
  if (codec === 'vorbis') return concat([prefix, comment, Uint8Array.of(1)])
  // SPEC: RFC 7845 §5.2: data after the comments is kept when the LSB of its first byte is 1, otherwise it is padding.
  if (codec === 'opus') return concat([prefix, comment, suffix.length && suffix[0]! & 1 ? suffix : new Uint8Array(0)])
  const size = comment.length
  if (size > 0xffffff) throw new OggWriteError('flac-block-size', 'the comment is larger than a FLAC metadata block can hold')
  return concat([Uint8Array.of(prefix[0]!, (size >> 16) & 0xff, (size >> 8) & 0xff, size & 0xff), comment])
}

/**
 * Reads the header packets of the first logical stream. `head` must start at the beginning of the
 * file and reach at least to the end of the last header page; NeedMoreData is thrown otherwise.
 */
export function readOggHead(head: Uint8Array, w: WarningSink = new WarningSink()): ReadOggResult {
  const start = afterID3v2(head)
  if (!startsWith(head, 'OggS', start)) throw new NotImplementedError('ogg-page', 'no Ogg page at the start of the stream')
  const pages: OggPage[] = []
  const packets: Uint8Array[] = []
  let current: Uint8Array[] = []
  let serial: number | undefined
  let codec: ReturnType<typeof codecOf>
  let interleaved = false
  let pos = start
  const done = () => codec && (codec.count > 1 ? packets.length >= codec.count : packets.length > 1 && (packets[packets.length - 1]![0]! & 0x80) !== 0)
  while (!done()) {
    const p = parsePage(head, pos)
    if (!p) {
      if (pos >= head.length || head.length - pos < 27 || startsWith(head, 'OggS', pos)) throw new NeedMoreData()
      throw new NotImplementedError('ogg-page', `no Ogg page at offset ${pos}`)
    }
    pos = p.end
    serial ??= p.serial
    if (p.serial !== serial) {
      // Another stream's page between the header pages (multiplexed): skipped for reading.
      if (pages.length) interleaved = true
      continue
    }
    if (!verifyPage(head, p)) w.warn('ogg-crc', `page ${p.sequence} has a wrong CRC`, { offset: p.start })
    pages.push(p)
    let d = p.dataStart
    for (const s of p.segments) {
      current.push(head.subarray(d, d + s))
      d += s
      if (s < 255) {
        packets.push(concat(current))
        current = []
        if (packets.length === 1) {
          codec = codecOf(packets[0]!)
          if (!codec) throw new NotImplementedError('ogg-codec', 'this Ogg stream is not Vorbis, Opus or FLAC; its tags are not implemented')
        }
        if (done()) break
      }
    }
    if (current.length && done()) break
  }
  const c = codec!
  // FLAC in Ogg: the comment is the metadata block of type 4 (RFC 9639 §10.1).
  const commentIndex = c.codec === 'flac' ? packets.findIndex((p, i) => i > 0 && (p[0]! & 0x7f) === 4) : c.comment
  const stream: OggStream = { codec: c.codec, serial: serial!, sampleRate: 48000 }
  const id = packets[0]!
  if (c.codec === 'vorbis' && id.length >= 16) stream.sampleRate = (id[12]! | (id[13]! << 8) | (id[14]! << 16) | (id[15]! << 24)) >>> 0
  if (c.codec === 'opus' && id.length >= 12) stream.preSkip = id[10]! | (id[11]! << 8)
  if (c.codec === 'flac' && id.length >= 51) {
    const si = parseStreamInfo(id.subarray(17, 51), w)
    if (si) {
      stream.streamInfo = si
      stream.sampleRate = si.sampleRate
    }
  }
  if (start > 0) w.note('ogg-id3-prefix', 'an ID3v2 tag in front of the Ogg stream is ignored (readID3File() reads it) and kept on write')
  const layout: OggLayout = { start, headerPages: pages, commentPacket: commentIndex, headerEnd: pages[pages.length - 1]!.end, interleaved }

  let tags: OggTags = { vorbis: { vendor: '', fields: [] }, pictures: [] }
  let commentPacket: Uint8Array = new Uint8Array(0)
  if (commentIndex < 0) w.warn('ogg-no-comment', 'the stream has no comment header')
  else {
    commentPacket = packets[commentIndex]!
    tags = toTags(parseVorbisComment(splitComment(c.codec, commentPacket).comment, w), w)
  }
  return { tags, stream, layout, commentPacket, packets, warnings: w.list }
}

/** G3: METADATA_BLOCK_PICTURE fields become pictures; undecodable ones stay fields. */
function toTags(comment: VorbisComment, w: WarningSink): OggTags {
  const fields = []
  const pictures: FLACPicture[] = []
  for (const f of comment.fields) {
    if (f.name.toUpperCase() !== PICTURE_FIELD) {
      fields.push(f)
      continue
    }
    const bytes = decodeBase64(f.value)
    const p = bytes && parsePicture(bytes, new WarningSink())
    if (p) pictures.push(p)
    else {
      w.warn('ogg-picture', 'a METADATA_BLOCK_PICTURE field is not a base64 picture block; it is kept as it is')
      fields.push(f)
    }
  }
  return { vorbis: { vendor: comment.vendor, fields }, pictures }
}

/** G6: the granule position of the last page of `serial` in `tail` (the end of the file), or undefined. */
export function lastGranule(tail: Uint8Array, serial: number): bigint | undefined {
  for (let i = tail.length - 27; i >= 0; i--) {
    if (tail[i] !== 0x4f || !startsWith(tail, 'OggS', i)) continue
    const p = parsePage(tail, i)
    if (p && p.serial === serial && p.granule !== 0xffffffffffffffffn) return p.granule
  }
  return undefined
}

export interface OggWriteResult {
  segments: Segment[]
  inPlace: boolean
  warnings: Warning[]
  /** G5: the following pages must be renumbered, but `data` does not hold the whole file. */
  needsWholeFile?: boolean
}

/**
 * Plans writing `tags` (G4, G5). `data` is the file from its start: at least the header pages, or
 * the whole file when the following pages must be renumbered.
 */
export function planOggWrite(data: Uint8Array, fileLength: number, r: ReadOggResult, tags: OggTags): OggWriteResult {
  const w = new WarningSink()
  const { layout, stream, packets } = r
  if (layout.commentPacket < 0) throw new OggWriteError('ogg-no-comment', 'the stream has no comment header to write the tags into')
  // Unchanged tags keep the stored packet, so an unchanged write gives identical bytes.
  const snapshot = buildComment(stream.codec, r.commentPacket, r.tags)
  let comment = buildComment(stream.codec, r.commentPacket, tags)
  if (equalBytes(comment, snapshot)) comment = r.commentPacket
  if (equalBytes(comment, r.commentPacket)) return { segments: [{ start: 0, end: fileLength }], inPlace: true, warnings: w.list }
  if (layout.interleaved) throw new OggWriteError('ogg-multiplexed', 'pages of another stream sit between the header pages; this file cannot be written')

  const [first, ...rest] = layout.headerPages
  const oldPages = rest.length
  const newPackets = packets.slice(1).map((p, i) => (i + 1 === layout.commentPacket ? comment : p))
  const lastFlags = rest.length ? rest[rest.length - 1]!.headerType & PageFlag.EOS : 0
  const pages = paginate(newPackets, oldPages, stream.serial, first!.sequence + 1, lastFlags)
  const header = concat(pages)
  const regionStart = rest[0]?.start ?? first!.end
  const segments: Segment[] = [{ start: 0, end: regionStart }, header]
  const delta = pages.length - oldPages
  if (delta === 0) {
    if (layout.headerEnd < fileLength) segments.push({ start: layout.headerEnd, end: fileLength })
    return { segments, inPlace: header.length === layout.headerEnd - regionStart, warnings: w.list }
  }
  // G5: every later page of the stream gets a new sequence number and CRC.
  if (data.length < fileLength) return { segments: [], inPlace: false, warnings: w.list, needsWholeFile: true }
  let pos = layout.headerEnd
  let copyFrom = pos
  while (pos < fileLength) {
    const p = parsePage(data, pos)
    if (!p) break
    if (p.serial === stream.serial) {
      if (copyFrom < p.start) segments.push({ start: copyFrom, end: p.start })
      segments.push(renumberPage(data, p, p.sequence + delta))
      copyFrom = p.end
    }
    pos = p.end
  }
  if (copyFrom < fileLength) segments.push({ start: copyFrom, end: fileLength })
  w.note('ogg-renumbered', `the header needs ${pages.length} pages instead of ${oldPages}; the following pages were renumbered`)
  return { segments, inPlace: false, warnings: w.list }
}
