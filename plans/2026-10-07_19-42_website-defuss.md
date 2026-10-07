# Rebuild the website with defuss + defuss-shadcn

Goal: replace the deleted `website/index.html`, `docs.html` and `404.html` with a defuss-ssg site (MDX pages,
defuss JSX components, hydrated islands), built from defuss-shadcn UI components and styled with the README
SVG palette. It keeps everything the old site did (overview, playground, docs with generated tables, 404,
offline copy in the npm package, GitHub Pages deploy, e2e of every page and control) and adds a "for nerds"
layer: the real byte layout of a file, its tag structure, warnings, raw result and hex.

Tick `- [x]` when a milestone's proof passes, THEN run `verify` on its scope.

## Decisions (by the user)

- UI: defuss-shadcn (npm `defuss-shadcn@0.9.4`, the CSS + ES-module component library), structure in defuss
  JSX and MDX, built by defuss-ssg.
- Look: the README SVGs. Dark cards `#0f172a`, hero gradient `#0f172a → #1e1b4b`, tag gradient
  `#3b82f6 → #7c3aed`, format colors ID3 `#3b82f6`, MP4 `#8b5cf6`, FLAC `#10b981`, Ogg `#f59e0b`,
  AIFF `#ec4899`, WAV `#06b6d4`, audio as grey hatching; light and dark themes.
- Playground, plus details for nerds on demand (collapsed by default, so the page stays simple).

## Evidence (probes in the session scratchpad `ssg-probe/`)

- VERIFIED[defuss-ssg@0.7.5 build] MDX page + `components/*.tsx` → `dist/index.html`, `dist/components/*.js`, `dist/assets/*` BC `bunx defuss-ssg build .`.
- VERIFIED[defuss-ssg node] REQUIRES Node `^20.19.0 || >=22.12.0` BC npm `engines`; 20.18.2 crashes in `uWebSockets.js`, 22.22.2 builds.
- VERIFIED[defuss-ssg page] ONE root (`<html>…</html>`) per page BC several roots → `TypeError: Failed to serialize XML`.
- VERIFIED[html-fix plugin] a `page-html` plugin adds `<!doctype html>`, rewrites `data-hydrate-src|runtime="/components/X"` → `"./X"` and other `"/components/` → `"./components/"`, drops the `?v=Date.now()` cache-bust BC Chromium: `CSS1Compat`, hydrated island works, 0 failed requests.
- VERIFIED[vendor plugin] a `pre` plugin copying `node_modules/defuss-shadcn/dist/components/{core.min.css,core.min.js,<name>/<name>.min.css|js}` into `assets/vendor/` works BC tabs switch and are styled under `/audio-tag/` and `/website/dist/`.
- VERIFIED[library alias] `viteConfig.resolve.alias["audio-tag/browser"] → <repo>/dist/browser.js` bundles the current build (3.08 kB for `detectFormat` + `VERSION`) BC probe ran with the `audio-tag` package removed.
- VERIFIED[404 base] the plugin's second argument is the output path; for `404.html` it rewrites `assets/`|`components/` URLs to `/audio-tag/…` BC 0 failed requests at `/audio-tag/404.html`.
- VERIFIED[relative paths] the same `dist/` works under `/audio-tag/` (Pages) and `/website/dist/` (npm offline copy) BC both bases passed.
- VERIFIED[ssg output] `dist/config.js` (the compiled config) lands in the output BC `ls dist`; it must not ship.
- VERIFIED[ui size] `all.min.css` 652 KB, `core.min.css` 108 KB BC `du`; load core + the used components only.
- VERIFIED[core.css] sets no body font BC the 404 probe rendered in Times; `site.css` sets it.
- VERIFIED[byte map data] every read result has byte offsets: MP3 `layout.id3v2[] / lyrics3 / id3v1 / audio`, MP4 `layout.atoms[]` + `moov`, FLAC `layout.blocks[]` + `audioStart`, Ogg `layout.headerPages[]` + `headerEnd`, AIFF/RIFF `layout.chunks[]` + `fileLength` BC `read()` on `input/sample.*`.
- VERIFIED[content] the deleted pages' uncommitted session edits are lost; README.md and `src/` are current; `git show HEAD:website/{index,docs,404}.html` gives the old structure.

## Layout

```text
website/                       bun subproject
  package.json                 defuss 3.4.9, defuss-ssg 0.7.5, defuss-shadcn 0.9.4 (exact pins);
                               packageManager bun@1.3.9; engines node ^20.19.0 || >=22.12.0
  bun.lock  tsconfig.json      jsx react-jsx, jsxImportSource defuss
  config.ts                    plugins: vendor (pre), html-fix (page-html), drop-config (post); alias
  pages/index.mdx              hero, how it works, where the tags live, playground, formats, install
  pages/docs.mdx               the documentation
  pages/404.mdx
  components/head.tsx          title, meta, icon, vendor + site CSS/JS          (server only)
  components/header.tsx        brand, nav, theme toggle                         (server only)
  components/footer.tsx        version, commit, build date from ../dist/build-info.json, sizes
  components/playground.tsx    open / edit / save / record; details for nerds   (hydrated)
  components/data-table.tsx    filterable table for frames and genres           (hydrated)
  lib/byte-map.ts              result → regions [{ label, kind, start, end, format }]   (pure)
  lib/byte-map.test.ts         bun test on real input/sample.* files
  assets/theme.css             palette → defuss-shadcn tokens, --fmt-* colors
  assets/site.css              layout, fonts, hero, byte map
  assets/icon.svg, how-it-works.svg, formats.svg   (from website/ and .github/readme/)
  data/support.json            generated by scripts/support-matrix.mjs
  dist/                        build output, gitignored, shipped in the npm package
```

Module boundaries:
- `lib/byte-map.ts` ONE owner of "which byte range is what" (contract: `byteMap(result): Region[]`, regions
  sorted, non-overlapping, covering `0 … fileLength`); the playground only renders its output.
- `components/playground.tsx` owns playground state; it reaches the library only through `readFromBlob` /
  `writeToBlob` from `audio-tag/browser` (alias).
- `data/support.json` is owned by `scripts/support-matrix.mjs`; pages only read it.
- Build info is owned by `dist/build-info.json`; the footer reads it at generation time.

## Milestones (dependency order)

- [x] **0. Scaffold.** `bun init` in `website/`; deps pinned; `tsconfig.json`; `config.ts` with the three probed plugins and the alias. Move `website/icon.svg` → `website/assets/`; delete `website/site.css`, `website/site.js`. Root `mise.toml`: `node = "22"`. `.gitignore`: `website/dist/`, `website/.ssg-temp/`, `website/node_modules/`, `website/assets/vendor/`.
  Proof: `bun install --frozen-lockfile && bunx defuss-ssg build .` exits 0; `dist/config.js` absent.
- [x] **1. Theme + shell.** `assets/theme.css` maps the palette onto defuss-shadcn tokens (`--primary` = `#3b82f6`→`#7c3aed` accents, `--background`, `--card`, ... light + dark) and defines `--fmt-id3 … --fmt-wav`; `site.css` sets the body font. `head.tsx`, `header.tsx` (icon brand, nav: Playground · Formats · Docs · GitHub, theme toggle remembered in localStorage), `footer.tsx` (version · commit link · build date · bundle size from `build-info.json`).
  Proof: e2e: footer equals the installed `dist/build-info.json`; theme toggle flips the mode; every page light + dark, 390 px without sideways scroll.
- [x] **2. Overview `pages/index.mdx`.** Hero in the banner style (dark gradient card, icon, tagline, format chips, facts, CTA buttons Playground / Docs), the two README diagrams, install (`code-block` with npm · pnpm · yarn · bun tabs), format cards with their color, CTA. Content from README.md.
  Proof: e2e visits it (HTTP 200, icon loads, no console errors or failed requests).
- [x] **3. Byte map `lib/byte-map.ts`.** `byteMap(result)` for all six formats from `result.layout` (regions: tag | header | free | audio; label = frame/atom/block/chunk/page name).
  Proof: `bun test lib/byte-map.test.ts` on every `input/sample.*`: regions sorted, non-overlapping, cover the whole file, tag regions match the known offsets (e.g. MP3 ID3v1 = 576...704, WAV `data` at 36). Wired into `make test`.
- [x] **4. Playground `components/playground.tsx`.** Simple view: drop or pick a file (`file-input` drop zone, `accept` covers every format incl. `.mp4 .mov`) or record (fake mic in e2e); cover, title, artist, album, album artist, genre, year, track, comment; Save → download; Reset; discard `alert-dialog`; toasts. Details for nerds (`accordion`, collapsed):
  - **Byte map**: the file as one bar, regions in format colors / grey hatching, proportional with a minimum width, tooltip with name, offset and size;
  - **Structure**: table of frames / atoms / blocks / pages / chunks with offset, size, flags;
  - **Warnings**: codes and messages (`badge` + `alert`);
  - **Raw result**: `readFromBlob` output as JSON (binary shown by size);
  - **Hex**: first 256 bytes of the selected region.
  Proof: e2e for every `input/sample.*`: opens, saves with a new title (read back from the download), byte map has ≥ 2 regions and matches `byteMap()`, details open; cover add/remove, Reset, discard keep/discard, recording loads `recording-*.wav`.
- [x] **5. Docs `pages/docs.mdx`.** Side navigation with scroll-spy (`docs-navigation`), sections: introduction, install (offline copy, `--port`), usage (runtime tabs), functions, metadata, writing (options incl. `padding` for AIFF/RIFF, Ogg ignores it), results by format (`riff`), errors, formats, where the specs disagree, field mapping, frames (filterable), genres (filterable), how tags are built (byte layouts as tables), low-level API (`const { tag: v23 } = convertID3v2(…)`), bundle size (from `build-info.json`), build info. Every claim re-checked against README.md and `src/`.
  Proof: `vae.py prose` on the MDX; e2e: tabs switch, frame filter and genre filter narrow 104 / 148 rows.
- [x] **6. Generated data.** `scripts/support-matrix.mjs` writes `website/data/support.json` (frames, mapping, genres) instead of patching HTML; the README table stays. `data-table.tsx` renders it.
  Proof: `npm run docs:matrix` is idempotent (second run, no diff); e2e row counts above.
- [x] **7. 404 `pages/404.mdx`.** `empty-state` with countdown and meta refresh to `https://mansi1.github.io/audio-tag/`; absolute `/audio-tag/` URLs (plugin). Not in the npm package.
  Proof: e2e under `/audio-tag/` (route mapping as now).
- [x] **8. Wiring.**
  - `package.json`: `files` `website` → `website/dist`, `!website/dist/404.html`; script `site` = `cd website && bun run build`.
  - `scripts/serve.mjs`: `/` → `/website/dist/index.html`, `--open` likewise.
  - `Makefile`: `setup` adds `cd website && bun install --frozen-lockfile`; `test` adds `cd website && bun test`; `e2e` runs `npm run build && npm run site` first.
  - `.github/workflows/pages.yml`: setup-bun + Node 22, `npm ci && npm run build && npm run site`, upload `website/dist`; drop the `sed` path rewrites.
  - `.github/workflows/verify.yml`: setup-bun picks up `website/bun.lock` (already conditional).
  - `scripts/e2e.mjs`: serve the installed `node_modules/audio-tag/website/dist`, new selectors, the checks above.
  - README (Install, Development), ARCH.md (website section), `website/README.md` (how to build and serve).
  Contract: `node node_modules/audio-tag/scripts/serve.mjs --open` shows the docs offline.
  Proof: `make e2e` AND the gate.

## Risks

- defuss-ssg is 0.x; the html-fix plugin depends on its hydration markup. Exact version pins; the e2e fails on console errors and failed requests, so a format change shows up.
- The website needs Node ≥ 20.19, the library supports ≥ 18: only the website build and CI use Node 22.
- Rollback: `git restore website/` brings back the old HTML pages (pre-session state).
