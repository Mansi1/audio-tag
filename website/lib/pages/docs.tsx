// The docs page (server only; pages/docs.mdx only renders it). The frame and genre tables are hydrated
// DataTables for their filter boxes; everything else is static. VERIFIED: defuss-ssg skips .tsx pages
// (kyr0/defuss#63), hence the one-line MDX wrapper.
import type { DefussChild } from "defuss";
import { buildInfo as info } from "../build-info.ts";
import { Head } from "../head.tsx";
import { Header } from "../header.tsx";
import { Footer } from "../footer.tsx";
import { MappingTable } from "../mapping-table.tsx";
import { BundleSizes, FrameTable, GenreTable, LOW_LEVEL, UsageTabs } from "../docs-parts.tsx";
import { CodeBlock } from "../code-block.tsx";

const FORMATS: [string, string][] = [["mpeg", "MP3 · ID3"], ["mp4", "M4A · MP4"], ["flac", "FLAC"], ["ogg", "Ogg"], ["aiff", "AIFF"], ["riff", "WAV"]];

const NAV: [string, [string, string][]][] = [
  ["Start", [["intro", "Introduction"], ["install", "Install"], ["usage", "Usage"], ["functions", "Functions"]]],
  ["Reading and writing", [["metadata", "Metadata"], ["writing", "Writing"], ["results", "Results by format"], ["errors", "Errors and warnings"]]],
  ["Formats", [["formats", "Formats"], ["specs", "Where the specs disagree"], ["mapping", "Field mapping"], ["frames", "ID3v2 frames"], ["genres", "ID3v1 genres"]]],
  ["For nerds", [["structure", "How tags are built"], ["low-level", "Low-level ID3 API"], ["sizes", "Bundle sizes"], ["build", "Build info"]]],
];

/** A table whose cells are text or markup; `columns` are the header cells. */
function DocTable({ columns, rows }: { columns: string[]; rows: DefussChild[][] }) {
  return (
    <div class="table-scroll">
      <table>
        <thead><tr>{columns.map((c) => <th>{c}</th>)}</tr></thead>
        <tbody>{rows.map((r) => <tr>{r.map((c) => <td>{c}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

/** A highlighted note: "Note", "Tip" or "Warning". */
function Callout({ label, children }: { label: string; children?: DefussChild }) {
  return <blockquote><p><strong>{label}:</strong> {children}</p></blockquote>;
}

const FUNCTIONS: [string, string, string, string][] = [
  ["ID3", "readID3File / writeID3File", "readID3FromBlob / writeID3ToBlob", "readID3FromFile / writeID3ToFile / removeID3FromFile"],
  ["MP4", "readMP4File / writeMP4File", "readMP4FromBlob / writeMP4ToBlob", "readMP4FromFile / writeMP4ToFile"],
  ["FLAC", "readFLACFile / writeFLACFile", "readFLACFromBlob / writeFLACToBlob", "readFLACFromFile / writeFLACToFile"],
  ["Ogg", "readOggFile / writeOggFile", "readOggFromBlob / writeOggToBlob", "readOggFromFile / writeOggToFile"],
  ["AIFF", "readAIFFFile / writeAIFFFile", "readAIFFFromBlob / writeAIFFToBlob", "readAIFFFromFile / writeAIFFToFile"],
  ["WAV", "readRIFFFile / writeRIFFFile", "readRIFFFromBlob / writeRIFFToBlob", "readRIFFFromFile / writeRIFFToFile"],
];
/** "a / b / c" as code spans separated by slashes. */
const fns = (list: string) => list.split(" / ").map((f, i) => <span>{i ? " / " : ""}<code>{f}</code></span>);

const WRITE_EXAMPLE = `const cover = { type: 3, mimeType: 'image/jpeg', description: '', data: jpegBytes }

const out = await writeToBlob(file, {
  metadata: {
    title: 'New title', // set
    comments: null,     // remove
    pictures: [cover],  // replace all pictures
  },
})`;

export function DocsPage({ title, description }: { title: string; description: string }) {
  return (
    <html lang="en">
      <Head title={title} description={description} path="docs" />
      <body>
        <Header active="docs" />
        <div class="page docs">
          <nav class="docs-nav" aria-label="Documentation">
            {NAV.map(([group, links]) => (
              <div>
                <h3>{group}</h3>
                {links.map(([id, name]) => <a href={`#${id}`}>{name}</a>)}
              </div>
            ))}
          </nav>
          <article class="prose">
            <section class="hero docs-hero" aria-labelledby="docs-title">
              <h1 id="docs-title"><img src="assets/icon.svg" alt="" width="56" height="56" /> Docs</h1>
              <p class="tagline">Every function, where each field goes in each format, all 104 ID3v2 frames, the 148 genres and the byte layout of every tag.</p>
              <div class="chips">{FORMATS.map(([f, name]) => <span class={`chip fmt-${f}`}>{name}</span>)}</div>
              <div class="facts-row"><span>version <b>{info.version}</b></span><a href="index.html#playground">try it live in the playground</a></div>
            </section>

            <h2 id="intro">Introduction</h2>
            <p><code>audio-tag</code> reads a file's tags into a <code>metadata</code> object that is the same for every format, and also gives you each format's own structures: ID3v2 frames, MP4 atoms, Vorbis comments, RIFF and AIFF chunks. Writing takes the same <code>metadata</code> shape and changes only what you pass.</p>
            <ul>
              <li><strong>Runs anywhere.</strong> The core uses only <code>Uint8Array</code>, so it works the same in browsers, Node, Deno, Bun and workers. It has no dependencies.</li>
              <li><strong>Exact round trips.</strong> A tag read and written back unchanged gives identical bytes, including unknown, encrypted and oddly encoded frames.</li>
              <li><strong>Strict writer, tolerant reader.</strong> Problems are reported as warnings; <code>strict: true</code> turns them into errors.</li>
            </ul>

            <h2 id="install">Install</h2>
            <CodeBlock code="npm install audio-tag" />
            <p>There are three entry points. Each one includes everything from <code>audio-tag</code>.</p>
            <DocTable
              columns={["Import", "Works with", "Runs in"]}
              rows={[
                [<code>audio-tag</code>, <span>Bytes (<code>Uint8Array</code>)</span>, "Any JavaScript runtime"],
                [<code>audio-tag/browser</code>, <span><code>Blob</code> and <code>File</code></span>, "Browsers, Deno, Bun, workers"],
                [<code>audio-tag/node</code>, "Paths on disk", "Node"],
              ]}
            />
            <Callout label="Offline docs">the package includes this website, with the docs and the playground. Open your installed copy with <code>node node_modules/audio-tag/scripts/serve.mjs --open</code>. It serves on port 5173; add <code>--port 8080</code> to use another one.</Callout>

            <h2 id="usage">Usage</h2>
            <p>The "any file" functions detect the format and call the right reader or writer. Pick your runtime:</p>
            <UsageTabs />
            <Callout label="Note">data that is no recognised audio format (a JPEG, a text file, a bare ID3v1 tag, empty input) throws an <code>UnknownFormatError</code> (<code>format-unknown</code>) and is never changed. Use the ID3 functions for a bare ID3v1 tag. A bare ID3v2 tag counts as MPEG audio (<code>'mpeg'</code>) and is read as one.</Callout>

            <h2 id="functions">Functions</h2>
            <p>Every format has its own functions, and one set handles any file. Use a format's own functions when you know the format, or want its own result type and options. They refuse other formats with an error that says so.</p>
            <DocTable
              columns={["", "Bytes", "Blob / File", "Files on disk"]}
              rows={[
                [<strong>Any file</strong>, fns("read / write"), fns("readFromBlob / writeToBlob"), fns("readFile / writeFile")],
                ...FUNCTIONS.map(([name, bytes, blob, disk]) => [name, fns(bytes), fns(blob), fns(disk)]),
              ]}
            />
            <p>To branch on the format yourself, call <code>detectFormat(bytes)</code>. It returns <code>'mpeg'</code>, <code>'mp4'</code>, <code>'flac'</code>, <code>'ogg'</code>, <code>'aiff'</code>, <code>'riff'</code> or <code>'unknown'</code>.</p>

            <h2 id="metadata">Metadata</h2>
            <p><code>metadata</code> is the same for every format. Each format maps the fields to its own frames, atoms or comments, and a field the format has no place for is rejected on write.</p>
            <DocTable
              columns={["Field", "Type", "Notes"]}
              rows={[
                [<span><code>title</code>, <code>subtitle</code>, <code>album</code>, <code>albumArtist</code>, <code>grouping</code></span>, <code>string</code>, ""],
                [<span><code>artist</code>, <code>composer</code>, <code>lyricist</code>, <code>genre</code>, <code>language</code></span>, <code>string[]</code>, "Several values. ID3v1 genre numbers are resolved to names."],
                [<span><code>track</code>, <code>disc</code></span>, <code>{"{ no?, of? }"}</code>, ""],
                [<code>bpm</code>, <code>number</code>, ""],
                [<code>length</code>, <code>number</code>, "Milliseconds. For FLAC, Ogg, AIFF and WAV it comes from the audio headers."],
                [<span><code>recordingTime</code>, <code>releaseTime</code>, <code>originalReleaseTime</code></span>, <code>string</code>, <span>ISO 8601 subset, such as <code>"2024"</code> or <code>"2024-05-01"</code>. <code>yearOf()</code> gives the year.</span>],
                [<span><code>comments</code>, <code>lyrics</code></span>, <code>{"{ language, description, text }[]"}</code>, ""],
                [<code>pictures</code>, <code>Picture[]</code>, <span><code>{"{ type, mimeType, description, data }"}</code>; type 3 is the front cover.</span>],
                [<span><code>ratings</code>, <code>playCount</code></span>, "", "ID3 only."],
                [<code>compilation</code>, <code>boolean</code>, ""],
                [<code>sort</code>, <code>{"{ title?, artist?, album?, albumArtist?, composer? }"}</code>, "Sort orders."],
                [<span><code>userText</code>, <code>userUrls</code></span>, <code>{"Record<string, string>"}</code>, <span>ID3 <code>TXXX</code> and <code>WXXX</code>, and their counterparts in other formats.</span>],
              ]}
            />
            <p>Also available: <code>setSubtitle</code>, <code>conductor</code>, <code>remixer</code>, <code>publisher</code>, <code>copyright</code>, <code>encodedBy</code>, <code>encoderSettings</code>, <code>isrc</code>, <code>mood</code>, <code>key</code>, <code>encodingTime</code> and <code>taggingTime</code>.</p>

            <h2 id="writing">Writing</h2>
            <p>A write changes only the fields you pass. <code>undefined</code> leaves a field alone and <code>null</code> removes it:</p>
            <CodeBlock code={WRITE_EXAMPLE} />
            <p>Besides <code>metadata</code>, each format takes its own input: <code>id3v2</code>, <code>id3v1</code> and <code>lyrics3</code> for ID3 files (<code>id3v2</code> is also the ID3 chunk of AIFF and WAV files), and <code>mp4</code>, <code>flac</code>, <code>ogg</code>, <code>aiff</code> and <code>riff</code> for theirs. Options that do not apply to the file, such as <code>version</code> for an MP4 file, are refused instead of ignored.</p>
            <DocTable
              columns={["Option", "Formats", "Effect"]}
              rows={[
                [<code>strict</code>, "All", "Warnings become errors."],
                [<code>version</code>, "ID3, AIFF, WAV", "ID3v2 version to write (2, 3 or 4). Default: the file's version, or 4."],
                [<code>id3v1</code>, "ID3", <span><code>'keep'</code> (default), <code>'always'</code> or <code>'never'</code>.</span>],
                [<code>padding</code>, "ID3, MP4, FLAC, AIFF, WAV", "Free space to leave when the tags are rewritten, so later edits fit in place. For AIFF and WAV it pads the tag in the ID3 chunk. Ogg files ignore it."],
              ]}
            />
            <Callout label="Tip">the byte-level <code>write()</code> returns <code>inPlace: true</code> when the file length and the audio position did not change, so only the tag bytes need to be saved.</Callout>

            <h2 id="results">Results by format</h2>
            <p><code>read()</code> returns a result narrowed by <code>format</code>. Every result has <code>metadata</code>, <code>layout</code> (the byte offsets the playground's byte map draws) and <code>warnings</code>, plus the format's own view:</p>
            <DocTable
              columns={["format", "Own view"]}
              rows={[
                [<code>'mpeg'</code>, <span><code>id3v2</code> (the effective tag: all ID3v2 tags in the file merged), <code>id3v1</code> and <code>lyrics3</code>. <code>metadata</code> takes ID3v2 first, then Lyrics3, then ID3v1.</span>],
                [<code>'mp4'</code>, <span><code>mp4</code>: the iTunes items, the QuickTime metadata and the user-data text. <code>metadata</code> takes them in that order.</span>],
                [<code>'flac'</code>, <span><code>flac</code>: the Vorbis comment block and the picture blocks. <code>streamInfo</code>: sample rate, channels, length and more.</span>],
                [<code>'ogg'</code>, <span><code>ogg</code>: the codec (<code>'vorbis'</code>, <code>'opus'</code> or <code>'flac'</code>), the comment and its pictures. <code>stream</code>: the header packets and pages.</span>],
                [<code>'aiff'</code>, <span><code>aiff</code>: the text chunks, the Comments chunk and the ID3 chunk's tag. <code>common</code>: channels, sample frames, sample size and rate.</span>],
                [<code>'riff'</code>, <span><code>riff</code>: the INFO list and the ID3 chunk's tag. <code>audio</code>: the format chunk, and the sizes the length comes from.</span>],
              ]}
            />

            <h2 id="errors">Errors and warnings</h2>
            <p>Reading never fails on small problems: each one becomes a <code>{"{ code, message }"}</code> entry in <code>warnings</code>. Errors carry a <code>code</code> too.</p>
            <DocTable
              columns={["Error", "When"]}
              rows={[
                [<code>TagReadError</code>, <span>A file can't be read, or a warning came up with <code>strict: true</code>.</span>],
                [<code>TagWriteError</code>, <span>A write was refused. <code>MP4WriteError</code>, <code>FLACWriteError</code>, <code>OggWriteError</code>, <code>AIFFWriteError</code> and <code>RIFFWriteError</code> extend it.</span>],
                [<code>UnknownFormatError</code>, <span><code>format-unknown</code>: the data is no supported audio format.</span>],
                [<code>NotImplementedError</code>, "An Ogg codec without comment support, such as Speex or Theora."],
              ]}
            />
            <Callout label="Warning">the per-format functions refuse other formats (<code>format-mp4</code> from the ID3 functions, <code>format-not-flac</code>, <code>format-not-riff</code> and so on). Check with <code>detectFormat()</code> first, or use <code>read()</code> and <code>write()</code>.</Callout>

            <h2 id="formats">Formats</h2>
            <h3 id="fmt-id3">MP3 · ID3</h3>
            <p>ID3v1 and v1.1, ID3v2.2, 2.3 and 2.4, and Lyrics3 v1 and v2.00. The library covers unsynchronisation, synchsafe sizes, zlib frame compression, encryption and grouping hooks, CRC-32, tag restrictions, SEEK, appended tags with footers, every frame layout of every version, and conversion between versions. It passes all 274 cases of the official ID3v1 test suite.</p>
            <h3 id="fmt-mp4">MP4 · M4A</h3>
            <p><code>.m4a</code>, <code>.m4b</code>, <code>.mp4</code> and <code>.mov</code> files keep their tags in metadata atoms, not ID3. When the new metadata fits in the file's free space, the file is rewritten in place. Otherwise every chunk offset (<code>stco</code>/<code>co64</code>) is moved, so the audio stays playable. Ratings and play counts are rejected.</p>
            <h3 id="fmt-flac">FLAC</h3>
            <p>Tags live in a Vorbis comment block (<code>TITLE=...</code>, repeated for several values) and picture blocks. Field names follow MusicBrainz Picard, as RFC 9639 suggests. Unchanged blocks keep their bytes, and a write uses the old padding, so it is usually in place.</p>
            <h3 id="fmt-ogg">Ogg</h3>
            <p>Vorbis, Opus and FLAC-in-Ogg comment headers, with the same field names as FLAC. Covers are <code>METADATA_BLOCK_PICTURE</code> fields. A write rewrites only the header pages, with new CRCs. A cover that needs more pages renumbers the following pages, which rewrites the whole file.</p>
            <h3 id="fmt-aiff">AIFF · AIFF-C</h3>
            <p>Rich metadata goes in an <code>ID3 </code> chunk, created at the end of the file when missing, so the sound data does not move. The <code>NAME</code>, <code>AUTH</code>, <code>(c) </code>, <code>ANNO</code> and <code>COMT</code> chunks are read as fallbacks, and existing <code>NAME</code>/<code>AUTH</code>/<code>(c) </code> chunks are kept in step (ASCII only, as the spec requires).</p>
            <h3 id="fmt-wav">WAV</h3>
            <p>The same idea as AIFF: an <code>id3 </code> chunk for rich metadata, and the <code>LIST</code>/<code>INFO</code> list (<code>INAM</code>, <code>IART</code>, <code>IPRD</code> and others) as a fallback, kept in step. Several values are joined with <code>"; "</code>, and INFO text is ISO 8859-1 unless a <code>CSET</code> chunk says otherwise.</p>
            <Callout label="Note">some taggers put ID3 tags in front of FLAC, Ogg, AIFF or WAV files. They are kept on write and noted on read.</Callout>

            <h2 id="specs">Where the specs disagree</h2>
            <p>The specifications contradict themselves in a few places. Each decision is marked with a <code>// SPEC:</code> comment in the code:</p>
            <ul>
              <li>The Lyrics3v2 page's prose says 1064 bytes and 6-digit field sizes, but its own example uses 1065 bytes and 5-digit sizes. The example wins.</li>
              <li>The v2.3 <code>LINK</code> frame lists a 3-byte frame ID; the reader accepts 3 or 4 bytes.</li>
              <li>Genres 126 to 147 are only named by the official test suite.</li>
              <li>Apple's QuickTime spec defines only <code>mdta</code> metadata. The iTunes item list follows ExifTool, mutagen, AtomicParsley and Picard.</li>
              <li>The spec gives no unit for v2.3 <code>RVAD</code>/<code>EQUA</code> values, so they are not converted to v2.4 <code>RVA2</code>/<code>EQU2</code>.</li>
              <li>RFC 9639 defines no Vorbis comment field names, so they come from MusicBrainz Picard, as the RFC suggests.</li>
              <li>No AIFF spec defines the <code>ID3 </code> chunk; it is implemented as ExifTool documents it.</li>
              <li>RIFF INFO text is ISO 8859-1 by the spec, but many writers put UTF-8 there. Valid UTF-8 is read as UTF-8, with a warning.</li>
              <li>RFC 3533 gives a page on which no packet ends a granule position of -1, while the Vorbis spec says header pages have 0. Header pages get 0, or -1 when no packet ends on them.</li>
            </ul>

            <h2 id="mapping">Field mapping</h2>
            <p>Where each <code>metadata</code> field is written in each format. AIFF and WAV files keep every field in their ID3 chunk, as the ID3v2 columns show; the WAV INFO and AIFF text columns are the extra copies kept in step when the file already has those chunks. MP4 freeform items are shown as <code>----:NAME</code>; their full key is <code>----:com.apple.iTunes:NAME</code>.</p>
            <MappingTable />

            <h2 id="frames">ID3v2 frames</h2>
            <p>Every frame of ID3v2.2, v2.3 and v2.4 is read, written and validated, along with the chapter and accessibility addenda and 8 common unofficial frames (<code>RGAD</code>, <code>XRVA</code>, and iTunes' <code>TCMP</code> and sort-order frames). Frames the library does not know are kept byte for byte.</p>
            <FrameTable />

            <h2 id="genres">ID3v1 genres</h2>
            <GenreTable />

            <h2 id="structure">How tags are built</h2>
            <p>The byte layout of every structure the library reads and writes, as the specs define it. Sizes are in bytes; BE and LE mean big- and little-endian. The playground's byte map shows these regions in your own files.</p>
            <h3 id="s-id3v2">ID3v2</h3>
            <DocTable
              columns={["Offset", "Size", "Field", "Value"]}
              rows={[
                ["0", "3", "Identifier", <span><code>"ID3"</code> (an appended v2.4 tag ends with a footer that starts <code>"3DI"</code>)</span>],
                ["3", "2", "Version", "Major (2, 3 or 4), then revision"],
                ["5", "1", "Flags", "v2.2: unsynchronisation, compression. v2.3: unsynchronisation, extended header, experimental. v2.4: those and footer."],
                ["6", "4", "Size", "Synchsafe: 7 bits per byte, the top bit always 0. Excludes the header (and footer)."],
              ]}
            />
            <p>Frame headers: v2.2 is ID (3) · size (3); v2.3 is ID (4) · size (4, plain BE) · flags (2); v2.4 is ID (4) · size (4, synchsafe) · flags (2).</p>
            <DocTable
              columns={["Frame", "Body"]}
              rows={[
                [<span>Text (<code>T***</code>)</span>, "Encoding (1) · text. v2.4 separates several values with a NUL."],
                [<code>TXXX</code>, "Encoding (1) · description · NUL · value"],
                [<span><code>COMM</code>, <code>USLT</code></span>, "Encoding (1) · language (3, ISO 639-2) · description · NUL · text"],
                [<code>APIC</code>, "Encoding (1) · MIME type · NUL · picture type (1) · description · NUL · image data"],
                [<code>W***</code>, "URL in ISO-8859-1"],
              ]}
            />
            <p>Text encodings: <code>$00</code> ISO-8859-1, <code>$01</code> UTF-16 with BOM, and in v2.4 also <code>$02</code> UTF-16BE and <code>$03</code> UTF-8.</p>
            <h3 id="s-id3v1">ID3v1 · Lyrics3</h3>
            <DocTable
              columns={["Offset", "Size", "Field"]}
              rows={[
                ["0", "3", <code>"TAG"</code>], ["3", "30", "Title"], ["33", "30", "Artist"], ["63", "30", "Album"], ["93", "4", "Year"],
                ["97", "30", "Comment. In v1.1: comment (28) · NUL · track number (1)"],
                ["127", "1", <span>Genre index (0 to 147; 255 = none). See <a href="#genres">the genre list</a>.</span>],
              ]}
            />
            <p>Lyrics3 sits just before the ID3v1 tag: v1 is <code>"LYRICSBEGIN"</code> · lyrics · <code>"LYRICSEND"</code>; v2.00 is <code>"LYRICSBEGIN"</code> · fields (3-letter ID, 5-digit size, data) · size of the tag (6 digits) · <code>"LYRICS200"</code>.</p>
            <h3 id="s-mp4">MP4</h3>
            <p>Every atom is size (4, BE, including the header) · type (4) · data. The iTunes items live in <code>moov/udta/meta/ilst</code> (handler <code>mdir</code>), one atom per item, each with a <code>data</code> atom: type (4) · locale (4) · value. Freeform items (<code>----</code>) add <code>mean</code> and <code>name</code> atoms. When the metadata grows and no free space is left, every chunk offset in <code>stco</code> (32-bit) and <code>co64</code> (64-bit) is updated so the audio is still found.</p>
            <h3 id="s-flac">FLAC · Vorbis</h3>
            <p>A FLAC file starts with <code>"fLaC"</code>, then metadata blocks (header: last-block flag (1 bit) · type (7 bits) · length (24 bits, BE)), then the audio frames. A Vorbis comment is vendor length (4, LE) · vendor · number of fields (4, LE) · each field: length (4, LE) · <code>NAME=value</code> in UTF-8.</p>
            <h3 id="s-ogg">Ogg</h3>
            <p>Each page is <code>"OggS"</code> · version · header type · granule position (8, LE) · serial (4) · sequence (4) · CRC-32 (4) · number of segments · segment table, then the data. The comment packet is the codec's second header packet: <code>0x03 "vorbis"</code> for Vorbis, <code>"OpusTags"</code> for Opus, a <code>VORBIS_COMMENT</code> block for FLAC in Ogg.</p>
            <h3 id="s-wav">WAV</h3>
            <p><code>"RIFF"</code> · size (4, LE) · <code>"WAVE"</code> · chunks: ID (4) · size (4, LE) · data, plus a pad byte when the size is odd. <code>fmt </code> holds the format, <code>data</code> the audio, <code>LIST</code> (type <code>INFO</code>) the text tags, <code>id3 </code> a whole ID3v2 tag.</p>
            <h3 id="s-aiff">AIFF</h3>
            <p><code>"FORM"</code> · size (4, BE) · <code>"AIFF"</code> or <code>"AIFC"</code> · chunks: ID (4) · size (4, BE) · data, plus a pad byte when the size is odd. <code>COMM</code> holds channels, sample frames, sample size and rate, <code>SSND</code> the audio, <code>NAME</code>/<code>AUTH</code>/<code>(c) </code>/<code>ANNO</code>/<code>COMT</code> the text, <code>ID3 </code> a whole ID3v2 tag.</p>

            <h2 id="low-level">Low-level ID3 API</h2>
            <p>Build, validate, convert and serialize ID3v2 tags frame by frame. Every frame type is a member of a discriminated union (<code>frame.type</code>), with fields named as in the spec.</p>
            <CodeBlock code={LOW_LEVEL} />

            <h2 id="sizes">Bundle sizes</h2>
            <p>Each bundle loads on its own, raw and gzipped as served. Importing only the functions you need lets a bundler drop the other formats; <code>npm run size</code> measures single imports against their budgets.</p>
            <BundleSizes />

            <h2 id="build">Build info</h2>
            <p>Each build writes <code>dist/build-info.json</code>: the version, the git commit, the build time and the byte sizes above. This page shows version {info.version}, built {info.date.slice(0, 10)}.</p>
          </article>
        </div>
        <Footer />
      </body>
    </html>
  );
}
