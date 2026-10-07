// RFC 4648 §4 base64 with padding, for METADATA_BLOCK_PICTURE (spec/ogg/xiph-VorbisComment.md:
// "line feeds are not allowed and padding characters ('=') are required").

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
const VALUES = new Map(Array.from(ALPHABET, (c, i) => [c, i]))

export function encodeBase64(bytes: Uint8Array): string {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const n = (bytes[i]! << 16) | ((bytes[i + 1] ?? 0) << 8) | (bytes[i + 2] ?? 0)
    out += ALPHABET[(n >> 18) & 63]! + ALPHABET[(n >> 12) & 63]!
    out += i + 1 < bytes.length ? ALPHABET[(n >> 6) & 63]! : '='
    out += i + 2 < bytes.length ? ALPHABET[n & 63]! : '='
  }
  return out
}

/** Decodes padded base64; undefined for anything else. */
export function decodeBase64(s: string): Uint8Array | undefined {
  if (s.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(s)) return undefined
  const pad = s.endsWith('==') ? 2 : s.endsWith('=') ? 1 : 0
  const out = new Uint8Array((s.length / 4) * 3 - pad)
  let o = 0
  for (let i = 0; i < s.length; i += 4) {
    const n = (VALUES.get(s[i]!)! << 18) | (VALUES.get(s[i + 1]!)! << 12) | ((VALUES.get(s[i + 2]!) ?? 0) << 6) | (VALUES.get(s[i + 3]!) ?? 0)
    if (o < out.length) out[o++] = (n >> 16) & 0xff
    if (o < out.length) out[o++] = (n >> 8) & 0xff
    if (o < out.length) out[o++] = n & 0xff
  }
  return out
}
