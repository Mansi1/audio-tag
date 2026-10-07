// Size budget (minified + gzip). The full bundle includes zlib, validation, conversion, Lyrics3 and
// MP4 metadata; tree-shaking keeps typical imports much smaller. readID3File() is ID3 only and
// readMP4File() MP4 only, so neither pulls in the other (checked below: ID3-only imports must not
// bundle any MP4, FLAC, Ogg, AIFF or WAV module); read() switches between all of them.
import { build } from 'esbuild'
import { gzipSync } from 'node:zlib'

const budgets = [
  ['everything', "export * from './dist/index.js'", 70 * 1024],
  ['readID3File()', "export { readID3File } from './dist/index.js'", 28 * 1024, true],
  ['read() any', "export { read } from './dist/index.js'", 40 * 1024],
  ['readMP4()', "export { readMP4 } from './dist/index.js'", 12 * 1024],
  ['readMP4File()', "export { readMP4File } from './dist/index.js'", 14 * 1024],
  ['readFLACFile()', "export { readFLACFile } from './dist/index.js'", 14 * 1024],
  ['readAIFFFile()', "export { readAIFFFile } from './dist/index.js'", 30 * 1024],
  ['readWAVFile()', "export { readWAVFile } from './dist/index.js'", 30 * 1024],
  ['readOggFile()', "export { readOggFile } from './dist/index.js'", 16 * 1024],
  ['parseID3v1()', "export { parseID3v1 } from './dist/index.js'", 8 * 1024],
  ['ID3 Blob I/O', "export { readID3FromBlob, writeID3ToBlob } from './dist/browser.js'", 36 * 1024, true],
]
let failed = false
for (const [name, contents, max, id3Only] of budgets) {
  const out = await build({ stdin: { contents, resolveDir: '.' }, bundle: true, minify: true, write: false, metafile: true, format: 'esm', platform: 'browser', logLevel: 'silent' })
  const size = gzipSync(out.outputFiles[0].contents, { level: 9 }).length
  let ok = size <= max
  let note = ''
  // modules that end up in the output (imported but fully tree-shaken ones have 0 bytes)
  const used = Object.values(out.metafile.outputs).flatMap((o) => Object.entries(o.inputs).filter(([, i]) => i.bytesInOutput > 0).map(([f]) => f))
  const mp4Modules = used.filter((f) => /dist\/(mp4|flac|ogg|aiff|wav)\/|-(mp4|flac|ogg|aiff|wav)\.js$/.test(f))
  if (id3Only && mp4Modules.length) {
    ok = false
    note = ` — bundles code for other formats: ${mp4Modules.join(', ')}`
  }
  if (!ok) failed = true
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name.padEnd(20)} ${(size / 1024).toFixed(1)} KB (budget ${(max / 1024).toFixed(0)} KB)${note}`)
}
if (failed) process.exit(1)
