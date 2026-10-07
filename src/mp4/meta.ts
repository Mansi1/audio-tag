import { ByteWriter, concat } from '../core/bytes.js'
import { WarningSink } from '../core/errors.js'
import { type AtomNode, MP4WriteError, atom, child, fullAtom, readAtoms, typeBytes, typeString } from './atoms.js'
import { type MP4Value, decodeMacRoman, encodeMacRoman, packLanguage } from './values.js'

/** One iTunes item: "©nam", "trkn", ... or "----:mean:name" for freeform items. */
export interface MP4Item {
  key: string
  /** One value per 'data' atom, in file order (most specific first, QTFF Data_ordering.md). */
  values: MP4Value[]
  /** Other child atoms of the item (e.g. 'itif'), kept byte for byte. */
  extra?: Uint8Array[]
}

/** QuickTime metadata (handler 'mdta'), QTFF Metadata_atoms_and_types.md. */
export interface QuickTimeItem {
  /** Key namespace, usually "mdta" (reverse-DNS keys) or "udta". */
  namespace: string
  /** Key value, e.g. "com.apple.quicktime.title". */
  key: string
  /** From the item information atom ('itif'). */
  itemId?: number
  /** From the name atom ('name'). */
  name?: string
  values: MP4Value[]
  extra?: Uint8Array[]
}

export interface QuickTimeMeta {
  /** Where the 'meta' atom sits. */
  location: 'moov' | 'udta'
  items: QuickTimeItem[]
  /** 'mhdr' nextItemID, when present. */
  nextItemId?: number
}

/** A user data international text entry (QTFF User_data_atoms.md), e.g. '©nam' in moov/udta. */
export interface UserDataText {
  type: string
  entries: { language: number; text: string }[]
}

export interface MP4Tags {
  /** iTunes metadata: moov/udta/meta with handler 'mdir'. */
  itunes?: { items: MP4Item[] }
  /** QuickTime metadata: a 'meta' atom with handler 'mdta'. */
  quicktime?: QuickTimeMeta
  /** User data text atoms in moov/udta. */
  userData: UserDataText[]
}

const utf8 = new TextDecoder('utf-8')
const utf8Enc = new TextEncoder()

function u32(d: Uint8Array, o: number): number {
  return ((d[o]! << 24) | (d[o + 1]! << 16) | (d[o + 2]! << 8) | d[o + 3]!) >>> 0
}

/** Handler type of a 'meta' atom node ('mdir', 'mdta', ...). */
export function metaHandler(meta: AtomNode): string | undefined {
  const h = child(meta, 'hdlr')
  // hdlr payload: version/flags (4), predefined (4), handler type (4), ...
  return h?.payload && h.payload.length >= 12 ? typeString(h.payload, 8) : undefined
}

function dataAtom(v: MP4Value): Uint8Array {
  const w = new ByteWriter(8 + v.data.length).u32(v.type).u32(v.locale).bytes(v.data)
  return atom('data', w.toUint8Array())
}

/**
 * Parses the children of an item atom. 'data' atoms become values; 'mean'/'name' are read for
 * iTunes freeform items and 'itif'/'name' for QuickTime items; everything else is kept in order.
 */
function parseItemChildren(payload: Uint8Array, w: WarningSink, where: string, mode: 'itunes' | 'freeform' | 'mdta') {
  const values: MP4Value[] = []
  const extra: Uint8Array[] = []
  let mean: string | undefined
  let name: string | undefined
  let itemId: number | undefined
  let nameAtom: string | undefined
  for (const h of readAtoms(payload, 0, payload.length, w)) {
    const body = payload.subarray(h.start + h.headerSize, h.end)
    if (h.type === 'data' && body.length >= 8) {
      const type = u32(body, 0)
      // SPEC: Type_indicator.md "The indicator byte must have a value of 0 ... All other values are reserved."
      if (type >>> 24 !== 0) w.warn('mp4-type-indicator', `${where}: reserved type set ${type >>> 24}`)
      values.push({ type, locale: u32(body, 4), data: body.subarray(8) })
    } else if (mode === 'freeform' && h.type === 'mean' && body.length >= 4) mean = utf8.decode(body.subarray(4))
    else if (mode !== 'itunes' && h.type === 'name' && body.length >= 4) {
      name = utf8.decode(body.subarray(4))
      nameAtom = name
    } else if (mode === 'mdta' && h.type === 'itif' && body.length >= 8) itemId = u32(body, 4)
    else extra.push(payload.subarray(h.start, h.end))
  }
  return { values, extra, mean, name, itemId, nameAtom }
}

/** Parses an iTunes 'ilst' (handler 'mdir'). Item types are four-character codes. */
export function parseITunesList(ilst: AtomNode, w: WarningSink): MP4Item[] {
  const items: MP4Item[] = []
  for (const it of ilst.children ?? []) {
    const freeform = it.type === '----'
    const p = parseItemChildren(it.payload ?? new Uint8Array(0), w, it.type, freeform ? 'freeform' : 'itunes')
    let key = it.type
    if (freeform) {
      if (p.mean === undefined || p.name === undefined) w.warn('mp4-freeform', "freeform '----' item without 'mean' or 'name'")
      key = `----:${p.mean ?? ''}:${p.name ?? ''}`
    }
    const item: MP4Item = { key, values: p.values }
    if (p.extra.length) item.extra = p.extra
    items.push(item)
  }
  return items
}

export function serializeITunesItem(item: MP4Item): Uint8Array {
  if (item.key.startsWith('----:')) {
    const [, mean = '', ...rest] = item.key.split(':')
    const name = rest.join(':')
    return atom('----', [
      fullAtom('mean', 0, 0, utf8Enc.encode(mean)),
      fullAtom('name', 0, 0, utf8Enc.encode(name)),
      ...(item.extra ?? []),
      ...item.values.map(dataAtom),
    ])
  }
  return atom(item.key, [...(item.extra ?? []), ...item.values.map(dataAtom)])
}

export function serializeITunesList(items: readonly MP4Item[]): Uint8Array {
  return atom('ilst', items.map(serializeITunesItem))
}

/** SPEC: Metadata_item_keys_atom.md: full atom, entry_count, then (key_size, key_namespace, key_value). */
function parseKeys(payload: Uint8Array, w: WarningSink): { namespace: string; key: string }[] {
  const keys: { namespace: string; key: string }[] = []
  if (payload.length < 8) return keys
  const count = u32(payload, 4)
  let p = 8
  for (let i = 0; i < count; i++) {
    if (p + 8 > payload.length) {
      w.warn('mp4-keys', `keys atom declares ${count} entries, ${i} present`)
      break
    }
    const size = u32(payload, p)
    if (size < 8 || p + size > payload.length) {
      w.warn('mp4-keys', `key ${i + 1} has an invalid size ${size}`)
      break
    }
    keys.push({ namespace: typeString(payload, p + 4), key: utf8.decode(payload.subarray(p + 8, p + size)) })
    p += size
  }
  return keys
}

/** Parses a QuickTime 'mdta' meta atom. */
export function parseQuickTimeMeta(meta: AtomNode, location: 'moov' | 'udta', w: WarningSink): QuickTimeMeta {
  const keysNode = child(meta, 'keys')
  const ilst = child(meta, 'ilst')
  // SPEC: Metadata_atoms_and_types.md "The metadata atom must contain ... 'hdlr', 'keys', and 'ilst'."
  if (!keysNode || !ilst) w.warn('mp4-mdta', "an 'mdta' metadata atom must contain 'keys' and 'ilst'")
  const keys = keysNode?.payload ? parseKeys(keysNode.payload, w) : []
  const out: QuickTimeMeta = { location, items: [] }
  const mhdr = child(meta, 'mhdr')
  if (mhdr?.payload && mhdr.payload.length >= 8) out.nextItemId = u32(mhdr.payload, 4)
  const names = new Set<string>()
  for (const it of ilst?.children ?? []) {
    // SPEC: Metadata_item_atom.md: the item atom type is the 1-based index into 'keys'.
    const index = u32(typeBytes(it.type), 0)
    const key = keys[index - 1]
    if (!key) w.warn('mp4-key-index', `metadata item refers to key ${index}, which does not exist`)
    const p = parseItemChildren(it.payload ?? new Uint8Array(0), w, `key ${index}`, 'mdta')
    const item: QuickTimeItem = { namespace: key?.namespace ?? 'mdta', key: key?.key ?? `#${index}`, values: p.values }
    if (p.itemId !== undefined) item.itemId = p.itemId
    if (p.nameAtom !== undefined) {
      // SPEC: Name_atom.md "No two metadata items may have the same name."
      if (names.has(p.nameAtom)) w.warn('mp4-item-name', `two metadata items are named "${p.nameAtom}"`)
      names.add(p.nameAtom)
      item.name = p.nameAtom
    }
    if (p.extra.length) item.extra = p.extra
    out.items.push(item)
  }
  if (out.items.some((i) => i.itemId !== undefined) && out.nextItemId === undefined) {
    // SPEC: Metadata_header_atom.md "The metadata header atom must exist if there are metadata item
    // atoms containing an item information atom".
    w.warn('mp4-mhdr', "items carry item IDs but there is no 'mhdr' atom")
  }
  return out
}

/** Rebuilds the children of an 'mdta' meta atom (hdlr is kept by the caller). */
export function serializeQuickTimeParts(q: QuickTimeMeta): { keys: Uint8Array; ilst: Uint8Array; mhdr?: Uint8Array } {
  const keyList: { namespace: string; key: string }[] = []
  const indexOf = (ns: string, k: string) => {
    let i = keyList.findIndex((x) => x.namespace === ns && x.key === k)
    if (i < 0) i = keyList.push({ namespace: ns, key: k }) - 1
    return i + 1
  }
  const items = q.items.map((it) => {
    const index = indexOf(it.namespace, it.key)
    const type = String.fromCharCode((index >>> 24) & 0xff, (index >>> 16) & 0xff, (index >>> 8) & 0xff, index & 0xff)
    const parts: Uint8Array[] = []
    if (it.itemId !== undefined) parts.push(fullAtom('itif', 0, 0, new ByteWriter(4).u32(it.itemId).toUint8Array()))
    if (it.name !== undefined) parts.push(fullAtom('name', 0, 0, utf8Enc.encode(it.name)))
    parts.push(...(it.extra ?? []), ...it.values.map(dataAtom))
    return atom(type, parts)
  })
  const kw = new ByteWriter().u32(keyList.length)
  for (const k of keyList) {
    const v = utf8Enc.encode(k.key)
    kw.u32(8 + v.length).bytes(typeBytes(k.namespace)).bytes(v)
  }
  const out: { keys: Uint8Array; ilst: Uint8Array; mhdr?: Uint8Array } = {
    keys: fullAtom('keys', 0, 0, kw.toUint8Array()),
    ilst: atom('ilst', items),
  }
  if (q.nextItemId !== undefined) out.mhdr = fullAtom('mhdr', 0, 0, new ByteWriter(4).u32(q.nextItemId).toUint8Array())
  return out
}

/**
 * SPEC: User_data_atoms.md: '©' entries are lists of (size u16, language u16, text). Language
 * codes below 0x400 (and 0x7FFF) are Macintosh codes with Macintosh text encoding; others are
 * packed ISO 639-2/T codes with UTF-8 text, or UTF-16BE when the text starts with a BOM.
 */
export function parseUserDataText(type: string, payload: Uint8Array, w: WarningSink): UserDataText | undefined {
  const entries: UserDataText['entries'] = []
  let p = 0
  while (p + 4 <= payload.length) {
    const size = (payload[p]! << 8) | payload[p + 1]!
    const language = (payload[p + 2]! << 8) | payload[p + 3]!
    if (size < 4 || p + size > payload.length) {
      // not the international text layout (some writers store plain text here)
      if (entries.length === 0) return undefined
      w.warn('mp4-udta-text', `${type}: text entry overruns the atom`)
      break
    }
    const raw = payload.subarray(p + 4, p + size)
    entries.push({ language, text: decodeUdtaText(raw, language) })
    p += size
  }
  if (p !== payload.length && entries.length === 0) return undefined
  return { type, entries }
}

function decodeUdtaText(raw: Uint8Array, language: number): string {
  if (language < 0x400 || language === 0x7fff) return decodeMacRoman(raw)
  if (raw.length >= 2 && raw[0] === 0xfe && raw[1] === 0xff) {
    let s = ''
    for (let i = 2; i + 1 < raw.length; i += 2) s += String.fromCharCode((raw[i]! << 8) | raw[i + 1]!)
    return s
  }
  return utf8.decode(raw)
}

export function serializeUserDataText(t: UserDataText): Uint8Array {
  const parts = t.entries.map((e) => {
    // SPEC: Macintosh language codes use Macintosh text encoding (Mac Roman, M7); ISO codes use UTF-8.
    let bytes: Uint8Array
    if (e.language < 0x400 || e.language === 0x7fff) {
      const mac = encodeMacRoman(e.text)
      if (!mac) throw new MP4WriteError('mp4-udta-text', `${t.type}: "${e.text}" has characters outside Mac Roman; use an ISO language code (udtaEntry(text, 'eng'))`)
      bytes = mac
    } else bytes = utf8Enc.encode(e.text)
    if (bytes.length + 4 > 0xffff) throw new MP4WriteError('mp4-udta-text', `${t.type}: text entry too long`)
    return concat([Uint8Array.of((bytes.length + 4) >> 8, (bytes.length + 4) & 0xff, e.language >> 8, e.language & 0xff), bytes])
  })
  return atom(t.type, parts)
}

/** A user data text entry in the given ISO language ("und" when unknown). */
export function udtaEntry(text: string, language = 'und'): { language: number; text: string } {
  return { language: packLanguage(language), text }
}

