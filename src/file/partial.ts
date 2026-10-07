// Random-access reading and writing for every supported file: a switch on the detected format sends
// each format to its partial-*.ts module, as api/api.ts does for whole files.
import { type ReadResult, type WriteInput, type WriteOptions, toAIFFInput, toAIFFOptions, toFLACInput, toFLACOptions, toID3Input, toMP4Input, toMP4Options, toOggInput, toOggOptions, toRIFFInput, toRIFFOptions, unknownFormat } from '../api/api.js'
import { assertNever } from '../core/errors.js'
import type { LocateOptions } from './layout.js'
import { planAIFFFileWrite, readAIFFRandomAccess } from './partial-aiff.js'
import { planFLACFileWrite, readFLACRandomAccess } from './partial-flac.js'
import { type PlannedWrite, type RandomAccess, detectRandomAccessFormat, planID3FileWrite, readID3RandomAccess } from './partial-id3.js'
import { planMP4FileWrite, readMP4RandomAccess } from './partial-mp4.js'
import { planOggFileWrite, readOggRandomAccess } from './partial-ogg.js'
import { planRIFFFileWrite, readRIFFRandomAccess } from './partial-riff.js'

/** Reads the tags of any supported file, loading only the tag regions (or the metadata) of large files. */
export async function readRandomAccess(src: RandomAccess, options: LocateOptions = {}): Promise<ReadResult> {
  const format = await detectRandomAccessFormat(src)
  const strict = options.strict ? { strict: true } : {}
  switch (format) {
    case 'mpeg':
      return { ...(await readID3RandomAccess(src, options)), format }
    case 'mp4':
      return readMP4RandomAccess(src, strict)
    case 'flac':
      return readFLACRandomAccess(src, strict)
    case 'ogg':
      return readOggRandomAccess(src, strict)
    case 'aiff':
      return readAIFFRandomAccess(src, strict)
    case 'riff':
      return readRIFFRandomAccess(src, strict)
    case 'unknown':
      throw unknownFormat()
    default:
      return assertNever(format)
  }
}

/** Plans a write into any supported file without loading the audio of large files. */
export async function planWrite(src: RandomAccess, input: WriteInput, options: WriteOptions = {}): Promise<PlannedWrite> {
  const format = await detectRandomAccessFormat(src)
  switch (format) {
    case 'mpeg':
      return planID3FileWrite(src, toID3Input(input), options)
    case 'mp4':
      return planMP4FileWrite(src, toMP4Input(input), toMP4Options(options))
    case 'flac':
      return planFLACFileWrite(src, toFLACInput(input), toFLACOptions(options))
    case 'ogg':
      return planOggFileWrite(src, toOggInput(input), toOggOptions(options))
    case 'aiff':
      return planAIFFFileWrite(src, toAIFFInput(input), toAIFFOptions(options))
    case 'riff':
      return planRIFFFileWrite(src, toRIFFInput(input), toRIFFOptions(options))
    case 'unknown':
      throw unknownFormat()
    default:
      return assertNever(format)
  }
}
