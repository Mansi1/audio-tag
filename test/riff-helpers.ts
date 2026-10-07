// WAV test fixtures, written from the spec independently of src/: little-endian chunks with a pad
// byte (spec/riff/riffmci.md Chapter 2 "Chunks").

const enc = new TextEncoder()
const le32 = (n: number) => [n & 0xff, (n >>> 8) & 0xff, (n >>> 16) & 0xff, (n >>> 24) & 0xff]
const le16 = (n: number) => [n & 0xff, (n >> 8) & 0xff]

export function chunk(id: string, data: Uint8Array | number[]): Uint8Array {
  const d = Array.from(data)
  return Uint8Array.from([...enc.encode(id), ...le32(d.length), ...d, ...(d.length & 1 ? [0] : [])])
}

export function riff(chunks: Uint8Array[]): Uint8Array {
  const body = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(12 + body)
  out.set([...enc.encode('RIFF'), ...le32(4 + body), ...enc.encode('WAVE')])
  let pos = 12
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

/** fmt(<wFormatTag> <wChannels> <dwSamplesPerSec> <dwAvgBytesPerSec> <wBlockAlign> <wBitsPerSample>) */
export function fmt(tag: number, channels: number, rate: number, byteRate: number, align: number, bits: number): Uint8Array {
  return chunk('fmt ', [...le16(tag), ...le16(channels), ...le32(rate), ...le32(byteRate), ...le16(align), ...le16(bits)])
}

export function data(bytes: number): Uint8Array {
  return chunk('data', Array.from({ length: bytes }, (_, i) => (i * 7) & 0xff))
}

/** LIST('INFO' <id>("value"Z)...): ZSTRs, written as ISO-8859-1 bytes unless given as bytes. */
export function info(entries: [string, string | Uint8Array][]): Uint8Array {
  const body = [...enc.encode('INFO')]
  for (const [id, v] of entries) {
    const bytes = typeof v === 'string' ? Array.from(v, (c) => c.charCodeAt(0)) : Array.from(v)
    body.push(...chunk(id, [...bytes, 0]))
  }
  return chunk('LIST', body)
}

/**
 * SPEC: spec/riff/riffmci.md "Examples of PCM WAVE Files":
 * RIFF('WAVE' INFO(INAM("O Canada"Z)) fmt(1, 1, 44100, 132300, 3, 20) data(<wave-data>)),
 * with two seconds of data.
 */
export function oCanada(): Uint8Array {
  return riff([info([['INAM', 'O Canada']]), fmt(1, 1, 44100, 132300, 3, 20), data(264600)])
}
