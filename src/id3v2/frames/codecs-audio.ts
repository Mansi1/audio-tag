import { type ByteReader, bigToBytes } from '../../core/bytes.js'
import { TagWriteError } from '../../core/errors.js'
import type { FrameReader, FrameWriter } from './context.js'
import type {
  Equalisation2Frame,
  EqualisationFrame,
  RelativeVolume2Frame,
  RelativeVolumeFrame,
  ReverbFrame,
  RvadChannel,
} from './types.js'

type Fields<F> = Omit<F, 'type' | 'id' | 'flags'>

/** Reads an unsigned integer of `n` bytes as a number when exact, otherwise as a bigint. */
function readVar(r: ByteReader, n: number): number | bigint {
  if (n === 0) return 0
  return n <= 6 ? r.uN(n) : r.big(n)
}

function writeVar(w: FrameWriter, v: number | bigint, n: number, what: string): void {
  if (n === 0) return
  const big = BigInt(v)
  if (big < 0n || big >= 1n << BigInt(8 * n)) throw new TagWriteError('value-range', `${what} ${v} does not fit in ${n} bytes`)
  w.bytes(bigToBytes(big, n))
}

// SPEC: v2.3 §4.12 RVAD. Values are in this order, each ceil(bits/8) bytes:
//   right, left, peak right, peak left            (peaks may be omitted if nothing follows)
//   right back, left back, peak right back, peak left back
//   center, peak center
//   bass, peak bass
// Increment/decrement bits: 0 right, 1 left, 2 right back, 3 left back, 4 center, 5 bass.
// v2.2 §4.12 RVA has only the first group (bits 0 and 1).
const RVAD_LAYOUT: { count: number; channels: RvadChannel[]; peaks: boolean }[] = [
  { count: 2, channels: ['right', 'left'], peaks: false },
  { count: 4, channels: ['right', 'left'], peaks: true },
  { count: 8, channels: ['right', 'left', 'rightBack', 'leftBack'], peaks: true },
  { count: 10, channels: ['right', 'left', 'rightBack', 'leftBack', 'center'], peaks: true },
  { count: 12, channels: ['right', 'left', 'rightBack', 'leftBack', 'center', 'bass'], peaks: true },
]
const RVAD_BIT: Record<RvadChannel, number> = { right: 0, left: 1, rightBack: 2, leftBack: 3, center: 4, bass: 5 }

export function decodeRvad(r: FrameReader): Fields<RelativeVolumeFrame> {
  const incdec = r.u8()
  const bitsUsed = r.u8()
  if (bitsUsed === 0) r.warn('rvad-bits', "'bits used for volume description' may not be $00")
  const per = Math.ceil(bitsUsed / 8)
  const n = per === 0 ? 0 : Math.floor(r.remaining / per)
  const max = r.ctx.major === 2 ? 4 : 12
  const layout = [...RVAD_LAYOUT].reverse().find((l) => l.count <= Math.min(n, max))
  if (!layout || layout.count !== n || r.remaining % (per || 1) !== 0) {
    r.warn('rvad-length', `unexpected RVA${r.ctx.major === 2 ? '' : 'D'} length (${n} values)`)
  }
  const values: (number | bigint)[] = []
  for (let i = 0; i < (layout?.count ?? 0); i++) values.push(readVar(r, per))
  r.rest()
  const channels: RelativeVolumeFrame['channels'] = []
  if (layout) {
    // positions of change/peak values for each channel in the flat list
    const pos: Record<RvadChannel, [number, number | undefined]> = {
      right: [0, layout.peaks ? 2 : undefined],
      left: [1, layout.peaks ? 3 : undefined],
      rightBack: [4, 6],
      leftBack: [5, 7],
      center: [8, 9],
      bass: [10, 11],
    }
    for (const ch of layout.channels) {
      const [c, p] = pos[ch]
      const entry: RelativeVolumeFrame['channels'][number] = {
        channel: ch,
        increment: (incdec & (1 << RVAD_BIT[ch])) !== 0,
        change: values[c]!,
      }
      if (p !== undefined) entry.peak = values[p]!
      channels.push(entry)
    }
  }
  return { bitsUsed, channels }
}

export function encodeRvad(f: Fields<RelativeVolumeFrame>, w: FrameWriter): void {
  if (f.bitsUsed === 0) throw new TagWriteError('rvad-bits', "'bits used for volume description' may not be $00")
  const by = new Map(f.channels.map((c) => [c.channel, c]))
  const hasPeaks = f.channels.some((c) => c.peak !== undefined)
  const layout = RVAD_LAYOUT.find(
    (l) => l.channels.length === by.size && l.channels.every((c) => by.has(c)) && (l.peaks === hasPeaks || l.count > 4),
  )
  if (!layout) {
    throw new TagWriteError(
      'rvad-channels',
      'RVAD channels must be right+left, optionally followed by both back channels, then center, then bass',
    )
  }
  if (w.ctx.major === 2 && layout.count > 4) throw new TagWriteError('rvad-channels', 'v2.2 RVA has only right and left')
  let incdec = 0
  for (const c of f.channels) if (c.increment) incdec |= 1 << RVAD_BIT[c.channel]
  w.u8(incdec).u8(f.bitsUsed)
  const per = Math.ceil(f.bitsUsed / 8)
  const get = (ch: RvadChannel) => by.get(ch)!
  const order: (number | bigint)[] = [get('right').change, get('left').change]
  if (layout.peaks) order.push(get('right').peak ?? 0, get('left').peak ?? 0)
  if (layout.count >= 8) order.push(get('rightBack').change, get('leftBack').change, get('rightBack').peak ?? 0, get('leftBack').peak ?? 0)
  if (layout.count >= 10) order.push(get('center').change, get('center').peak ?? 0)
  if (layout.count >= 12) order.push(get('bass').change, get('bass').peak ?? 0)
  for (const v of order) writeVar(w, v, per, 'volume value')
}

// SPEC: v2.4 §4.11 RVA2: identification <text string> $00, then per channel:
//   type $xx, volume adjustment $xx xx (signed, dB*512), bits representing peak $xx, peak volume.
export function decodeRva2(r: FrameReader): Fields<RelativeVolume2Frame> {
  const identification = r.latin1()
  const channels: RelativeVolume2Frame['channels'] = []
  while (r.remaining >= 4) {
    const channelType = r.u8()
    const adjustment = r.i16()
    const bitsRepresentingPeak = r.u8()
    const n = Math.ceil(bitsRepresentingPeak / 8)
    if (n > r.remaining) {
      r.warn('rva2-truncated', 'peak volume runs past the end of the frame')
      r.rest()
      break
    }
    channels.push({ channelType, adjustment, bitsRepresentingPeak, peak: readVar(r, n) })
  }
  if (r.remaining) {
    r.warn('rva2-trailing', 'incomplete channel entry at the end of the frame')
    r.rest()
  }
  return { identification, channels }
}

export function encodeRva2(f: Fields<RelativeVolume2Frame>, w: FrameWriter): void {
  w.latin1(f.identification)
  for (const c of f.channels) {
    if (c.adjustment < -32768 || c.adjustment > 32767) throw new TagWriteError('rva2-range', 'RVA2 adjustment must fit in 16 signed bits')
    w.u8(c.channelType).i16(c.adjustment).u8(c.bitsRepresentingPeak)
    writeVar(w, c.peak, Math.ceil(c.bitsRepresentingPeak / 8), 'peak volume')
  }
}

/** RVA2/EQU2 fixed point: dB × 512. +2 dB is $04 00 and -2 dB is $FC 00 (v2.4 §4.11). */
export function dbToFixed(db: number): number {
  return Math.round(db * 512)
}
export function fixedToDb(v: number): number {
  return v / 512
}

// SPEC: v2.3 §4.13 EQUA / v2.2 §4.13 EQU: adjustment bits $xx, then per band:
//   increment/decrement %x (MSB of the frequency), frequency (lower 15 bits), adjustment.
export function decodeEqua(r: FrameReader): Fields<EqualisationFrame> {
  const adjustmentBits = r.u8()
  if (adjustmentBits === 0) r.warn('equa-bits', "'adjustment bits' may not be $00")
  const per = Math.ceil(adjustmentBits / 8)
  const bands: EqualisationFrame['bands'] = []
  while (r.remaining >= 2 + per && (per > 0 || r.remaining >= 2)) {
    const word = r.u16()
    bands.push({ increment: (word & 0x8000) !== 0, frequency: word & 0x7fff, adjustment: readVar(r, per) })
  }
  if (r.remaining) {
    r.warn('equa-trailing', 'incomplete band at the end of the frame')
    r.rest()
  }
  return { adjustmentBits, bands }
}

export function encodeEqua(f: Fields<EqualisationFrame>, w: FrameWriter): void {
  if (f.adjustmentBits === 0) throw new TagWriteError('equa-bits', "'adjustment bits' may not be $00")
  w.u8(f.adjustmentBits)
  const per = Math.ceil(f.adjustmentBits / 8)
  for (const b of f.bands) {
    if (b.frequency < 0 || b.frequency > 0x7fff) throw new TagWriteError('equa-frequency', 'frequency must be 0-32767 Hz')
    w.u16((b.increment ? 0x8000 : 0) | b.frequency)
    writeVar(w, b.adjustment, per, 'adjustment')
  }
}

// SPEC: v2.4 §4.12 EQU2: interpolation $xx, identification <text string> $00, then
// (frequency $xx xx in 1/2 Hz, volume adjustment $xx xx signed dB*512)*.
export function decodeEqu2(r: FrameReader): Fields<Equalisation2Frame> {
  const interpolation = r.u8()
  const identification = r.latin1()
  const points: Equalisation2Frame['points'] = []
  while (r.remaining >= 4) points.push({ frequency: r.u16(), adjustment: r.i16() })
  if (r.remaining) {
    r.warn('equ2-trailing', 'incomplete adjustment point at the end of the frame')
    r.rest()
  }
  return { interpolation, identification, points }
}

export function encodeEqu2(f: Fields<Equalisation2Frame>, w: FrameWriter): void {
  w.u8(f.interpolation).latin1(f.identification)
  for (const p of f.points) w.u16(p.frequency).i16(p.adjustment)
}

// SPEC: v2.4 §4.13 RVRB (v2.3 §4.14, v2.2 §4.14 REV with a fixed size of $00 00 0C).
export function decodeRvrb(r: FrameReader): Fields<ReverbFrame> {
  if (r.remaining !== 12) r.warn('rvrb-size', `reverb frame is ${r.remaining} bytes, expected 12`)
  const f: Fields<ReverbFrame> = {
    reverbLeft: r.u16(),
    reverbRight: r.u16(),
    bouncesLeft: r.u8(),
    bouncesRight: r.u8(),
    feedbackLeftToLeft: r.u8(),
    feedbackLeftToRight: r.u8(),
    feedbackRightToRight: r.u8(),
    feedbackRightToLeft: r.u8(),
    premixLeftToRight: r.u8(),
    premixRightToLeft: r.u8(),
  }
  r.done()
  return f
}

export function encodeRvrb(f: Fields<ReverbFrame>, w: FrameWriter): void {
  w.u16(f.reverbLeft).u16(f.reverbRight).u8(f.bouncesLeft).u8(f.bouncesRight)
  w.u8(f.feedbackLeftToLeft).u8(f.feedbackLeftToRight).u8(f.feedbackRightToRight).u8(f.feedbackRightToLeft)
  w.u8(f.premixLeftToRight).u8(f.premixRightToLeft)
}

