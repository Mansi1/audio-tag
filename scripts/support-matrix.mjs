// Regenerates the frame support table in README.md, and website/data/support.json (frames, field
// mapping, genres) that the docs page renders, from the frame registry and the format mappings, so
// they cannot drift.
import { readFileSync, writeFileSync } from 'node:fs'
import {
  FRAME_DEFINITIONS,
  GENRES,
  GENRE_NONE,
  applyAIFFMetadata,
  applyFLACMetadata,
  applyMP4Metadata,
  applyMetadata,
  applyOggMetadata,
  applyRIFFMetadata,
} from '../dist/index.js'

const origin = { native: 'spec', 'chapters-addendum': 'chapters addendum', 'accessibility-addendum': 'accessibility addendum', unofficial: 'unofficial' }

function replaceBetween(text, name, content) {
  const start = `<!-- ${name}:start -->`
  const end = `<!-- ${name}:end -->`
  if (!text.includes(start)) throw new Error(`marker ${start} not found`)
  return text.replace(new RegExp(`${start}[\\s\\S]*${end}`), `${start}\n${content}\n${end}`)
}

// README: Markdown frame table
// VERIFIED: 'n/a' rather than a dash, because the README is prose-checked, and a dash in a table cell reads as a typography slip.
const cell = (d, v) => (d.ids[v] ? `\`${d.ids[v]}\`${d.sections[v] ? ` §${d.sections[v]}` : ''}` : 'n/a')
const rows = FRAME_DEFINITIONS.map((d) => `| ${d.name} | ${cell(d, 2)} | ${cell(d, 3)} | ${cell(d, 4)} | ${origin[d.origin]} |`)
const table = ['| Frame | v2.2 | v2.3 | v2.4 | Source |', '|---|---|---|---|---|', ...rows].join('\n')
writeFileSync('README.md', replaceBetween(readFileSync('README.md', 'utf8'), 'support-matrix', table))

// support.json: every frame with its IDs and spec sections per version
const frames = FRAME_DEFINITIONS.map((d) => ({
  name: d.name,
  v22: d.ids[2] ? { id: d.ids[2], section: d.sections[2] ?? null } : null,
  v23: d.ids[3] ? { id: d.ids[3], section: d.sections[3] ?? null } : null,
  v24: d.ids[4] ? { id: d.ids[4], section: d.sections[4] ?? null } : null,
  layout: d.type,
  source: origin[d.origin],
}))

// support.json: where each metadata field is written, found by applying it to an empty tag
const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
const SAMPLES = {
  title: 'x', subtitle: 'x', grouping: 'x', artist: ['x'], albumArtist: 'x', album: 'x', setSubtitle: 'x', composer: ['x'], lyricist: ['x'], conductor: 'x',
  remixer: 'x', publisher: 'x', copyright: 'x', encodedBy: 'x', encoderSettings: 'x', isrc: 'USABC1234567', language: ['eng'], mood: 'x', key: 'C', bpm: 120,
  length: 1000, track: { no: 1, of: 2 }, disc: { no: 1, of: 2 }, genre: ['Rock'], recordingTime: '2024-05-01', releaseTime: '2024-05-01',
  originalReleaseTime: '2024-05-01', encodingTime: '2024-05-01', taggingTime: '2024-05-01', comments: [{ language: 'eng', description: '', text: 'x' }],
  lyrics: [{ language: 'eng', description: '', text: 'x' }], pictures: [{ type: 3, mimeType: 'image/png', description: '', data: png }],
  ratings: [{ email: 'a@b', rating: 5 }], playCount: 1n, compilation: true, sort: { title: 'x', artist: 'x', album: 'x', albumArtist: 'x', composer: 'x' },
  userText: { '<name>': 'x' }, userUrls: { '<name>': 'https://example.com' },
}
const attempt = (f) => {
  try {
    return f()
  } catch {
    return []
  }
}
const ITUNES = '----:com.apple.iTunes:'
const id3Ids = (md, major) =>
  attempt(() => applyMetadata(undefined, md, major).frames.map((f) => (/^(TXXX|WXXX|TXX|WXX)$/.test(f.id) ? `${f.id}:${f.description}` : f.id)))
const MAPPERS = [
  ['ID3v2.4', (md) => id3Ids(md, 4)],
  ['ID3v2.3', (md) => id3Ids(md, 3)],
  ['ID3v2.2', (md) => id3Ids(md, 2)],
  ['MP4', (md) => attempt(() => applyMP4Metadata({ userData: [] }, md).itunes?.items.map((i) => (i.key.startsWith(ITUNES) ? `----:${i.key.slice(ITUNES.length)}` : i.key)) ?? [])],
  [
    'FLAC · Ogg',
    (md) =>
      attempt(() => {
        const t = applyFLACMetadata({ pictures: [] }, md)
        applyOggMetadata({ vorbis: { vendor: '', fields: [] }, pictures: [] }, md) // the same fields; throws for the same ones
        return [...new Set((t.vorbis?.fields ?? []).map((f) => f.name))].concat(t.pictures.length ? ['PICTURE block · METADATA_BLOCK_PICTURE'] : [])
      }),
  ],
  ['WAV INFO', (md) => attempt(() => applyRIFFMetadata({ info: [] }, md).tags.info.map((e) => e.id))],
  [
    'AIFF text',
    (md) =>
      attempt(() => {
        const t = applyAIFFMetadata({ name: '', author: '', copyright: '', annotations: [], comments: [] }, md).tags
        return [['name', 'NAME'], ['author', 'AUTH'], ['copyright', '(c) ']].filter(([p]) => t[p] !== '').map(([, id]) => id)
      }),
  ],
]
const mapping = {
  formats: MAPPERS.map(([name]) => name),
  rows: Object.entries(SAMPLES).map(([field, value]) => ({ field, places: MAPPERS.map(([, f]) => f({ [field]: value })) })),
}

// support.json: the ID3v1 genre list
const genreSource = {
  id3v1: 'ID3v1 (v2.4 Appendix A)',
  'winamp-v2.3-appendix': 'Winamp extension (v2.3 Appendix A)',
  'winamp-test-suite': 'Winamp, named only in the ID3v1 test suite',
}
const genres = GENRES.map((g) => ({ id: g.id, name: g.name, source: genreSource[g.source] }))

writeFileSync(
  'website/data/support.json',
  JSON.stringify({ frames, mapping, genres: { none: GENRE_NONE, list: genres } }, null, 1) + '\n',
)
