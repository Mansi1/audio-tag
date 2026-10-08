# Changelog

## 0.1.0

- New website built with defuss, defuss-ssg and defuss-shadcn: a playground that reads, edits and writes tags in the browser, with byte map, structure and hex views; docs; a 404 page.
- The playground loads the library build as its own file (`assets/vendor/audio-tag/browser.min.js`, the package's `dist/browser.min.js`), cached apart from the playground code.
- The installed package ships the website, 404 page included: `npx audio-tag --open` (or `yarn audio-tag`, `bunx audio-tag`) serves it, `--port 8080` picks the port.
- `dist/build-info.json` records version, commit, date and output sizes.
- Breaking: WAV is now RIFF in the public API: the detected format is `'riff'`, and every WAV export is renamed (`readWAVFile` → `readRIFFFile`, `WAVWriteError` → `RIFFWriteError`, `getWAVMetadata` → `getRIFFMetadata`, and so on).
- `docs/` became `spec/`: format specifications as Markdown, grouped by format.
- README with banner and diagrams; project icon.
- Code examples on the website have syntax colors and a Copy button; the docs show the install command for npm, pnpm, yarn and bun, like the start page.
- Link previews: Open Graph tags and a 1200 × 630 preview image, so shared links show a picture (WhatsApp, Slack).

## 0.1.0-rc.1

- Release candidate of 0.1.0, with the same content.
