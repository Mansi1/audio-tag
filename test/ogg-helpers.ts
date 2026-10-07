// Ogg test fixtures, written from the specs independently of src/: RFC 3533 pages (with a bitwise
// CRC, so the table-driven one in src/ogg/crc.ts is checked against it), and Vorbis, Opus and
// FLAC-in-Ogg header packets.

const enc = new TextEncoder()
const le32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]

/** RFC 3533 §6 CRC, bit by bit: polynomial 0x04c11db7, MSB first, initial 0. */
export function bitwiseCrc(data: Uint8Array): number {
  let crc = 0
  for (const byte of data) {
    crc ^= byte << 24
    for (let k = 0; k < 8; k++) crc = crc & 0x80000000 ? (crc << 1) ^ 0x04c11db7 : crc << 1
    crc >>>= 0
  }
  return crc
}

export function page(headerType: number, granule: bigint, serial: number, sequence: number, segments: number[], data: Uint8Array): Uint8Array {
  const out = new Uint8Array(27 + segments.length + data.length)
  const dv = new DataView(out.buffer)
  out.set([...enc.encode('OggS'), 0, headerType])
  dv.setBigUint64(6, BigInt.asUintN(64, granule), true)
  dv.setUint32(14, serial, true)
  dv.setUint32(18, sequence, true)
  out[26] = segments.length
  out.set(segments, 27)
  out.set(data, 27 + segments.length)
  dv.setUint32(22, bitwiseCrc(out), true)
  return out
}

function lacing(size: number): number[] {
  return [...new Array<number>(Math.floor(size / 255)).fill(255), size % 255]
}

function cat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}

export interface StreamOptions {
  serial?: number
  /** Audio packets, each on its own page; granule positions grow by `samplesPerPacket`. */
  audio?: Uint8Array[]
  samplesPerPacket?: number
}

/**
 * A logical stream: the first packet alone on the BOS page, the other header packets packed
 * greedily on the next pages (granule 0, or -1 when no packet ends there), then one page per audio
 * packet, the last with EOS.
 */
export function stream(headers: Uint8Array[], o: StreamOptions = {}): Uint8Array {
  const serial = o.serial ?? 0x1234
  const pages: Uint8Array[] = [page(0x02, 0n, serial, 0, lacing(headers[0]!.length), headers[0]!)]
  let seq = 1
  const segs: { size: number; ends: boolean; data: Uint8Array }[] = []
  for (const h of headers.slice(1)) {
    let off = 0
    const l = lacing(h.length)
    l.forEach((size, i) => {
      segs.push({ size, ends: i === l.length - 1, data: h.subarray(off, off + size) })
      off += size
    })
  }
  let continued = false
  for (let i = 0; i < segs.length; i += 255) {
    const chunk = segs.slice(i, i + 255)
    const granule = chunk.some((s) => s.ends) ? 0n : -1n
    pages.push(page(continued ? 1 : 0, granule, serial, seq++, chunk.map((s) => s.size), cat(chunk.map((s) => s.data))))
    continued = !chunk[chunk.length - 1]!.ends
  }
  const audio = o.audio ?? [Uint8Array.of(1, 2, 3, 4, 5), Uint8Array.of(6, 7, 8)]
  audio.forEach((a, i) => {
    pages.push(page(i === audio.length - 1 ? 0x04 : 0, BigInt((i + 1) * (o.samplesPerPacket ?? 1000)), serial, seq++, lacing(a.length), a))
  })
  return cat(pages)
}

/** A Vorbis comment (v-comment.html): vendor, count, fields, little-endian lengths. */
export function comment(vendor: string, fields: string[]): number[] {
  const out: number[] = []
  const put = (s: string) => {
    const b = enc.encode(s)
    out.push(...le32(b.length), ...b)
  }
  put(vendor)
  out.push(...le32(fields.length))
  for (const f of fields) put(f)
  return out
}

/** Vorbis I §4.2.2: type 1, "vorbis", version 0, channels, sample rate, bitrates, block sizes, framing. */
export function vorbisId(rate = 44100): Uint8Array {
  return Uint8Array.from([1, ...enc.encode('vorbis'), 0, 0, 0, 0, 2, ...le32(rate), 0, 0, 0, 0, ...le32(128000), 0, 0, 0, 0, 0xb8, 1])
}

/** Vorbis I §5: type 3, "vorbis", the comment, framing bit. */
export function vorbisComment(vendor: string, fields: string[]): Uint8Array {
  return Uint8Array.from([3, ...enc.encode('vorbis'), ...comment(vendor, fields), 1])
}

/** A stand-in setup header: type 5, "vorbis", some codebook bytes, framing bit. */
export function vorbisSetup(size = 300): Uint8Array {
  return Uint8Array.from([5, ...enc.encode('vorbis'), ...Array.from({ length: size }, (_, i) => (i * 37) & 0xff), 1])
}

/** RFC 7845 §5.1: "OpusHead", version 1, channels, pre-skip, input rate, gain, mapping family. */
export function opusHead(preSkip = 312): Uint8Array {
  return Uint8Array.from([...enc.encode('OpusHead'), 1, 2, preSkip & 0xff, preSkip >> 8, ...le32(48000), 0, 0, 0])
}

/** RFC 7845 §5.2: "OpusTags", the comment, optional trailing data. */
export function opusTags(vendor: string, fields: string[], trailing: number[] = []): Uint8Array {
  return Uint8Array.from([...enc.encode('OpusTags'), ...comment(vendor, fields), ...trailing])
}

/** RFC 9639 §10.1: 0x7F "FLAC", 1.0, header count, "fLaC", the streaminfo block (44.1 kHz). */
export function flacFirst(headerCount: number): Uint8Array {
  const streaminfo = [0x10, 0, 0x10, 0, 0, 0, 0x17, 0, 0, 0x44, 0x0a, 0xc4, 0x42, 0xf0, 0, 0, 0, 0, ...new Array(16).fill(0)]
  return Uint8Array.from([0x7f, ...enc.encode('FLAC'), 1, 0, headerCount >> 8, headerCount & 0xff, ...enc.encode('fLaC'), 0, 0, 0, 34, ...streaminfo])
}

/** A metadata-block packet (RFC 9639 §8.1 header + data). */
export function flacBlock(type: number, data: number[] | Uint8Array, last: boolean): Uint8Array {
  const d = Array.from(data)
  return Uint8Array.from([(last ? 0x80 : 0) | type, (d.length >> 16) & 0xff, (d.length >> 8) & 0xff, d.length & 0xff, ...d])
}

export function vorbisFile(fields: string[], o: StreamOptions = {}): Uint8Array {
  return stream([vorbisId(), vorbisComment('test vendor', fields), vorbisSetup()], o)
}
