import { genreId, genreName } from '../../id3v1/genres.js'

/** One entry of a content type (TCON / TCO) frame. */
export type ContentTypeItem =
  | { kind: 'genre'; id: number; name: string | undefined }
  | { kind: 'keyword'; value: 'RX' | 'CR' }
  | { kind: 'text'; value: string }

const KEYWORDS: Record<string, string> = { RX: 'Remix', CR: 'Cover' }

/**
 * SPEC: v2.2 §4.2.1 TCO / v2.3 §4.2.1 TCON: references "(n)" or "(RX)"/"(CR)", optionally followed
 * by a refinement; a refinement starting with "(" is written "((". Examples: "(21)",
 * "(4)Eurodisco", "(51)(39)", "((I can figure out any genre)", "(55)((I think...)".
 */
export function parseContentTypeV23(s: string): ContentTypeItem[] {
  const items: ContentTypeItem[] = []
  let i = 0
  while (s[i] === '(') {
    if (s[i + 1] === '(') break
    const j = s.indexOf(')', i)
    if (j < 0) break
    const inner = s.slice(i + 1, j)
    if (/^[0-9]+$/.test(inner)) items.push({ kind: 'genre', id: Number(inner), name: genreName(Number(inner)) })
    else if (inner === 'RX' || inner === 'CR') items.push({ kind: 'keyword', value: inner })
    else break
    i = j + 1
  }
  let rest = s.slice(i)
  if (rest.startsWith('((')) rest = rest.slice(1)
  if (rest) items.push({ kind: 'text', value: rest })
  return items
}

/**
 * SPEC: v2.4 §4.2.3 TCON: each null-separated value is an ID3v1 genre as a numeric string, the
 * keyword RX or CR, or free text. Values in the v2.3 "(n)" style are accepted too (see D9).
 */
export function parseContentType(values: readonly string[], major: 2 | 3 | 4): ContentTypeItem[] {
  if (major < 4) return values.flatMap(parseContentTypeV23)
  return values.flatMap((v): ContentTypeItem[] => {
    if (/^[0-9]+$/.test(v)) return [{ kind: 'genre', id: Number(v), name: genreName(Number(v)) }]
    if (v === 'RX' || v === 'CR') return [{ kind: 'keyword', value: v }]
    if (v.startsWith('(')) return parseContentTypeV23(v)
    return [{ kind: 'text', value: v }]
  })
}

/** Display names, e.g. ["Hip-Hop", "Remix", "Eurodisco"]. */
export function contentTypeNames(items: readonly ContentTypeItem[]): string[] {
  return items.map((it) => (it.kind === 'genre' ? (it.name ?? `(${it.id})`) : it.kind === 'keyword' ? KEYWORDS[it.value]! : it.value))
}

/**
 * Formats content type values for a version. v2.2/v2.3 produce one string ("(4)(RX)Eurodisco");
 * several free-text items are joined with "/". v2.4 produces one value per item.
 */
export function formatContentType(items: readonly ContentTypeItem[], major: 2 | 3 | 4): string[] {
  if (major === 4) return items.map((it) => (it.kind === 'genre' ? String(it.id) : it.value))
  let refs = ''
  const texts: string[] = []
  for (const it of items) {
    if (it.kind === 'genre') refs += `(${it.id})`
    else if (it.kind === 'keyword') refs += `(${it.value})`
    else texts.push(it.value)
  }
  let text = texts.join('/')
  if (text.startsWith('(')) text = `(${text}`
  return [refs + text]
}

/** Builds content type items from genre names, using ID3v1 numbers where a name is in the list. */
export function contentTypeFromNames(names: readonly string[]): ContentTypeItem[] {
  return names.map((n): ContentTypeItem => {
    const id = genreId(n)
    if (id !== undefined) return { kind: 'genre', id, name: genreName(id) }
    if (n === 'RX' || n === 'CR') return { kind: 'keyword', value: n }
    return { kind: 'text', value: n }
  })
}

/** SPEC: TRCK "4/9", TPOS "1/2". */
export function parsePosition(s: string): { number?: number; total?: number } {
  const m = /^\s*([0-9]*)\s*(?:\/\s*([0-9]*))?\s*$/.exec(s)
  if (!m) return {}
  const out: { number?: number; total?: number } = {}
  if (m[1]) out.number = Number(m[1])
  if (m[2]) out.total = Number(m[2])
  return out
}

export function formatPosition(number: number, total?: number): string {
  return total === undefined ? String(number) : `${number}/${total}`
}

export interface Timestamp {
  year: number
  month?: number
  day?: number
  hour?: number
  minute?: number
  second?: number
}

/**
 * SPEC: v2.4 structure §4: yyyy, yyyy-MM, yyyy-MM-dd, yyyy-MM-ddTHH, yyyy-MM-ddTHH:mm and
 * yyyy-MM-ddTHH:mm:ss, all UTC.
 */
export function parseTimestamp(s: string): Timestamp | undefined {
  const m = /^([0-9]{4})(?:-([0-9]{2})(?:-([0-9]{2})(?:T([0-9]{2})(?::([0-9]{2})(?::([0-9]{2}))?)?)?)?)?$/.exec(s)
  if (!m) return undefined
  const t: Timestamp = { year: Number(m[1]) }
  const keys = ['month', 'day', 'hour', 'minute', 'second'] as const
  const limits = [
    [1, 12],
    [1, 31],
    [0, 23],
    [0, 59],
    [0, 59],
  ] as const
  for (let i = 0; i < keys.length; i++) {
    const v = m[i + 2]
    if (v === undefined) break
    const n = Number(v)
    if (n < limits[i]![0] || n > limits[i]![1]) return undefined
    t[keys[i]!] = n
  }
  return t
}

export function formatTimestamp(t: Timestamp): string {
  const p = (n: number) => String(n).padStart(2, '0')
  let s = String(t.year).padStart(4, '0')
  if (t.month === undefined) return s
  s += `-${p(t.month)}`
  if (t.day === undefined) return s
  s += `-${p(t.day)}`
  if (t.hour === undefined) return s
  s += `T${p(t.hour)}`
  if (t.minute === undefined) return s
  s += `:${p(t.minute)}`
  if (t.second === undefined) return s
  return `${s}:${p(t.second)}`
}

/** SPEC: TKEY "A"-"G", halfkeys "b" and "#", minor "m", off key "o"; at most three characters. */
export function isValidKey(s: string): boolean {
  return /^(?:[A-G][b#]?m?|o)$/.test(s)
}

/** SPEC: TMED / TMT "(CD/A)", "(VID/PAL/VHS)", "(MC) with four channels"; v2.4 drops the parentheses. */
export function parseMediaType(value: string): { references: string[]; refinement?: string } {
  const items = parseParenRefs(value)
  if (items.references.length || value.startsWith('(')) return items
  // v2.4 style: a bare reference such as "VID/PAL/VHS"
  const head = value.split('/')[0]!
  return head in MEDIA_PREFIXES ? { references: [value] } : { references: [], refinement: value }
}

const MEDIA_PREFIXES: Record<string, true> = Object.fromEntries(
  ['DIG', 'ANA', 'CD', 'LD', 'TT', 'MD', 'DAT', 'DCC', 'DVD', 'TV', 'VID', 'RAD', 'TEL', 'MC', 'REE'].map((k) => [k, true]),
)

function parseParenRefs(s: string): { references: string[]; refinement?: string } {
  const references: string[] = []
  let i = 0
  while (s[i] === '(' && s[i + 1] !== '(') {
    const j = s.indexOf(')', i)
    if (j < 0) break
    references.push(s.slice(i + 1, j))
    i = j + 1
  }
  let rest = s.slice(i)
  if (rest.startsWith('((')) rest = rest.slice(1)
  return rest ? { references, refinement: rest } : { references }
}

/** SPEC: TCOP/TPRO: "must be preceded with "Copyright " (C) " " / "Produced " (P) " " when displayed. */
export function displayCopyright(value: string, kind: 'TCOP' | 'TPRO' = 'TCOP'): string {
  return kind === 'TCOP' ? `Copyright © ${value}` : `Produced ℗ ${value}`
}

/** iTunNORM comment (spec/id3v2/extensions/iTunes-Normalization-settings.md): 10 hex values. */
export function parseITunNorm(text: string): number[] | undefined {
  const parts = text.trim().split(/\s+/)
  if (parts.length !== 10 || !parts.every((p) => /^[0-9A-Fa-f]{8}$/.test(p))) return undefined
  return parts.map((p) => parseInt(p, 16))
}

export function formatITunNorm(values: readonly number[]): string {
  return values.map((v) => ` ${(v >>> 0).toString(16).toUpperCase().padStart(8, '0')}`).join('')
}
