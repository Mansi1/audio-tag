// The start page (server only; pages/index.mdx only renders it). VERIFIED: defuss-ssg builds pages only
// from .md, .mdx and .html files (kyr0/defuss#63). The playground inside is the one hydrated island.
import type { Props } from "defuss";
import { Head } from "../head.tsx";
import { Header } from "../header.tsx";
import { Footer } from "../footer.tsx";
import { Playground } from "../../components/playground.tsx";
import { Diagram } from "../diagram.tsx";

const FORMATS: [string, string, string][] = [
  ["mpeg", "MP3 · ID3", "ID3v1 and v1.1, ID3v2.2, 2.3 and 2.4, and Lyrics3 v1 and v2.00. 104 frame types, including the CHAP/CTOC chapters, and 148 genres. Unknown frames keep their bytes."],
  ["mp4", "M4A · MP4", "The iTunes item list in moov/udta/meta/ilst, QuickTime mdta keys and udta text. When the metadata grows, every chunk offset (stco/co64) moves with it."],
  ["flac", "FLAC", "The VORBIS_COMMENT block and PICTURE blocks (RFC 9639). A write reuses the padding, so it is usually in place."],
  ["ogg", "Ogg", "Vorbis, Opus and FLAC in Ogg: the comment header, with covers as METADATA_BLOCK_PICTURE. Only the header pages are rewritten, with new CRCs."],
  ["aiff", "AIFF · AIFF-C", "An ID3 chunk for rich metadata, plus the spec's NAME, AUTH, (c), ANNO and COMT chunks, kept in step."],
  ["riff", "WAV", "An id3 chunk for rich metadata and the RIFF LIST/INFO list (INAM, IART and others) as a fallback, kept in step."],
];
const MANAGERS: [string, string][] = [["npm", "npm install audio-tag"], ["pnpm", "pnpm add audio-tag"], ["yarn", "yarn add audio-tag"], ["bun", "bun add audio-tag"]];
const WAVE = [30, 55, 80, 45, 70, 95, 60, 35, 75, 50, 25];

// Syntax colors of the code example in the hero.
const CodeKeyword = ({ children }: Props) => <span class="code-keyword">{children}</span>;
const CodeString = ({ children }: Props) => <span class="code-string">{children}</span>;
const CodeComment = ({ children }: Props) => <span class="code-comment">{children}</span>;

export function HomePage({ title, description }: { title: string; description: string }) {
  return (
    <html lang="en">
      <Head title={title} description={description} />
      <body>
        <Header active="home" />
        <main class="page">
          <section class="hero" aria-labelledby="hero-title">
            <div class="wave" aria-hidden="true">{WAVE.map((h) => <span style={`height:${h}%`}></span>)}</div>
            <div class="hero-grid">
              <div>
                <h1 id="hero-title"><img src="assets/icon.svg" alt="" width="80" height="80" /> audio-tag</h1>
                <p class="tagline">Spec-exact tags for every audio container. Read and write them in the browser and in Node, and every byte you did not touch stays as it was.</p>
                <div class="chips">{FORMATS.map(([f, name]) => <span class={`chip fmt-${f}`}>{name}</span>)}</div>
                <div class="actions">
                  <a class="btn brand-btn" data-size="lg" href="#playground">Try the playground</a>
                  <a class="btn" data-variant="ghost" data-size="lg" href="docs.html">Read the docs</a>
                </div>
                <div class="facts-row"><span><b>0</b> dependencies</span><span>browser · Node · Deno · Bun</span><span>byte-exact round trips</span><span><b>104</b> ID3v2 frames</span></div>
              </div>
              <pre class="hero-code" aria-label="Example">
                <CodeKeyword>import</CodeKeyword> {"{ readFromBlob, writeToBlob } "}<CodeKeyword>from</CodeKeyword> <CodeString>'audio-tag/browser'</CodeString>{"\n\n"}
                <CodeKeyword>const</CodeKeyword> {"{ format, metadata } = "}<CodeKeyword>await</CodeKeyword> {"readFromBlob(file)\n"}
                <CodeComment>// 'mpeg' | 'mp4' | 'flac' | 'ogg' | 'aiff' | 'riff'</CodeComment>{"\n\n"}
                <CodeKeyword>const</CodeKeyword> {"out = "}<CodeKeyword>await</CodeKeyword> {"writeToBlob(file, {\n  metadata: { title: "}<CodeString>'New title'</CodeString>{", genre: ["}<CodeString>'Rock'</CodeString>{"] },\n})\n"}
                <CodeComment>// a File with the same name; the audio is never copied</CodeComment>
              </pre>
            </div>
          </section>

          <section class="section" id="how" aria-labelledby="how-title">
            <h2 id="how-title">How it <span class="gradient-text">works</span></h2>
            <p class="lead">Reading looks at the tag regions only. Writing is a plan of new tag bytes and ranges of the old file, carried out in place when the size stays the same.</p>
            <Diagram name="how-it-works" />
          </section>

          <section class="section" id="playground" aria-labelledby="playground-title">
            <h2 id="playground-title">Try it on <span class="gradient-text">your own files</span></h2>
            <p class="lead">Drop an audio file, edit its tags and download the result. Everything runs in your browser; nothing is uploaded. Open "For nerds" to see the file byte by byte.</p>
            <Playground />
          </section>

          <section class="section" id="formats" aria-labelledby="formats-title">
            <h2 id="formats-title">Where the tags <span class="gradient-text">live</span></h2>
            <p class="lead">Each format keeps its tags somewhere else. audio-tag reads and writes all of them with the same <code>metadata</code> object.</p>
            <Diagram name="formats" />
            <div class="format-grid" style="margin-top:1.5rem">
              {FORMATS.map(([f, name, text]) => (
                <article class={`card format-card fmt-${f}`}>
                  <div class="card-header"><h3 class="card-title">{name}</h3></div>
                  <div class="card-content"><p>{text}</p></div>
                </article>
              ))}
            </div>
          </section>

          <section class="section" id="install" aria-labelledby="install-title">
            <h2 id="install-title">Install</h2>
            <p class="lead">One package, three entry points: bytes (<code>audio-tag</code>), Blob and File (<code>audio-tag/browser</code>), files on disk (<code>audio-tag/node</code>). It also ships this website, to read offline.</p>
            <div class="tabs" style="max-width:40rem">
              <div class="tab-list" role="tablist" aria-label="Package manager">
                {MANAGERS.map(([pm], i) => (
                  <button class="tab-trigger" role="tab" aria-selected={String(i === 0)} aria-controls={`pm-${pm}`} id={`tab-${pm}`} tabindex={i === 0 ? undefined : "-1"}>{pm}</button>
                ))}
              </div>
              {MANAGERS.map(([pm, cmd], i) => (
                <div class="tab-content" role="tabpanel" id={`pm-${pm}`} aria-labelledby={`tab-${pm}`} tabindex="0" hidden={i > 0}>
                  <pre class="hero-code">{cmd}</pre>
                </div>
              ))}
            </div>
            <div class="actions" style="display:flex;gap:.75rem;margin-top:1.5rem;flex-wrap:wrap">
              <a class="btn brand-btn" href="docs.html">Read the docs</a>
              <a class="btn" data-variant="outline" href="https://github.com/Mansi1/audio-tag">View on GitHub</a>
            </div>
          </section>
        </main>
        <Footer />
      </body>
    </html>
  );
}
