// Pieces of the docs page that are data or code rather than prose (server only). The frame and genre
// tables are hydrated DataTables for their filter boxes; the rest is static. VERIFIED: the code examples
// live here as strings, so the page needs no escaping of braces and code.
import support from "../data/support.json";
import { buildInfo as info } from "./build-info.ts";
import { DataTable } from "../components/data-table.tsx";

const version = (v: { id: string; section: string | null } | null) => (v ? `${v.id}${v.section ? ` §${v.section}` : ""}` : "n/a");

export function FrameTable() {
  return (
    <DataTable
      id="frame-table"
      caption={`${support.frames.length} frame types. § is the section of each version's spec; the layout is the frame body type in src/id3v2/frames/types.ts.`}
      columns={["Frame", "v2.2", "v2.3", "v2.4", "Layout", "Source"]}
      rows={support.frames.map((f) => [f.name, version(f.v22), version(f.v23), version(f.v24), f.layout, f.source])}
      placeholder="Filter: TIT2, picture, chapter, unofficial ..."
    />
  );
}

export function GenreTable() {
  const { list, none } = support.genres;
  return (
    <DataTable
      id="genre-table"
      caption={`${list.length} genres, index 0 to ${list.length - 1}. Index ${none} means no genre.`}
      columns={["Index", "Genre", "Defined by"]}
      rows={list.map((g) => [String(g.id), g.name, g.source])}
      placeholder="Filter: rock, 17, Winamp ..."
    />
  );
}

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

/** The byte sizes of this build, from dist/build-info.json. */
export function BundleSizes() {
  const { bundles, esm, types, maps, total } = info.sizes;
  const groups: [string, { files: number; bytes: number }][] = [["ESM modules (tsc)", esm], ["Type declarations", types], ["Source maps", maps], ["Everything in dist/", total]];
  return (
    <div class="table-scroll">
      <table class="table" id="size-table">
        <caption class="table-caption">Build {info.commit ?? "from a checkout without git"} of {info.date.slice(0, 10)}, from dist/build-info.json.</caption>
        <thead><tr class="table-row"><th class="table-head">File</th><th class="table-head">Size</th><th class="table-head">gzip</th></tr></thead>
        <tbody>
          {Object.entries(bundles).map(([file, s]) => <tr class="table-row"><td class="table-cell"><code>{file}</code></td><td class="table-cell">{kb(s.bytes)}</td><td class="table-cell">{kb(s.gzip)}</td></tr>)}
          {groups.map(([name, g]) => <tr class="table-row"><td class="table-cell">{name} ({g.files} files)</td><td class="table-cell">{kb(g.bytes)}</td><td class="table-cell"></td></tr>)}
        </tbody>
      </table>
    </div>
  );
}

const USAGE: [string, string, string][] = [
  ["browser", "Browser", `import { readFromBlob, writeToBlob } from 'audio-tag/browser'

// reads only the tag regions of large files
const { format, metadata } = await readFromBlob(file)
console.log(format, metadata.title, metadata.artist, metadata.pictures?.[0])

const updated = await writeToBlob(file, { metadata: { title: 'New title', genre: ['Rock'] } })
// a File with the same name and type; the audio is never copied into memory`],
  ["node", "Node", `import { readFile, writeFile, readID3FromFile, writeID3ToFile, removeID3FromFile } from 'audio-tag/node'

const { metadata } = await readFile('song.m4a') // the format is detected
await writeFile('song.m4a', { metadata: { album: 'Album', track: { no: 1, of: 12 } } })

const { id3v2, id3v1, lyrics3, warnings } = await readID3FromFile('song.mp3')
await writeID3ToFile('song.mp3', { metadata: { title: 'x' } }, { version: 3 })
// in place when the tag still fits, otherwise through an atomic temp-file rename
await removeID3FromFile('song.mp3', { id3v1: true })`],
  ["bytes", "Bytes", `import { read, write } from 'audio-tag'

const result = read(bytes)
if (result.format === 'flac') console.log(result.streamInfo)

const { bytes: out, inPlace } = write(bytes, { metadata: { title: 'x' } })`],
];

/** The "any file" functions per runtime, as tabs. */
export function UsageTabs() {
  return (
    <div class="tabs">
      <div class="tab-list" role="tablist" aria-label="Runtime">
        {USAGE.map(([id, name], i) => (
          <button class="tab-trigger" role="tab" aria-selected={String(i === 0)} aria-controls={`usage-${id}`} id={`tab-usage-${id}`} tabindex={i === 0 ? undefined : "-1"}>{name}</button>
        ))}
      </div>
      {USAGE.map(([id, , code], i) => (
        <div class="tab-content" role="tabpanel" id={`usage-${id}`} aria-labelledby={`tab-usage-${id}`} tabindex="0" hidden={i > 0}>
          <pre><code>{code}</code></pre>
        </div>
      ))}
    </div>
  );
}

export const LOW_LEVEL = `import { createTag, createFrame, TextEncoding, validateID3v2, writeID3v2, readID3v2, convertID3v2 } from 'audio-tag'

const tag = createTag(4, [
  createFrame('text', 'TIT2', { encoding: TextEncoding.UTF8, values: ['Title'] }),
])
const issues = validateID3v2(tag)          // [] when valid; each issue cites its section
const { bytes } = writeID3v2(tag, { padding: 1024 })
const parsed = readID3v2(bytes)            // { tag, warnings, totalSize }
const { tag: v23 } = convertID3v2(tag, 3)  // TDRC -> TYER/TDAT/TIME, UTF-8 -> UTF-16`;

export function Code({ code }: { code: string }) {
  return <pre><code>{code}</code></pre>;
}
