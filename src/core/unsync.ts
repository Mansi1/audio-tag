// SPEC: v2.4 structure §6.1, v2.3 §5, v2.2 §5. A false sync is %11111111 111xxxxx. Encoders
// insert $00 after the $FF, and every $FF 00 also becomes $FF 00 00 so decoding is unambiguous.

/** Applies the unsynchronisation scheme. `endsWithFF` lets callers apply the trailing-byte rule. */
export function unsynchronise(data: Uint8Array): { data: Uint8Array; changed: boolean; endsWithFF: boolean } {
  let extra = 0
  for (let i = 0; i + 1 < data.length; i++) {
    if (data[i] === 0xff && (data[i + 1]! >= 0xe0 || data[i + 1] === 0x00)) extra++
  }
  const endsWithFF = data.length > 0 && data[data.length - 1] === 0xff
  if (extra === 0) return { data, changed: false, endsWithFF }
  const out = new Uint8Array(data.length + extra)
  let o = 0
  for (let i = 0; i < data.length; i++) {
    const b = data[i]!
    out[o++] = b
    if (b === 0xff && i + 1 < data.length && (data[i + 1]! >= 0xe0 || data[i + 1] === 0x00)) out[o++] = 0
  }
  return { data: out, changed: true, endsWithFF }
}

/** Reverses unsynchronisation: every $FF 00 becomes $FF. */
export function resynchronise(data: Uint8Array): Uint8Array {
  let drop = 0
  for (let i = 0; i + 1 < data.length; i++) if (data[i] === 0xff && data[i + 1] === 0) drop++
  if (drop === 0) return data
  const out = new Uint8Array(data.length - drop)
  let o = 0
  for (let i = 0; i < data.length; i++) {
    out[o++] = data[i]!
    if (data[i] === 0xff && data[i + 1] === 0) i++
  }
  return out
}

/** True when unsynchronising would change the data. */
export function needsUnsync(data: Uint8Array): boolean {
  for (let i = 0; i + 1 < data.length; i++) {
    if (data[i] === 0xff && (data[i + 1]! >= 0xe0 || data[i + 1] === 0x00)) return true
  }
  return false
}
