/** A problem found while reading or writing. Collected instead of thrown unless `strict` is set. */
export interface Warning {
  code: string
  message: string
  /** Byte offset in the input, when known. */
  offset?: number
  /** Frame ID the warning belongs to, when known. */
  frameId?: string
}

/** Thrown by readers in strict mode, and for malformed input that cannot be recovered. */
export class TagReadError extends Error {
  override name = 'TagReadError'
  constructor(
    public readonly code: string,
    message: string,
    public readonly offset?: number,
  ) {
    super(message)
  }
}

/** Thrown by writers when the result would break a MUST in the spec. */
export class TagWriteError extends Error {
  override name = 'TagWriteError'
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Collects warnings; in strict mode the first warning becomes a {@link TagReadError}. */
export class WarningSink {
  readonly list: Warning[] = []
  constructor(readonly strict = false) {}

  warn(code: string, message: string, extra: { offset?: number; frameId?: string } = {}): void {
    if (this.strict) throw new TagReadError(code, message, extra.offset)
    const w: Warning = { code, message }
    if (extra.offset !== undefined) w.offset = extra.offset
    if (extra.frameId !== undefined) w.frameId = extra.frameId
    this.list.push(w)
  }

  /** Records a warning that never throws, even in strict mode. */
  note(code: string, message: string, extra: { offset?: number; frameId?: string } = {}): void {
    const w: Warning = { code, message }
    if (extra.offset !== undefined) w.offset = extra.offset
    if (extra.frameId !== undefined) w.frameId = extra.frameId
    this.list.push(w)
  }
}

/** Thrown for input the library recognises but does not support yet, such as FLAC's Vorbis comments. */
export class NotImplementedError extends Error {
  override name = 'NotImplementedError'
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
  }
}

/** Thrown by read()/write() when the data is not a recognised audio format (detectFormat() says 'unknown'). */
export class UnknownFormatError extends Error {
  override name = 'UnknownFormatError'
  readonly code = 'format-unknown'
}

/** Exhaustiveness check for switch statements: compiling fails when a case is missing. */
export function assertNever(value: never): never {
  throw new Error(`unexpected value: ${String(value)}`)
}
