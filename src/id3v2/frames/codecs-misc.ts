import { bigToBytes, bytesToBig } from '../../core/bytes.js'
import { TagWriteError } from '../../core/errors.js'
import type { FrameReader, FrameWriter } from './context.js'
import type {
  AudioEncryptionFrame,
  BufferSizeFrame,
  EncryptedMetaFrame,
  EncryptionRegistrationFrame,
  GeneralObjectFrame,
  GroupRegistrationFrame,
  LinkFrame,
  PictureFrame,
  PlayCounterFrame,
  PopularimeterFrame,
  PositionSyncFrame,
  PrivateFrame,
  SeekFrame,
  SeekPointIndexFrame,
  SignatureFrame,
} from './types.js'

type Fields<F> = Omit<F, 'type' | 'id' | 'flags'>

// SPEC: v2.3 §4.15 / v2.4 §4.14 APIC: encoding, MIME type <text string> $00, picture type,
// description <according to encoding>, picture data.
// SPEC: v2.2 §4.15 PIC: encoding, image format $xx xx xx, picture type, description, data.
export function decodePicture(r: FrameReader): Fields<PictureFrame> {
  const encoding = r.encoding()
  const mimeType = r.ctx.major === 2 ? r.fixed(3) : r.latin1()
  const pictureType = r.u8()
  const description = r.text(encoding)
  if (r.ctx.major === 3 && description.length > 64) r.warn('apic-description', 'description longer than 64 characters')
  return { encoding, mimeType, pictureType, description, data: r.rest() }
}

export function encodePicture(f: Fields<PictureFrame>, w: FrameWriter): void {
  w.encoding(f.encoding)
  if (w.ctx.major === 2) w.fixed(f.mimeType, 3, 'image format')
  else w.latin1(f.mimeType)
  w.u8(f.pictureType).text(f.description, f.encoding).bytes(f.data)
}

/** SPEC: "In the event that the MIME media type name is omitted, "image/" will be implied." */
export function pictureMimeType(f: Pick<PictureFrame, 'mimeType'>, major: 2 | 3 | 4): string {
  if (major === 2) {
    const fmt = f.mimeType.trim().toLowerCase()
    if (fmt === '-->') return '-->'
    return fmt === 'jpg' ? 'image/jpeg' : `image/${fmt}`
  }
  if (f.mimeType === '-->' || f.mimeType.includes('/')) return f.mimeType
  return `image/${f.mimeType.toLowerCase()}`
}

/** The URL of a linked picture (MIME type or image format "-->"). */
export function pictureLinkUrl(f: Pick<PictureFrame, 'mimeType' | 'data'>): string | undefined {
  if (f.mimeType !== '-->') return undefined
  let s = ''
  for (const b of f.data) {
    if (b === 0) break
    s += String.fromCharCode(b)
  }
  return s
}

// SPEC: v2.3 §4.16 / v2.4 §4.15 GEOB: encoding, MIME type <text string> $00, filename <according
// to encoding>, description <according to encoding>, object.
// SPEC: v2.2 §4.16 GEO: "'MIME type' and 'Filename' ... both represented as terminated strings
// encoded with ISO 8859-1".
export function decodeGeob(r: FrameReader): Fields<GeneralObjectFrame> {
  const encoding = r.encoding()
  const mimeType = r.latin1()
  const filename = r.ctx.major === 2 ? r.latin1() : r.text(encoding)
  const description = r.text(encoding)
  return { encoding, mimeType, filename, description, data: r.rest() }
}

export function encodeGeob(f: Fields<GeneralObjectFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).latin1(f.mimeType)
  if (w.ctx.major === 2) w.latin1(f.filename)
  else w.text(f.filename, f.encoding)
  w.text(f.description, f.encoding).bytes(f.data)
}

// SPEC: v2.4 §4.16 PCNT: counter $xx xx xx xx (xx ...). "The counter must be at least 32-bits long
// to begin with." It grows by one byte when it reaches all ones.
export function decodePcnt(r: FrameReader): Fields<PlayCounterFrame> {
  const bytes = r.rest()
  if (bytes.length < 4) r.warn('pcnt-length', 'play counter shorter than 32 bits')
  return { count: bytesToBig(bytes) }
}

export function encodePcnt(f: Fields<PlayCounterFrame>, w: FrameWriter): void {
  if (f.count < 0n) throw new TagWriteError('pcnt-range', 'play counter cannot be negative')
  w.bytes(bigToBytes(f.count, 4))
}

// SPEC: v2.4 §4.17 POPM: email <text string> $00, rating $xx, counter $xx xx xx xx (xx ...).
// "If no personal counter is wanted it may be omitted."
export function decodePopm(r: FrameReader): Fields<PopularimeterFrame> {
  const email = r.latin1()
  const rating = r.u8()
  const f: Fields<PopularimeterFrame> = { email, rating }
  if (r.remaining > 0) {
    if (r.remaining < 4) r.warn('popm-counter', 'counter shorter than 32 bits')
    f.counter = bytesToBig(r.rest())
  }
  return f
}

export function encodePopm(f: Fields<PopularimeterFrame>, w: FrameWriter): void {
  if (f.rating < 0 || f.rating > 255) throw new TagWriteError('popm-rating', 'rating must be 0-255')
  w.latin1(f.email).u8(f.rating)
  if (f.counter !== undefined) w.bytes(bigToBytes(f.counter, 4))
}

// SPEC: v2.4 §4.18 RBUF: buffer size $xx xx xx, embedded info flag %0000000x, offset to next tag
// $xx xx xx xx ("This field may be omitted").
export function decodeRbuf(r: FrameReader): Fields<BufferSizeFrame> {
  const bufferSize = r.u24()
  const flag = r.u8()
  const f: Fields<BufferSizeFrame> = { bufferSize, embeddedInfo: (flag & 1) !== 0 }
  if (flag & 0xfe) r.warn('rbuf-flags', 'undefined bits set in the embedded info flag')
  if (r.remaining >= 4) f.offsetToNextTag = r.u32()
  r.done()
  return f
}

export function encodeRbuf(f: Fields<BufferSizeFrame>, w: FrameWriter): void {
  w.u24(f.bufferSize).u8(f.embeddedInfo ? 1 : 0)
  if (f.offsetToNextTag !== undefined) w.u32(f.offsetToNextTag)
}

// SPEC: v2.4 §4.19 AENC / v2.2 §4.21 CRA: owner <text string> $00, preview start $xx xx, preview
// length $xx xx, encryption info <binary data>.
export function decodeAenc(r: FrameReader): Fields<AudioEncryptionFrame> {
  const owner = r.latin1()
  return { owner, previewStart: r.u16(), previewLength: r.u16(), encryptionInfo: r.rest() }
}

export function encodeAenc(f: Fields<AudioEncryptionFrame>, w: FrameWriter): void {
  w.latin1(f.owner).u16(f.previewStart).u16(f.previewLength).bytes(f.encryptionInfo)
}

// SPEC: v2.2 §4.20 CRM: owner, content/explanation, encrypted datablock.
export function decodeCrm(r: FrameReader): Fields<EncryptedMetaFrame> {
  if (r.peek()[0] === 0) r.warn('crm-empty-owner', 'CRM frame with empty owner should be ignored')
  const owner = r.latin1()
  const explanation = r.latin1()
  return { owner, explanation, data: r.rest() }
}

export function encodeCrm(f: Fields<EncryptedMetaFrame>, w: FrameWriter): void {
  w.latin1(f.owner).latin1(f.explanation).bytes(f.data)
}

// SPEC: v2.4 §4.20 LINK: frame identifier $xx xx xx xx, URL <text string> $00, ID and additional
// data <text string(s)>. v2.2 §4.22 LNK uses a 3-byte identifier. v2.3 §4.21 also lists 3 bytes,
// which contradicts its 4-character frame IDs.
export function decodeLink(r: FrameReader): Fields<LinkFrame> {
  let idLen = r.ctx.major === 2 ? 3 : 4
  if (r.ctx.major === 3) {
    const opt = r.ctx.options.link23IdLength
    if (opt === 3) idLen = 3
    else if (opt === undefined) {
      // auto: four bytes when they form a frame ID, otherwise the literal three bytes of the spec
      const four = r.fixed(4)
      r.offset -= four.length
      idLen = /^[A-Z0-9]{4}$/.test(four) ? 4 : 3
    }
  }
  const frameId = r.fixed(idLen)
  const url = r.latin1()
  const additional: string[] = []
  while (r.remaining > 0) additional.push(r.latin1())
  return { frameId, url, additional }
}

export function encodeLink(f: Fields<LinkFrame>, w: FrameWriter): void {
  const ok = w.ctx.major === 2 ? f.frameId.length === 3 : w.ctx.major === 3 ? f.frameId.length === 3 || f.frameId.length === 4 : f.frameId.length === 4
  if (!ok) throw new TagWriteError('link-id', `"${f.frameId}" is not a valid linked frame ID for v2.${w.ctx.major}`)
  w.latin1(f.frameId, false).latin1(f.url)
  f.additional.forEach((a) => w.latin1(a))
}

// SPEC: v2.4 §4.21 POSS: time stamp format $xx, position $xx (xx ...).
export function decodePoss(r: FrameReader): Fields<PositionSyncFrame> {
  const timestampFormat = r.u8()
  const n = r.remaining
  if (n > 6) {
    r.warn('poss-length', 'position wider than 48 bits')
    return { timestampFormat, position: Number(r.big(n)) }
  }
  return { timestampFormat, position: r.uN(n) }
}

export function encodePoss(f: Fields<PositionSyncFrame>, w: FrameWriter): void {
  w.u8(f.timestampFormat).u32(f.position)
}

// SPEC: v2.4 §4.25 ENCR / §4.26 GRID: owner <text string> $00, symbol $xx, data.
export function decodeEncr(r: FrameReader): Fields<EncryptionRegistrationFrame> {
  const owner = r.latin1()
  return { owner, methodSymbol: r.u8(), data: r.rest() }
}

export function encodeEncr(f: Fields<EncryptionRegistrationFrame>, w: FrameWriter): void {
  w.latin1(f.owner).u8(f.methodSymbol).bytes(f.data)
}

export function decodeGrid(r: FrameReader): Fields<GroupRegistrationFrame> {
  const owner = r.latin1()
  return { owner, groupSymbol: r.u8(), data: r.rest() }
}

export function encodeGrid(f: Fields<GroupRegistrationFrame>, w: FrameWriter): void {
  w.latin1(f.owner).u8(f.groupSymbol).bytes(f.data)
}

// SPEC: v2.4 §4.27 PRIV: owner <text string> $00, private data.
export function decodePriv(r: FrameReader): Fields<PrivateFrame> {
  const owner = r.latin1()
  return { owner, data: r.rest() }
}

export function encodePriv(f: Fields<PrivateFrame>, w: FrameWriter): void {
  w.latin1(f.owner).bytes(f.data)
}

// SPEC: v2.4 §4.28 SIGN: group symbol $xx, signature.
export function decodeSign(r: FrameReader): Fields<SignatureFrame> {
  return { groupSymbol: r.u8(), signature: r.rest() }
}

export function encodeSign(f: Fields<SignatureFrame>, w: FrameWriter): void {
  w.u8(f.groupSymbol).bytes(f.signature)
}

// SPEC: v2.4 §4.29 SEEK: minimum offset to next tag $xx xx xx xx.
export function decodeSeek(r: FrameReader): Fields<SeekFrame> {
  const minimumOffset = r.u32()
  r.done()
  return { minimumOffset }
}

export function encodeSeek(f: Fields<SeekFrame>, w: FrameWriter): void {
  w.u32(f.minimumOffset)
}

// SPEC: v2.4 §4.30 ASPI: S $xx xx xx xx, L $xx xx xx xx, N $xx xx, b $xx, then N fractions of b bits.
export function decodeAspi(r: FrameReader): Fields<SeekPointIndexFrame> {
  const indexedDataStart = r.u32()
  const indexedDataLength = r.u32()
  const n = r.u16()
  const bitsPerIndexPoint = r.u8()
  if (bitsPerIndexPoint !== 8 && bitsPerIndexPoint !== 16) r.warn('aspi-bits', `bits per index point is ${bitsPerIndexPoint}, expected 8 or 16`)
  const per = Math.max(1, Math.ceil(bitsPerIndexPoint / 8))
  const fractions: number[] = []
  for (let i = 0; i < n; i++) {
    if (r.remaining < per) {
      r.warn('aspi-truncated', `${n} index points declared, ${i} present`)
      break
    }
    fractions.push(r.uN(per))
  }
  r.done()
  return { indexedDataStart, indexedDataLength, bitsPerIndexPoint, fractions }
}

export function encodeAspi(f: Fields<SeekPointIndexFrame>, w: FrameWriter): void {
  if (f.bitsPerIndexPoint !== 8 && f.bitsPerIndexPoint !== 16) throw new TagWriteError('aspi-bits', "'Bits per index point' is 8 or 16")
  w.u32(f.indexedDataStart).u32(f.indexedDataLength).u16(f.fractions.length).u8(f.bitsPerIndexPoint)
  for (const x of f.fractions) w.uN(x, f.bitsPerIndexPoint / 8)
}

/** SPEC: v2.4 §4.30 "Fi = Oi/L * 2^b (rounded down to the nearest integer)". */
export function aspiFraction(offset: number, length: number, bits: number): number {
  return Math.floor((offset / length) * 2 ** bits)
}

/** SPEC: v2.4 §4.30 "Oi = (Fi/2^b)*L (rounded up to the nearest integer)". */
export function aspiOffset(fraction: number, length: number, bits: number): number {
  return Math.ceil((fraction / 2 ** bits) * length)
}

