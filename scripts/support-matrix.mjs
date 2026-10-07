// Regenerates the frame support table in README.md, and the frame table, field mapping and genre
// list in website/docs.html, from the frame registry and the format mappings, so they cannot drift.
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
  applyWAVMetadata,
} from '../dist/index.js'

const origin = { native: 'spec', 'chapters-addendum': 'chapters addendum', 'accessibility-addendum': 'accessibility addendum', unofficial: 'unofficial' }

function replaceBetween(text, name, content) {
  const start = `<!-- ${name}:start -->`
  const end = `<!-- ${name}:end -->`
  if (!text.includes(start)) throw new Error(`marker ${start} not found`)
  return text.replace(new RegExp(`${start}[\\s\\S]*${end}`), `${start}\n${content}\n${end}`)
}

// README: Markdown frame table
const cell = (d, v) => (d.ids[v] ? `\`${d.ids[v]}\`${d.sections[v] ? ` §${d.sections[v]}` : ''}` : '—')
const rows = FRAME_DEFINITIONS.map((d) => `| ${d.name} | ${cell(d, 2)} | ${cell(d, 3)} | ${cell(d, 4)} | ${origin[d.origin]} |`)
const table = ['| Frame | v2.2 | v2.3 | v2.4 | Source |', '|---|---|---|---|---|', ...rows].join('\n')
writeFileSync('README.md', replaceBetween(readFileSync('README.md', 'utf8'), 'support-matrix', table))

// docs.html: the same table in HTML, with the frame layout
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const htmlCell = (d, v) => (d.ids[v] ? `<code>${d.ids[v]}</code>${d.sections[v] ? ` §${d.sections[v]}` : ''}` : '—')
const frameRows = FRAME_DEFINITIONS.map(
  (d) =>
    `            <tr class="table-row"><td class="table-cell">${esc(d.name)}</td><td class="table-cell">${htmlCell(d, 2)}</td><td class="table-cell">${htmlCell(d, 3)}</td><td class="table-cell">${htmlCell(d, 4)}</td><td class="table-cell">${d.type}</td><td class="table-cell">${origin[d.origin]}</td></tr>`,
)
const frameTable = `      <div class="table-container">
        <table class="table" id="frame-table">
          <caption class="table-caption">${FRAME_DEFINITIONS.length} frame types. § is the section of each version's spec; the layout is the frame body type in <code>src/id3v2/frames/types.ts</code>.</caption>
          <thead>
            <tr class="table-row"><th class="table-head">Frame</th><th class="table-head">v2.2</th><th class="table-head">v2.3</th><th class="table-head">v2.4</th><th class="table-head">Layout</th><th class="table-head">Source</th></tr>
          </thead>
          <tbody>
${frameRows.join('\n')}
          </tbody>
        </table>
      </div>`

// docs.html: where each metadata field is written, found by applying it to an empty tag
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
  ['WAV INFO', (md) => attempt(() => applyWAVMetadata({ info: [] }, md).tags.info.map((e) => e.id))],
  [
    'AIFF text',
    (md) =>
      attempt(() => {
        const t = applyAIFFMetadata({ name: '', author: '', copyright: '', annotations: [], comments: [] }, md).tags
        return [['name', 'NAME'], ['author', 'AUTH'], ['copyright', '(c) ']].filter(([p]) => t[p] !== '').map(([, id]) => id)
      }),
  ],
]
const mapRows = Object.entries(SAMPLES).map(([field, value]) => {
  const cells = MAPPERS.map(([, f]) => {
    const ids = f({ [field]: value })
    return ids.length ? ids.map((id) => `<code>${esc(id)}</code>`).join(' ') : '—'
  })
  return `            <tr class="table-row"><td class="table-cell"><code>${field}</code></td>${cells.map((c) => `<td class="table-cell">${c}</td>`).join('')}</tr>`
})
const mapTable = `      <div class="table-container">
        <table class="table">
          <caption class="table-caption">Found by writing each field into an empty tag with the library itself. — means the format has no place for the field and refuses it.</caption>
          <thead>
            <tr class="table-row"><th class="table-head">Field</th>${MAPPERS.map(([name]) => `<th class="table-head">${name}</th>`).join('')}</tr>
          </thead>
          <tbody>
${mapRows.join('\n')}
          </tbody>
        </table>
      </div>`

// docs.html: the ID3v1 genre list
const genreSource = {
  id3v1: 'ID3v1 (v2.4 Appendix A)',
  'winamp-v2.3-appendix': 'Winamp extension (v2.3 Appendix A)',
  'winamp-test-suite': 'Winamp, named only in the ID3v1 test suite',
}
const genreRows = GENRES.map(
  (g) => `            <tr class="table-row"><td class="table-cell" data-numeric>${g.id}</td><td class="table-cell">${esc(g.name)}</td><td class="table-cell">${genreSource[g.source]}</td></tr>`,
)
const genreTable = `      <div class="table-container">
        <table class="table" id="genre-table">
          <caption class="table-caption">${GENRES.length} genres, index 0–${GENRES.length - 1}. Index ${GENRE_NONE} means no genre.</caption>
          <thead>
            <tr class="table-row"><th class="table-head">Index</th><th class="table-head">Genre</th><th class="table-head">Defined by</th></tr>
          </thead>
          <tbody>
${genreRows.join('\n')}
          </tbody>
        </table>
      </div>`

let docs = readFileSync('website/docs.html', 'utf8')
docs = replaceBetween(docs, 'frames', frameTable)
docs = replaceBetween(docs, 'mapping', mapTable)
docs = replaceBetween(docs, 'genres', genreTable)
writeFileSync('website/docs.html', docs)
console.log(`support matrix: ${rows.length} frame definitions, ${mapRows.length} mapped fields, ${genreRows.length} genres`)
