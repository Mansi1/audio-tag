// Random-access reading and writing of Ogg files, the counterpart of the other partial-*.ts files:
// the header pages and the end of the file are read; the audio pages only when they must be
// renumbered (tasks/33-ogg.md G5).
import { type OggFileWriteOptions, type OggReadResult, type OggWriteInput, oggInput, oggResult } from '../api/api-ogg.js'
import { TagReadError, WarningSink } from '../core/errors.js'
import { NeedMoreData, type ReadOggResult, lastGranule, planOggWrite, readOggHead } from '../ogg/file.js'
import { OggWriteError } from '../ogg/page.js'
import { detectRandomAccessFormat, type PlannedWrite, type RandomAccess } from './partial-id3.js'

const NOT_OGG = 'not an Ogg file; check the format with detectFormat() and use the matching functions, or read()/write()'
/** Bytes read from the end of the file for the last granule position (an Ogg page is at most 65307 bytes). */
const TAIL = 65536 + 27 + 255

/** The start of the file, read in growing steps until it holds all header pages. */
async function headOf(src: RandomAccess, strict: boolean): Promise<{ head: Uint8Array; r: ReadOggResult }> {
  for (let n = 64 * 1024; ; n *= 4) {
    const head = await src.read(0, Math.min(n, src.size))
    try {
      return { head, r: readOggHead(head, new WarningSink(strict)) }
    } catch (e) {
      if (!(e instanceof NeedMoreData)) throw e
      if (head.length >= src.size) throw new TagReadError('ogg-truncated', 'the file ends inside the Ogg header pages')
    }
  }
}

/** Reads the comment header of an Ogg file without loading the audio pages. */
export async function readOggRandomAccess(src: RandomAccess, options: { strict?: boolean } = {}): Promise<OggReadResult> {
  if ((await detectRandomAccessFormat(src)) !== 'ogg') throw new TagReadError('format-not-ogg', NOT_OGG)
  const { r } = await headOf(src, options.strict ?? false)
  const from = Math.max(r.layout.headerEnd, src.size - TAIL)
  return oggResult(r, lastGranule(await src.read(from, src.size - from), r.stream.serial))
}

/** Plans an Ogg tag write; only the header pages are read, unless the following pages must be renumbered. */
export async function planOggFileWrite(src: RandomAccess, input: OggWriteInput, options: OggFileWriteOptions = {}): Promise<PlannedWrite> {
  if ((await detectRandomAccessFormat(src)) !== 'ogg') throw new OggWriteError('format-not-ogg', NOT_OGG)
  const { head, r } = await headOf(src, options.strict ?? false)
  const tags = oggInput(r.tags, input)
  let p = planOggWrite(head, src.size, r, tags)
  if (p.needsWholeFile) p = planOggWrite(await src.read(0, src.size), src.size, r, tags)
  return { segments: p.segments, inPlace: p.inPlace, warnings: p.warnings }
}
