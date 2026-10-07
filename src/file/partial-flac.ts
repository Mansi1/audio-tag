// Random-access reading and writing of FLAC files, the counterpart of partial-id3.ts and
// partial-mp4.ts: only the metadata blocks in front of the first audio frame are read.
import { startsWith } from '../core/bytes.js'
import { TagReadError, WarningSink } from '../core/errors.js'
import { type FLACFileWriteResult, type FLACReadResult, type FLACWriteInput, flacInput, flacResult } from '../api/api-flac.js'
import { FLACWriteError, parseBlockHeader } from '../flac/blocks.js'
import { type FLACWriteOptions, planFLACWrite, readFLACHead } from '../flac/file.js'
import { type PlannedWrite, type RandomAccess, detectRandomAccessFormat, headEnd } from './partial-id3.js'

export type { FLACFileWriteResult }

const NOT_FLAC = 'not a FLAC file; check the format with detectFormat() and use the matching functions, or read()/write()'

/** The file up to the first audio frame: ID3v2 tags in front, "fLaC" and the metadata blocks. */
async function flacHead(src: RandomAccess): Promise<Uint8Array> {
  const start = await headEnd(src)
  if (!startsWith(await src.read(start, 4), 'fLaC')) return src.read(0, Math.min(src.size, start + 4))
  // SPEC: docs/flac/rfc9639.txt §8.1: walk the block headers until the last-block flag.
  let pos = start + 4
  while (pos + 4 <= src.size) {
    const h = parseBlockHeader(await src.read(pos, 4))
    pos += 4 + h.size
    if (h.last) break
  }
  return src.read(0, Math.min(pos, src.size))
}

/** Reads the Vorbis comments and pictures of a FLAC file without loading the audio. */
export async function readFLACRandomAccess(src: RandomAccess, options: { strict?: boolean } = {}): Promise<FLACReadResult> {
  if ((await detectRandomAccessFormat(src)) !== 'flac') throw new TagReadError('format-not-flac', NOT_FLAC)
  return flacResult(readFLACHead(await flacHead(src), new WarningSink(options.strict ?? false)))
}

/** Plans a FLAC metadata write without loading the audio. */
export async function planFLACFileWrite(src: RandomAccess, input: FLACWriteInput, options: FLACWriteOptions = {}): Promise<PlannedWrite> {
  if ((await detectRandomAccessFormat(src)) !== 'flac') throw new FLACWriteError('format-not-flac', NOT_FLAC)
  const head = await flacHead(src)
  const r = planFLACWrite(head, src.size, flacInput(readFLACHead(head).tags, input), options)
  return { segments: r.segments, inPlace: r.inPlace, warnings: r.warnings }
}
