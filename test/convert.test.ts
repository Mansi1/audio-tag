import { describe, expect, it } from 'vitest'
import { TextEncoding } from '../src/core/encoding'
import { parseID3v1, serializeID3v1 } from '../src/id3v1/id3v1'
import { convertID3v2, id3v1FromID3v2, id3v2FromID3v1, imageFormatToMime, mimeToImageFormat } from '../src/id3v2/convert'
import type { Frame, FrameOf } from '../src/id3v2/frames/types'
import { readID3v2 } from '../src/id3v2/reader'
import { type ID3v2Tag, createFrame, createTag } from '../src/id3v2/tag'
import { writeID3v2 } from '../src/id3v2/writer'

const text = (t: ID3v2Tag, id: string) => (t.frames.find((f) => f.id === id) as FrameOf<'text'> | undefined)?.values
const ids = (t: ID3v2Tag) => t.frames.map((f) => f.id).sort()

/** Writes and reads back, to prove a converted tag is valid for its version. */
function reread(t: ID3v2Tag): ID3v2Tag {
  const r = readID3v2(writeID3v2(t).bytes)
  if (!r || 'unsupported' in r) throw new Error('no tag')
  expect(r.warnings).toEqual([])
  return r.tag
}

function v22Tag(): ID3v2Tag {
  const L = TextEncoding.Latin1
  const frames: Frame[] = [
    createFrame('text', 'TT2', { encoding: L, values: ['Title'] }, 2),
    createFrame('text', 'TP1', { encoding: TextEncoding.UTF16, values: ['Ärtist'] }, 2),
    createFrame('text', 'TAL', { encoding: L, values: ['Album'] }, 2),
    createFrame('text', 'TYE', { encoding: L, values: ['1999'] }, 2),
    createFrame('text', 'TDA', { encoding: L, values: ['3112'] }, 2),
    createFrame('text', 'TIM', { encoding: L, values: ['2359'] }, 2),
    createFrame('text', 'TCO', { encoding: L, values: ['(4)Eurodisco'] }, 2),
    createFrame('text', 'TRK', { encoding: L, values: ['4/9'] }, 2),
    createFrame('comment', 'COM', { encoding: L, language: 'eng', description: '', text: 'hello' }, 2),
    createFrame('picture', 'PIC', { encoding: L, mimeType: 'JPG', pictureType: 3, description: '', data: Uint8Array.from([0xff, 0xd8]) }, 2),
    createFrame('involved-people', 'IPL', { encoding: L, people: [['producer', 'P'], ['guitar', 'G']] }, 2),
    createFrame('crm', 'CRM', { owner: 'o', explanation: 'x', data: new Uint8Array(1) }, 2),
    createFrame('text', 'TCP', { encoding: L, values: ['1'] }, 2),
  ]
  return createTag(2, frames)
}

describe('version conversion (task 19)', () => {
  it('v2.2 -> v2.3 maps IDs, PIC formats, and drops CRM', () => {
    const { tag, warnings } = convertID3v2(v22Tag(), 3)
    const t = reread(tag)
    expect(ids(t)).toEqual(['APIC', 'COMM', 'IPLS', 'TALB', 'TCMP', 'TCON', 'TDAT', 'TIME', 'TIT2', 'TPE1', 'TRCK', 'TYER'])
    expect((t.frames.find((f) => f.id === 'APIC') as FrameOf<'picture'>).mimeType).toBe('image/jpeg')
    expect(warnings.map((w) => w.frameId)).toEqual(['CRM'])
  })

  it('v2.3 -> v2.4 builds TDRC, converts TCON and IPLS', () => {
    const v23 = convertID3v2(v22Tag(), 3).tag
    const { tag } = convertID3v2(v23, 4, { instrumentNames: ['guitar'] })
    const t = reread(tag)
    expect(text(t, 'TDRC')).toEqual(['1999-12-31T23:59'])
    expect(text(t, 'TCON')).toEqual(['4', 'Eurodisco'])
    expect(text(t, 'TIPL')).toEqual(['producer', 'P'])
    expect(text(t, 'TMCL')).toEqual(['guitar', 'G'])
    expect(ids(t)).not.toContain('TYER')
  })

  it('the full chain keeps everything that has an equivalent', () => {
    const v23 = convertID3v2(v22Tag(), 3).tag
    const v24 = convertID3v2(v23, 4).tag
    const back23 = reread(convertID3v2(v24, 3).tag)
    expect(text(back23, 'TYER')).toEqual(['1999'])
    expect(text(back23, 'TDAT')).toEqual(['3112'])
    expect(text(back23, 'TIME')).toEqual(['2359'])
    expect(text(back23, 'TCON')).toEqual(['(4)Eurodisco'])
    const back22 = reread(convertID3v2(back23, 2).tag)
    expect(ids(back22)).toEqual(['COM', 'IPL', 'PIC', 'TAL', 'TCO', 'TCP', 'TDA', 'TIM', 'TP1', 'TRK', 'TT2', 'TYE'])
    expect((back22.frames.find((f) => f.id === 'PIC') as FrameOf<'picture'>).mimeType).toBe('JPG')
    expect(text(back22, 'TP1')).toEqual(['Ärtist'])
  })

  it('v2.4 -> v2.3 handles v2.4-only frames and encodings', () => {
    const t = createTag(4, [
      createFrame('text', 'TPE1', { encoding: TextEncoding.UTF8, values: ['A', 'B'] }),
      createFrame('text', 'TMOO', { encoding: 0, values: ['Sad'] }),
      createFrame('text', 'TDOR', { encoding: 0, values: ['1980-01-01'] }),
      createFrame('rva2', 'RVA2', { identification: 'track', channels: [{ channelType: 1, adjustment: 1024, bitsRepresentingPeak: 0, peak: 0 }] }),
      createFrame('equ2', 'EQU2', { interpolation: 0, identification: '', points: [] }),
      createFrame('seek', 'SEEK', { minimumOffset: 1 }),
    ])
    const { tag, warnings } = convertID3v2(t, 3)
    const v23 = reread(tag)
    expect(text(v23, 'TPE1')).toEqual(['A/B'])
    expect((v23.frames.find((f) => f.id === 'TPE1') as FrameOf<'text'>).encoding).toBe(TextEncoding.UTF16)
    expect(text(v23, 'TORY')).toEqual(['1980'])
    expect((v23.frames.find((f) => f.id === 'TXXX') as FrameOf<'user-text'>).description).toBe('TMOO')
    expect(ids(v23)).toContain('XRVA')
    expect(warnings.map((w) => w.frameId)).toEqual(expect.arrayContaining(['EQU2', 'SEEK']))
  })

  it('handles TYER without TDAT, and a bad TIME', () => {
    const L = TextEncoding.Latin1
    const a = convertID3v2(createTag(3, [createFrame('text', 'TYER', { encoding: L, values: ['2001'] }, 3)]), 4).tag
    expect(text(a, 'TDRC')).toEqual(['2001'])
    const b = convertID3v2(
      createTag(3, [
        createFrame('text', 'TYER', { encoding: L, values: ['2001'] }, 3),
        createFrame('text', 'TDAT', { encoding: L, values: ['0102'] }, 3),
        createFrame('text', 'TIME', { encoding: L, values: ['99xx'] }, 3),
      ]),
      4,
    ).tag
    expect(text(b, 'TDRC')).toEqual(['2001-02-01'])
  })

  it('splits slash-separated artists only when asked', () => {
    const t = createTag(3, [createFrame('text', 'TPE1', { encoding: 0, values: ['AC/DC'] }, 3)])
    expect(text(convertID3v2(t, 4).tag, 'TPE1')).toEqual(['AC/DC'])
    expect(text(convertID3v2(t, 4, { splitSlashes: true }).tag, 'TPE1')).toEqual(['AC', 'DC'])
  })

  it('converts embedded CHAP sub-frames', () => {
    const t = createTag(3, [
      createFrame('chap', 'CHAP', { elementId: 'c', startTime: 0, endTime: 1, startOffset: 0, endOffset: 0, frames: [createFrame('text', 'TIT2', { encoding: 0, values: ['x'] }, 3)] }, 3),
    ])
    const t4 = reread(convertID3v2(t, 4).tag)
    expect((t4.frames[0] as FrameOf<'chap'>).frames[0]!.id).toBe('TIT2')
    expect(convertID3v2(t, 2).tag.frames).toEqual([])
  })

  it('picture formats', () => {
    expect(imageFormatToMime('PNG')).toBe('image/png')
    expect(imageFormatToMime('JPG')).toBe('image/jpeg')
    expect(mimeToImageFormat('image/jpeg')).toBe('JPG')
    expect(mimeToImageFormat('image/png')).toBe('PNG')
    expect(mimeToImageFormat('-->')).toBe('-->')
  })
})

describe('ID3v1 <-> ID3v2', () => {
  it('derives ID3v1.1 from ID3v2', () => {
    const v24 = convertID3v2(convertID3v2(v22Tag(), 3).tag, 4).tag
    const v1 = id3v1FromID3v2(v24)
    expect(v1).toEqual({ version: '1.1', title: 'Title', artist: 'Ärtist', album: 'Album', year: '1999', comment: 'hello', track: 4, genre: 4 })
    expect(parseID3v1(serializeID3v1(v1))!.tag).toEqual(v1)
  })
  it('builds ID3v2 from ID3v1 for every version', () => {
    const v1 = { version: '1.1' as const, title: 'T', artist: 'A', album: 'B', year: '2003', comment: 'c', track: 12, genre: 7 }
    for (const major of [2, 3, 4] as const) {
      const t = reread(id3v2FromID3v1(v1, major))
      expect(id3v1FromID3v2(t)).toEqual(v1)
    }
  })
})
