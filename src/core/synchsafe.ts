// SPEC: v2.4 structure §6.2. Synchsafe integers keep bit 7 of every byte zero, so 4 bytes hold
// 28 bits and the 5-byte CRC field in the v2.4 extended header holds 35 bits (§3.2).

export function decodeSynchsafe(bytes: Uint8Array, offset = 0, length = 4): number {
  let v = 0
  for (let i = 0; i < length; i++) v = v * 128 + (bytes[offset + i]! & 0x7f)
  return v
}

export function encodeSynchsafe(value: number, length = 4): Uint8Array {
  if (!Number.isInteger(value) || value < 0 || value >= 2 ** (7 * length)) {
    throw new RangeError(`${value} does not fit in a ${length}-byte synchsafe integer`)
  }
  const out = new Uint8Array(length)
  for (let i = length - 1; i >= 0; i--) {
    out[i] = value % 128
    value = Math.floor(value / 128)
  }
  return out
}

export function isSynchsafe(bytes: Uint8Array, offset = 0, length = 4): boolean {
  for (let i = 0; i < length; i++) if (bytes[offset + i]! >= 0x80) return false
  return true
}

/** Plain (non-synchsafe) big-endian decode of 4 bytes, as used by v2.3 frame sizes. */
export function decodeUint32(bytes: Uint8Array, offset = 0): number {
  return (
    bytes[offset]! * 0x1000000 + bytes[offset + 1]! * 0x10000 + bytes[offset + 2]! * 0x100 + bytes[offset + 3]!
  )
}
