// AIFF test fixtures: the Appendix A example of AIFF 1.3, and a chunk builder (written from the spec,
// independently of src/).

const enc = new TextEncoder()
const be32 = (n: number) => [(n >>> 24) & 0xff, (n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff]
const be16 = (n: number) => [(n >> 8) & 0xff, n & 0xff]

/** A chunk: ID, 32-bit big-endian size, data, and a zero pad byte for odd sizes ("File Structure"). */
export function chunk(id: string, data: Uint8Array | number[]): Uint8Array {
  const out = new Uint8Array(8 + data.length + (data.length & 1))
  out.set([...enc.encode(id), ...be32(data.length)])
  out.set(data, 8)
  return out
}

/** A FORM AIFF (or AIFC) around the given chunks. */
export function form(chunks: Uint8Array[], formType = 'AIFF'): Uint8Array {
  const body = chunks.reduce((n, c) => n + c.length, 0)
  const out = new Uint8Array(12 + body)
  out.set([...enc.encode('FORM'), ...be32(4 + body), ...enc.encode(formType)])
  let pos = 12
  for (const c of chunks) {
    out.set(c, pos)
    pos += c.length
  }
  return out
}

/** 44100.00 as an 80-bit extended: exponent 0x400E, mantissa 0xAC44 << 48. */
export const RATE_44100 = [0x40, 0x0e, 0xac, 0x44, 0, 0, 0, 0, 0, 0]

export function comm(channels: number, frames: number, sampleSize: number, rate = RATE_44100): Uint8Array {
  return chunk('COMM', [...be16(channels), ...be32(frames), ...be16(sampleSize), ...rate])
}

export function ssnd(bytes: number): Uint8Array {
  const data = new Uint8Array(8 + bytes)
  for (let i = 8; i < data.length; i++) data[i] = (i * 13) & 0xff
  return chunk('SSND', data)
}

export function text(id: string, s: string): Uint8Array {
  return chunk(id, enc.encode(s))
}

/** The Comments Chunk: numComments, then timeStamp, MarkerID, count, text (padded to even). */
export function comt(comments: { timeStamp: number; marker: number; text: string }[]): Uint8Array {
  const out = [...be16(comments.length)]
  for (const c of comments) {
    const t = Array.from(enc.encode(c.text))
    out.push(...be32(c.timeStamp), ...be16(c.marker & 0xffff), ...be16(t.length), ...t, ...(t.length & 1 ? [0] : []))
  }
  return chunk('COMT', out)
}

/**
 * SPEC: spec/aiff/AIFF-1.3.md Appendix A: COMM (2 channels, 88200 frames, 16 bits, 44100 Hz),
 * MARK (markers 1 "beg loop" at 44100 and 2 "end loop" at 88200), INST and SSND (176408 bytes).
 * Its FORM ckSize is 176516.
 */
export function appendixA(): Uint8Array {
  const pstring = (s: string) => [s.length, ...enc.encode(s), ...(s.length % 2 === 0 ? [0] : [])]
  const mark = chunk('MARK', [...be16(2), ...be16(1), ...be32(44100), ...pstring('beg loop'), ...be16(2), ...be32(88200), ...pstring('end loop')])
  const inst = chunk('INST', [60, 0xfd, 57, 63, 1, 127, ...be16(6), ...be16(1), ...be16(1), ...be16(2), ...be16(0), ...be16(0), ...be16(0)])
  return form([comm(2, 88200, 16), mark, inst, ssnd(176400)])
}
