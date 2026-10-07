import { concat, isBytes } from '../core/bytes.js'

/** New bytes, or a byte range of the original file (so audio is never copied in memory). */
export type Segment = Uint8Array | { start: number; end: number }

/** Joins segments into a new file. */
export function applySegments(data: Uint8Array, segments: readonly Segment[]): Uint8Array {
  return concat(segments.map((s) => (isBytes(s) ? s : data.subarray(s.start, s.end))))
}

/** Joins neighbouring ranges, so unchanged runs of the original are one copy. */
export function mergeRanges(segments: readonly Segment[]): Segment[] {
  const out: Segment[] = []
  for (const s of segments) {
    const last = out[out.length - 1]
    if (last && !isBytes(last) && !isBytes(s) && last.end === s.start) out[out.length - 1] = { start: last.start, end: s.end }
    else out.push(s)
  }
  return out
}
