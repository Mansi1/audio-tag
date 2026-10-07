import { ByteWriter, asciiString, concat, isBytes } from '../core/bytes.js'
import { TagWriteError, type WarningSink } from '../core/errors.js'

// SPEC: spec/mp4/qtff/Atoms.md. An atom is a 32-bit size and a 32-bit type, then its data.
// Size 1: a 64-bit extended size follows the type. Size 0: "allowed only for a top-level atom,
// designates the last atom in the file and indicates that the atom extends to the end of the
// file". "The actual size of an atom cannot be less than 8 bytes."

export class MP4WriteError extends TagWriteError {
  override name = 'MP4WriteError'
}

export interface AtomHeader {
  /** Four characters, decoded as ISO-8859-1 so "©nam" (0xA9 'n' 'a' 'm') round-trips. */
  type: string
  start: number
  end: number
  headerSize: 8 | 16
  sizeField: 'normal' | 'extended' | 'to-end'
}

export function typeString(data: Uint8Array, offset: number): string {
  return asciiString(data.subarray(offset, offset + 4))
}

export function typeBytes(type: string): Uint8Array {
  if (type.length !== 4) throw new MP4WriteError('atom-type', `atom type "${type}" must be 4 characters`)
  return Uint8Array.from(type, (c) => c.charCodeAt(0) & 0xff)
}

function u32(data: Uint8Array, o: number): number {
  return ((data[o]! << 24) | (data[o + 1]! << 16) | (data[o + 2]! << 8) | data[o + 3]!) >>> 0
}

/** Reads one atom header. Returns null (with a warning) when it is invalid or truncated. */
export function readAtomHeader(data: Uint8Array, offset: number, end: number, w?: WarningSink, topLevel = false): AtomHeader | null {
  if (offset + 8 > end) {
    if (offset < end) w?.warn('mp4-truncated', `${end - offset} trailing bytes are too short for an atom header`, { offset })
    return null
  }
  const size = u32(data, offset)
  const type = typeString(data, offset + 4)
  if (size === 1) {
    if (offset + 16 > end) {
      w?.warn('mp4-truncated', `atom "${type}" has a truncated 64-bit size`, { offset })
      return null
    }
    const big = u32(data, offset + 8) * 2 ** 32 + u32(data, offset + 12)
    if (big < 16 || offset + big > end) {
      w?.warn('mp4-atom-size', `atom "${type}" claims ${big} bytes`, { offset })
      return null
    }
    return { type, start: offset, end: offset + big, headerSize: 16, sizeField: 'extended' }
  }
  if (size === 0) {
    if (!topLevel) w?.warn('mp4-atom-size', `atom "${type}" has size 0, which is only allowed at the top level`, { offset })
    return { type, start: offset, end, headerSize: 8, sizeField: 'to-end' }
  }
  if (size < 8 || offset + size > end) {
    w?.warn('mp4-atom-size', `atom "${type}" claims ${size} bytes but ${end - offset} are available`, { offset })
    return null
  }
  return { type, start: offset, end: offset + size, headerSize: 8, sizeField: 'normal' }
}

/** All sibling atoms in [start, end). */
export function readAtoms(data: Uint8Array, start: number, end: number, w?: WarningSink, topLevel = false): AtomHeader[] {
  const out: AtomHeader[] = []
  let p = start
  while (p < end) {
    const h = readAtomHeader(data, p, end, w, topLevel)
    if (!h) break
    out.push(h)
    p = h.end
  }
  return out
}

/** Builds an atom from its type and payload, choosing a 64-bit size when needed. */
export function atom(type: string, payload: Uint8Array | readonly Uint8Array[], extended = false): Uint8Array {
  const body = isBytes(payload) ? payload : concat(payload)
  const total = body.length + 8
  const w = new ByteWriter(body.length + 16)
  if (extended || total > 0xffffffff) {
    w.u32(1).bytes(typeBytes(type))
    w.uN(Math.floor((total + 8) / 2 ** 32), 4).u32((total + 8) % 2 ** 32)
  } else {
    w.u32(total).bytes(typeBytes(type))
  }
  w.bytes(body)
  return w.toUint8Array()
}

/** A full atom: version (1 byte) and flags (3 bytes) before the payload. */
export function fullAtom(type: string, version: number, flags: number, payload: Uint8Array | readonly Uint8Array[]): Uint8Array {
  const vf = Uint8Array.of(version, (flags >> 16) & 0xff, (flags >> 8) & 0xff, flags & 0xff)
  return atom(type, [vf, ...(isBytes(payload) ? [payload] : payload)])
}

/**
 * An editable atom tree. Containers hold children; leaves hold their payload bytes. Atoms that
 * were not changed are written back from their original bytes.
 */
export interface AtomNode {
  type: string
  /** The original bytes (header included), when the node came from a file and is unchanged. */
  original?: Uint8Array
  extended?: boolean
  /** Bytes between the header and the children (e.g. version/flags of a full atom). */
  prefix?: Uint8Array
  children?: AtomNode[]
  /** Leaf payload (bytes after the header). */
  payload?: Uint8Array
}

/** Atoms whose children are atoms. `meta` is handled separately (plain or full, see M2). */
export const CONTAINERS = new Set(['moov', 'trak', 'mdia', 'minf', 'stbl', 'udta', 'edts', 'dinf', 'mvex', 'moof', 'traf', 'ilst'])

/**
 * SPEC: spec/mp4/qtff/Metadata_atom.md shows 'meta' as a plain atom, but ISO 14496-12 and iTunes
 * write it as a full atom. It is full when a child type follows 4 bytes in.
 */
export function metaIsFull(data: Uint8Array, h: AtomHeader): boolean {
  const p = h.start + h.headerSize
  if (h.end - p < 12) return false
  const plainChild = typeString(data, p + 4)
  const fullChild = typeString(data, p + 8)
  if (/^[a-z]{4}$/.test(fullChild) && u32(data, p) === 0) return true
  return !/^[a-z]{4}$/.test(plainChild)
}

/** Parses an atom into a tree, descending into the known containers. */
export function parseNode(data: Uint8Array, h: AtomHeader, w?: WarningSink, containers = CONTAINERS): AtomNode {
  const node: AtomNode = { type: h.type, original: data.subarray(h.start, h.end) }
  if (h.sizeField === 'extended') node.extended = true
  const bodyStart = h.start + h.headerSize
  if (containers.has(h.type) || h.type === 'meta') {
    let childStart = bodyStart
    if (h.type === 'meta' && metaIsFull(data, h)) {
      node.prefix = data.subarray(bodyStart, bodyStart + 4)
      childStart += 4
    }
    node.children = readAtoms(data, childStart, h.end, w).map((c) => parseNode(data, c, w, containers))
  } else {
    node.payload = data.subarray(bodyStart, h.end)
  }
  return node
}

/** Serialises a node, reusing its original bytes when it was not modified. */
export function serializeNode(node: AtomNode): Uint8Array {
  if (node.original) return node.original
  if (node.children) {
    return atom(node.type, [node.prefix ?? new Uint8Array(0), ...node.children.map(serializeNode)], node.extended)
  }
  return atom(node.type, node.payload ?? new Uint8Array(0), node.extended)
}

/** Marks a node and its ancestors as modified so they are rebuilt. */
export function touch(path: readonly AtomNode[]): void {
  for (const n of path) delete n.original
}

export function child(node: AtomNode, type: string): AtomNode | undefined {
  return node.children?.find((c) => c.type === type)
}

/** Every node of a type below `node`, with its path from `node` (inclusive). */
export function findAll(node: AtomNode, type: string, path: AtomNode[] = []): AtomNode[][] {
  const here = [...path, node]
  const out: AtomNode[][] = []
  for (const c of node.children ?? []) {
    if (c.type === type) out.push([...here, c])
    out.push(...findAll(c, type, here))
  }
  return out
}
