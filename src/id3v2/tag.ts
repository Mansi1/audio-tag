import { isBytes } from '../core/bytes.js'
import type { MajorVersion } from '../core/encoding.js'
import type { ExtendedHeader } from './extended-header.js'
import { defaultFrameFlags, type FrameFlags } from './frame-header.js'
import type { TagHeaderFlags } from './header.js'
import { defaultDiscardOnFileAlter } from './frames/registry.js'
import type { Frame, FrameInit, FrameOf, FrameType } from './frames/types.js'

export interface ID3v2Tag {
  version: { major: MajorVersion; revision: number }
  flags: TagHeaderFlags
  extendedHeader?: ExtendedHeader
  frames: Frame[]
  /** Padding bytes after the last frame (as read; the writer decides what to write). */
  padding: number
}

export function createTag(major: MajorVersion = 4, frames: Frame[] = []): ID3v2Tag {
  return { version: { major, revision: 0 }, flags: { unsynchronisation: false }, frames, padding: 0 }
}

/**
 * Builds a frame with the default status flags for its ID: class 3 frames (v2.3 §3.3.2, v2.4
 * frames §3) are discarded when the file is altered.
 */
export function createFrame<T extends FrameType>(
  type: T,
  id: string,
  init: FrameInit<T>,
  major: MajorVersion = 4,
  flags: Partial<FrameFlags> = {},
): FrameOf<T> {
  const f = { ...defaultFrameFlags(), fileAlterPreservation: defaultDiscardOnFileAlter(id, major), ...flags }
  return { type, id, flags: f, ...init } as unknown as FrameOf<T>
}

export function getFrames(tag: Pick<ID3v2Tag, 'frames'>, id: string): Frame[] {
  return tag.frames.filter((f) => f.id === id)
}

export function getFrame(tag: Pick<ID3v2Tag, 'frames'>, id: string): Frame | undefined {
  return tag.frames.find((f) => f.id === id)
}

/** Values of a text frame, or undefined when it is absent. */
export function getText(tag: Pick<ID3v2Tag, 'frames'>, id: string): string[] | undefined {
  const f = getFrame(tag, id)
  return f?.type === 'text' ? f.values : undefined
}

/** Size (header + body, no footer) of tags as they were read, for size-preserving rewrites. */
const ORIGINAL_SIZE = new WeakMap<ID3v2Tag, number>()

export function setOriginalSize(tag: ID3v2Tag, size: number): void {
  ORIGINAL_SIZE.set(tag, size)
}

export function getOriginalSize(tag: ID3v2Tag): number | undefined {
  return ORIGINAL_SIZE.get(tag)
}

/** Deep copy of a frame (plain objects, arrays and byte arrays). */
export function cloneFrame<F extends Frame>(frame: F): F {
  return deepClone(frame)
}

function deepClone<T>(v: T): T {
  if (isBytes(v)) return v.slice() as T
  if (Array.isArray(v)) return v.map(deepClone) as T
  if (v && typeof v === 'object') {
    const out: Record<string, unknown> = {}
    for (const [k, x] of Object.entries(v)) out[k] = deepClone(x)
    return out as T
  }
  return v
}
