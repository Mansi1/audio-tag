import type { WarningSink } from '../core/errors.js'
import { TagWriteError } from '../core/errors.js'
import { resynchronise, unsynchronise } from '../core/unsync.js'
import { deflate, inflate } from '../core/zlib.js'
import type { FrameFlags, FrameHeader } from './frame-header.js'

/** Decrypts frame data for a registered ENCR method. Return undefined if the method is unknown. */
export type DecryptHook = (method: number, data: Uint8Array, frameId: string) => Uint8Array | undefined
/** Encrypts frame data for a registered ENCR method. */
export type EncryptHook = (method: number, data: Uint8Array, frameId: string) => Uint8Array

export type PayloadResult =
  | { ok: true; body: Uint8Array }
  | { ok: false; reason: 'encrypted' | 'compression-error'; message: string }

/**
 * Turns the stored frame payload (bytes after the extras) into the frame body.
 * SPEC: v2.4 §6.1 "When decoding an unsynchronised frame, the unsynchronisation scheme MUST be
 * reversed first, encryption and decompression afterwards." v2.3 frames are never unsynchronised
 * on their own; tag-level unsync was already reversed.
 */
export function decodeFramePayload(
  payload: Uint8Array,
  header: FrameHeader,
  major: 2 | 3 | 4,
  w: WarningSink,
  decrypt?: DecryptHook,
): PayloadResult {
  let data = payload
  const f = header.flags
  if (major === 4 && f.unsynchronisation) data = resynchronise(data)
  if (f.encryptionMethod !== undefined) {
    const out = decrypt?.(f.encryptionMethod, data, header.id)
    if (!out) {
      return { ok: false, reason: 'encrypted', message: `no decrypt hook for method $${f.encryptionMethod.toString(16)}` }
    }
    data = out
  }
  if (f.compression) {
    if (major === 4 && !f.dataLengthIndicator) {
      // SPEC: v2.4 §4.1.2 k: "A 'Data Length Indicator' byte MUST be included in the frame."
      w.warn('frame-compression-dli', 'compressed v2.4 frame without data length indicator', { frameId: header.id })
    }
    try {
      data = inflate(data, header.dataLength !== undefined ? { expectedSize: header.dataLength, warnings: w } : { warnings: w })
    } catch (e) {
      return { ok: false, reason: 'compression-error', message: (e as Error).message }
    }
    if (header.dataLength !== undefined && data.length !== header.dataLength) {
      w.warn('frame-data-length', `decompressed to ${data.length} bytes, header says ${header.dataLength}`, { frameId: header.id })
    }
  } else if (major === 4 && f.dataLengthIndicator && f.encryptionMethod === undefined && header.dataLength !== data.length) {
    w.warn('frame-data-length', `data length indicator ${header.dataLength} != ${data.length}`, { frameId: header.id })
  }
  return { ok: true, body: data }
}

export interface EncodedPayload {
  payload: Uint8Array
  /** v2.3 decompressed size or v2.4 data length indicator. */
  dataLength?: number
  flags: FrameFlags
}

/**
 * The reverse of {@link decodeFramePayload}: compress, encrypt, then (v2.4) unsynchronise.
 * The returned flags have the unsynchronisation and data length bits set to what was applied.
 */
export function encodeFramePayload(
  body: Uint8Array,
  flags: FrameFlags,
  major: 2 | 3 | 4,
  opts: { encrypt?: EncryptHook; unsynchronise?: boolean; id: string; compressionLevel?: 0 | 1 | 6 },
): EncodedPayload {
  const f: FrameFlags = { ...flags }
  let data = body
  let dataLength: number | undefined
  if (f.compression) {
    if (major === 2) throw new TagWriteError('frame-flags', 'v2.2 frames cannot be compressed')
    data = deflate(data, opts.compressionLevel ?? 6)
    dataLength = body.length
    // SPEC: v2.4 §4.1.2 k requires the data length indicator.
    if (major === 4) f.dataLengthIndicator = true
  }
  if (f.encryptionMethod !== undefined) {
    if (!opts.encrypt) {
      throw new TagWriteError('frame-encrypt', `frame ${opts.id} is marked encrypted but no encrypt hook was given`)
    }
    data = opts.encrypt(f.encryptionMethod, data, opts.id)
  }
  if (major === 4) {
    if (f.dataLengthIndicator) dataLength = body.length
    f.unsynchronisation = false
    if (opts.unsynchronise) {
      const u = unsynchronise(data)
      // SPEC: v2.4 §6.1 "This bit MUST be set if the frame was altered by the unsynchronisation
      // and SHOULD NOT be set if unaltered."
      if (u.changed) {
        data = u.data
        f.unsynchronisation = true
      }
    }
  }
  const out: EncodedPayload = { payload: data, flags: f }
  if (dataLength !== undefined) out.dataLength = dataLength
  return out
}
