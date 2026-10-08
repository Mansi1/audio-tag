// Builds the library (npm run build in the repository root) before the website uses it, unless dist/ is
// current: the playground loads dist/browser.min.js as a vendor file, and the footer and docs show
// dist/build-info.json. A rebuild every time would build twice in `make verify` and the Pages workflow,
// which build the library first, so this rebuilds only when dist/ is missing, older than a source or build
// file, or from another commit than HEAD (the footer would show the wrong build).
// VERIFIED: each condition rebuilds and a current dist/ is skipped (make e2e logs "library build is current").
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'

const root = resolve(import.meta.dirname, '../..')
const info = join(root, 'dist/build-info.json')
const INPUTS = ['src', 'package.json', 'tsconfig.build.json', 'tsup.config.ts', 'scripts/minify.mjs']

const log = (level, message) => console.log(`${new Date().toISOString()} ${level} ${message}`)

function newestChange(path) {
  const stat = statSync(path)
  if (!stat.isDirectory()) return stat.mtimeMs
  return Math.max(0, ...readdirSync(path).map((name) => newestChange(join(path, name))))
}

function headCommit() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || null
  } catch {
    return null // not a git checkout: the build records no commit either
  }
}

function staleReason() {
  if (!existsSync(info) || !existsSync(join(root, 'dist/browser.min.js'))) return 'dist/ is missing'
  const built = statSync(info).mtimeMs // minify.mjs writes it last
  const changed = INPUTS.find((input) => newestChange(join(root, input)) > built)
  if (changed) return `${changed} changed after the build`
  const commit = headCommit()
  const recorded = JSON.parse(readFileSync(info, 'utf8')).commit
  if (commit && recorded !== commit) return `built from ${recorded}, HEAD is ${commit}`
  return undefined
}

const reason = staleReason()
if (reason) {
  log('info', `building the library reason=${JSON.stringify(reason)}`)
  execFileSync('npm', ['run', 'build'], { cwd: root, stdio: 'inherit' })
} else {
  log('info', 'library build is current path=dist/')
}
