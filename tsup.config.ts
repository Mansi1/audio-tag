/// <reference types="node" />
import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { defineConfig } from 'tsup'

// Build info, computed once per build: the package version, the git commit and the build time.
// VERIFIED: SOURCE_DATE_EPOCH (seconds) fixes the time for reproducible builds (1767225600 gives 2026-01-01T00:00:00.000Z).
function gitCommit(): string | null {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null
  } catch {
    return null // not a git checkout, e.g. a source tarball
  }
}
const epoch = process.env.SOURCE_DATE_EPOCH

const buildInfo = {
  version: (JSON.parse(readFileSync('package.json', 'utf8')) as { version: string }).version,
  commit: gitCommit(),
  date: (epoch ? new Date(Number(epoch) * 1000) : new Date()).toISOString(),
}

// CommonJS build for require() users: one self-contained file per entry in dist/cjs.
// The ESM build (dist/, mirroring src/) is produced by `tsc -p tsconfig.build.json`, which runs first.
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    node: 'src/node.ts',
    browser: 'src/browser.ts',
  },
  outDir: 'dist/cjs',
  format: ['cjs'],
  // The core is type-checked without DOM (tsconfig.json); the browser/node entries need DOM and Node types.
  dts: { compilerOptions: { lib: ['ES2020', 'DOM'], types: ['node'] } },
  clean: true,
  sourcemap: true,
  target: 'es2020',
  platform: 'neutral',
  external: [/^node:/],
  splitting: false,
  treeshake: true,
  // VERIFIED: the build info is a file next to the output, not part of the library: dist/build-info.json.
  // scripts/minify.mjs, the last build step, adds the byte sizes; the website reads it.
  async onSuccess() {
    writeFileSync('dist/build-info.json', JSON.stringify(buildInfo, null, 2) + '\n')
  },
})
