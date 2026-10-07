import { getFLACMetadata, applyFLACMetadata } from '../flac/mapping.js'
import type { Metadata, MetadataUpdate } from '../metadata/metadata.js'
import type { OggStream, OggTags } from './file.js'

// The comment fields map as for FLAC (tasks/30-flac.md F1, F2, F7); pictures are the
// METADATA_BLOCK_PICTURE fields (tasks/33-ogg.md G3).

/** Friendly metadata from Ogg tags; `length` from the last granule position (G6). */
export function getOggMetadata(tags: OggTags, stream?: OggStream, granule?: bigint): Metadata {
  const m = getFLACMetadata({ vorbis: tags.vorbis, pictures: tags.pictures })
  if (stream && granule !== undefined && stream.sampleRate > 0) {
    // SPEC: RFC 7845 §4: Opus granule positions count 48 kHz samples, including the pre-skip.
    const samples = Number(granule) - (stream.preSkip ?? 0)
    if (samples > 0) m.length = Math.round((samples * 1000) / stream.sampleRate)
  }
  return m
}

/** Applies metadata changes to Ogg tags. The input is not modified. */
export function applyOggMetadata(tags: OggTags, metadata: MetadataUpdate): OggTags {
  const r = applyFLACMetadata({ vorbis: tags.vorbis, pictures: tags.pictures }, metadata)
  return { vorbis: r.vorbis ?? tags.vorbis, pictures: r.pictures }
}
