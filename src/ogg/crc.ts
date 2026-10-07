// SPEC: spec/ogg/rfc3533.md §6 "CRC_checksum: a 4 Byte field containing a 32 bit CRC checksum of the
// page (including header with zero CRC field and page content). The generator polynomial is
// 0x04c11db7." Unlike zlib's CRC-32 (core/crc32.ts) it is computed MSB first, with initial value 0
// and no final XOR (the reference implementation, libogg framing.c).

const TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let r = i << 24
    for (let k = 0; k < 8; k++) r = r & 0x80000000 ? (r << 1) ^ 0x04c11db7 : r << 1
    t[i] = r >>> 0
  }
  return t
})()

export function oggCrc(data: Uint8Array): number {
  let crc = 0
  for (let i = 0; i < data.length; i++) crc = ((crc << 8) ^ TABLE[((crc >>> 24) ^ data[i]!) & 0xff]!) >>> 0
  return crc
}
