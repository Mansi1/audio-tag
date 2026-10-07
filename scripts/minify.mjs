// Builds one self-contained, minified file per entry:
//   dist/index.min.js  dist/browser.min.js  dist/node.min.js          (ESM)
//   dist/cjs/index.min.cjs  dist/cjs/browser.min.cjs  dist/cjs/node.min.cjs  (CommonJS)
// Each bundles the whole library, so it can be loaded on its own (CDN, <script type="module">, a
// single file to copy around). Node built-ins stay external in node.min.*.
// It is the last build step, so it also records the byte sizes of everything in dist/ in dist/build-info.json.
import { build } from 'esbuild'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// The build info tsup wrote (tsup.config.ts); the sizes below are added to it.
const buildInfo = readFileSync('dist/build-info.json', 'utf8')

const entries = ['index', 'browser', 'node']
const lines = []
for (const name of entries) {
  for (const format of ['esm', 'cjs']) {
    const outfile = format === 'esm' ? `dist/${name}.min.js` : `dist/cjs/${name}.min.cjs`
    await build({
      entryPoints: [`src/${name}.ts`],
      outfile,
      bundle: true,
      minify: true,
      format,
      platform: name === 'node' ? 'node' : 'neutral',
      target: 'es2020',
      sourcemap: true,
      legalComments: 'none',
      external: ['node:*'],
      logLevel: 'error',
    })
    lines.push(`${outfile.padEnd(30)} ${(statSync(outfile).size / 1024).toFixed(1)} KB`)
  }
}
console.log(lines.join('\n'))

// VERIFIED: byte sizes of the generated output, each bundle on its own (raw and gzipped, as served), the rest
// as groups; make e2e checks each recorded bundle size against the installed file.
const BUNDLES = /^dist\/(cjs\/)?(index|browser|node)(\.min)?\.c?js$/
const group = () => ({ files: 0, bytes: 0 })
const sizes = { bundles: {}, esm: group(), types: group(), maps: group(), total: group() }
const walk = (dir) => readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]))
for (const file of walk('dist').sort()) {
  if (file === 'dist/build-info.json') continue // this file, which cannot hold its own size
  const bytes = statSync(file).size
  const add = (g) => { g.files += 1; g.bytes += bytes }
  add(sizes.total)
  if (file.endsWith('.map')) add(sizes.maps)
  else if (/\.d\.c?ts$/.test(file)) add(sizes.types)
  else if (BUNDLES.test(file) && (file.includes('.min.') || file.startsWith('dist/cjs/'))) sizes.bundles[file] = { bytes, gzip: gzipSync(readFileSync(file), { level: 9 }).length }
  else if (file.endsWith('.js')) add(sizes.esm)
}
writeFileSync('dist/build-info.json', JSON.stringify({ ...JSON.parse(buildInfo), sizes }, null, 2) + '\n')
