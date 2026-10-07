import { ByteReader, ByteWriter } from '../../core/bytes.js'
import {
  type MajorVersion,
  TextEncoding,
  type Utf16State,
  decodeLatin1,
  encodeText,
  isAllowedEncoding,
  readTerminated,
  readToEnd,
  terminatorWidth,
} from '../../core/encoding.js'
import { TagWriteError, type WarningSink } from '../../core/errors.js'
import type { Frame } from './types.js'

export interface DecodeContext {
  major: MajorVersion
  revision: number
  warnings: WarningSink
  frameId: string
  /** Decodes embedded frames (CHAP/CTOC sub-frames, CRM payloads) with the tag's rules. */
  decodeFrames: (data: Uint8Array) => Frame[]
  options: { link23IdLength?: 3 | 4 }
}

export interface EncodeContext {
  major: MajorVersion
  warnings: WarningSink
  strict: boolean
  frameId: string
  /** Encodes embedded frames for CHAP/CTOC. */
  encodeFrames: (frames: Frame[]) => Uint8Array
  /** Byte order for $01 strings. */
  littleEndian?: boolean
}

/** Per-frame decoding state: shared UTF-16 byte order and warning helpers. */
export class FrameReader extends ByteReader {
  readonly utf16: Utf16State = {}
  constructor(
    data: Uint8Array,
    readonly ctx: DecodeContext,
  ) {
    super(data)
  }

  private get dopts() {
    return { warnings: this.ctx.warnings, major: this.ctx.major, frameId: this.ctx.frameId }
  }

  /** Text encoding byte; unknown values warn and fall back to ISO-8859-1. */
  encoding(): TextEncoding {
    const e = this.u8()
    if (!isAllowedEncoding(e, this.ctx.major)) {
      this.ctx.warnings.warn('frame-encoding', `text encoding $${e.toString(16).padStart(2, '0')} is not valid in v2.${this.ctx.major}`, {
        frameId: this.ctx.frameId,
      })
      if (e <= 3) return e as TextEncoding
      return TextEncoding.Latin1
    }
    return e
  }

  /** Terminated string in the given encoding. */
  text(enc: TextEncoding): string {
    return readTerminated(this, enc, this.dopts, this.utf16)
  }

  /** The rest of the frame as one string (a trailing terminator is ignored). */
  textToEnd(enc: TextEncoding): string {
    return readToEnd(this, enc, this.dopts, this.utf16)
  }

  /** Terminated ISO-8859-1 string. */
  latin1(): string {
    return readTerminated(this, TextEncoding.Latin1, this.dopts)
  }

  latin1ToEnd(): string {
    return readToEnd(this, TextEncoding.Latin1, this.dopts)
  }

  /** Fixed-width ISO-8859-1 field, e.g. the 3-byte language. */
  fixed(n: number): string {
    return decodeLatin1(this.bytes(Math.min(n, this.remaining)))
  }

  warn(code: string, message: string): void {
    this.ctx.warnings.warn(code, message, { frameId: this.ctx.frameId })
  }

  /** Extra bytes after the last field: a later revision may have added fields. */
  done(): void {
    if (this.remaining > 0) {
      this.ctx.warnings.note('frame-extra-data', `${this.remaining} unexpected bytes at the end of the frame`, {
        frameId: this.ctx.frameId,
      })
    }
  }
}

export class FrameWriter extends ByteWriter {
  constructor(readonly ctx: EncodeContext) {
    super(64)
  }

  private eopts() {
    const o: { warnings: WarningSink; ucs2: boolean; frameId: string; lenient: boolean; littleEndian?: boolean } = {
      warnings: this.ctx.warnings,
      ucs2: this.ctx.major < 4,
      frameId: this.ctx.frameId,
      lenient: !this.ctx.strict,
    }
    if (this.ctx.littleEndian !== undefined) o.littleEndian = this.ctx.littleEndian
    return o
  }

  encoding(enc: TextEncoding): this {
    if (!isAllowedEncoding(enc, this.ctx.major)) {
      throw new TagWriteError('frame-encoding', `${this.ctx.frameId}: encoding ${enc} is not allowed in v2.${this.ctx.major}`)
    }
    return this.u8(enc)
  }

  text(s: string, enc: TextEncoding, terminate = true): this {
    this.bytes(encodeText(s, enc, this.eopts()))
    if (terminate) this.zeros(terminatorWidth(enc))
    return this
  }

  latin1(s: string, terminate = true): this {
    return this.text(s, TextEncoding.Latin1, terminate)
  }

  /** Fixed-width ISO-8859-1 field such as the 3-byte language; a wrong length warns (throws when strict). */
  fixed(s: string, n: number, what: string): this {
    if (s.length !== n) {
      if (this.ctx.strict) throw new TagWriteError('frame-field', `${this.ctx.frameId}: ${what} must be ${n} characters`)
      this.ctx.warnings.note('frame-field', `${what} "${s}" is not ${n} characters`, { frameId: this.ctx.frameId })
    }
    return this.latin1(s.padEnd(n, ' ').slice(0, n), false)
  }
}
