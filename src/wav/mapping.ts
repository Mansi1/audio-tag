import type { MajorVersion } from '../core/encoding.js'
import { isLatin1Representable } from '../core/encoding.js'
import type { Warning } from '../core/errors.js'
import { convertID3v2 } from '../id3v2/convert.js'
import { parsePosition } from '../id3v2/frames/text-helpers.js'
import { applyMetadata, getID3v2Metadata } from '../id3v2/mapping.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import type { InfoEntry } from './chunks.js'
import type { WAVAudio, WAVTags } from './file.js'

// tasks/32-wav.md W1-W3: the ID3 chunk holds the metadata; the INFO list is a fallback that is
// kept in step with it. INFO IDs are Picard's RIFF INFO column, plus ISFT.

const STRING_IDS = { title: 'INAM', album: 'IPRD', copyright: 'ICOP', recordingTime: 'ICRD', encodedBy: 'IENC', encoderSettings: 'ISFT' } as const
const LIST_IDS = { artist: 'IART', composer: 'IMUS', genre: 'IGNR', language: 'ILNG' } as const
/** W3: the spec's separator for several values. */
const SEPARATOR = '; '

/** Friendly metadata: the ID3 chunk first, then the INFO list; `length` from fmt/data/fact (W6). */
export function getWAVMetadata(tags: WAVTags, audio?: WAVAudio): Metadata {
  const m: Metadata = tags.id3v2 ? getID3v2Metadata(tags.id3v2) : {}
  const rec = m as Record<string, unknown>
  const info = (id: string) => tags.info?.find((e) => e.id === id && e.value !== '')?.value
  for (const [field, id] of Object.entries(STRING_IDS)) if (rec[field] === undefined && info(id)) rec[field] = info(id)
  for (const [field, id] of Object.entries(LIST_IDS)) if (rec[field] === undefined && info(id)) rec[field] = [info(id)]
  const cmt = info('ICMT')
  if (!m.comments && cmt) m.comments = [{ language: 'XXX', description: '', text: cmt }]
  const trk = info('ITRK')
  if (!m.track && trk) {
    const p = parsePosition(trk)
    if (p.number !== undefined) m.track = { no: p.number, ...(p.total !== undefined ? { of: p.total } : {}) }
  }
  if (m.length === undefined && audio) {
    const { format, dataSize, sampleFrames } = audio
    if (sampleFrames !== undefined && format.sampleRate > 0) m.length = Math.round((sampleFrames * 1000) / format.sampleRate)
    else if (dataSize !== undefined && format.byteRate > 0) m.length = Math.round((dataSize * 1000) / format.byteRate)
  }
  return m
}

/**
 * Applies metadata changes: to the ID3 chunk's tag (created when missing, in `version` or 4), and
 * to the INFO list when the file has one (W2). The input is not modified.
 */
export function applyWAVMetadata(tags: WAVTags, metadata: MetadataUpdate, version?: MajorVersion): { tags: WAVTags; warnings: Warning[] } {
  const warnings: Warning[] = []
  let tag = tags.id3v2
  const major = version ?? tag?.version.major ?? 4
  if (tag && tag.version.major !== major) {
    const c = convertID3v2(tag, major)
    tag = c.tag
    warnings.push(...c.warnings)
  }
  const out: WAVTags = { ...tags }
  const id3 = applyMetadata(tag, metadata, major)
  if (id3.frames.length) out.id3v2 = id3
  else delete out.id3v2

  if (tags.info) {
    const info: InfoEntry[] = tags.info.map((e) => ({ ...e }))
    const set = (id: string, value: string | null | undefined) => {
      if (value === undefined) return
      const i = info.findIndex((e) => e.id === id)
      const kept = info.filter((e) => e.id !== id)
      // W4: the INFO list holds ISO-8859-1; other text stays only in the ID3 chunk.
      if (value !== null && value !== '' && !isLatin1Representable(value)) {
        warnings.push({ code: 'wav-info-latin1', message: `INFO '${id}' can only hold ISO-8859-1 text; the entry is removed and the ID3 chunk keeps the value` })
        value = null
      }
      if (value !== null && value !== '') kept.splice(i < 0 ? kept.length : i, 0, { id, value })
      info.length = 0
      info.push(...kept)
    }
    const has = (k: keyof MetadataUpdate) => Object.prototype.hasOwnProperty.call(metadata, k) && metadata[k] !== undefined
    for (const [field, id] of Object.entries(STRING_IDS)) {
      const k = field as keyof typeof STRING_IDS
      if (has(k)) set(id, metadata[k] ?? null)
    }
    for (const [field, id] of Object.entries(LIST_IDS)) {
      const k = field as keyof typeof LIST_IDS
      if (has(k)) set(id, metadata[k]?.length ? metadata[k]!.join(SEPARATOR) : null)
    }
    if (has('comments')) set('ICMT', metadata.comments?.[0]?.text ?? null)
    if (has('track')) set('ITRK', metadata.track?.no !== undefined ? String(metadata.track.no) : null)
    out.info = info
  }
  return { tags: out, warnings }
}
