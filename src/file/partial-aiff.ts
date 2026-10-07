// Random-access reading and writing of AIFF files, the counterpart of partial-id3.ts: every chunk
// is read except the Sound Data Chunk, which is only copied by range.
import { type AIFFFileWriteOptions, type AIFFReadResult, type AIFFWriteInput, aiffResult, planAIFFFile } from '../api/api-aiff.js'
import { type AIFFLayout, AIFFWriteError, addChunk, formEnd, formHeader, newLayout } from '../aiff/chunks.js'
import { readAIFFChunks } from '../aiff/file.js'
import { TagReadError, WarningSink } from '../core/errors.js'
import { type PlannedWrite, type RandomAccess, headEnd } from './partial-id3.js'

const NOT_AIFF = 'not an AIFF file; check the format with detectFormat() and use the matching functions, or read()/write()'
/** Chunks that are copied by range without being read: the sound data. */
const SKIPPED = new Set(['SSND'])

async function layoutOf(src: RandomAccess, w: WarningSink): Promise<AIFFLayout | undefined> {
  const start = await headEnd(src)
  const form = formHeader(await src.read(start, Math.min(12, src.size - start)))
  if (!form) return undefined
  const layout = newLayout(start, src.size, form, w)
  const end = formEnd(layout)
  for (let pos: number | undefined = start + 12; pos !== undefined && pos + 8 <= end; ) {
    const { chunk, next } = addChunk(layout, pos, await src.read(pos, 8), w)
    if (!SKIPPED.has(chunk.id)) chunk.data = await src.read(chunk.start + 8, chunk.size)
    pos = next
  }
  return layout
}

/** Reads the tags of an AIFF file without loading the sound data. */
export async function readAIFFRandomAccess(src: RandomAccess, options: { strict?: boolean } = {}): Promise<AIFFReadResult> {
  const w = new WarningSink(options.strict ?? false)
  const layout = await layoutOf(src, w)
  if (!layout) throw new TagReadError('format-not-aiff', NOT_AIFF)
  return aiffResult(readAIFFChunks(layout, w))
}

/** Plans an AIFF tag write without loading the sound data. */
export async function planAIFFFileWrite(src: RandomAccess, input: AIFFWriteInput, options: AIFFFileWriteOptions = {}): Promise<PlannedWrite> {
  const layout = await layoutOf(src, new WarningSink())
  if (!layout) throw new AIFFWriteError('format-not-aiff', NOT_AIFF)
  const r = planAIFFFile(layout, readAIFFChunks(layout).tags, input, options)
  return { segments: r.segments, inPlace: r.inPlace, warnings: r.warnings }
}
