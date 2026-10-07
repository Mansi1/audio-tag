// Hand-built MP4 fixtures, independent of the library's writer.
import { bytes, u32 } from './helpers'

export function box(type: string, ...body: (number[] | Uint8Array | string)[]): Uint8Array {
  const b = bytes(...body)
  return bytes(u32(b.length + 8), type, b)
}

export function fullBox(type: string, ...body: (number[] | Uint8Array | string)[]): Uint8Array {
  return box(type, [0, 0, 0, 0], ...body)
}

/** A 'data' atom: type indicator, locale, value. */
export function data(type: number, value: number[] | Uint8Array | string): Uint8Array {
  return box('data', u32(type), u32(0), typeof value === 'string' ? new TextEncoder().encode(value) : value)
}

export function stco(offsets: number[]): Uint8Array {
  return fullBox('stco', u32(offsets.length), ...offsets.map(u32))
}

export function co64(offsets: number[]): Uint8Array {
  return fullBox('co64', u32(offsets.length), offsets.flatMap((o) => [...u32(Math.floor(o / 2 ** 32)), ...u32(o % 2 ** 32)]))
}

/** iTunes hdlr exactly as in the sample file: version/flags, predefined, 'mdir', 'appl', 0, 0, name. */
export const HDLR_MDIR = fullBox('hdlr', u32(0), 'mdir', 'appl', u32(0), u32(0), [0])

export const CHUNKS = 10
export const CHUNK = 100

/** Deterministic "audio": each chunk starts with its index so moved chunks are detectable. */
export function audio(): Uint8Array {
  return Uint8Array.from({ length: CHUNKS * CHUNK }, (_, i) => (i % CHUNK === 0 ? i / CHUNK : (i * 7) & 0xff))
}

export interface M4AOptions {
  items?: Uint8Array[]
  free?: number
  moovAtEnd?: boolean
  wideOffsets?: boolean
  extraTopLevel?: Uint8Array[]
  /** Extra udta children (e.g. user data text atoms). */
  udta?: Uint8Array[]
  /** A plain QuickTime 'meta' directly in moov. */
  moovMeta?: Uint8Array
  noMeta?: boolean
}

/** ftyp, moov [mvhd, trak [... stbl [stsd, stco]], udta [meta [hdlr, ilst]]], free, mdat. */
export function m4a(opts: M4AOptions = {}): Uint8Array {
  const ftyp = box('ftyp', 'M4A ', u32(0), 'M4A ', 'mp42', 'isom', [0, 0, 0, 0])
  const media = audio()
  const build = (mdatStart: number) => {
    const offsets = Array.from({ length: CHUNKS }, (_, i) => mdatStart + 8 + i * CHUNK)
    const trak = box(
      'trak',
      fullBox('tkhd', new Array(80).fill(0)),
      box('mdia', fullBox('hdlr', u32(0), 'soun', u32(0), u32(0), u32(0), [0]), box('minf', box('stbl', fullBox('stsd', u32(0)), opts.wideOffsets ? co64(offsets) : stco(offsets)))),
    )
    const meta = fullBox('meta', HDLR_MDIR, box('ilst', ...(opts.items ?? [])))
    const udta = opts.noMeta ? (opts.udta?.length ? box('udta', ...opts.udta) : new Uint8Array(0)) : box('udta', meta, ...(opts.udta ?? []))
    return box('moov', fullBox('mvhd', new Array(96).fill(0)), trak, udta, opts.moovMeta ?? new Uint8Array(0))
  }
  const free = opts.free ? box('free', new Array(opts.free - 8).fill(0)) : new Uint8Array(0)
  const extra = bytes(...(opts.extraTopLevel ?? []))
  if (opts.moovAtEnd) {
    const mdatStart = ftyp.length + extra.length
    return bytes(ftyp, extra, box('mdat', media), build(mdatStart), free)
  }
  const moovLen = build(0).length
  const mdatStart = ftyp.length + moovLen + free.length + extra.length
  return bytes(ftyp, build(mdatStart), free, extra, box('mdat', media))
}

/** The items of the user's sample file, rebuilt byte for byte (without the cover image). */
export function sampleItems(): Uint8Array[] {
  return [
    box('trkn', data(0, [0, 0, 0, 2, 0, 4, 0, 0])),
    box('disk', data(0, [0, 0, 0, 1, 0, 1])),
    box('tmpo', data(21, [0, 0])),
    box('cpil', data(21, [0])),
    box('gnre', data(0, [0, 15])),
    box('©alb', data(1, 'Baby Boy')),
    box('aART', data(1, 'Beyoncé')),
    box('©ART', data(1, 'Beyoncé feat. Sean Paul')),
    box('----', fullBox('mean', 'com.apple.iTunes'), fullBox('name', 'iTunNORM'), data(1, ' 00000c46 00000a35')),
    box('©nam', data(1, "Baby Boy (Maurice's Nu Soul Mix)")),
    box('©too', data(1, 'iTunes v6.0.2.23, QuickTime 7.0.4')),
    box('©day', data(1, '2003')),
    box('covr', data(13, [0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])),
  ]
}

/** All chunk offsets of all tracks. */
export function chunkOffsets(file: Uint8Array): number[] {
  const out: number[] = []
  const dv = new DataView(file.buffer, file.byteOffset, file.byteLength)
  const text = (o: number) => String.fromCharCode(...file.subarray(o, o + 4))
  for (let i = 0; i + 8 < file.length; i++) {
    const t = text(i + 4)
    if (t !== 'stco' && t !== 'co64') continue
    const size = dv.getUint32(i)
    if (size < 16 || i + size > file.length) continue
    const n = dv.getUint32(i + 12)
    const wide = t === 'co64'
    if (16 + n * (wide ? 8 : 4) !== size) continue
    for (let k = 0; k < n; k++) out.push(wide ? dv.getUint32(i + 16 + k * 8) * 2 ** 32 + dv.getUint32(i + 20 + k * 8) : dv.getUint32(i + 16 + k * 4))
  }
  return out
}

/** True when every chunk offset points at the chunk with the expected index. */
export function chunksIntact(file: Uint8Array): boolean {
  const offs = chunkOffsets(file)
  return offs.length === CHUNKS && offs.every((o, i) => file[o] === i && file[o + 1] === ((i * CHUNK + 1) * 7 & 0xff))
}
