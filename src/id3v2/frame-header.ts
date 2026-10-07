import { asciiString, ByteWriter } from '../core/bytes.js'
import { TagWriteError } from '../core/errors.js'
import { decodeSynchsafe, decodeUint32, encodeSynchsafe } from '../core/synchsafe.js'

/**
 * Frame flags, normalised across versions.
 * SPEC: v2.3 §3.3.1 %abc00000 %ijk00000, v2.4 structure §4.1 %0abc0000 %0h00kmnp. v2.2 has none.
 */
export interface FrameFlags {
  /** a: discard this frame, if unknown, when the tag is altered. */
  tagAlterPreservation: boolean
  /** b: discard this frame, if unknown, when the audio is altered. */
  fileAlterPreservation: boolean
  /** c: contents are intended to be read only. */
  readOnly: boolean
  /** Grouping identity byte (v2.3 k, v2.4 h). */
  groupId?: number
  /** Compressed with zlib (v2.3 i, v2.4 k). */
  compression: boolean
  /** Encryption method symbol (v2.3 j, v2.4 m). */
  encryptionMethod?: number
  /** v2.4 n: the frame is unsynchronised. */
  unsynchronisation: boolean
  /** v2.4 p: a data length indicator is present. */
  dataLengthIndicator: boolean
  /** Undefined status bits that were set (byte 1). */
  unknownStatusBits?: number
  /** Undefined format bits that were set (byte 2). */
  unknownFormatBits?: number
}

export function defaultFrameFlags(): FrameFlags {
  return {
    tagAlterPreservation: false,
    fileAlterPreservation: false,
    readOnly: false,
    compression: false,
    unsynchronisation: false,
    dataLengthIndicator: false,
  }
}

export interface FrameHeader {
  id: string
  /** Size field: bytes after the header (including the flag extras). */
  size: number
  flags: FrameFlags
  headerSize: 6 | 10
  /** v2.3: the 4-byte decompressed size; v2.4: the data length indicator value. */
  dataLength?: number
  /** Number of extra bytes after the header (group, encryption method, sizes). */
  extrasSize: number
  /** The flag bytes exactly as stored. */
  rawFlags: number
}

export const FRAME_ID = { 2: /^[A-Z0-9]{3}$/, 3: /^[A-Z0-9]{4}$/, 4: /^[A-Z0-9]{4}$/ } as const

export function isValidFrameId(id: string, major: 2 | 3 | 4): boolean {
  return FRAME_ID[major].test(id)
}

export function frameHeaderSize(major: 2 | 3 | 4): 6 | 10 {
  return major === 2 ? 6 : 10
}

/** Decodes the flag bytes. Extras are not read here. */
export function decodeFrameFlags(major: 2 | 3 | 4, raw: number): FrameFlags {
  const f = defaultFrameFlags()
  if (major === 2) return f
  const status = raw >> 8
  const format = raw & 0xff
  if (major === 3) {
    f.tagAlterPreservation = (status & 0x80) !== 0
    f.fileAlterPreservation = (status & 0x40) !== 0
    f.readOnly = (status & 0x20) !== 0
    f.compression = (format & 0x80) !== 0
    if (status & 0x1f) f.unknownStatusBits = status & 0x1f
    if (format & 0x1f) f.unknownFormatBits = format & 0x1f
  } else {
    f.tagAlterPreservation = (status & 0x40) !== 0
    f.fileAlterPreservation = (status & 0x20) !== 0
    f.readOnly = (status & 0x10) !== 0
    f.compression = (format & 0x08) !== 0
    f.unsynchronisation = (format & 0x02) !== 0
    f.dataLengthIndicator = (format & 0x01) !== 0
    if (status & 0x8f) f.unknownStatusBits = status & 0x8f
    if (format & 0xb0) f.unknownFormatBits = format & 0xb0
  }
  return f
}

/**
 * Reads a frame header at `offset`. `sizeMode` lets the reader try plain sizes for v2.4 tags
 * written by old iTunes (Compliance Issues: "iTunes does not treat framelength as a sync safe
 * integer").
 */
export function readFrameHeader(
  data: Uint8Array,
  offset: number,
  major: 2 | 3 | 4,
  sizeMode: 'spec' | 'plain' = 'spec',
): FrameHeader | null {
  const hs = frameHeaderSize(major)
  if (offset + hs > data.length) return null
  const id = asciiString(data.subarray(offset, offset + (major === 2 ? 3 : 4)))
  let size: number
  let rawFlags = 0
  if (major === 2) {
    // SPEC: v2.2 §3.2 three-byte size, frame size - 6.
    size = (data[offset + 3]! << 16) | (data[offset + 4]! << 8) | data[offset + 5]!
  } else {
    size = major === 4 && sizeMode === 'spec' ? decodeSynchsafe(data, offset + 4) : decodeUint32(data, offset + 4)
    rawFlags = (data[offset + 8]! << 8) | data[offset + 9]!
  }
  const flags = decodeFrameFlags(major, rawFlags)
  const header: FrameHeader = { id, size, flags, headerSize: hs, extrasSize: 0, rawFlags }

  // Extras follow the header in flag order.
  // SPEC v2.3 §3.3.1: decompressed size (4), encryption method (1), group id (1).
  // SPEC v2.4 §4.1.2: group id (1), encryption method (1), data length indicator (4, synchsafe).
  // In v2.4 the extras are inside the unsynchronised region, but none of them can contain $FF
  // (synchsafe bytes are < $80 and symbols are $80-$F0), so reading them before resync is safe.
  let p = offset + hs
  const end = offset + hs + size
  const take = (n: number): number | undefined => {
    if (p + n > end || p + n > data.length) return undefined
    const v = n === 1 ? data[p]! : decodeUint32(data, p)
    p += n
    return v
  }
  if (major === 3) {
    const format = rawFlags & 0xff
    if (format & 0x80) {
      const v = take(4)
      if (v !== undefined) header.dataLength = v
    }
    if (format & 0x40) {
      const v = take(1)
      if (v !== undefined) flags.encryptionMethod = v
    }
    if (format & 0x20) {
      const v = take(1)
      if (v !== undefined) flags.groupId = v
    }
  } else if (major === 4) {
    const format = rawFlags & 0xff
    if (format & 0x40) {
      const v = take(1)
      if (v !== undefined) flags.groupId = v
    }
    if (format & 0x04) {
      const v = take(1)
      if (v !== undefined) flags.encryptionMethod = v
    }
    if (format & 0x01) {
      if (p + 4 <= end && p + 4 <= data.length) {
        header.dataLength = decodeSynchsafe(data, p)
        p += 4
      }
    }
  }
  header.extrasSize = p - (offset + hs)
  return header
}

/** Encodes the two flag bytes for v2.3/v2.4. */
export function encodeFrameFlags(major: 3 | 4, f: FrameFlags, keepUnknown = true): number {
  let status = 0
  let format = 0
  if (major === 3) {
    if (f.tagAlterPreservation) status |= 0x80
    if (f.fileAlterPreservation) status |= 0x40
    if (f.readOnly) status |= 0x20
    if (f.compression) format |= 0x80
    if (f.encryptionMethod !== undefined) format |= 0x40
    if (f.groupId !== undefined) format |= 0x20
    if (keepUnknown) {
      status |= (f.unknownStatusBits ?? 0) & 0x1f
      format |= (f.unknownFormatBits ?? 0) & 0x1f
    }
  } else {
    if (f.tagAlterPreservation) status |= 0x40
    if (f.fileAlterPreservation) status |= 0x20
    if (f.readOnly) status |= 0x10
    if (f.groupId !== undefined) format |= 0x40
    if (f.compression) format |= 0x08
    if (f.encryptionMethod !== undefined) format |= 0x04
    if (f.unsynchronisation) format |= 0x02
    if (f.dataLengthIndicator) format |= 0x01
    if (keepUnknown) {
      status |= (f.unknownStatusBits ?? 0) & 0x8f
      format |= (f.unknownFormatBits ?? 0) & 0xb0
    }
  }
  return (status << 8) | format
}

/**
 * Writes a frame header followed by its extras. `payload` is the final frame data (already
 * compressed, encrypted and unsynchronised); `dataLength` is the decompressed size (v2.3) or the
 * data length indicator (v2.4).
 */
export function writeFrame(
  w: ByteWriter,
  major: 2 | 3 | 4,
  id: string,
  flags: FrameFlags,
  payload: Uint8Array,
  dataLength?: number,
  keepUnknownFlags = true,
): void {
  if (!isValidFrameId(id, major)) throw new TagWriteError('frame-id', `"${id}" is not a valid v2.${major} frame ID`)
  if (payload.length === 0 && dataLength === undefined) {
    // SPEC: "A frame must be at least 1 byte big, excluding the header."
    throw new TagWriteError('frame-empty', `frame ${id} has no data`)
  }
  for (let i = 0; i < id.length; i++) w.u8(id.charCodeAt(i))
  if (major === 2) {
    if (flags.compression || flags.encryptionMethod !== undefined || flags.groupId !== undefined || flags.unsynchronisation || flags.dataLengthIndicator) {
      throw new TagWriteError('frame-flags', `v2.2 frames cannot carry flags (${id})`)
    }
    if (payload.length > 0xffffff) throw new TagWriteError('frame-size', `frame ${id} is too large for v2.2`)
    w.u24(payload.length)
    w.bytes(payload)
    return
  }
  if (major === 3 && (flags.unsynchronisation || flags.dataLengthIndicator)) {
    throw new TagWriteError('frame-flags', `v2.3 frames cannot carry the unsynchronisation or data length flags (${id})`)
  }
  const extras = new ByteWriter(8)
  if (major === 3) {
    if (flags.compression) extras.u32(dataLength ?? 0)
    if (flags.encryptionMethod !== undefined) extras.u8(flags.encryptionMethod)
    if (flags.groupId !== undefined) extras.u8(flags.groupId)
  } else {
    if (flags.groupId !== undefined) extras.u8(flags.groupId)
    if (flags.encryptionMethod !== undefined) extras.u8(flags.encryptionMethod)
    if (flags.dataLengthIndicator) extras.bytes(encodeSynchsafe(dataLength ?? 0))
  }
  const ex = extras.toUint8Array()
  const size = ex.length + payload.length
  if (major === 4) w.bytes(encodeSynchsafe(size))
  else w.u32(size)
  w.u16(encodeFrameFlags(major, flags, keepUnknownFlags))
  w.bytes(ex)
  w.bytes(payload)
}
