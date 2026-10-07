import type { MajorVersion } from '../core/encoding.js'
import { type Warning, WarningSink } from '../core/errors.js'
import { crc32 } from '../core/crc32.js'
import { resynchronise } from '../core/unsync.js'
import { parseExtendedHeaderV23, parseExtendedHeaderV24 } from './extended-header.js'
import { type FrameReadOptions, parseFrames } from './frame-io.js'
import { HEADER_SIZE, parseTagHeader } from './header.js'
import { type ID3v2Tag, setOriginalSize } from './tag.js'

export type ReadOptions = FrameReadOptions

export interface ReadResult {
  tag: ID3v2Tag
  warnings: Warning[]
  /** Offset of the tag in the input. */
  offset: number
  /** Bytes the tag occupies, header and footer included. */
  totalSize: number
}

/** A tag that was found but must be ignored according to its spec. */
export interface UnsupportedTag {
  unsupported: true
  major: number
  revision: number
  reason: 'version' | 'v2.2-compression'
  offset: number
  totalSize: number
  raw: Uint8Array
}

/**
 * Reads an ID3v2 tag starting at `offset`. Returns null when there is no tag there.
 * SPEC: v2.4 structure §3, v2.3 §3, v2.2 §3.
 */
export function readID3v2(data: Uint8Array, offset = 0, options: ReadOptions = {}): ReadResult | UnsupportedTag | null {
  const header = parseTagHeader(data, offset)
  if (!header) return null
  const w = new WarningSink(options.strict ?? false)
  const { major, revision, flags } = header
  const footer = major === 4 && flags.footer === true
  const totalSize = HEADER_SIZE + header.size + (footer ? HEADER_SIZE : 0)
  const unsupported = (reason: UnsupportedTag['reason']): UnsupportedTag => ({
    unsupported: true,
    major,
    revision,
    reason,
    offset,
    totalSize,
    raw: data.subarray(offset, Math.min(data.length, offset + totalSize)),
  })
  // SPEC: v2.2-v2.4 §3.1: software that meets a newer major version "should simply ignore the
  // whole tag". Versions 0 and 1 were never ID3v2 formats.
  if (major < 2 || major > 4) return unsupported('version')
  // SPEC: v2.2 §3.1 "the ID3 decoder (for now) should just ignore the entire tag if the
  // compression bit is set."
  if (major === 2 && flags.compression) return unsupported('v2.2-compression')
  if (flags.unknownBits) w.warn('tag-flags', `undefined header flags set: $${flags.unknownBits.toString(16)}`, { offset })

  const bodyStart = offset + HEADER_SIZE
  let bodyEnd = bodyStart + header.size
  if (bodyEnd > data.length) {
    w.warn('tag-truncated', `tag size ${header.size} runs past the end of the data`, { offset })
    bodyEnd = data.length
  }
  let body = data.subarray(bodyStart, bodyEnd)
  // SPEC: v2.2/v2.3 §5: unsynchronisation covers the whole tag after the header.
  // v2.4: it is applied per frame (changes §3: "Resynchronisation of the complete tag when the
  // unsynchronisation flag in the header is set might result in a corrupt tag").
  if (major < 4 && flags.unsynchronisation) body = resynchronise(body)

  const tag: ID3v2Tag = { version: { major: major as MajorVersion, revision }, flags, frames: [], padding: 0 }
  let pos = 0
  let crcStart = 0
  if (major >= 3 && flags.extendedHeader) {
    try {
      if (major === 3) {
        const { header: ext, size } = parseExtendedHeaderV23(body, 0, w)
        tag.extendedHeader = ext
        pos = size
      } else {
        const { header: ext, size } = parseExtendedHeaderV24(body, 0, w)
        tag.extendedHeader = ext
        pos = size
      }
    } catch (e) {
      w.warn('ext-header', `unreadable extended header: ${(e as Error).message}`, { offset: bodyStart })
      pos = body.length
    }
    crcStart = pos
  }

  const parsed = parseFrames(body, pos, body.length, major as MajorVersion, revision, w, options, major === 4 && flags.unsynchronisation)
  tag.frames = parsed.frames
  tag.padding = body.length - parsed.end
  const padding = body.subarray(parsed.end)
  if (padding.some((b) => b !== 0)) {
    // SPEC: v2.4 §3.3 "The value of the padding bytes must be $00." (Compliance Issues: MP3ext)
    w.warn('padding-nonzero', 'padding contains non-zero bytes', { offset: bodyStart + parsed.end })
  }
  // SPEC: "A tag MUST contain at least one frame."
  if (tag.frames.length === 0) w.warn('tag-no-frames', 'tag contains no frames', { offset })

  const ext = tag.extendedHeader
  if (ext?.version === 3) {
    if (ext.paddingSize !== tag.padding) {
      w.note('ext-padding-size', `extended header says ${ext.paddingSize} bytes of padding, found ${tag.padding}`)
    }
    // SPEC: v2.3 §3.2: the CRC covers the frames only, before unsynchronisation.
    if (ext.crc !== undefined && crc32(body.subarray(crcStart, parsed.end)) !== ext.crc) {
      w.warn('crc-mismatch', 'extended header CRC does not match the frames', { offset })
    }
  } else if (ext?.version === 4 && ext.crc !== undefined) {
    // SPEC: v2.4 §3.2: the CRC covers frames and padding, excluding the extended header.
    if (crc32(body.subarray(crcStart)) !== ext.crc) w.warn('crc-mismatch', 'extended header CRC does not match', { offset })
  }

  if (footer) {
    const f = parseTagHeader(data, bodyStart + header.size, '3DI')
    if (!f) w.warn('footer-missing', 'footer flag set but no "3DI" footer found', { offset: bodyStart + header.size })
    else if (f.size !== header.size || f.major !== major) w.warn('footer-mismatch', 'footer does not match the header')
    if (tag.padding > 0) w.warn('footer-padding', 'a tag with a footer MUST NOT have padding')
  }
  setOriginalSize(tag, HEADER_SIZE + header.size)
  return { tag, warnings: w.list, offset, totalSize }
}

export function isUnsupported(r: ReadResult | UnsupportedTag | null): r is UnsupportedTag {
  return r !== null && 'unsupported' in r
}
