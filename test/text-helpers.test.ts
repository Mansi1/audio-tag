import { describe, expect, it } from 'vitest'
import { declaredIds, defaultDiscardOnFileAlter, mapFrameId } from '../src/id3v2/frames/registry'
import { etcoEventName } from '../src/id3v2/frames/tables'
import {
  contentTypeNames,
  formatContentType,
  formatITunNorm,
  formatTimestamp,
  isValidKey,
  parseContentType,
  parseContentTypeV23,
  parseITunNorm,
  parseMediaType,
  parsePosition,
  parseTimestamp,
} from '../src/id3v2/frames/text-helpers'

describe('content type (TCON)', () => {
  it('parses every example from v2.3 §4.2.1', () => {
    expect(parseContentTypeV23('(21)')).toEqual([{ kind: 'genre', id: 21, name: 'Ska' }])
    expect(contentTypeNames(parseContentTypeV23('(4)Eurodisco'))).toEqual(['Disco', 'Eurodisco'])
    expect(contentTypeNames(parseContentTypeV23('(51)(39)'))).toEqual(['Techno-Industrial', 'Noise'])
    expect(parseContentTypeV23('((I can figure out any genre)')).toEqual([{ kind: 'text', value: '(I can figure out any genre)' }])
    expect(contentTypeNames(parseContentTypeV23('(55)((I think...)'))).toEqual(['Dream', '(I think...)'])
    expect(parseContentTypeV23('(RX)')).toEqual([{ kind: 'keyword', value: 'RX' }])
  })
  it('round-trips the v2.3 syntax', () => {
    for (const s of ['(21)', '(4)Eurodisco', '(51)(39)', '((I can figure out any genre)', '(55)((I think...)', '(RX)(CR)']) {
      expect(formatContentType(parseContentTypeV23(s), 3)).toEqual([s])
    }
  })
  it('parses v2.4 values and accepts the v2.3 style (D9)', () => {
    expect(contentTypeNames(parseContentType(['21', 'Eurodisco'], 4))).toEqual(['Ska', 'Eurodisco'])
    expect(contentTypeNames(parseContentType(['(17)'], 4))).toEqual(['Rock'])
    expect(formatContentType(parseContentType(['21', 'RX', 'x'], 4), 4)).toEqual(['21', 'RX', 'x'])
  })
})

describe('other text helpers', () => {
  it('track and part of a set', () => {
    expect(parsePosition('4/9')).toEqual({ number: 4, total: 9 })
    expect(parsePosition('4')).toEqual({ number: 4 })
  })
  it('timestamps follow the v2.4 ISO-8601 subset', () => {
    for (const s of ['2004', '2004-05', '2004-05-06', '2004-05-06T07', '2004-05-06T07:08', '2004-05-06T07:08:09']) {
      expect(formatTimestamp(parseTimestamp(s)!)).toBe(s)
    }
    expect(parseTimestamp('2004-13')).toBeUndefined()
    expect(parseTimestamp('2004-05-06 07:08')).toBeUndefined()
  })
  it('initial key', () => {
    for (const k of ['A', 'Dbm', 'F#', 'o', 'Cbm']) expect(isValidKey(k)).toBe(true)
    for (const k of ['H', 'Abmm', 'om', '']) expect(isValidKey(k)).toBe(false)
  })
  it('media type references', () => {
    expect(parseMediaType('(MC) with four channels')).toEqual({ references: ['MC'], refinement: ' with four channels' })
    expect(parseMediaType('(VID/PAL/VHS)')).toEqual({ references: ['VID/PAL/VHS'] })
    expect(parseMediaType('VID/PAL/VHS')).toEqual({ references: ['VID/PAL/VHS'] })
  })
  it('iTunNORM', () => {
    const sample = ' 00001E86 00001E86 0000A2A3 0000A2A3 000006A6 000006A6 000078FA 000078FA 00000211 00000211'
    const v = parseITunNorm(sample)!
    expect(v).toHaveLength(10)
    expect(v[0]).toBe(0x1e86)
    expect(formatITunNorm(v)).toBe(sample)
  })
  it('ETCO event names per version', () => {
    expect(etcoEventName(0x0d, 2)).toBe('unwanted noise (Snap, Crackle & Pop)')
    expect(etcoEventName(0x0e, 2)).toBeUndefined()
    expect(etcoEventName(0x14, 3)).toBe('theme end')
    expect(etcoEventName(0x15, 3)).toBeUndefined()
    expect(etcoEventName(0x16, 4)).toBe('profanity end')
    expect(etcoEventName(0xe3, 4)).toBe('not predefined synch 3')
  })
})

describe('frame registry (task 07)', () => {
  // The declared-frame indexes of each spec, copied literally.
  const v22 =
    'BUF CNT COM CRA CRM ETC EQU GEO IPL LNK MCI MLL PIC POP REV RVA SLT STC TAL TBP TCM TCO TCR TDA TDY TEN TFT TIM TKE TLA TLE TMT TOA TOF TOL TOR TOT TP1 TP2 TP3 TP4 TPA TPB TRC TRD TRK TSI TSS TT1 TT2 TT3 TXT TXX TYE UFI ULT WAF WAR WAS WCM WCP WPB WXX'
  const v23 =
    'AENC APIC COMM COMR ENCR EQUA ETCO GEOB GRID IPLS LINK MCDI MLLT OWNE PRIV PCNT POPM POSS RBUF RVAD RVRB SYLT SYTC TALB TBPM TCOM TCON TCOP TDAT TDLY TENC TEXT TFLT TIME TIT1 TIT2 TIT3 TKEY TLAN TLEN TMED TOAL TOFN TOLY TOPE TORY TOWN TPE1 TPE2 TPE3 TPE4 TPOS TPUB TRCK TRDA TRSN TRSO TSIZ TSRC TSSE TYER TXXX UFID USER USLT WCOM WCOP WOAF WOAR WOAS WORS WPAY WPUB WXXX'
  const v24 =
    'AENC APIC ASPI COMM COMR ENCR EQU2 ETCO GEOB GRID LINK MCDI MLLT OWNE PRIV PCNT POPM POSS RBUF RVA2 RVRB SEEK SIGN SYLT SYTC TALB TBPM TCOM TCON TCOP TDEN TDLY TDOR TDRC TDRL TDTG TENC TEXT TFLT TIPL TIT1 TIT2 TIT3 TKEY TLAN TLEN TMCL TMED TMOO TOAL TOFN TOLY TOPE TOWN TPE1 TPE2 TPE3 TPE4 TPOS TPRO TPUB TRCK TRSN TRSO TSOA TSOP TSOT TSRC TSSE TSST TXXX UFID USER USLT WCOM WCOP WOAF WOAR WOAS WORS WPAY WPUB WXXX'
  const sorted = (s: string) => s.split(' ').sort()
  it('declares exactly the frames of each spec', () => {
    expect(declaredIds(2).sort()).toEqual(sorted(v22))
    expect(declaredIds(3).sort()).toEqual(sorted(v23))
    expect(declaredIds(4).sort()).toEqual(sorted(v24))
    expect([sorted(v22).length, sorted(v23).length, sorted(v24).length]).toEqual([63, 74, 83])
  })
  it('includes the addenda for v2.3 and v2.4', () => {
    expect(declaredIds(4, ['chapters-addendum', 'accessibility-addendum']).sort()).toEqual(['ATXT', 'CHAP', 'CTOC'])
  })
  it('maps IDs between versions', () => {
    expect(mapFrameId('TT2', 2, 4)).toBe('TIT2')
    expect(mapFrameId('PIC', 2, 3)).toBe('APIC')
    expect(mapFrameId('TYER', 3, 4)).toBeUndefined()
    expect(mapFrameId('TCP', 2, 4)).toBe('TCMP')
    expect(mapFrameId('TSOT', 4, 2)).toBe('TST')
  })
  it('default flag classes (v2.3 §3.3.2, v2.4 frames §3)', () => {
    const v23c3 = 'AENC ETCO EQUA MLLT POSS SYLT SYTC RVAD TENC TLEN TSIZ'.split(' ')
    const v24c3 = 'ASPI AENC ETCO EQU2 MLLT POSS SEEK SYLT SYTC RVA2 TENC TLEN'.split(' ')
    expect(declaredIds(3).filter((id) => defaultDiscardOnFileAlter(id, 3)).sort()).toEqual(v23c3.sort())
    expect(declaredIds(4).filter((id) => defaultDiscardOnFileAlter(id, 4)).sort()).toEqual(v24c3.sort())
  })
})
