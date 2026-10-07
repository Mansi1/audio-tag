// FLAC test fixtures: the worked examples of RFC 9639 Appendix D, and a builder for synthetic files.

/** Bytes from an `xxd`-style dump ("00000000: 664c 6143 ...  fLaC"), as printed in the RFC. */
export function fromDump(dump: string): Uint8Array {
  const hex = dump
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => l.slice(l.indexOf(':') + 1).split(/\s{2,}/)[0]!.replace(/\s/g, ''))
    .join('')
  return Uint8Array.from(hex.match(/../g)!, (b) => parseInt(b, 16))
}

/** SPEC: docs/flac/rfc9639.txt D.1.1, a streaminfo block and one audio frame. */
export const RFC_EXAMPLE_1 = fromDump(`
00000000: 664c 6143 8000 0022 1000 1000  fLaC..."....
0000000c: 0000 0f00 000f 0ac4 42f0 0000  ........B...
00000018: 0001 3e84 b418 07dc 6903 0758  ..>.....i..X
00000024: 6a3d ad1a 2e0f fff8 6918 0000  j=......i...
00000030: bf03 58fd 0312 8baa 9a         ..X......
`)

/** SPEC: docs/flac/rfc9639.txt D.2.1, with a seek table, a Vorbis comment and padding. */
export const RFC_EXAMPLE_2 = fromDump(`
00000000: 664c 6143 0000 0022 0010 0010  fLaC..."....
0000000c: 0000 1700 0044 0ac4 42f0 0000  .....D..B...
00000018: 0013 d5b0 5649 75e9 8b8d 8b93  ....VIu.....
00000024: 0422 757b 8103 0300 0012 0000  ."u{........
00000030: 0000 0000 0000 0000 0000 0000  ............
0000003c: 0000 0010 0400 003a 2000 0000  .......: ...
00000048: 7265 6665 7265 6e63 6520 6c69  reference li
00000054: 6246 4c41 4320 312e 332e 3320  bFLAC 1.3.3
00000060: 3230 3139 3038 3034 0100 0000  20190804....
0000006c: 0e00 0000 5449 544c 453d d7a9  ....TITLE=..
00000078: d79c d795 d79d 8100 0006 0000  ............
00000084: 0000 0000 fff8 6998 000f 9912  ......i.....
00000090: 0867 0162 3d14 4299 8f5d f70d  .g.b=.B..]..
0000009c: 6fe0 0c17 caeb 2100 0ee7 a77a  o.....!....z
000000a8: 24a1 590c 1217 b603 097b 784f  $.Y......{xO
000000b4: aa9a 33d2 85e0 70ad 5b1b 4851  ..3...p.[.HQ
000000c0: b401 0d99 d2cd 1a68 f1e6 b810  .......h....
000000cc: fff8 6918 0102 a402 c382 c40b  ..i.........
000000d8: c14a 03ee 48dd 03b6 7c13 30    .J..H...|.0
`)

/** Where the audio frames of RFC example 2 start (D.2.7: the first frame at 0x88). */
export const RFC_EXAMPLE_2_AUDIO = 0x88

const enc = new TextEncoder()

function le32(n: number): number[] {
  return [n & 0xff, (n >> 8) & 0xff, (n >> 16) & 0xff, (n >>> 24) & 0xff]
}

/** A block with its header (written independently of src/, from §8.1). */
export function block(type: number, data: Uint8Array, last = false): Uint8Array {
  return Uint8Array.from([(last ? 0x80 : 0) | type, (data.length >> 16) & 0xff, (data.length >> 8) & 0xff, data.length & 0xff, ...data])
}

/** A Vorbis comment block body (§8.6): little-endian lengths. */
export function vorbis(vendor: string, fields: string[]): Uint8Array {
  const out: number[] = []
  const put = (s: string) => {
    const b = enc.encode(s)
    out.push(...le32(b.length), ...b)
  }
  put(vendor)
  out.push(...le32(fields.length))
  for (const f of fields) put(f)
  return Uint8Array.from(out)
}

/** A picture block body (§8.8): big-endian lengths. */
export function picture(type: number, mime: string, description: string, data: Uint8Array, width = 0, height = 0): Uint8Array {
  const be = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
  const m = enc.encode(mime)
  const d = enc.encode(description)
  return Uint8Array.from([...be(type), ...be(m.length), ...m, ...be(d.length), ...d, ...be(width), ...be(height), ...be(0), ...be(0), ...be(data.length), ...data])
}

/** Streaminfo of RFC example 2 (44.1 kHz, 2 channels, 16 bits), with a given number of samples. */
export function streamInfo(totalSamples = 441000): Uint8Array {
  const s = RFC_EXAMPLE_2.slice(8, 8 + 34)
  s[13] = (s[13]! & 0xf0) | Math.floor(totalSamples / 2 ** 32)
  s.set([(totalSamples >>> 24) & 0xff, (totalSamples >> 16) & 0xff, (totalSamples >> 8) & 0xff, totalSamples & 0xff], 14)
  return s
}

export interface FLACOptions {
  comment?: string[]
  vendor?: string
  pictures?: Uint8Array[]
  /** Other blocks after streaminfo, as [type, data]. */
  extra?: [number, Uint8Array][]
  padding?: number
  /** Bytes in front of "fLaC" (an ID3v2 tag). */
  prefix?: Uint8Array
  audio?: Uint8Array
}

/** Audio frames stand-in: frame sync code and a recognisable pattern. */
export function frames(n = 256): Uint8Array {
  return Uint8Array.from({ length: n }, (_, i) => (i === 0 ? 0xff : i === 1 ? 0xf8 : (i * 31) & 0xff))
}

export function flac(o: FLACOptions = {}): Uint8Array {
  const blocks: [number, Uint8Array][] = [[0, streamInfo()], ...(o.extra ?? [])]
  if (o.comment) blocks.push([4, vorbis(o.vendor ?? 'test vendor', o.comment)])
  for (const p of o.pictures ?? []) blocks.push([6, p])
  if (o.padding !== undefined) blocks.push([1, new Uint8Array(o.padding)])
  const body = blocks.map(([t, d], i) => block(t, d, i === blocks.length - 1))
  const parts = [o.prefix ?? new Uint8Array(0), enc.encode('fLaC'), ...body, o.audio ?? frames()]
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0))
  let pos = 0
  for (const p of parts) {
    out.set(p, pos)
    pos += p.length
  }
  return out
}
