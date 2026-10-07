import { concat } from '../core/bytes.js'
import { crc32 } from '../core/crc32.js'
import type { MajorVersion } from '../core/encoding.js'
import { TagWriteError, type Warning, WarningSink } from '../core/errors.js'
import { unsynchronise } from '../core/unsync.js'
import {
  type ExtendedHeaderV23,
  type ExtendedHeaderV24,
  serializeExtendedHeaderV23,
  serializeExtendedHeaderV24,
} from './extended-header.js'
import { type FrameWriteOptions, encodeFrameForWrite, isUnchanged } from './frame-io.js'
import { HEADER_SIZE, serializeTagHeader } from './header.js'
import type { Frame } from './frames/types.js'
import { type ID3v2Tag, getOriginalSize } from './tag.js'

export interface WriteOptions extends Omit<FrameWriteOptions, 'unsynchronisation'> {
  /**
   * Padding after the frames.
   * - a number: exactly that many bytes
   * - 'auto' (default): keep the original tag size when the new content fits (so the file can be
   *   rewritten in place), otherwise reserve space as id3guide recommends
   */
  padding?: number | 'auto'
  /** Size (header + body) the tag must keep if it fits, for 'auto'. Defaults to the size it was read with. */
  originalSize?: number
  /**
   * Unsynchronisation (v2.2/v2.3: whole tag, v2.4: per frame). 'preserve' (default) keeps what
   * the tag and its frames say.
   */
  unsynchronisation?: boolean | 'preserve'
  /**
   * What was altered, for the preservation flags (v2.3 §3.3.1, v2.4 §4.1.1): unknown frames with
   * the matching flag set are discarded. Default 'tag' when frames changed, else 'none'.
   */
  alteration?: 'none' | 'tag' | 'file'
}

export interface WriteResult {
  bytes: Uint8Array
  warnings: Warning[]
}

const MAX_TAG_SIZE = 2 ** 28 - 1

/**
 * id3guide "Padding": keep the old size when the content fits; a new tag gets 1 KB; a tag that
 * outgrows its space gets double the space, capped at 32 KB more. Pictures get 2 KB extra.
 */
function autoPadding(contentSize: number, originalSize: number | undefined, hasPictures: boolean): number {
  const extra = hasPictures ? 2048 : 0
  if (originalSize === undefined) return 1024 + extra
  const old = originalSize - HEADER_SIZE
  if (old >= contentSize) return old - contentSize
  const target = Math.max(contentSize + 1024, Math.min(old * 2, old + 32 * 1024))
  return target - contentSize + extra
}

function isUnknown(f: Frame): boolean {
  return f.type === 'unknown' || f.type === 'undecodable'
}

/** Serialises an ID3v2 tag. SPEC: v2.4 structure §3, v2.3 §3, v2.2 §3. */
export function writeID3v2(tag: ID3v2Tag, options: WriteOptions = {}): WriteResult {
  const w = new WarningSink(false)
  const major = tag.version.major
  const revision = tag.version.revision
  if (major !== 2 && major !== 3 && major !== 4) throw new TagWriteError('version', `cannot write ID3v2.${major as number}`)

  // SPEC: preservation flags only apply to frames unknown to the software.
  const anyChanged = tag.frames.some((f) => !isUnchanged(f, major))
  const alteration = options.alteration ?? (anyChanged ? 'tag' : 'none')
  const frames = tag.frames.filter((f) => {
    if (!isUnknown(f)) return true
    if (alteration === 'tag' && f.flags.tagAlterPreservation) {
      w.note('frame-discarded', `${f.id} discarded: unknown frame marked "discard if tag is altered"`, { frameId: f.id })
      return false
    }
    if (alteration === 'file' && f.flags.fileAlterPreservation) {
      w.note('frame-discarded', `${f.id} discarded: unknown frame marked "discard if file is altered"`, { frameId: f.id })
      return false
    }
    return true
  })
  // SPEC: "A tag MUST contain at least one frame."
  if (frames.length === 0) throw new TagWriteError('tag-no-frames', 'a tag must contain at least one frame')

  const unsyncOpt = options.unsynchronisation ?? 'preserve'
  const wantUnsync = unsyncOpt === 'preserve' ? tag.flags.unsynchronisation : unsyncOpt
  const frameOpts: FrameWriteOptions = { ...options }
  frameOpts.unsynchronisation = major === 4 ? (unsyncOpt === 'preserve' ? (tag.flags.unsynchronisation ? true : 'preserve') : unsyncOpt) : false

  const encoded = frames.map((f) => encodeFrameForWrite(f, major, w, frameOpts))
  const frameBytes = concat(encoded)

  const footer = major === 4 && tag.flags.footer === true
  const flags = { ...tag.flags }
  delete flags.unknownBits // SPEC: v2.4 §3.1 "All the other flags MUST be cleared."
  if (major === 2) flags.compression = false

  // Extended header (v2.3/v2.4)
  const ext = major >= 3 ? tag.extendedHeader : undefined
  if (major >= 3) flags.extendedHeader = ext !== undefined
  let extBytes: Uint8Array = new Uint8Array(0)
  const sizeOfExt = (): number => {
    if (!ext) return 0
    if (ext.version === 3) return ext.crc !== undefined ? 14 : 10
    return serializeExtendedHeaderV24(ext).length
  }

  // Padding. SPEC: v2.4 §3.3 "it MUST NOT have any padding when a tag footer is added".
  let content = sizeOfExt() + frameBytes.length
  // v2.2/v2.3 unsynchronise the whole tag: count the bytes it adds so a size-preserving rewrite
  // still fits (padding is all $00 and never grows).
  if (major < 4 && wantUnsync) content += unsynchronise(frameBytes).data.length - frameBytes.length
  const hasPictures = frames.some((f) => f.type === 'picture')
  let padding = footer ? 0 : options.padding === undefined || options.padding === 'auto' ? autoPadding(content, options.originalSize ?? getOriginalSize(tag), hasPictures) : options.padding
  if (footer && typeof options.padding === 'number' && options.padding > 0) {
    w.note('footer-padding', 'padding dropped: a tag with a footer must not have padding')
  }
  if (padding < 0 || !Number.isInteger(padding)) throw new TagWriteError('padding', `invalid padding ${padding}`)

  let body: Uint8Array
  if (major === 4) {
    // SPEC: v2.4 §6.1: a tag that ends in $FF with neither padding nor footer creates a false
    // sync with the audio; add a byte of padding.
    if (!footer && padding === 0 && frameBytes[frameBytes.length - 1] === 0xff) padding = 1
    const tail = concat([frameBytes, new Uint8Array(padding)])
    if (ext?.version === 4) {
      const e: ExtendedHeaderV24 = { ...ext }
      // SPEC: v2.4 §3.2 unknown flags "MUST be unset and their corresponding data removed when a
      // tag is modified".
      if (ext.crc !== undefined) e.crc = crc32(tail)
      extBytes = serializeExtendedHeaderV24(e, !anyChanged)
    }
    body = concat([extBytes, tail])
    // SPEC: v2.4 §6.1 the header flag "SHOULD be set" when all frames are unsynchronised and
    // "MUST NOT be set if the tag has a frame which is not unsynchronised". A frame that the
    // scheme would not change counts as unsynchronised.
    const isU = (b: Uint8Array) => (b[9]! & 0x02) !== 0
    flags.unsynchronisation = (wantUnsync || encoded.some(isU)) && encoded.every((b) => isU(b) || !needsChange(b))
  } else {
    if (ext?.version === 3) {
      const e: ExtendedHeaderV23 = { ...ext, paddingSize: padding }
      // SPEC: v2.3 §3.2 the CRC covers the frames only, before unsynchronisation.
      if (ext.crc !== undefined) e.crc = crc32(frameBytes)
      extBytes = serializeExtendedHeaderV23(e)
    }
    body = concat([extBytes, frameBytes, new Uint8Array(padding)])
    flags.unsynchronisation = false
    if (wantUnsync) {
      const u = unsynchronise(body)
      // SPEC: v2.3 §5 "This bit should only be set if the tag contains a, now corrected, false
      // synchronisation."
      if (u.changed) {
        body = u.data
        flags.unsynchronisation = true
        // SPEC: v2.3 §5 "If the last byte in the tag is $FF ... at least one byte of padding
        // should be added."
        if (body[body.length - 1] === 0xff) body = concat([body, new Uint8Array(1)])
      }
    }
  }

  if (body.length > MAX_TAG_SIZE) throw new TagWriteError('tag-size', 'tag exceeds the 256 MB limit of the size field')
  const header = serializeTagHeader(major, revision, flags, body.length)
  const parts = [header, body]
  // SPEC: v2.4 §3.4 the footer is a copy of the header with identifier "3DI".
  if (footer) parts.push(serializeTagHeader(major, revision, flags, body.length, '3DI'))
  return { bytes: concat(parts), warnings: w.list }
}

/** True when the stored frame payload contains bytes unsynchronisation would change. */
function needsChange(frame: Uint8Array): boolean {
  for (let i = 10; i + 1 < frame.length; i++) {
    if (frame[i] === 0xff && (frame[i + 1]! >= 0xe0 || frame[i + 1] === 0)) return true
  }
  return false
}
