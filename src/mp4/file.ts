import { ByteWriter, concat, equalBytes, isBytes } from '../core/bytes.js'
import { type Segment, applySegments } from '../file/segments.js'
import { type Warning, WarningSink } from '../core/errors.js'
import {
  type AtomHeader,
  type AtomNode,
  MP4WriteError,
  atom,
  child,
  findAll,
  parseNode,
  readAtomHeader,
  readAtoms,
  serializeNode,
  typeBytes,
} from './atoms.js'
import {
  type MP4Item,
  type MP4Tags,
  type QuickTimeMeta,
  type UserDataText,
  metaHandler,
  parseITunesList,
  parseQuickTimeMeta,
  parseUserDataText,
  serializeITunesList,
  serializeQuickTimeParts,
  serializeUserDataText,
} from './meta.js'

export interface MP4Layout {
  /** Top-level atoms in file order. */
  atoms: { type: string; start: number; end: number }[]
  moov?: { start: number; end: number }
  /** Movie fragments ('moof') or segment indexes are present. */
  fragmented: boolean
}

export interface ReadMP4Result {
  tags: MP4Tags
  layout: MP4Layout
  warnings: Warning[]
}

/**
 * Exact round trips (as for ID3 frames): what each part of the model serialised to when it was
 * read, and the original bytes. Unchanged parts are written back from the original bytes.
 */
const ORIGINAL = new WeakMap<object, { snapshot: Uint8Array; original: Uint8Array }>()

function remember(key: object, snapshot: Uint8Array, original: Uint8Array): void {
  ORIGINAL.set(key, { snapshot, original })
}

function reuse(key: object, now: Uint8Array): Uint8Array {
  const o = ORIGINAL.get(key)
  return o && equalBytes(o.snapshot, now) ? o.original : now
}

const FRAGMENT_ATOMS = new Set(['moof', 'mfra', 'sidx', 'ssix'])

function layoutOf(top: AtomHeader[]): MP4Layout {
  const moov = top.find((a) => a.type === 'moov')
  const layout: MP4Layout = { atoms: top.map((a) => ({ type: a.type, start: a.start, end: a.end })), fragmented: top.some((a) => FRAGMENT_ATOMS.has(a.type)) }
  if (moov) layout.moov = { start: moov.start, end: moov.end }
  return layout
}

/** The metadata atoms of a movie: iTunes ('mdir') and QuickTime ('mdta'), with their parents. */
function metaAtoms(moov: AtomNode): { itunes?: { meta: AtomNode; parent: AtomNode }; quicktime?: { meta: AtomNode; parent: AtomNode; location: 'moov' | 'udta' } } {
  const out: ReturnType<typeof metaAtoms> = {}
  const udta = child(moov, 'udta')
  for (const [parent, location] of [
    [udta, 'udta'],
    [moov, 'moov'],
  ] as const) {
    for (const m of parent?.children?.filter((c) => c.type === 'meta') ?? []) {
      const h = metaHandler(m)
      if (h === 'mdir' && !out.itunes) out.itunes = { meta: m, parent: parent! }
      if (h === 'mdta' && !out.quicktime) out.quicktime = { meta: m, parent: parent!, location }
    }
  }
  return out
}

/** Reads the metadata of an MP4/M4A/MOV file. */
export function readMP4(data: Uint8Array, options: { strict?: boolean } = {}): ReadMP4Result {
  const w = new WarningSink(options.strict ?? false)
  const top = readAtoms(data, 0, data.length, w, true)
  const moov = top.find((a) => a.type === 'moov')
  return readMP4Parts(top, moov ? data.subarray(moov.start, moov.end) : undefined, w)
}

/**
 * Reads metadata from the top-level atom headers and the bytes of the movie atom only, so large
 * files never need their media data in memory.
 */
export function readMP4Parts(top: AtomHeader[], moovBytes: Uint8Array | undefined, w: WarningSink = new WarningSink()): ReadMP4Result {
  const layout = layoutOf(top)
  const tags: MP4Tags = { userData: [] }
  if (!moovBytes) {
    w.warn('mp4-no-moov', "no movie atom ('moov'): the file has no metadata")
    return { tags, layout, warnings: w.list }
  }
  if (top.filter((a) => a.type === 'moov').length > 1) w.warn('mp4-moov-count', 'more than one movie atom; using the first')
  const moov = parseNode(moovBytes, readAtomHeader(moovBytes, 0, moovBytes.length, w)!, w)
  const metas = metaAtoms(moov)

  if (metas.itunes) {
    const ilst = child(metas.itunes.meta, 'ilst')
    const items = ilst ? parseITunesList(ilst, w) : []
    tags.itunes = { items }
    if (ilst) remember(tags.itunes, serializeITunesList(items), serializeNode(ilst))
  }
  if (metas.quicktime) {
    const q = parseQuickTimeMeta(metas.quicktime.meta, metas.quicktime.location, w)
    tags.quicktime = q
    remember(q, quickTimeSnapshot(q), serializeNode(metas.quicktime.meta))
  }
  for (const c of child(moov, 'udta')?.children ?? []) {
    if (c.type.charCodeAt(0) !== 0xa9 || !c.payload) continue
    const t = parseUserDataText(c.type, c.payload, w)
    if (!t) continue
    tags.userData.push(t)
    remember(t, serializeUserDataText(t), serializeNode(c))
  }
  // SPEC: User_data_atoms.md "only one user data atom is allowed as the immediate child of any
  // given movie atom or track atom".
  if ((moov.children ?? []).filter((c) => c.type === 'udta').length > 1) w.warn('mp4-udta-count', "more than one 'udta' in the movie atom")
  return { tags, layout, warnings: w.list }
}

function quickTimeSnapshot(q: QuickTimeMeta): Uint8Array {
  const p = serializeQuickTimeParts(q)
  return concat([p.keys, p.ilst, p.mhdr ?? new Uint8Array(0)])
}

/** A leaf node holding fixed bytes. */
function leaf(bytes: Uint8Array, type: string): AtomNode {
  return { type, original: bytes }
}

/** SPEC: Metadata_handler_atom.md: version/flags, predefined, handler type, reserved[3], name. */
function hdlr(handler: 'mdir' | 'mdta'): Uint8Array {
  const w = new ByteWriter(25).u32(0).u32(0).bytes(typeBytes(handler))
  // iTunes writes 'appl' in the first reserved word (as in the sample file); QTFF says reserved.
  if (handler === 'mdir') w.bytes(typeBytes('appl')).u32(0).u32(0)
  else w.zeros(12)
  w.u8(0) // empty name
  return atom('hdlr', w.toUint8Array())
}

/** Builds the new iTunes 'meta' content (handler 'mdir'). New meta atoms are full atoms (M2). */
function applyITunes(moov: AtomNode, items: MP4Item[] | undefined, existing: ReturnType<typeof metaAtoms>['itunes'], tagsKey: object | undefined): void {
  if (!items || items.length === 0) {
    if (existing) existing.parent.children = existing.parent.children!.filter((c) => c !== existing.meta)
    if (existing) delete existing.parent.original
    return
  }
  const ilstBytes = tagsKey ? reuse(tagsKey, serializeITunesList(items)) : serializeITunesList(items)
  if (existing) {
    const meta = existing.meta
    const old = child(meta, 'ilst')
    if (old && old.original && equalBytes(old.original, ilstBytes)) return
    const node = leaf(ilstBytes, 'ilst')
    meta.children = old ? meta.children!.map((c) => (c === old ? node : c)) : [...meta.children!, node]
    delete meta.original
    delete existing.parent.original
    return
  }
  let udta = child(moov, 'udta')
  if (!udta) {
    udta = { type: 'udta', children: [] }
    moov.children!.push(udta)
  }
  udta.children!.push({ type: 'meta', prefix: new Uint8Array(4), children: [leaf(hdlr('mdir'), 'hdlr'), leaf(ilstBytes, 'ilst')] })
  delete udta.original
}

function applyQuickTime(moov: AtomNode, q: QuickTimeMeta | undefined, existing: ReturnType<typeof metaAtoms>['quicktime']): void {
  if (!q) {
    if (existing) {
      existing.parent.children = existing.parent.children!.filter((c) => c !== existing.meta)
      delete existing.parent.original
    }
    return
  }
  const parts = serializeQuickTimeParts(q)
  const snap = concat([parts.keys, parts.ilst, parts.mhdr ?? new Uint8Array(0)])
  const o = ORIGINAL.get(q)
  if (existing && o && equalBytes(o.snapshot, snap)) return
  const keep = (existing?.meta.children ?? []).filter((c) => !['keys', 'ilst', 'mhdr', 'hdlr'].includes(c.type))
  const h = existing ? child(existing.meta, 'hdlr') : undefined
  const children = [h ?? leaf(hdlr('mdta'), 'hdlr'), ...(parts.mhdr ? [leaf(parts.mhdr, 'mhdr')] : []), leaf(parts.keys, 'keys'), leaf(parts.ilst, 'ilst'), ...keep]
  if (existing) {
    existing.meta.children = children
    delete existing.meta.original
    delete existing.parent.original
    return
  }
  // New 'mdta' metadata follows QTFF: a plain 'meta' atom in the movie atom.
  const parent = q.location === 'udta' ? (child(moov, 'udta') ?? (moov.children!.push({ type: 'udta', children: [] }), child(moov, 'udta')!)) : moov
  parent.children!.push({ type: 'meta', children })
  delete parent.original
}

function applyUserData(moov: AtomNode, texts: UserDataText[]): void {
  let udta = child(moov, 'udta')
  const isText = (c: AtomNode) => c.type.charCodeAt(0) === 0xa9 && c.payload !== undefined && parseUserDataText(c.type, c.payload, new WarningSink()) !== undefined
  const wanted = new Map(texts.map((t) => [t.type, t]))
  if (!udta) {
    if (!texts.length) return
    udta = { type: 'udta', children: [] }
    moov.children!.push(udta)
  }
  const out: AtomNode[] = []
  let changed = false
  for (const c of udta.children!) {
    if (!isText(c)) {
      out.push(c)
      continue
    }
    const t = wanted.get(c.type)
    if (!t) {
      changed = true
      continue
    }
    wanted.delete(c.type)
    const bytes = reuse(t, serializeUserDataText(t))
    if (c.original && equalBytes(bytes, c.original)) out.push(c)
    else {
      out.push(leaf(bytes, c.type))
      changed = true
    }
  }
  for (const t of wanted.values()) {
    out.push(leaf(serializeUserDataText(t), t.type))
    changed = true
  }
  if (changed) {
    udta.children = out
    delete udta.original
  }
}

/** SPEC: Chunk_offset_atom.md: chunk offsets are absolute file offsets ('stco' 32-bit, 'co64' 64-bit). */
function shiftChunkOffsets(moov: AtomNode, from: number, delta: number, w: WarningSink): void {
  if (delta === 0) return
  for (const path of [...findAll(moov, 'stco'), ...findAll(moov, 'co64')]) {
    const node = path[path.length - 1]!
    const p = node.payload!
    const wide = node.type === 'co64'
    const n = ((p[4]! << 24) | (p[5]! << 16) | (p[6]! << 8) | p[7]!) >>> 0
    const dv = new DataView(p.buffer, p.byteOffset, p.byteLength)
    const out = new ByteWriter(p.length + 4 * n).bytes(p.subarray(0, 8))
    let upgrade = false
    const offsets: number[] = []
    for (let i = 0; i < n; i++) {
      const at = 8 + i * (wide ? 8 : 4)
      if (at + (wide ? 8 : 4) > p.length) {
        w.warn('mp4-stco', `${node.type} declares ${n} entries, ${i} present`)
        break
      }
      let v = wide ? dv.getUint32(at) * 2 ** 32 + dv.getUint32(at + 4) : dv.getUint32(at)
      if (v >= from) v += delta
      if (!wide && v > 0xffffffff) upgrade = true
      offsets.push(v)
    }
    if (upgrade || wide) {
      // SPEC: "QuickTime ... uses the 64-bit chunk offset atom only if there are chunks that use the
      // high 32-bits of the chunk offset."
      for (const v of offsets) out.uN(Math.floor(v / 2 ** 32), 4).u32(v % 2 ** 32)
      node.type = 'co64'
    } else for (const v of offsets) out.u32(v)
    node.payload = out.toUint8Array()
    touch(path)
  }
}

function touch(path: AtomNode[]): void {
  for (const n of path) delete n.original
}

/** A node is rebuilt when it or any descendant was changed (has no original bytes). */
function propagate(node: AtomNode): boolean {
  let changed = node.original === undefined
  for (const c of node.children ?? []) if (propagate(c)) changed = true
  if (changed) delete node.original
  return changed
}

export interface MP4WriteOptions {
  /** Free space to leave after the movie atom when the file must be rewritten. Default 1024. */
  padding?: number
  strict?: boolean
}


export interface MP4WriteResult {
  segments: Segment[]
  /** The file length and the audio position did not change. */
  inPlace: boolean
  warnings: Warning[]
}

/**
 * Writes metadata into an MP4 file.
 * SPEC: Chunk_offset_atom.md: "the size of the movie atom affects the chunk offsets to the media
 * data". The new movie atom first uses the free space that follows it; otherwise every chunk
 * offset after it is moved.
 */
export function writeMP4(data: Uint8Array, tags: MP4Tags, options: MP4WriteOptions = {}): MP4WriteResult {
  const top = readAtoms(data, 0, data.length, new WarningSink(), true)
  const moovH = top.find((a) => a.type === 'moov')
  return planMP4Write(top, moovH ? data.subarray(moovH.start, moovH.end) : undefined, data.length, tags, options)
}

/** Plans a write from the top-level atom headers and the movie atom bytes (see readMP4Parts). */
export function planMP4Write(
  top: AtomHeader[],
  moovBytes: Uint8Array | undefined,
  fileLength: number,
  tags: MP4Tags,
  options: MP4WriteOptions = {},
): MP4WriteResult {
  const w = new WarningSink(options.strict ?? false)
  const moovH = top.find((a) => a.type === 'moov')
  if (!moovH || !moovBytes) throw new MP4WriteError('mp4-no-moov', "the file has no movie atom ('moov')")
  if (top.filter((a) => a.type === 'moov').length > 1) throw new MP4WriteError('mp4-moov-count', 'more than one movie atom')
  const moov = parseNode(moovBytes, readAtomHeader(moovBytes, 0, moovBytes.length, w)!, w)
  const metas = metaAtoms(moov)

  applyITunes(moov, tags.itunes?.items, metas.itunes, tags.itunes)
  applyQuickTime(moov, tags.quicktime, metas.quicktime)
  applyUserData(moov, tags.userData)
  const udta = child(moov, 'udta')
  if (udta && udta.children!.length === 0) {
    moov.children = moov.children!.filter((c) => c !== udta)
    delete moov.original
  }

  propagate(moov)

  // Free space directly after the movie atom can absorb a size change.
  const idx = top.indexOf(moovH)
  let regionEnd = moovH.end
  for (let i = idx + 1; i < top.length && (top[i]!.type === 'free' || top[i]!.type === 'skip'); i++) regionEnd = top[i]!.end
  const available = regionEnd - moovH.start
  const fragmented = top.some((a) => FRAGMENT_ATOMS.has(a.type))

  let newMoov = serializeNode(moov)
  const free = (n: number) => atom('free', new Uint8Array(n - 8))
  let region: Uint8Array
  const left = available - newMoov.length
  if (equalBytes(newMoov, moovBytes)) {
    region = new Uint8Array(0)
  } else if (left === 0 || left >= 8) {
    region = left ? concat([newMoov, free(left)]) : newMoov
  } else {
    if (fragmented) {
      throw new MP4WriteError('mp4-fragmented', 'the metadata does not fit in the free space and fragmented files cannot be moved')
    }
    const padding = Math.max(8, options.padding ?? 1024)
    // Every chunk offset behind the region moves by delta. Converting 'stco' to 'co64' (on
    // overflow) grows the movie atom again, so repeat until its size is stable.
    let moovLength = newMoov.length
    for (let i = 0; i < 4; i++) {
      const fresh = serializeNode(moov)
      const trial = parseNode(fresh, readAtomHeader(fresh, 0, fresh.length)!, w)
      shiftChunkOffsets(trial, regionEnd, moovLength + padding - available, w)
      newMoov = serializeNode(trial)
      if (newMoov.length === moovLength) break
      moovLength = newMoov.length
    }
    region = concat([newMoov, free(padding)])
  }

  if (region.length === 0) return { segments: [{ start: 0, end: fileLength }], inPlace: true, warnings: w.list }
  const segments: Segment[] = []
  if (moovH.start > 0) segments.push({ start: 0, end: moovH.start })
  segments.push(region)
  if (regionEnd < fileLength) segments.push({ start: regionEnd, end: fileLength })
  return { segments, inPlace: region.length === available, warnings: w.list }
}

export { type Segment, applySegments }
