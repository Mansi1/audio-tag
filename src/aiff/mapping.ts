import type { MajorVersion } from '../core/encoding.js'
import type { Warning } from '../core/errors.js'
import { convertID3v2 } from '../id3v2/convert.js'
import { applyMetadata, getID3v2Metadata } from '../id3v2/mapping.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import { type CommonChunk, isASCII } from './chunks.js'
import type { AIFFTags } from './file.js'

// The ID3 chunk holds the metadata; the text chunks are fallbacks that are
// kept in step with it.

/** Friendly metadata: the ID3 chunk first, then NAME, AUTH, (c), COMT and ANNO; `length` from COMM (A5). */
export function getAIFFMetadata(tags: AIFFTags, common?: CommonChunk): Metadata {
  const m: Metadata = tags.id3v2 ? getID3v2Metadata(tags.id3v2) : {}
  if (!m.title && tags.name) m.title = tags.name
  if (!m.artist && tags.author) m.artist = [tags.author]
  if (!m.copyright && tags.copyright) m.copyright = tags.copyright
  const texts = [...tags.comments.map((c) => c.text), ...tags.annotations].filter((t) => t !== '')
  if (!m.comments && texts.length) m.comments = texts.map((text) => ({ language: 'XXX', description: '', text }))
  if (m.length === undefined && common && common.sampleRate > 0 && common.sampleFrames > 0) {
    m.length = Math.round((common.sampleFrames * 1000) / common.sampleRate)
  }
  return m
}

/**
 * Applies metadata changes: to the ID3 chunk's tag (created when missing, in `version` or 4), and to
 * the NAME, AUTH and (c) chunks the file already has. The input is not modified.
 */
export function applyAIFFMetadata(tags: AIFFTags, metadata: MetadataUpdate, version?: MajorVersion): { tags: AIFFTags; warnings: Warning[] } {
  const warnings: Warning[] = []
  let tag = tags.id3v2
  const major = version ?? tag?.version.major ?? 4
  if (tag && tag.version.major !== major) {
    const c = convertID3v2(tag, major)
    tag = c.tag
    warnings.push(...c.warnings)
  }
  const out: AIFFTags = { ...tags, annotations: [...tags.annotations], comments: [...tags.comments] }
  const id3 = applyMetadata(tag, metadata, major)
  if (id3.frames.length) out.id3v2 = id3
  else delete out.id3v2

  // A2/A3: keep existing text chunks in step; a value that is not ASCII removes the chunk.
  const text = (key: 'name' | 'author' | 'copyright', id: string, value: string | null | undefined) => {
    if (value === undefined || out[key] === undefined) return
    if (value !== null && isASCII(value)) out[key] = value
    else {
      delete out[key]
      if (value !== null) warnings.push({ code: 'aiff-text-ascii', message: `'${id}' can only hold ASCII; the chunk is removed and the ID3 chunk keeps the value` })
    }
  }
  text('name', 'NAME', metadata.title)
  text('author', 'AUTH', metadata.artist === undefined ? undefined : metadata.artist?.length ? metadata.artist.join(', ') : null)
  text('copyright', '(c) ', metadata.copyright)
  return { tags: out, warnings }
}
