// Prints the CHANGELOG.md section of the version in package.json; exits 1 when the version is not semver or has
// no section. `make lint` runs it on every commit, so every version carries its notes, and publish.yml uses its
// output as the GitHub release notes. VERIFIED: a check on every commit, rather than only in publish.yml, finds a missing
// section before the tag exists; a tag that fails there would have to be deleted and pushed again.
// Usage: node scripts/release-notes.mjs [CHANGELOG.md] [package.json]
import { readFileSync } from 'node:fs'

const [changelog = 'CHANGELOG.md', manifest = 'package.json'] = process.argv.slice(2)
const { version } = JSON.parse(readFileSync(manifest, 'utf8'))
// VERIFIED: no `semver` dependency for one test: the regex semver.org recommends (https://semver.org/#is-there-a-suggested-regular-expression-regex-to-check-a-semver-string), without build metadata
const SEMVER = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?$/
if (!SEMVER.test(version)) {
  console.error(`${manifest}: version ${version} is not semver (MAJOR.MINOR.PATCH or MAJOR.MINOR.PATCH-PRERELEASE)`)
  process.exit(1)
}
const lines = readFileSync(changelog, 'utf8').split('\n')
const start = lines.findIndex((l) => l.trim() === `## ${version}`)
const end = lines.findIndex((l, i) => i > start && l.startsWith('## '))
const notes = lines.slice(start + 1, end < 0 ? undefined : end).join('\n').trim()
if (start < 0 || !notes) {
  console.error(`${changelog}: no notes under "## ${version}"; rename "## Unreleased" to "## ${version}" when you release`)
  process.exit(1)
}
console.log(notes)
