import { splitStrings } from '../../core/encoding.js'
import { TagWriteError } from '../../core/errors.js'
import { type EncodeContext, FrameReader, FrameWriter } from './context.js'
import type { InvolvedPeopleFrame, TextFrame, UrlFrame, UserTextFrame, UserUrlFrame } from './types.js'

type Fields<F> = Omit<F, 'type' | 'id' | 'flags'>

// SPEC: v2.4 frames §4.2. "All text information frames supports multiple strings, stored as a
// null separated list."  v2.3 §4.2 / v2.2 §4.2: "If the textstring is followed by a termination
// ($00 (00)) all the following information should be ignored and not be displayed."
export function decodeText(r: FrameReader): Fields<TextFrame> {
  const encoding = r.encoding()
  if (r.ctx.major === 4) {
    const values = splitStrings(r.rest(), encoding, { warnings: r.ctx.warnings, major: 4, frameId: r.ctx.frameId }, r.utf16)
    return { encoding, values }
  }
  const value = r.text(encoding)
  if (r.remaining > 0 && r.peek(r.remaining).some((b) => b !== 0)) {
    r.ctx.warnings.note('text-after-terminator', 'data after the terminator is ignored', { frameId: r.ctx.frameId })
  }
  r.rest()
  return { encoding, values: [value] }
}

function checkValues(values: readonly string[], ctx: EncodeContext): void {
  if (values.length === 0) throw new TagWriteError('text-empty', `${ctx.frameId}: a text frame needs at least one value`)
  if (ctx.major < 4 && values.length > 1) {
    throw new TagWriteError(
      'text-multi-value',
      `${ctx.frameId}: v2.${ctx.major} text frames hold one string; join values (e.g. with "/") first`,
    )
  }
}

export function encodeText(f: Fields<TextFrame>, w: FrameWriter): void {
  checkValues(f.values, w.ctx)
  w.encoding(f.encoding)
  // Values are separated by the terminator; the last one is not terminated.
  f.values.forEach((v, i) => w.text(v, f.encoding, i < f.values.length - 1))
}

// SPEC: v2.4 §4.2.6 TXXX: encoding, description <terminated>, value.
export function decodeUserText(r: FrameReader): Fields<UserTextFrame> {
  const encoding = r.encoding()
  const description = r.text(encoding)
  if (r.ctx.major === 4) {
    const values = splitStrings(r.rest(), encoding, { warnings: r.ctx.warnings, major: 4, frameId: r.ctx.frameId }, r.utf16)
    return { encoding, description, values }
  }
  const value = r.text(encoding)
  r.rest()
  return { encoding, description, values: [value] }
}

export function encodeUserText(f: Fields<UserTextFrame>, w: FrameWriter): void {
  checkValues(f.values, w.ctx)
  w.encoding(f.encoding).text(f.description, f.encoding)
  f.values.forEach((v, i) => w.text(v, f.encoding, i < f.values.length - 1))
}

// SPEC: v2.4 §4.3 URL frames: <text string> (ISO-8859-1). "If the text string is followed by a
// string termination, all the following information should be ignored."
export function decodeUrl(r: FrameReader): Fields<UrlFrame> {
  const url = r.latin1()
  r.rest()
  return { url }
}

export function encodeUrl(f: Fields<UrlFrame>, w: FrameWriter): void {
  w.latin1(f.url, false)
}

// SPEC: v2.4 §4.3.2 WXXX: encoding, description <according to encoding>, URL <ISO-8859-1>.
export function decodeUserUrl(r: FrameReader): Fields<UserUrlFrame> {
  const encoding = r.encoding()
  const description = r.text(encoding)
  const url = r.latin1()
  r.rest()
  return { encoding, description, url }
}

export function encodeUserUrl(f: Fields<UserUrlFrame>, w: FrameWriter): void {
  w.encoding(f.encoding).text(f.description, f.encoding).latin1(f.url, false)
}

// SPEC: v2.3 §4.4 IPLS / v2.2 §4.4 IPL: involvement, involvee, involvement, ... all terminated.
export function decodeInvolvedPeople(r: FrameReader): Fields<InvolvedPeopleFrame> {
  const encoding = r.encoding()
  const strings: string[] = []
  while (r.remaining > 0) {
    // a trailing run of zero bytes is padding, not an empty entry
    if (r.peek(r.remaining).every((b) => b === 0)) {
      r.rest()
      break
    }
    strings.push(r.text(encoding))
  }
  if (strings.length % 2 === 1) {
    r.warn('ipls-odd', 'involved people list has an odd number of strings')
    strings.push('')
  }
  const people: [string, string][] = []
  for (let i = 0; i < strings.length; i += 2) people.push([strings[i]!, strings[i + 1]!])
  return { encoding, people }
}

export function encodeInvolvedPeople(f: Fields<InvolvedPeopleFrame>, w: FrameWriter): void {
  w.encoding(f.encoding)
  for (const [a, b] of f.people) w.text(a, f.encoding).text(b, f.encoding)
}

/** v2.4 TMCL/TIPL: values come in pairs (instrument or function, names). */
export function textPairs(values: readonly string[]): [string, string][] {
  const out: [string, string][] = []
  for (let i = 0; i < values.length; i += 2) out.push([values[i]!, values[i + 1] ?? ''])
  return out
}

