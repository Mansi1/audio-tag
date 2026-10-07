// Random-access reading and writing of WAV files, the counterpart of partial-aiff.ts: every chunk
// is read except the sound data, which is only copied by range.
import { type RIFFFileWriteOptions, type RIFFReadResult, type RIFFWriteInput, planRIFFFile, riffResult } from '../api/api-riff.js'
import { TagReadError, WarningSink } from '../core/errors.js'
import { type RIFFLayout, RIFFWriteError, addChunk, formEnd, newLayout, riffHeader } from '../riff/chunks.js'
import { readRIFFChunks } from '../riff/file.js'
import { type PlannedWrite, type RandomAccess, headEnd } from './partial-id3.js'

const NOT_RIFF = 'not a WAV file; check the format with detectFormat() and use the matching functions, or read()/write()'
/** Chunks that are copied by range without being read: the sound data. */
const SKIPPED = new Set(['data'])

async function layoutOf(src: RandomAccess, w: WarningSink): Promise<RIFFLayout | undefined> {
  const start = await headEnd(src)
  const riff = riffHeader(await src.read(start, Math.min(12, src.size - start)))
  if (!riff) return undefined
  const layout = newLayout(start, src.size, riff.formSize, w)
  const end = formEnd(layout)
  for (let pos: number | undefined = start + 12; pos !== undefined && pos + 8 <= end; ) {
    const { chunk, next } = addChunk(layout, pos, await src.read(pos, 8), w)
    if (!SKIPPED.has(chunk.id)) chunk.data = await src.read(chunk.start + 8, chunk.size)
    pos = next
  }
  return layout
}

/** Reads the tags of a WAV file without loading the sound data. */
export async function readRIFFRandomAccess(src: RandomAccess, options: { strict?: boolean } = {}): Promise<RIFFReadResult> {
  const w = new WarningSink(options.strict ?? false)
  const layout = await layoutOf(src, w)
  if (!layout) throw new TagReadError('format-not-riff', NOT_RIFF)
  return riffResult(readRIFFChunks(layout, w))
}

/** Plans a WAV tag write without loading the sound data. */
export async function planRIFFFileWrite(src: RandomAccess, input: RIFFWriteInput, options: RIFFFileWriteOptions = {}): Promise<PlannedWrite> {
  const layout = await layoutOf(src, new WarningSink())
  if (!layout) throw new RIFFWriteError('format-not-riff', NOT_RIFF)
  const r = planRIFFFile(layout, readRIFFChunks(layout).tags, input, options)
  return { segments: r.segments, inPlace: r.inPlace, warnings: r.warnings }
}
