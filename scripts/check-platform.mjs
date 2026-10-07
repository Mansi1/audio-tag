// Proves the universal core and the browser entry never pull in Node built-ins.
import { build } from 'esbuild'

const forbidden = /^(node:|fs$|path$|buffer$|zlib$|crypto$|os$|stream$|util$)/
let failed = false
for (const entry of ['dist/index.js', 'dist/browser.js']) {
  await build({
    entryPoints: [entry],
    bundle: true,
    write: false,
    platform: 'browser',
    format: 'esm',
    logLevel: 'silent',
    plugins: [
      {
        name: 'forbid-node',
        setup(b) {
          b.onResolve({ filter: /.*/ }, (args) => {
            if (forbidden.test(args.path)) {
              console.error(`${entry}: imports Node built-in "${args.path}" (from ${args.importer})`)
              failed = true
              return { path: args.path, external: true }
            }
            return undefined
          })
        },
      },
    ],
  })
}
if (failed) process.exit(1)
console.log('platform check passed: core and browser entries are Node-free')
