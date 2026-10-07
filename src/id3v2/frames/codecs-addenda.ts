import { TagWriteError } from '../../core/errors.js'
import type { FrameReader, FrameWriter } from './context.js'
import type { AudioTextFrame, ChapterFrame, ReplayGainFrame, TableOfContentsFrame } from './types.js'

type Fields<F> = Omit<F, 'type' | 'id' | 'flags'>

// SPEC: id3v2-chapters-1.0 §3.1 CHAP: element ID <text string> $00, start time, end time, start
// offset, end offset (all $xx xx xx xx), then optional embedded sub-frames.
export function decodeChap(r: FrameReader): Fields<ChapterFrame> {
  const elementId = r.latin1()
  const startTime = r.u32()
  const endTime = r.u32()
  const startOffset = r.u32()
  const endOffset = r.u32()
  return { elementId, startTime, endTime, startOffset, endOffset, frames: r.ctx.decodeFrames(r.rest()) }
}

export function encodeChap(f: Fields<ChapterFrame>, w: FrameWriter): void {
  w.latin1(f.elementId).u32(f.startTime).u32(f.endTime).u32(f.startOffset).u32(f.endOffset)
  w.bytes(w.ctx.encodeFrames(f.frames))
}

// SPEC: id3v2-chapters-1.0 §3.2 CTOC: element ID, flags %000000ab (a top-level, b ordered), entry
// count $xx, child element IDs <text string> $00 each, then optional embedded sub-frames.
export function decodeCtoc(r: FrameReader): Fields<TableOfContentsFrame> {
  const elementId = r.latin1()
  const flags = r.u8()
  const count = r.u8()
  // SPEC: "The Entry count ... must be greater than zero."
  if (count === 0) r.warn('ctoc-entry-count', 'CTOC entry count must be greater than zero')
  const childElementIds: string[] = []
  for (let i = 0; i < count && r.remaining > 0; i++) childElementIds.push(r.latin1())
  if (childElementIds.length < count) r.warn('ctoc-truncated', `${count} child IDs declared, ${childElementIds.length} present`)
  const f: Fields<TableOfContentsFrame> = {
    elementId,
    topLevel: (flags & 0x02) !== 0,
    ordered: (flags & 0x01) !== 0,
    childElementIds,
    frames: r.ctx.decodeFrames(r.rest()),
  }
  if (flags & 0xfc) f.unknownFlagBits = flags & 0xfc
  return f
}

export function encodeCtoc(f: Fields<TableOfContentsFrame>, w: FrameWriter): void {
  if (f.childElementIds.length === 0 || f.childElementIds.length > 255) {
    if (w.ctx.strict || f.childElementIds.length > 255) {
      throw new TagWriteError('ctoc-entry-count', 'CTOC needs 1-255 child element IDs')
    }
    w.ctx.warnings.note('ctoc-entry-count', 'CTOC entry count must be greater than zero', { frameId: w.ctx.frameId })
  }
  w.latin1(f.elementId)
  w.u8((f.topLevel ? 2 : 0) | (f.ordered ? 1 : 0) | (f.unknownFlagBits ?? 0))
  w.u8(f.childElementIds.length)
  for (const id of f.childElementIds) w.latin1(id)
  w.bytes(w.ctx.encodeFrames(f.frames))
}

/**
 * SPEC: id3v2-accessibility-1.0 §5. XOR with a pseudo-random sequence that starts at %11111110;
 * each next byte is derived from the current one (Table 1). Applying it twice restores the data.
 */
export function scramble(data: Uint8Array): Uint8Array {
  const out = new Uint8Array(data.length)
  let s = 0xfe
  const bit = (n: number) => (s >> n) & 1
  for (let i = 0; i < data.length; i++) {
    out[i] = data[i]! ^ s
    s =
      ((bit(6) ^ bit(5)) << 7) |
      ((bit(5) ^ bit(4)) << 6) |
      ((bit(4) ^ bit(3)) << 5) |
      ((bit(3) ^ bit(2)) << 4) |
      ((bit(2) ^ bit(1)) << 3) |
      ((bit(1) ^ bit(0)) << 2) |
      ((bit(7) ^ bit(5)) << 1) |
      (bit(6) ^ bit(4))
  }
  return out
}

// SPEC: id3v2-accessibility-1.0 §4 ATXT: encoding, MIME type <text string> $00, flags %0000000a,
// equivalent text <according to encoding> $00 (00), audio data.
export function decodeAtxt(r: FrameReader): Fields<AudioTextFrame> {
  const encoding = r.encoding()
  const mimeType = r.latin1()
  const flags = r.u8()
  const equivalentText = r.text(encoding)
  const scrambled = (flags & 1) !== 0
  const raw = r.rest()
  const f: Fields<AudioTextFrame> = { encoding, mimeType, scrambled, equivalentText, audio: scrambled ? scramble(raw) : raw }
  if (flags & 0xfe) f.unknownFlagBits = flags & 0xfe
  return f
}

export function encodeAtxt(f: Fields<AudioTextFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).latin1(f.mimeType).u8((f.scrambled ? 1 : 0) | (f.unknownFlagBits ?? 0))
  w.text(f.equivalentText, f.encoding)
  w.bytes(f.scrambled ? scramble(f.audio) : f.audio)
}

/** MIME types for which the addendum asks for unsynchronisation instead of scrambling. */
export function atxtNeedsUnsync(mimeType: string): boolean {
  return /^audio\/(mpeg|mp3|mpa|mpeg3|x-mpeg|aac|aacp|mp4a-latm|x-aac)$/i.test(mimeType)
}

// RGAD (spec/id3v2/extensions/Replay-Gain-Adjustment.md): peak amplitude $xx xx xx xx, radio replay
// gain adjustment $xx xx, audiophile replay gain adjustment $xx xx.
export function decodeRgad(r: FrameReader): Fields<ReplayGainFrame> {
  const f = { peakAmplitude: r.u32(), radioAdjustment: r.u16(), audiophileAdjustment: r.u16() }
  r.done()
  return f
}

export function encodeRgad(f: Fields<ReplayGainFrame>, w: FrameWriter): void {
  w.u32(f.peakAmplitude).u16(f.radioAdjustment).u16(f.audiophileAdjustment)
}

/**
 * Decodes RGAD values per the Hydrogenaudio ReplayGain proposal (not part of the id3.org docs):
 * the peak is an IEEE-754 float; each adjustment packs name (3 bits), originator (3 bits),
 * sign (1 bit) and value in 0.1 dB (9 bits).
 */
export function decodeReplayGain(f: Pick<ReplayGainFrame, 'peakAmplitude' | 'radioAdjustment' | 'audiophileAdjustment'>) {
  const dv = new DataView(new ArrayBuffer(4))
  dv.setUint32(0, f.peakAmplitude)
  const adj = (v: number) => ({
    name: (v >> 13) & 7,
    originator: (v >> 10) & 7,
    db: ((v & 0x200 ? -1 : 1) * (v & 0x1ff)) / 10,
  })
  return { peak: dv.getFloat32(0), radio: adj(f.radioAdjustment), audiophile: adj(f.audiophileAdjustment) }
}
