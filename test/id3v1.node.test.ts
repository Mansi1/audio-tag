// Conformance against Martin Nilsson's ID3v1/ID3v1.1 test suite (test/fixtures/id3v1).
// Node-only because it reads fixture files from disk.
import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { decodeLatin1 } from '../src/core/encoding'
import { parseID3v1, serializeID3v1 } from '../src/id3v1/id3v1'

const dir = join(__dirname, 'fixtures', 'id3v1')

interface Case {
  n: number
  file: string
  expect: 'ok' | 'warning' | 'failure'
  fields: Record<string, string>
  version: string
  track?: number
  genre: number
}

function loadCases(): Case[] {
  const log = decodeLatin1(readFileSync(join(dir, 'generation.log')))
  const cases: Case[] = []
  for (const block of log.split(/\nTest case (?=\d+\n)/).slice(1)) {
    const n = Number(block.slice(0, block.indexOf('\n')))
    const file = /Generated test file "([^"]+)"/.exec(block)![1]!
    const fields: Record<string, string> = {}
    for (const m of block.matchAll(/^(title|artist|album|year|comment) *: "(.*)"$/gm)) {
      // the log writes NUL as \0; readers stop at the first NUL
      fields[m[1]!] = m[2]!.split('\\0')[0]!
    }
    const c: Case = {
      n,
      file,
      expect: /decoding failure/.test(block) ? 'failure' : /decoding warning/.test(block) ? 'warning' : 'ok',
      fields,
      version: /^version: (\S+)/m.exec(block)![1]!,
      genre: Number(/^genre *: (\d+)/m.exec(block)![1]),
    }
    const t = /^track *: (\d+)/m.exec(block)
    if (t) c.track = Number(t[1])
    cases.push(c)
  }
  return cases
}

const cases = loadCases()

describe('ID3v1 test suite', () => {
  it('found every test case', () => {
    expect(cases).toHaveLength(274)
    expect(readdirSync(dir).filter((f) => f.endsWith('.mp3'))).toHaveLength(274)
  })

  for (const c of cases) {
    it(`case ${c.n}: ${c.file}`, () => {
      const data = readFileSync(join(dir, c.file))
      const tail = data.subarray(data.length - 128)

      if (c.n === 3) {
        // header in the wrong case: not a tag at all
        expect(parseID3v1(tail)).toBeNull()
        return
      }

      const r = parseID3v1(tail, { trimSpaces: false })!
      expect(r).not.toBeNull()
      expect(r.tag.version).toBe(c.version)
      for (const k of ['title', 'artist', 'album', 'comment'] as const) expect(r.tag[k]).toBe(c.fields[k])
      expect(r.tag.year).toBe(c.fields.year)
      expect(r.tag.genre).toBe(c.genre)
      if (c.track !== undefined) expect(r.tag.track).toBe(c.track)

      // 255 is treated as "no genre" by convention, which the (non-normative) suite marks as a
      // failure; we accept it silently. See tasks/README.md D3.
      if (c.expect === 'failure' && c.genre !== 255) {
        expect(r.warnings.length).toBeGreaterThan(0)
        expect(() => parseID3v1(tail, { strict: true })).toThrow()
      }
      if (c.expect === 'warning') expect(r.warnings.length).toBeGreaterThan(0)
      if (c.expect === 'ok') expect(r.warnings).toEqual([])

      // round trip: everything except junk-after-terminator cases reproduces the bytes
      if (c.expect !== 'warning') expect(serializeID3v1(r.tag)).toEqual(new Uint8Array(tail))
    })
  }

  it('decodes the UTF-8 case with charset auto', () => {
    const data = readFileSync(join(dir, 'id3v1_272_extra.mp3'))
    expect(parseID3v1(data, { charset: 'auto' })!.tag.title).toBe('räksmörgås')
    expect(parseID3v1(readFileSync(join(dir, 'id3v1_271_extra.mp3')), { charset: 'auto' })!.tag.title).toBe('räksmörgås')
  })
})
