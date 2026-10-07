import { startsWith } from '../core/bytes.js'
import { TagWriteError } from '../core/errors.js'
import { oggCrc } from './crc.js'

// SPEC: spec/ogg/rfc3533.md §6. A page is "OggS", version 0, header_type, granule_position (8),
// bitstream_serial_number (4), page_sequence_number (4), CRC_checksum (4), number_page_segments,
// segment_table, then the data. "Fields with more than one byte length are encoded LSB (least
// significant byte) first." A packet is a run of lacing values of 255 ended by one below 255.

export class OggWriteError extends TagWriteError {
  override name = 'OggWriteError'
}

export const PageFlag = { CONTINUED: 0x01, BOS: 0x02, EOS: 0x04 } as const
/** RFC 3533: "A special value of -1 (in two's complement) indicates that no packets finish on this page." */
export const NO_GRANULE = 0xffffffffffffffffn

export interface OggPage {
  start: number
  /** End of the page data. */
  end: number
  headerType: number
  granule: bigint
  serial: number
  sequence: number
  crc: number
  /** The segment table (lacing values). */
  segments: number[]
  /** Offset of the page data. */
  dataStart: number
}

function u32le(b: Uint8Array, pos: number): number {
  return (b[pos]! | (b[pos + 1]! << 8) | (b[pos + 2]! << 16) | (b[pos + 3]! << 24)) >>> 0
}

/** The page at `pos`, or undefined when it is not a whole page in `data` (more bytes are needed or the pattern is missing). */
export function parsePage(data: Uint8Array, pos: number): OggPage | undefined {
  if (pos + 27 > data.length || !startsWith(data, 'OggS', pos)) return undefined
  const n = data[pos + 26]!
  if (pos + 27 + n > data.length) return undefined
  const segments = Array.from(data.subarray(pos + 27, pos + 27 + n))
  const dataStart = pos + 27 + n
  const end = dataStart + segments.reduce((a, b) => a + b, 0)
  if (end > data.length) return undefined
  let granule = 0n
  for (let i = 7; i >= 0; i--) granule = (granule << 8n) | BigInt(data[pos + 6 + i]!)
  return { start: pos, end, headerType: data[pos + 5]!, granule, serial: u32le(data, pos + 14), sequence: u32le(data, pos + 18), crc: u32le(data, pos + 22), segments, dataStart }
}

/** Size of the page whose 27-byte header (and segment table) start at `h`, or undefined. */
export function pageSize(h: Uint8Array): number | undefined {
  if (h.length < 27 || !startsWith(h, 'OggS')) return undefined
  const n = h[26]!
  if (h.length < 27 + n) return 27 + n
  return 27 + n + Array.from(h.subarray(27, 27 + n)).reduce((a, b) => a + b, 0)
}

/** Whether the stored CRC matches the page. */
export function verifyPage(data: Uint8Array, p: OggPage): boolean {
  const copy = data.slice(p.start, p.end)
  copy.fill(0, 22, 26)
  return oggCrc(copy) === p.crc
}

export interface PageSpec {
  headerType: number
  granule: bigint
  serial: number
  sequence: number
  segments: readonly number[]
  data: Uint8Array
}

export function serializePage(p: PageSpec): Uint8Array {
  if (p.segments.length > 255) throw new OggWriteError('ogg-page-segments', 'an Ogg page holds at most 255 segments')
  const out = new Uint8Array(27 + p.segments.length + p.data.length)
  const dv = new DataView(out.buffer)
  out.set([0x4f, 0x67, 0x67, 0x53, 0, p.headerType])
  dv.setBigUint64(6, BigInt.asUintN(64, p.granule), true)
  dv.setUint32(14, p.serial, true)
  dv.setUint32(18, p.sequence, true)
  out[26] = p.segments.length
  out.set(p.segments, 27)
  out.set(p.data, 27 + p.segments.length)
  dv.setUint32(22, oggCrc(out), true)
  return out
}

/** The lacing values of a packet: 255s, then the remainder (0 when the size is a multiple of 255). */
export function lacing(size: number): number[] {
  const out = new Array<number>(Math.floor(size / 255)).fill(255)
  out.push(size % 255)
  return out
}

/**
 * Lays packets out over `pageCount` pages or more (G4): each page holds at most 255 segments, the
 * last packet finishes the last page, a page that starts inside a packet is flagged as continued,
 * and the granule is 0 when a packet ends on the page and -1 otherwise.
 */
export function paginate(packets: readonly Uint8Array[], pageCount: number, serial: number, firstSequence: number, lastFlags = 0): Uint8Array[] {
  // Every segment: its size, and whether it ends a packet.
  const segs: { size: number; ends: boolean; packet: number; offset: number }[] = []
  packets.forEach((p, i) => {
    let offset = 0
    const l = lacing(p.length)
    l.forEach((size, k) => {
      segs.push({ size, ends: k === l.length - 1, packet: i, offset })
      offset += size
    })
  })
  const minPages = Math.ceil(segs.length / 255)
  const pages = Math.max(minPages, Math.min(pageCount, segs.length))
  const out: Uint8Array[] = []
  let s = 0
  for (let i = 0; i < pages; i++) {
    // Spread the segments evenly; the remainder goes to the first pages.
    const count = Math.floor(segs.length / pages) + (i < segs.length % pages ? 1 : 0)
    const page = segs.slice(s, s + count)
    s += count
    const data = new Uint8Array(page.reduce((n, g) => n + g.size, 0))
    let pos = 0
    for (const g of page) {
      data.set(packets[g.packet]!.subarray(g.offset, g.offset + g.size), pos)
      pos += g.size
    }
    const continued = page[0]!.offset > 0
    const headerType = (continued ? PageFlag.CONTINUED : 0) | (i === pages - 1 ? lastFlags : 0)
    const granule = page.some((g) => g.ends) ? 0n : NO_GRANULE
    out.push(serializePage({ headerType, granule, serial, sequence: firstSequence + i, segments: page.map((g) => g.size), data }))
  }
  return out
}

/** A copy of the page with a new sequence number and CRC (G5). */
export function renumberPage(data: Uint8Array, p: OggPage, sequence: number): Uint8Array {
  const copy = data.slice(p.start, p.end)
  const dv = new DataView(copy.buffer)
  dv.setUint32(18, sequence, true)
  dv.setUint32(22, 0, true)
  dv.setUint32(22, oggCrc(copy), true)
  return copy
}
