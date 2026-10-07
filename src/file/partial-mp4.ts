// Random-access reading and writing of MP4/M4A files, the counterpart of partial-id3.ts: large
// files are handled from their atom headers and movie atom, without loading the media data.
import { asciiString } from '../core/bytes.js'
import { TagReadError, WarningSink } from '../core/errors.js'
import { type MP4FileWriteResult, type MP4ReadResult, type MP4WriteInput, mp4Input, readMP4File, writeMP4File } from '../api/api-mp4.js'
import { getMP4Metadata } from '../mp4/mapping.js'
import { MP4WriteError, type AtomHeader } from '../mp4/atoms.js'
import { type MP4WriteOptions, planMP4Write, readMP4Parts } from '../mp4/file.js'
import { type PlannedWrite, type RandomAccess, WHOLE_FILE_LIMIT, isMP4 } from './partial-id3.js'

/** Top-level MP4 atom headers, read 16 bytes at a time, and the movie atom bytes. */
async function mp4Parts(src: RandomAccess): Promise<{ top: AtomHeader[]; moov?: Uint8Array }> {
  const top: AtomHeader[] = []
  let pos = 0
  while (pos + 8 <= src.size) {
    const h = await src.read(pos, Math.min(16, src.size - pos))
    const size32 = ((h[0]! << 24) | (h[1]! << 16) | (h[2]! << 8) | h[3]!) >>> 0
    const type = asciiString(h.subarray(4, 8))
    let end: number
    let headerSize: 8 | 16 = 8
    let sizeField: AtomHeader['sizeField'] = 'normal'
    if (size32 === 1 && h.length >= 16) {
      end = pos + (((h[8]! << 24) | (h[9]! << 16) | (h[10]! << 8) | h[11]!) >>> 0) * 2 ** 32 + (((h[12]! << 24) | (h[13]! << 16) | (h[14]! << 8) | h[15]!) >>> 0)
      headerSize = 16
      sizeField = 'extended'
    } else if (size32 === 0) {
      end = src.size
      sizeField = 'to-end'
    } else end = pos + size32
    if (end <= pos || end > src.size) break
    top.push({ type, start: pos, end, headerSize, sizeField })
    pos = end
  }
  const moov = top.find((a) => a.type === 'moov')
  return moov ? { top, moov: await src.read(moov.start, moov.end - moov.start) } : { top }
}

const NOT_MP4 = 'not an MP4/M4A file; check the format with detectFormat() and use the ID3 functions for other files'

/** Reads the metadata of an MP4/M4A file, loading only the atom headers and movie atom of large files. */
export async function readMP4RandomAccess(src: RandomAccess, options: { strict?: boolean } = {}): Promise<MP4ReadResult> {
  if (!(await isMP4(src))) throw new TagReadError('format-not-mp4', NOT_MP4)
  if (src.size <= WHOLE_FILE_LIMIT) return readMP4File(await src.read(0, src.size), options)
  const parts = await mp4Parts(src)
  const m = readMP4Parts(parts.top, parts.moov, new WarningSink(options.strict ?? false))
  return { format: 'mp4', mp4: m.tags, metadata: getMP4Metadata(m.tags), layout: m.layout, warnings: m.warnings }
}

/** Plans an MP4/M4A metadata write without loading the media data of large files. */
export async function planMP4FileWrite(src: RandomAccess, input: MP4WriteInput, options: MP4WriteOptions = {}): Promise<PlannedWrite> {
  if (!(await isMP4(src))) throw new MP4WriteError('format-not-mp4', NOT_MP4)
  if (src.size <= WHOLE_FILE_LIMIT) {
    const r: MP4FileWriteResult = writeMP4File(await src.read(0, src.size), input, options)
    return { segments: [r.bytes], inPlace: r.inPlace, warnings: r.warnings }
  }
  const parts = await mp4Parts(src)
  const tags = mp4Input(readMP4Parts(parts.top, parts.moov).tags, input)
  const r = planMP4Write(parts.top, parts.moov, src.size, tags, options)
  return { segments: r.segments, inPlace: r.inPlace, warnings: r.warnings }
}
