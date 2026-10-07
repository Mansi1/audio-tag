// SPEC: CRC-32 [ISO-3309], used by the extended header in v2.3 §3.2 and v2.4 structure §3.2.
// Reflected polynomial 0xEDB88320, the same algorithm as zlib and PNG.

let table: Uint32Array | undefined

function getTable(): Uint32Array {
  if (table) return table
  table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
}

export function crc32(data: Uint8Array, crc = 0): number {
  const t = getTable()
  let c = (crc ^ 0xffffffff) >>> 0
  for (let i = 0; i < data.length; i++) c = t[(c ^ data[i]!) & 0xff]! ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}
