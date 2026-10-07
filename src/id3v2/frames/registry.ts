import type { MajorVersion } from '../../core/encoding.js'
import * as A from './codecs-addenda.js'
import * as U from './codecs-audio.js'
import * as C from './codecs-content.js'
import * as M from './codecs-misc.js'
import * as T from './codecs-text.js'
import type { FrameReader, FrameWriter } from './context.js'
import type { Frame, FrameType } from './types.js'

type Body = Record<string, unknown>
interface Codec {
  decode(r: FrameReader): Body
  encode(f: never, w: FrameWriter): void
}

/** How the spec limits repeats of a frame within one tag. */
export type Uniqueness =
  /** "There may only be one ... frame in each tag." */
  | { kind: 'single' }
  /** "... but only one with the same <key>." */
  | { kind: 'key'; describe: string; key: (f: Frame) => string }
  /** "... but not with the same content" / "no two may be identical". */
  | { kind: 'content' }
  /** No restriction stated. */
  | { kind: 'none' }

export type Origin = 'native' | 'chapters-addendum' | 'accessibility-addendum' | 'unofficial'

export interface FrameDefinition {
  type: Exclude<FrameType, 'unknown' | 'undecodable'>
  ids: { 2?: string; 3?: string; 4?: string }
  name: string
  /** Spec section per version, e.g. "4.2.1". */
  sections: { 2?: string; 3?: string; 4?: string }
  origin: Origin
  /** Default status flags class (v2.3 §3.3.2, v2.4 frames §3): 3 = discard if the file is altered. */
  flagClass: 3 | 4
  uniqueness: { 2?: Uniqueness; 3?: Uniqueness; 4?: Uniqueness; all?: Uniqueness }
}

const CODECS: Record<FrameDefinition['type'], Codec> = {
  text: { decode: T.decodeText, encode: T.encodeText },
  'user-text': { decode: T.decodeUserText, encode: T.encodeUserText },
  url: { decode: T.decodeUrl, encode: T.encodeUrl },
  'user-url': { decode: T.decodeUserUrl, encode: T.encodeUserUrl },
  'involved-people': { decode: T.decodeInvolvedPeople, encode: T.encodeInvolvedPeople },
  ufid: { decode: C.decodeUfid, encode: C.encodeUfid },
  mcdi: { decode: C.decodeMcdi, encode: C.encodeMcdi },
  etco: { decode: C.decodeEtco, encode: C.encodeEtco },
  mllt: { decode: C.decodeMllt, encode: C.encodeMllt },
  sytc: { decode: C.decodeSytc, encode: C.encodeSytc },
  uslt: { decode: C.decodeUslt, encode: C.encodeUslt },
  sylt: { decode: C.decodeSylt, encode: C.encodeSylt },
  comment: { decode: C.decodeComment, encode: C.encodeComment },
  user: { decode: C.decodeUser, encode: C.encodeUser },
  owne: { decode: C.decodeOwne, encode: C.encodeOwne },
  comr: { decode: C.decodeComr, encode: C.encodeComr },
  rvad: { decode: U.decodeRvad, encode: U.encodeRvad },
  rva2: { decode: U.decodeRva2, encode: U.encodeRva2 },
  equa: { decode: U.decodeEqua, encode: U.encodeEqua },
  equ2: { decode: U.decodeEqu2, encode: U.encodeEqu2 },
  rvrb: { decode: U.decodeRvrb, encode: U.encodeRvrb },
  picture: { decode: M.decodePicture, encode: M.encodePicture },
  geob: { decode: M.decodeGeob, encode: M.encodeGeob },
  pcnt: { decode: M.decodePcnt, encode: M.encodePcnt },
  popm: { decode: M.decodePopm, encode: M.encodePopm },
  rbuf: { decode: M.decodeRbuf, encode: M.encodeRbuf },
  aenc: { decode: M.decodeAenc, encode: M.encodeAenc },
  crm: { decode: M.decodeCrm, encode: M.encodeCrm },
  link: { decode: M.decodeLink, encode: M.encodeLink },
  poss: { decode: M.decodePoss, encode: M.encodePoss },
  encr: { decode: M.decodeEncr, encode: M.encodeEncr },
  grid: { decode: M.decodeGrid, encode: M.encodeGrid },
  priv: { decode: M.decodePriv, encode: M.encodePriv },
  sign: { decode: M.decodeSign, encode: M.encodeSign },
  seek: { decode: M.decodeSeek, encode: M.encodeSeek },
  aspi: { decode: M.decodeAspi, encode: M.encodeAspi },
  chap: { decode: A.decodeChap, encode: A.encodeChap },
  ctoc: { decode: A.decodeCtoc, encode: A.encodeCtoc },
  atxt: { decode: A.decodeAtxt, encode: A.encodeAtxt },
  rgad: { decode: A.decodeRgad, encode: A.encodeRgad },
}

export function codecFor(type: FrameDefinition['type']): Codec {
  return CODECS[type]
}

const single: Uniqueness = { kind: 'single' }
const content: Uniqueness = { kind: 'content' }
const none: Uniqueness = { kind: 'none' }
const by = (describe: string, key: (f: never) => string): Uniqueness => ({ kind: 'key', describe, key: key as (f: Frame) => string })
const langDesc = by('language and content descriptor', (f: { language: string; description: string }) => `${f.language}\0${f.description}`)
const desc = by('description', (f: { description: string }) => f.description)
const owner = by('owner identifier', (f: { owner: string }) => f.owner)

const DEFS: FrameDefinition[] = []

function add(
  type: FrameDefinition['type'],
  ids: [v22: string | null, v23: string | null, v24: string | null],
  name: string,
  sections: [string | null, string | null, string | null],
  opts: { uniqueness?: FrameDefinition['uniqueness']; flagClass?: 3 | 4; origin?: Origin } = {},
): void {
  const d: FrameDefinition = {
    type,
    ids: {},
    name,
    sections: {},
    origin: opts.origin ?? 'native',
    flagClass: opts.flagClass ?? 4,
    uniqueness: opts.uniqueness ?? { all: single },
  }
  ;([2, 3, 4] as const).forEach((v, i) => {
    if (ids[i]) d.ids[v] = ids[i]!
    if (sections[i]) d.sections[v] = sections[i]!
  })
  DEFS.push(d)
}

// --- Text information frames: v2.2 §4.2.1, v2.3 §4.2.1, v2.4 §4.2.1-4.2.5 -----------------------
const text = (ids: [string | null, string | null, string | null], name: string, s4: string | null, flagClass: 3 | 4 = 4) =>
  add('text', ids, name, [ids[0] ? '4.2.1' : null, ids[1] ? '4.2.1' : null, ids[2] ? s4 : null], { flagClass })

text(['TT1', 'TIT1', 'TIT1'], 'Content group description', '4.2.1')
text(['TT2', 'TIT2', 'TIT2'], 'Title/songname/content description', '4.2.1')
text(['TT3', 'TIT3', 'TIT3'], 'Subtitle/Description refinement', '4.2.1')
text(['TAL', 'TALB', 'TALB'], 'Album/Movie/Show title', '4.2.1')
text(['TOT', 'TOAL', 'TOAL'], 'Original album/movie/show title', '4.2.1')
text(['TRK', 'TRCK', 'TRCK'], 'Track number/Position in set', '4.2.1')
text(['TPA', 'TPOS', 'TPOS'], 'Part of a set', '4.2.1')
text([null, null, 'TSST'], 'Set subtitle', '4.2.1')
text(['TRC', 'TSRC', 'TSRC'], 'ISRC (international standard recording code)', '4.2.1')
text(['TP1', 'TPE1', 'TPE1'], 'Lead performer(s)/Soloist(s)', '4.2.2')
text(['TP2', 'TPE2', 'TPE2'], 'Band/orchestra/accompaniment', '4.2.2')
text(['TP3', 'TPE3', 'TPE3'], 'Conductor/performer refinement', '4.2.2')
text(['TP4', 'TPE4', 'TPE4'], 'Interpreted, remixed, or otherwise modified by', '4.2.2')
text(['TOA', 'TOPE', 'TOPE'], 'Original artist(s)/performer(s)', '4.2.2')
text(['TXT', 'TEXT', 'TEXT'], 'Lyricist/Text writer', '4.2.2')
text(['TOL', 'TOLY', 'TOLY'], 'Original lyricist(s)/text writer(s)', '4.2.2')
text(['TCM', 'TCOM', 'TCOM'], 'Composer', '4.2.2')
text([null, null, 'TMCL'], 'Musician credits list', '4.2.2')
text([null, null, 'TIPL'], 'Involved people list', '4.2.2')
text(['TEN', 'TENC', 'TENC'], 'Encoded by', '4.2.2', 3)
text(['TBP', 'TBPM', 'TBPM'], 'BPM (beats per minute)', '4.2.3')
text(['TLE', 'TLEN', 'TLEN'], 'Length', '4.2.3', 3)
text(['TKE', 'TKEY', 'TKEY'], 'Initial key', '4.2.3')
text(['TLA', 'TLAN', 'TLAN'], 'Language(s)', '4.2.3')
text(['TCO', 'TCON', 'TCON'], 'Content type', '4.2.3')
text(['TFT', 'TFLT', 'TFLT'], 'File type', '4.2.3')
text(['TMT', 'TMED', 'TMED'], 'Media type', '4.2.3')
text([null, null, 'TMOO'], 'Mood', '4.2.3')
text(['TCR', 'TCOP', 'TCOP'], 'Copyright message', '4.2.4')
text([null, null, 'TPRO'], 'Produced notice', '4.2.4')
text(['TPB', 'TPUB', 'TPUB'], 'Publisher', '4.2.4')
text([null, 'TOWN', 'TOWN'], 'File owner/licensee', '4.2.4')
text([null, 'TRSN', 'TRSN'], 'Internet radio station name', '4.2.4')
text([null, 'TRSO', 'TRSO'], 'Internet radio station owner', '4.2.4')
text(['TOF', 'TOFN', 'TOFN'], 'Original filename', '4.2.5')
text(['TDY', 'TDLY', 'TDLY'], 'Playlist delay', '4.2.5')
text([null, null, 'TDEN'], 'Encoding time', '4.2.5')
text([null, null, 'TDOR'], 'Original release time', '4.2.5')
text([null, null, 'TDRC'], 'Recording time', '4.2.5')
text([null, null, 'TDRL'], 'Release time', '4.2.5')
text([null, null, 'TDTG'], 'Tagging time', '4.2.5')
text(['TSS', 'TSSE', 'TSSE'], 'Software/Hardware and settings used for encoding', '4.2.5')
text([null, null, 'TSOA'], 'Album sort order', '4.2.5')
text([null, null, 'TSOP'], 'Performer sort order', '4.2.5')
text([null, null, 'TSOT'], 'Title sort order', '4.2.5')
// v2.2/v2.3 only (deprecated in v2.4, changes §4)
text(['TYE', 'TYER', null], 'Year', null)
text(['TDA', 'TDAT', null], 'Date', null)
text(['TIM', 'TIME', null], 'Time', null)
text(['TOR', 'TORY', null], 'Original release year', null)
text(['TRD', 'TRDA', null], 'Recording dates', null)
text(['TSI', 'TSIZ', null], 'Size', null, 3)

add('user-text', ['TXX', 'TXXX', 'TXXX'], 'User defined text information frame', ['4.2.2', '4.2.2', '4.2.6'], {
  uniqueness: { all: desc },
})

// --- URL link frames: v2.2 §4.3, v2.3 §4.3, v2.4 §4.3 ----------------------------------------------
const url = (ids: [string | null, string | null, string | null], name: string, u: FrameDefinition['uniqueness'] = { all: single }) =>
  add('url', ids, name, [ids[0] ? '4.3.1' : null, ids[1] ? '4.3.1' : null, ids[2] ? '4.3.1' : null], { uniqueness: u })
// SPEC: v2.3/v2.4 allow several WCOM/WOAR "but not with the same content"; v2.2 states no limit.
const severalDistinct = { 2: none, 3: content, 4: content }
url(['WCM', 'WCOM', 'WCOM'], 'Commercial information', severalDistinct)
url(['WCP', 'WCOP', 'WCOP'], 'Copyright/Legal information')
url(['WAF', 'WOAF', 'WOAF'], 'Official audio file webpage')
url(['WAR', 'WOAR', 'WOAR'], 'Official artist/performer webpage', severalDistinct)
url(['WAS', 'WOAS', 'WOAS'], 'Official audio source webpage')
url([null, 'WORS', 'WORS'], 'Official Internet radio station homepage')
url([null, 'WPAY', 'WPAY'], 'Payment')
url(['WPB', 'WPUB', 'WPUB'], 'Publishers official webpage')
add('user-url', ['WXX', 'WXXX', 'WXXX'], 'User defined URL link frame', ['4.3.2', '4.3.2', '4.3.2'], { uniqueness: { all: desc } })

// --- Other native frames ---------------------------------------------------------------------------
add('involved-people', ['IPL', 'IPLS', null], 'Involved people list', ['4.4', '4.4', null])
add('ufid', ['UFI', 'UFID', 'UFID'], 'Unique file identifier', ['4.1', '4.1', '4.1'], { uniqueness: { all: owner } })
add('mcdi', ['MCI', 'MCDI', 'MCDI'], 'Music CD identifier', ['4.5', '4.5', '4.4'])
add('etco', ['ETC', 'ETCO', 'ETCO'], 'Event timing codes', ['4.6', '4.6', '4.5'], { flagClass: 3 })
add('mllt', ['MLL', 'MLLT', 'MLLT'], 'MPEG location lookup table', ['4.7', '4.7', '4.6'], { flagClass: 3 })
add('sytc', ['STC', 'SYTC', 'SYTC'], 'Synchronised tempo codes', ['4.8', '4.8', '4.7'], { flagClass: 3 })
add('uslt', ['ULT', 'USLT', 'USLT'], 'Unsynchronised lyrics/text transcription', ['4.9', '4.9', '4.8'], { uniqueness: { all: langDesc } })
add('sylt', ['SLT', 'SYLT', 'SYLT'], 'Synchronised lyrics/text', ['4.10', '4.10', '4.9'], { uniqueness: { all: langDesc }, flagClass: 3 })
add('comment', ['COM', 'COMM', 'COMM'], 'Comments', ['4.11', '4.11', '4.10'], { uniqueness: { all: langDesc } })
add('rvad', ['RVA', 'RVAD', null], 'Relative volume adjustment', ['4.12', '4.12', null], { flagClass: 3 })
add('rva2', [null, null, 'RVA2'], 'Relative volume adjustment (2)', [null, null, '4.11'], {
  uniqueness: { all: by('identification', (f: { identification: string }) => f.identification) },
  flagClass: 3,
})
add('equa', ['EQU', 'EQUA', null], 'Equalisation', ['4.13', '4.13', null], { flagClass: 3 })
add('equ2', [null, null, 'EQU2'], 'Equalisation (2)', [null, null, '4.12'], {
  uniqueness: { all: by('identification', (f: { identification: string }) => f.identification) },
  flagClass: 3,
})
add('rvrb', ['REV', 'RVRB', 'RVRB'], 'Reverb', ['4.14', '4.14', '4.13'])
add('picture', ['PIC', 'APIC', 'APIC'], 'Attached picture', ['4.15', '4.15', '4.14'], { uniqueness: { all: desc } })
add('geob', ['GEO', 'GEOB', 'GEOB'], 'General encapsulated object', ['4.16', '4.16', '4.15'], { uniqueness: { all: desc } })
add('pcnt', ['CNT', 'PCNT', 'PCNT'], 'Play counter', ['4.17', '4.17', '4.16'])
add('popm', ['POP', 'POPM', 'POPM'], 'Popularimeter', ['4.18', '4.18', '4.17'], {
  uniqueness: { all: by('email', (f: { email: string }) => f.email) },
})
add('rbuf', ['BUF', 'RBUF', 'RBUF'], 'Recommended buffer size', ['4.19', '4.19', '4.18'])
add('crm', ['CRM', null, null], 'Encrypted meta frame', ['4.20', null, null], { uniqueness: { all: owner } })
add('aenc', ['CRA', 'AENC', 'AENC'], 'Audio encryption', ['4.21', '4.20', '4.19'], { uniqueness: { all: owner }, flagClass: 3 })
add('link', ['LNK', 'LINK', 'LINK'], 'Linked information', ['4.22', '4.21', '4.20'], { uniqueness: { all: content } })
add('poss', [null, 'POSS', 'POSS'], 'Position synchronisation frame', [null, '4.22', '4.21'], { flagClass: 3 })
add('user', [null, 'USER', 'USER'], 'Terms of use', [null, '4.23', '4.22'], {
  // SPEC: v2.3 "There may only be one USER frame"; v2.4 "only one with the same 'Language'".
  uniqueness: { 3: single, 4: by('language', (f: { language: string }) => f.language) },
})
add('owne', [null, 'OWNE', 'OWNE'], 'Ownership frame', [null, '4.24', '4.23'])
// SPEC: v2.3 states no limit for COMR; v2.4 adds "no two may be identical".
add('comr', [null, 'COMR', 'COMR'], 'Commercial frame', [null, '4.25', '4.24'], { uniqueness: { 3: none, 4: content } })
add('encr', [null, 'ENCR', 'ENCR'], 'Encryption method registration', [null, '4.26', '4.25'], { uniqueness: { all: owner } })
add('grid', [null, 'GRID', 'GRID'], 'Group identification registration', [null, '4.27', '4.26'], { uniqueness: { all: owner } })
add('priv', [null, 'PRIV', 'PRIV'], 'Private frame', [null, '4.28', '4.27'], { uniqueness: { all: content } })
add('sign', [null, null, 'SIGN'], 'Signature frame', [null, null, '4.28'], { uniqueness: { all: content } })
add('seek', [null, null, 'SEEK'], 'Seek frame', [null, null, '4.29'], { flagClass: 3 })
add('aspi', [null, null, 'ASPI'], 'Audio seek point index', [null, null, '4.30'], { flagClass: 3 })

// --- Addenda (v2.3 and v2.4) -----------------------------------------------------------------------
const elementId = by('element ID', (f: { elementId: string }) => f.elementId)
add('chap', [null, 'CHAP', 'CHAP'], 'Chapter', [null, '3.1', '3.1'], { origin: 'chapters-addendum', uniqueness: { all: elementId } })
add('ctoc', [null, 'CTOC', 'CTOC'], 'Table of contents', [null, '3.2', '3.2'], { origin: 'chapters-addendum', uniqueness: { all: elementId } })
add('atxt', [null, 'ATXT', 'ATXT'], 'Audio-text', [null, '4', '4'], {
  origin: 'accessibility-addendum',
  uniqueness: { all: by('equivalent text', (f: { equivalentText: string }) => f.equivalentText) },
})

// --- Unofficial frames seen in the wild (spec/id3/Developer-Information.md) ----------------------
const unofficialText = (ids: [string | null, string | null, string | null], name: string) =>
  add('text', ids, name, [null, null, null], { origin: 'unofficial' })
unofficialText(['TCP', 'TCMP', 'TCMP'], 'iTunes compilation flag')
unofficialText(['TS2', 'TSO2', 'TSO2'], 'iTunes album artist sort order')
unofficialText(['TSC', 'TSOC', 'TSOC'], 'iTunes composer sort order')
// iTunes v2.2/v2.3 equivalents of the v2.4 sort order frames (spec/id3v2/extensions/iTunes.md)
unofficialText(['TST', 'TSOT', 'TSOT'], 'iTunes title sort order')
unofficialText(['TSP', 'TSOP', 'TSOP'], 'iTunes performer sort order')
unofficialText(['TSA', 'TSOA', 'TSOA'], 'iTunes album sort order')
add('rva2', [null, 'XRVA', null], 'Experimental RVA2', [null, null, null], {
  origin: 'unofficial',
  flagClass: 3,
  uniqueness: { all: by('identification', (f: { identification: string }) => f.identification) },
})
add('rgad', [null, 'RGAD', 'RGAD'], 'Replay Gain Adjustment', [null, null, null], { origin: 'unofficial', flagClass: 3 })

export const FRAME_DEFINITIONS: readonly FrameDefinition[] = DEFS

const BY_ID: Record<MajorVersion, Map<string, FrameDefinition>> = { 2: new Map(), 3: new Map(), 4: new Map() }
for (const d of DEFS) {
  for (const v of [2, 3, 4] as const) {
    const id = d.ids[v]
    // the first definition wins, so a native v2.4 TSOT is not shadowed by the iTunes v2.3 entry
    if (id && !BY_ID[v].has(id)) BY_ID[v].set(id, d)
  }
}

/** The definition of a frame ID in a version, including family fallbacks for T*** and W***. */
export function getDefinition(id: string, major: MajorVersion): FrameDefinition | undefined {
  const d = BY_ID[major].get(id)
  if (d) return d
  // SPEC: v2.4 §4.2 "All text frame identifiers begin with T"; §4.3 URL frames begin with "W".
  if (id[0] === 'T') return FALLBACK_TEXT
  if (id[0] === 'W') return FALLBACK_URL
  return undefined
}

const FALLBACK_TEXT: FrameDefinition = {
  type: 'text',
  ids: {},
  name: 'Text information frame',
  sections: {},
  origin: 'native',
  flagClass: 4,
  uniqueness: { all: single },
}
const FALLBACK_URL: FrameDefinition = { ...FALLBACK_TEXT, type: 'url', name: 'URL link frame' }

/** The IDs declared for a version (native, addenda and unofficial frames). */
export function declaredIds(major: MajorVersion, origins: readonly Origin[] = ['native']): string[] {
  return DEFS.filter((d) => d.ids[major] && origins.includes(d.origin)).map((d) => d.ids[major]!)
}

/** Maps a frame ID to the equivalent ID in another version, when one exists. */
export function mapFrameId(id: string, from: MajorVersion, to: MajorVersion): string | undefined {
  // several definitions may share an ID (e.g. native v2.4 TSOT and the iTunes v2.2 TST/v2.3 TSOT)
  for (const d of DEFS) if (d.ids[from] === id && d.ids[to]) return d.ids[to]
  if (BY_ID[from].has(id)) return undefined
  return from !== 2 && to !== 2 ? id : undefined // unknown 4-character IDs carry over
}

export function uniquenessOf(d: FrameDefinition, major: MajorVersion): Uniqueness {
  return d.uniqueness[major] ?? d.uniqueness.all ?? none
}

/** Default status flags for a new frame (v2.3 §3.3.2, v2.4 frames §3). */
export function defaultDiscardOnFileAlter(id: string, major: MajorVersion): boolean {
  return getDefinition(id, major)?.flagClass === 3
}
