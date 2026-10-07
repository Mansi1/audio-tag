import { defineConfig } from 'tsup'

// CommonJS build for require() users: one self-contained file per entry in dist/cjs.
// The ESM build (dist/, mirroring src/) is produced by `tsc -p tsconfig.build.json`.
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
})
