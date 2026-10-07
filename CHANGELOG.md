# Changelog

## Unreleased

- New website built with defuss, defuss-ssg and defuss-shadcn: a playground that reads, edits and writes tags in the browser, with byte map, structure and hex views; docs; a 404 page.
- The installed package ships the website: `node node_modules/audio-tag/scripts/serve.mjs --port 8080`.
- `dist/build-info.json` records version, commit, date and output sizes.
- Breaking: WAV is now RIFF in the public API: the detected format is `'riff'`, and every WAV export is renamed (`readWAVFile` → `readRIFFFile`, `WAVWriteError` → `RIFFWriteError`, `getWAVMetadata` → `getRIFFMetadata`, and so on).
- `docs/` became `spec/`: format specifications as Markdown, grouped by format.
- README with banner and diagrams; project icon.
