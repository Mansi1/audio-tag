import { ByteWriter, asciiString, concat, equalBytes } from '../core/bytes.js'
import type { MajorVersion } from '../core/encoding.js'
import { TagReadError, TagWriteError, WarningSink } from '../core/errors.js'
import { isSynchsafe } from '../core/synchsafe.js'
import { type DecryptHook, type EncryptHook, decodeFramePayload, encodeFramePayload } from './frame-codec.js'
import { type FrameHeader, frameHeaderSize, isValidFrameId, readFrameHeader, writeFrame } from './frame-header.js'
import { FrameReader, FrameWriter } from './frames/context.js'
import { codecFor, getDefinition } from './frames/registry.js'
import type { Frame } from './frames/types.js'

export interface FrameReadOptions {
  strict?: boolean
  /** Accept iTunes-style plain sizes in v2.4 tags (Compliance Issues). Default true. */
  v24SizeFallback?: boolean
  decrypt?: DecryptHook
  /** v2.3 LINK frame identifier length; see tasks/README.md D1. Default: detect. */
  link23IdLength?: 3 | 4
}

export interface FrameWriteOptions {
  strict?: boolean
  encrypt?: EncryptHook
  compressionLevel?: 0 | 1 | 6
  /** v2.4 per-frame unsynchronisation: true, false, or keep each frame's flag. */
  unsynchronisation?: boolean | 'preserve'
  /** Byte order for UTF-16 strings; little-endian by default. */
  littleEndian?: boolean
}

/**
 * Exact-round-trip support. When a frame is read, its stored bytes are remembered together with a
 * snapshot of how this library encodes it. The writer emits the stored bytes again as long as the
 * frame still encodes to the same snapshot, i.e. it was not changed. This keeps legal but unusual
 * layouts (other compressors, BOM choices, junk after terminators) byte-identical.
 */
const ORIGINAL = new WeakMap<Frame, { major: MajorVersion; stored: Uint8Array; snapshot: Uint8Array }>()

/** Frame ID check that tolerates nothing: used to spot the end of the frames. */
function looksLikeFrameStart(data: Uint8Array, pos: number, end: number, major: MajorVersion): boolean {
  if (pos === end) return true
  if (pos > end) return false
  if (data[pos] === 0) return true // padding
  const n = major === 2 ? 3 : 4
  if (pos + n > end) return false
  return isValidFrameId(asciiString(data.subarray(pos, pos + n)), major)
}

export interface ParsedFrames {
  frames: Frame[]
  /** Offset where padding (or junk) starts. */
  end: number
}

/**
 * Parses consecutive frames in `data[start, end)`.
 * `tagUnsync` is the v2.4 header flag, which means every frame is unsynchronised.
 */
export function parseFrames(
  data: Uint8Array,
  start: number,
  end: number,
  major: MajorVersion,
  revision: number,
  w: WarningSink,
  opts: FrameReadOptions,
  tagUnsync = false,
): ParsedFrames {
  const frames: Frame[] = []
  let pos = start
  const hs = frameHeaderSize(major)
  while (pos < end) {
    if (data[pos] === 0) break
    if (pos + hs > end) {
      w.warn('frame-junk', `${end - pos} bytes after the last frame are neither padding nor a frame`, { offset: pos })
      break
    }
    let header = readFrameHeader(data, pos, major)!
    if (!isValidFrameId(header.id, major)) {
      w.warn('frame-id', `invalid frame ID ${JSON.stringify(header.id)}; treating the rest as padding`, { offset: pos })
      break
    }
    if (major === 4 && (opts.v24SizeFallback ?? true)) {
      const specEnd = pos + hs + header.size
      const synchsafe = isSynchsafe(data, pos + 4)
      if (!synchsafe || !looksLikeFrameStart(data, specEnd, end, major)) {
        const plain = readFrameHeader(data, pos, major, 'plain')!
        if (looksLikeFrameStart(data, pos + hs + plain.size, end, major)) {
          w.warn('frame-size-not-synchsafe', `${header.id}: size is not synchsafe (old iTunes bug), read as a plain integer`, {
            offset: pos,
            frameId: header.id,
          })
          header = plain
        }
      }
    }
    const frameEnd = pos + hs + header.size
    if (header.size === 0) {
      // SPEC: "A frame must be at least 1 byte big, excluding the header."
      w.warn('frame-empty', `${header.id} has size 0`, { offset: pos, frameId: header.id })
      pos = frameEnd
      continue
    }
    if (frameEnd > end) {
      w.warn('frame-truncated', `${header.id} runs ${frameEnd - end} bytes past the end of the tag`, { offset: pos, frameId: header.id })
      break
    }
    const stored = data.subarray(pos, frameEnd)
    const frame = decodeFrame(stored, header, major, revision, w, opts, tagUnsync)
    frames.push(frame)
    rememberOriginal(frame, stored, major)
    pos = frameEnd
  }
  return { frames, end: pos }
}

function rememberOriginal(frame: Frame, stored: Uint8Array, major: MajorVersion): void {
  let snapshot: Uint8Array
  try {
    snapshot = encodeFrame(frame, major, new WarningSink(false), { unsynchronisation: 'preserve' })
  } catch {
    // cannot be re-encoded as is (e.g. encrypted without a hook); only the stored bytes are usable
    snapshot = new Uint8Array(0)
  }
  ORIGINAL.set(frame, { major, stored, snapshot })
}

/** Decodes one frame given its stored bytes (header included). */
export function decodeFrame(
  stored: Uint8Array,
  header: FrameHeader,
  major: MajorVersion,
  revision: number,
  w: WarningSink,
  opts: FrameReadOptions,
  tagUnsync = false,
): Frame {
  const payload = stored.subarray(header.headerSize + header.extrasSize)
  const flags = header.flags
  const effective: FrameHeader =
    major === 4 && tagUnsync && !flags.unsynchronisation ? { ...header, flags: { ...flags, unsynchronisation: true } } : header
  const res = decodeFramePayload(payload, effective, major, w, opts.decrypt)
  const undecodable = (reason: 'encrypted' | 'compression-error' | 'invalid-body', message: string): Frame => {
    const f: Frame = { type: 'undecodable', id: header.id, flags, reason, message, payload }
    if (header.dataLength !== undefined) f.dataLength = header.dataLength
    return f
  }
  if (!res.ok) {
    w.note(`frame-${res.reason}`, `${header.id}: ${res.message}; frame kept as raw bytes`, { frameId: header.id })
    return undecodable(res.reason, res.message)
  }
  const def = getDefinition(header.id, major)
  if (!def) return { type: 'unknown', id: header.id, flags, data: res.body }
  const ctx = {
    major,
    revision,
    warnings: w,
    frameId: header.id,
    options: opts.link23IdLength ? { link23IdLength: opts.link23IdLength } : {},
    // SPEC: CHAP/CTOC sub-frames use the frame format of the enclosing tag.
    decodeFrames: (data: Uint8Array) => {
      const sub = parseFrames(data, 0, data.length, major, revision, w, opts)
      if (sub.end < data.length && data.subarray(sub.end).some((b) => b !== 0)) {
        w.warn('subframe-junk', 'unparsed data after embedded frames', { frameId: header.id })
      }
      return sub.frames
    },
  }
  const r = new FrameReader(res.body, ctx)
  try {
    const fields = codecFor(def.type).decode(r)
    return { type: def.type, id: header.id, flags, ...fields } as Frame
  } catch (e) {
    if (e instanceof TagReadError && w.strict) throw e
    const msg = e instanceof Error ? e.message : String(e)
    w.warn('frame-invalid', `${header.id}: ${msg}; frame kept as raw bytes`, { frameId: header.id })
    return undecodable('invalid-body', msg)
  }
}

/** Encodes the body of a frame (no header, no compression/encryption). */
export function encodeFrameBody(frame: Frame, major: MajorVersion, w: WarningSink, opts: FrameWriteOptions = {}): Uint8Array {
  if (frame.type === 'unknown') return frame.data
  if (frame.type === 'undecodable') throw new TagWriteError('frame-undecodable', `${frame.id} cannot be re-encoded`)
  const def = getDefinition(frame.id, major)
  if (!def) {
    throw new TagWriteError('frame-id', `${frame.id} is not a known v2.${major} frame; store it as type "unknown"`)
  }
  if (def.type !== frame.type) {
    throw new TagWriteError('frame-type', `${frame.id} is a "${def.type}" frame in v2.${major}, got "${frame.type}"`)
  }
  const ctx = {
    major,
    warnings: w,
    strict: opts.strict ?? false,
    frameId: frame.id,
    encodeFrames: (frames: Frame[]) => encodeFrames(frames, major, w, opts),
    ...(opts.littleEndian !== undefined ? { littleEndian: opts.littleEndian } : {}),
  }
  const fw = new FrameWriter(ctx)
  codecFor(def.type).encode(frame as never, fw)
  return fw.toUint8Array()
}

/** Encodes a whole frame: header, extras and payload. */
export function encodeFrame(frame: Frame, major: MajorVersion, w: WarningSink, opts: FrameWriteOptions = {}): Uint8Array {
  const out = new ByteWriter(64)
  if (frame.type === 'undecodable') {
    writeFrame(out, major, frame.id, frame.flags, frame.payload, frame.dataLength)
    return out.toUint8Array()
  }
  const body = encodeFrameBody(frame, major, w, opts)
  const unsync = opts.unsynchronisation === 'preserve' ? frame.flags.unsynchronisation : (opts.unsynchronisation ?? false)
  const enc = encodeFramePayload(body, frame.flags, major, {
    id: frame.id,
    unsynchronise: major === 4 && unsync,
    ...(opts.encrypt ? { encrypt: opts.encrypt } : {}),
    ...(opts.compressionLevel !== undefined ? { compressionLevel: opts.compressionLevel } : {}),
  })
  writeFrame(out, major, frame.id, enc.flags, enc.payload, enc.dataLength)
  return out.toUint8Array()
}

/**
 * Encodes a frame for writing. Unchanged frames read from a tag of the same version are emitted
 * exactly as stored. Changed frames get the read-only bit and unknown status bits cleared, as
 * v2.4 §4.1 requires ("If an unknown flag is set in the first byte the frame MUST NOT be changed
 * without that bit cleared"; v2.3 §3.3.1 c).
 */
export function encodeFrameForWrite(frame: Frame, major: MajorVersion, w: WarningSink, opts: FrameWriteOptions = {}): Uint8Array {
  const orig = ORIGINAL.get(frame)
  if (frame.type === 'undecodable') {
    if (orig && orig.major !== major) {
      throw new TagWriteError('frame-undecodable', `${frame.id} could not be decoded and cannot be converted to v2.${major}`)
    }
    return orig ? orig.stored : encodeFrame(frame, major, w, opts)
  }
  if (orig && orig.major === major) {
    try {
      const now = encodeFrame(frame, major, new WarningSink(false), { ...opts, unsynchronisation: 'preserve' })
      if (equalBytes(now, orig.snapshot)) return orig.stored
    } catch {
      // fall through to a normal encode, which reports the error properly
    }
  }
  const changed = orig !== undefined && orig.major === major
  let f: Frame = frame
  if (changed && (frame.flags.readOnly || frame.flags.unknownStatusBits)) {
    const flags = { ...frame.flags, readOnly: false }
    delete flags.unknownStatusBits
    f = { ...frame, flags } as Frame
    w.note('frame-flags-cleared', `${frame.id} was changed; read-only and unknown status flags cleared`, { frameId: frame.id })
  }
  return encodeFrame(f, major, w, opts)
}

export function encodeFrames(frames: readonly Frame[], major: MajorVersion, w: WarningSink, opts: FrameWriteOptions = {}): Uint8Array {
  return concat(frames.map((f) => encodeFrameForWrite(f, major, w, opts)))
}

/** True when the frame came from a parsed tag and has not been modified since. */
export function isUnchanged(frame: Frame, major: MajorVersion): boolean {
  const orig = ORIGINAL.get(frame)
  if (!orig) return false
  if (orig.major !== major) return false
  if (frame.type === 'undecodable') return true
  try {
    return equalBytes(encodeFrame(frame, major, new WarningSink(false), { unsynchronisation: 'preserve' }), orig.snapshot)
  } catch {
    return false
  }
}
