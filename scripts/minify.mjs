// Builds one self-contained, minified file per entry:
//   dist/index.min.js  dist/browser.min.js  dist/node.min.js          (ESM)
//   dist/cjs/index.min.cjs  dist/cjs/browser.min.cjs  dist/cjs/node.min.cjs  (CommonJS)
// Each bundles the whole library, so it can be loaded on its own (CDN, <script type="module">, a
// single file to copy around). Node built-ins stay external in node.min.*.
import { build } from 'esbuild'
import { statSync } from 'node:fs'

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
