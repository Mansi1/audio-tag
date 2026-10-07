// Enumerations copied from the specs. Where a version extends a table, the version is noted.

/** SPEC: APIC/PIC picture type (v2.4 §4.14, v2.3 §4.15, v2.2 §4.15). */
export const PICTURE_TYPES: readonly string[] = [
  'Other',
  "32x32 pixels 'file icon' (PNG only)",
  'Other file icon',
  'Cover (front)',
  'Cover (back)',
  'Leaflet page',
  'Media (e.g. label side of CD)',
  'Lead artist/lead performer/soloist',
  'Artist/performer',
  'Conductor',
  'Band/Orchestra',
  'Composer',
  'Lyricist/text writer',
  'Recording Location',
  'During recording',
  'During performance',
  'Movie/video screen capture',
  'A bright coloured fish',
  'Illustration',
  'Band/artist logotype',
  'Publisher/Studio logotype',
]

/** SPEC: ETCO event types. v2.2 §4.6 defines $00-$0D, v2.3 §4.6 up to $14, v2.4 §4.5 up to $16. */
const ETCO_V22 = [
  'padding (has no meaning)',
  'end of initial silence',
  'intro start',
  'mainpart start',
  'outro start',
  'outro end',
  'verse begins',
  'refrain begins',
  'interlude',
  'theme start',
  'variation',
  'key change',
  'time change',
  'unwanted noise (Snap, Crackle & Pop)',
]
const ETCO_V23 = [
  'padding (has no meaning)',
  'end of initial silence',
  'intro start',
  'mainpart start',
  'outro start',
  'outro end',
  'verse start',
  'refrain start',
  'interlude start',
  'theme start',
  'variation start',
  'key change',
  'time change',
  'momentary unwanted noise (Snap, Crackle & Pop)',
  'sustained noise',
  'sustained noise end',
  'intro end',
  'mainpart end',
  'verse end',
  'refrain end',
  'theme end',
]
const ETCO_V24 = [...ETCO_V23.slice(0, 3), 'main part start', ...ETCO_V23.slice(4, 17), 'main part end', ...ETCO_V23.slice(18), 'profanity', 'profanity end']

export function etcoEventName(type: number, major: 2 | 3 | 4): string | undefined {
  const table = major === 2 ? ETCO_V22 : major === 3 ? ETCO_V23 : ETCO_V24
  if (type < table.length) return table[type]
  if (type >= 0xe0 && type <= 0xef) return `not predefined synch ${(type - 0xe0).toString(16).toUpperCase()}`
  if (type === 0xfd) return 'audio end (start of silence)'
  if (type === 0xfe) return 'audio file ends'
  return undefined // reserved for future use
}

/** SPEC: SYLT content type. v2.2 $00-$05, v2.3 $00-$06, v2.4 $00-$08. */
export const SYLT_CONTENT_TYPES: readonly string[] = [
  'other',
  'lyrics',
  'text transcription',
  'movement/part name',
  'events',
  'chord',
  'trivia/pop up information',
  'URLs to webpages',
  'URLs to images',
]
export const SYLT_CONTENT_TYPE_MAX = { 2: 5, 3: 6, 4: 8 } as const

/** SPEC: RVA2 type of channel (v2.4 §4.11). */
export const RVA2_CHANNEL_TYPES: readonly string[] = [
  'Other',
  'Master volume',
  'Front right',
  'Front left',
  'Back right',
  'Back left',
  'Front centre',
  'Back centre',
  'Subwoofer',
]

/** SPEC: COMR 'received as' (v2.4 §4.24, v2.3 §4.25). */
export const COMR_RECEIVED_AS: readonly string[] = [
  'Other',
  'Standard CD album with other songs',
  'Compressed audio on CD',
  'File over the Internet',
  'Stream over the Internet',
  'As note sheets',
  'As note sheets in a book with other sheets',
  'Music on other media',
  'Non-musical merchandise',
]

/** SPEC: time stamp format for ETCO, SYTC, SYLT and POSS. */
export const TIMESTAMP_FORMATS = { 1: 'MPEG frames', 2: 'milliseconds' } as const

/** SPEC: TFLT file types (v2.4 §4.2.3; v2.3 lacks MIME; v2.2 TFT lacks VQF, PCM and MIME). */
export const FILE_TYPES: Record<string, { name: string; refinements?: Record<string, string>; versions: (2 | 3 | 4)[] }> = {
  MIME: { name: 'MIME type follows', versions: [4] },
  MPG: {
    name: 'MPEG Audio',
    refinements: { '1': 'MPEG 1/2 layer I', '2': 'MPEG 1/2 layer II', '3': 'MPEG 1/2 layer III', '2.5': 'MPEG 2.5', AAC: 'Advanced audio compression' },
    versions: [2, 3, 4],
  },
  VQF: { name: 'Transform-domain Weighted Interleave Vector Quantisation', versions: [3, 4] },
  PCM: { name: 'Pulse Code Modulated audio', versions: [3, 4] },
}

/** SPEC: TMED media types (v2.4 §4.2.3, v2.3 §4.2.1, v2.2 TMT). LD/A is absent in v2.4. */
export const MEDIA_TYPES: Record<string, { name: string; refinements: Record<string, string> }> = {
  DIG: { name: 'Other digital media', refinements: { A: 'Analogue transfer from media' } },
  ANA: { name: 'Other analogue media', refinements: { WAC: 'Wax cylinder', '8CA': '8-track tape cassette' } },
  CD: { name: 'CD', refinements: { A: 'Analogue transfer from media', DD: 'DDD', AD: 'ADD', AA: 'AAD' } },
  LD: { name: 'Laserdisc', refinements: { A: 'Analogue transfer from media' } },
  TT: {
    name: 'Turntable records',
    refinements: { '33': '33.33 rpm', '45': '45 rpm', '71': '71.29 rpm', '76': '76.59 rpm', '78': '78.26 rpm', '80': '80 rpm' },
  },
  MD: { name: 'MiniDisc', refinements: { A: 'Analogue transfer from media' } },
  DAT: {
    name: 'DAT',
    refinements: {
      A: 'Analogue transfer from media',
      '1': 'standard, 48 kHz/16 bits, linear',
      '2': 'mode 2, 32 kHz/16 bits, linear',
      '3': 'mode 3, 32 kHz/12 bits, non-linear, low speed',
      '4': 'mode 4, 32 kHz/12 bits, 4 channels',
      '5': 'mode 5, 44.1 kHz/16 bits, linear',
      '6': "mode 6, 44.1 kHz/16 bits, 'wide track' play",
    },
  },
  DCC: { name: 'DCC', refinements: { A: 'Analogue transfer from media' } },
  DVD: { name: 'DVD', refinements: { A: 'Analogue transfer from media' } },
  TV: { name: 'Television', refinements: { PAL: 'PAL', NTSC: 'NTSC', SECAM: 'SECAM' } },
  VID: { name: 'Video', refinements: { PAL: 'PAL', NTSC: 'NTSC', SECAM: 'SECAM', VHS: 'VHS', SVHS: 'S-VHS', BETA: 'BETAMAX' } },
  RAD: { name: 'Radio', refinements: { FM: 'FM', AM: 'AM', LW: 'LW', MW: 'MW' } },
  TEL: { name: 'Telephone', refinements: { I: 'ISDN' } },
  MC: {
    name: 'MC (normal cassette)',
    refinements: {
      '4': '4.75 cm/s (normal speed for a two sided cassette)',
      '9': '9.5 cm/s',
      I: 'Type I cassette (ferric/normal)',
      II: 'Type II cassette (chrome)',
      III: 'Type III cassette (ferric chrome)',
      IV: 'Type IV cassette (metal)',
    },
  },
  REE: {
    name: 'Reel',
    refinements: {
      '9': '9.5 cm/s',
      '19': '19 cm/s',
      '38': '38 cm/s',
      '76': '76 cm/s',
      I: 'Type I cassette (ferric/normal)',
      II: 'Type II cassette (chrome)',
      III: 'Type III cassette (ferric chrome)',
      IV: 'Type IV cassette (metal)',
    },
  },
}
