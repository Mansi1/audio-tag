import { TagWriteError } from '../../core/errors.js'
import type { FrameReader, FrameWriter } from './context.js'
import type {
  CommentFrame,
  CommercialFrame,
  EventTimingFrame,
  MpegLookupFrame,
  MusicCdIdFrame,
  OwnershipFrame,
  SyncLyricsFrame,
  SyncTempoFrame,
  TermsOfUseFrame,
  TimingEvent,
  UniqueFileIdFrame,
  UnsyncLyricsFrame,
} from './types.js'

type Fields<F> = Omit<F, 'type' | 'id' | 'flags'>

// SPEC: v2.4 §4.1 UFID: owner <text string> $00, identifier <up to 64 bytes>.
export function decodeUfid(r: FrameReader): Fields<UniqueFileIdFrame> {
  if (r.ctx.major === 2 && r.peek()[0] === 0) {
    // SPEC: v2.2 §4.1 "If a $00 is found directly after the 'Frame size' the whole frame should be
    // ignored, and preferably be removed."
    r.warn('ufid-empty-owner', 'UFI frame with empty owner should be ignored')
  }
  const owner = r.latin1()
  const identifier = r.rest()
  if (owner === '') r.warn('ufid-owner', "'Owner identifier' must be non-empty")
  if (identifier.length > 64) r.warn('ufid-length', `identifier is ${identifier.length} bytes, at most 64 allowed`)
  return { owner, identifier }
}

export function encodeUfid(f: Fields<UniqueFileIdFrame>, w: FrameWriter): void {
  if (f.owner === '') throw new TagWriteError('ufid-owner', "UFID 'Owner identifier' must be non-empty")
  if (f.identifier.length > 64) throw new TagWriteError('ufid-length', 'UFID identifier may be at most 64 bytes')
  w.latin1(f.owner).bytes(f.identifier)
}

// SPEC: v2.4 §4.4 MCDI: CD TOC <binary data>.
export function decodeMcdi(r: FrameReader): Fields<MusicCdIdFrame> {
  return { toc: r.rest() }
}
export function encodeMcdi(f: Fields<MusicCdIdFrame>, w: FrameWriter): void {
  w.bytes(f.toc)
}

// SPEC: v2.4 §4.5 ETCO: time stamp format, then (type of event $xx, time stamp $xx xx xx xx)*.
// "$FF one more byte of events follows (all the following bytes with the value $FF have the same
// function)."
export function decodeEtco(r: FrameReader): Fields<EventTimingFrame> {
  const timestampFormat = r.u8()
  const events: TimingEvent[] = []
  while (r.remaining > 0) {
    let ff = 0
    let type = r.u8()
    while (type === 0xff && r.remaining > 0) {
      ff++
      type = r.u8()
    }
    if (r.remaining < 4) {
      r.warn('etco-truncated', 'event without a complete time stamp')
      r.rest()
      break
    }
    const e: TimingEvent = { type, timestamp: r.u32() }
    if (ff) e.ffPrefix = ff
    events.push(e)
  }
  return { timestampFormat, events }
}

export function encodeEtco(f: Fields<EventTimingFrame>, w: FrameWriter): void {
  w.u8(f.timestampFormat)
  for (const e of f.events) {
    for (let i = 0; i < (e.ffPrefix ?? 0); i++) w.u8(0xff)
    w.u8(e.type).u32(e.timestamp)
  }
}

// SPEC: v2.4 §4.6 MLLT. References are bit-packed: bits for bytes deviation then bits for
// milliseconds deviation; their sum must be a multiple of four.
export function decodeMllt(r: FrameReader): Fields<MpegLookupFrame> {
  const framesBetweenReference = r.u16()
  const bytesBetweenReference = r.u24()
  const millisecondsBetweenReference = r.u24()
  const bitsForBytesDeviation = r.u8()
  const bitsForMillisecondsDeviation = r.u8()
  const per = bitsForBytesDeviation + bitsForMillisecondsDeviation
  if (per % 4 !== 0) r.warn('mllt-bits', `bits per reference (${per}) is not a multiple of four`)
  const data = r.rest()
  const references: MpegLookupFrame['references'] = []
  if (per > 0) {
    let bit = 0
    const total = data.length * 8
    const take = (n: number): number => {
      let v = 0
      for (let i = 0; i < n; i++, bit++) v = v * 2 + ((data[bit >> 3]! >> (7 - (bit & 7))) & 1)
      return v
    }
    while (bit + per <= total) {
      references.push({ bytesDeviation: take(bitsForBytesDeviation), millisecondsDeviation: take(bitsForMillisecondsDeviation) })
    }
  }
  return {
    framesBetweenReference,
    bytesBetweenReference,
    millisecondsBetweenReference,
    bitsForBytesDeviation,
    bitsForMillisecondsDeviation,
    references,
  }
}

export function encodeMllt(f: Fields<MpegLookupFrame>, w: FrameWriter): void {
  const per = f.bitsForBytesDeviation + f.bitsForMillisecondsDeviation
  if (per % 4 !== 0) throw new TagWriteError('mllt-bits', 'MLLT bits per reference must be a multiple of four')
  w.u16(f.framesBetweenReference).u24(f.bytesBetweenReference).u24(f.millisecondsBetweenReference)
  w.u8(f.bitsForBytesDeviation).u8(f.bitsForMillisecondsDeviation)
  const out = new Uint8Array(Math.ceil((per * f.references.length) / 8))
  let bit = 0
  const put = (v: number, n: number) => {
    if (v < 0 || v >= 2 ** n) throw new TagWriteError('mllt-range', `deviation ${v} does not fit in ${n} bits`)
    for (let i = n - 1; i >= 0; i--, bit++) if (Math.floor(v / 2 ** i) % 2) out[bit >> 3]! |= 0x80 >> (bit & 7)
  }
  for (const ref of f.references) {
    put(ref.bytesDeviation, f.bitsForBytesDeviation)
    put(ref.millisecondsDeviation, f.bitsForMillisecondsDeviation)
  }
  w.bytes(out)
}

// SPEC: v2.4 §4.7 SYTC: tempo is one byte, or $FF plus a second byte added to it (2-510 BPM),
// followed by a 32-bit time stamp.
export function decodeSytc(r: FrameReader): Fields<SyncTempoFrame> {
  const timestampFormat = r.u8()
  const tempos: SyncTempoFrame['tempos'] = []
  while (r.remaining > 0) {
    let bpm = r.u8()
    if (bpm === 0xff && r.remaining > 0) bpm += r.u8()
    if (r.remaining < 4) {
      r.warn('sytc-truncated', 'tempo code without a complete time stamp')
      r.rest()
      break
    }
    tempos.push({ bpm, timestamp: r.u32() })
  }
  return { timestampFormat, tempos }
}

export function encodeSytc(f: Fields<SyncTempoFrame>, w: FrameWriter): void {
  w.u8(f.timestampFormat)
  for (const t of f.tempos) {
    if (!Number.isInteger(t.bpm) || t.bpm < 0 || t.bpm > 510) throw new TagWriteError('sytc-bpm', `BPM ${t.bpm} outside 0-510`)
    if (t.bpm >= 0xff) w.u8(0xff).u8(t.bpm - 0xff)
    else w.u8(t.bpm)
    w.u32(t.timestamp)
  }
}

// SPEC: v2.4 §4.8 USLT: encoding, language $xx xx xx, content descriptor, lyrics/text.
export function decodeUslt(r: FrameReader): Fields<UnsyncLyricsFrame> {
  const encoding = r.encoding()
  const language = r.fixed(3)
  const description = r.text(encoding)
  if (r.ctx.major === 2 && description.length > 64) r.warn('ult-descriptor', 'descriptor longer than 64 bytes')
  return { encoding, language, description, text: r.textToEnd(encoding) }
}

export function encodeUslt(f: Fields<UnsyncLyricsFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).fixed(f.language, 3, 'language').text(f.description, f.encoding).text(f.text, f.encoding, false)
}

// SPEC: v2.4 §4.10 COMM: same layout as USLT.
export function decodeComment(r: FrameReader): Fields<CommentFrame> {
  const encoding = r.encoding()
  const language = r.fixed(3)
  const description = r.text(encoding)
  return { encoding, language, description, text: r.textToEnd(encoding) }
}

export function encodeComment(f: Fields<CommentFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).fixed(f.language, 3, 'language').text(f.description, f.encoding).text(f.text, f.encoding, false)
}

// SPEC: v2.4 §4.9 SYLT: encoding, language, time stamp format, content type, descriptor, then
// (terminated text, 32-bit time stamp)*.
export function decodeSylt(r: FrameReader): Fields<SyncLyricsFrame> {
  const encoding = r.encoding()
  const language = r.fixed(3)
  const timestampFormat = r.u8()
  const contentType = r.u8()
  const description = r.text(encoding)
  const entries: SyncLyricsFrame['entries'] = []
  while (r.remaining > 0) {
    const text = r.text(encoding)
    if (r.remaining < 4) {
      r.warn('sylt-truncated', 'sync entry without a complete time stamp')
      r.rest()
      break
    }
    entries.push({ text, timestamp: r.u32() })
  }
  return { encoding, language, timestampFormat, contentType, description, entries }
}

export function encodeSylt(f: Fields<SyncLyricsFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).fixed(f.language, 3, 'language').u8(f.timestampFormat).u8(f.contentType)
  w.text(f.description, f.encoding)
  for (const e of f.entries) w.text(e.text, f.encoding).u32(e.timestamp)
}

// SPEC: v2.4 §4.22 USER: encoding, language, the actual text.
export function decodeUser(r: FrameReader): Fields<TermsOfUseFrame> {
  const encoding = r.encoding()
  const language = r.fixed(3)
  return { encoding, language, text: r.textToEnd(encoding) }
}

export function encodeUser(f: Fields<TermsOfUseFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).fixed(f.language, 3, 'language').text(f.text, f.encoding, false)
}

// SPEC: v2.4 §4.23 OWNE: encoding, price paid <text string> $00, date of purchase <8 chars>,
// seller <according to encoding>.
export function decodeOwne(r: FrameReader): Fields<OwnershipFrame> {
  const encoding = r.encoding()
  const pricePaid = r.latin1()
  const purchaseDate = r.fixed(8)
  return { encoding, pricePaid, purchaseDate, seller: r.textToEnd(encoding) }
}

export function encodeOwne(f: Fields<OwnershipFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).latin1(f.pricePaid).fixed(f.purchaseDate, 8, 'date of purchase').text(f.seller, f.encoding, false)
}

// SPEC: v2.4 §4.24 COMR. The picture MIME type and logo "may be omitted if no picture is attached".
export function decodeComr(r: FrameReader): Fields<CommercialFrame> {
  const encoding = r.encoding()
  const prices = r.latin1()
  const validUntil = r.fixed(8)
  const contactUrl = r.latin1()
  const receivedAs = r.u8()
  const seller = r.text(encoding)
  const description = r.text(encoding)
  const f: Fields<CommercialFrame> = { encoding, prices, validUntil, contactUrl, receivedAs, seller, description }
  if (r.remaining > 0) {
    f.logoMimeType = r.latin1()
    f.logo = r.rest()
  }
  return f
}

export function encodeComr(f: Fields<CommercialFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).latin1(f.prices).fixed(f.validUntil, 8, 'valid until').latin1(f.contactUrl).u8(f.receivedAs)
  w.text(f.seller, f.encoding).text(f.description, f.encoding)
  if (f.logoMimeType !== undefined || f.logo !== undefined) {
    w.latin1(f.logoMimeType ?? '').bytes(f.logo ?? new Uint8Array(0))
  }
}

