// scripts/release-notes.mjs, the release gate: `make lint` and publish.yml stop a version without semver or notes.
import { spawnSync } from 'node:child_process'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

let dir: string
beforeAll(async () => {
  dir = await mkdtemp(join(tmpdir(), 'audio-tag-notes-'))
})
afterAll(async () => {
  await rm(dir, { recursive: true, force: true })
})

async function notes(version: string, changelog: string) {
  await writeFile(join(dir, 'package.json'), JSON.stringify({ version }))
  await writeFile(join(dir, 'CHANGELOG.md'), changelog)
  return spawnSync('node', ['scripts/release-notes.mjs', join(dir, 'CHANGELOG.md'), join(dir, 'package.json')], { encoding: 'utf8' })
}

const CHANGELOG = '# Changelog\n\n## Unreleased\n\n- next\n\n## 1.2.0-rc.1\n\n- one\n- two\n\n## 1.1.0\n\n- old\n'

describe('release-notes', () => {
  it('prints only the section of the package version', async () => {
    const r = await notes('1.2.0-rc.1', CHANGELOG)
    expect(r.status).toBe(0)
    expect(r.stdout.trim()).toBe('- one\n- two')
  })

  it('prints the last section up to the end of the file', async () => {
    const r = await notes('1.1.0', CHANGELOG)
    expect(r.stdout.trim()).toBe('- old')
  })

  it('fails when the version has no section', async () => {
    const r = await notes('1.3.0', CHANGELOG)
    expect(r.status).toBe(1)
    expect(r.stderr).toContain('no notes under "## 1.3.0"')
  })

  it('fails when the section is empty', async () => {
    const r = await notes('2.0.0', '## 2.0.0\n\n## 1.1.0\n\n- old\n')
    expect(r.status).toBe(1)
  })

  it('fails when the version is not semver', async () => {
    for (const version of ['1.0', 'v1.0.0', '01.0.0', '1.0.0-rc.01']) {
      const r = await notes(version, `## ${version}\n\n- x\n`)
      expect(r.status, version).toBe(1)
      expect(r.stderr).toContain('is not semver')
    }
  })
})
