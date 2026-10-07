// Random-access reading and writing of WAV files, the counterpart of partial-aiff.ts: every chunk
// is read except the sound data, which is only copied by range.
import { type WAVFileWriteOptions, type WAVReadResult, type WAVWriteInput, planWAVFile, wavResult } from '../api/api-wav.js'
import { TagReadError, WarningSink } from '../core/errors.js'
import { type WAVLayout, WAVWriteError, addChunk, formEnd, newLayout, riffHeader } from '../wav/chunks.js'
import { readWAVChunks } from '../wav/file.js'
import { type PlannedWrite, type RandomAccess, headEnd } from './partial-id3.js'

const NOT_WAV = 'not a WAV file; check the format with detectFormat() and use the matching functions, or read()/write()'
/** Chunks that are copied by range without being read: the sound data. */
const SKIPPED = new Set(['data'])

async function layoutOf(src: RandomAccess, w: WarningSink): Promise<WAVLayout | undefined> {
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
export async function readWAVRandomAccess(src: RandomAccess, options: { strict?: boolean } = {}): Promise<WAVReadResult> {
  const w = new WarningSink(options.strict ?? false)
  const layout = await layoutOf(src, w)
  if (!layout) throw new TagReadError('format-not-wav', NOT_WAV)
  return wavResult(readWAVChunks(layout, w))
}

/** Plans a WAV tag write without loading the sound data. */
export async function planWAVFileWrite(src: RandomAccess, input: WAVWriteInput, options: WAVFileWriteOptions = {}): Promise<PlannedWrite> {
  const layout = await layoutOf(src, new WarningSink())
  if (!layout) throw new WAVWriteError('format-not-wav', NOT_WAV)
  const r = planWAVFile(layout, readWAVChunks(layout).tags, input, options)
  return { segments: r.segments, inPlace: r.inPlace, warnings: r.warnings }
}
