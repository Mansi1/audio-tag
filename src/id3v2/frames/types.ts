import type { TextEncoding } from '../../core/encoding.js'
import type { FrameFlags } from '../frame-header.js'

/**
 * Every frame stores its ID exactly as in the tag ("TT2" in v2.2, "TIT2" in v2.3/v2.4) and its
 * flags. Field names follow the spec; the spec section is noted on each type.
 */
interface Base<T extends string> {
  type: T
  id: string
  flags: FrameFlags
}

/** Timestamp format used by ETCO, SYTC, SYLT and POSS: 1 = MPEG frames, 2 = milliseconds. */
export type TimestampFormat = number

/** T000-TZZZ except TXXX. v2.4 §4.2, v2.3 §4.2, v2.2 §4.2. */
export interface TextFrame extends Base<'text'> {
  encoding: TextEncoding
  /** v2.4: null-separated values. v2.2/v2.3: exactly one value. */
  values: string[]
}

/** TXXX / TXX. v2.4 §4.2.6, v2.3 §4.2.2, v2.2 §4.2.2. */
export interface UserTextFrame extends Base<'user-text'> {
  encoding: TextEncoding
  description: string
  /** v2.4 may hold several null-separated values; v2.2/v2.3 hold one. */
  values: string[]
}

/** W000-WZZZ except WXXX. Always ISO-8859-1. */
export interface UrlFrame extends Base<'url'> {
  url: string
}

/** WXXX / WXX. The URL is always ISO-8859-1. */
export interface UserUrlFrame extends Base<'user-url'> {
  encoding: TextEncoding
  description: string
  url: string
}

/** IPLS (v2.3 §4.4) / IPL (v2.2 §4.4): involvement, involvee pairs. */
export interface InvolvedPeopleFrame extends Base<'involved-people'> {
  encoding: TextEncoding
  people: [involvement: string, involvee: string][]
}

/** UFID / UFI. v2.4 §4.1. */
export interface UniqueFileIdFrame extends Base<'ufid'> {
  owner: string
  /** Up to 64 bytes. */
  identifier: Uint8Array
}

/** MCDI / MCI: binary CD table of contents. v2.4 §4.4. */
export interface MusicCdIdFrame extends Base<'mcdi'> {
  toc: Uint8Array
}

export interface TimingEvent {
  /** Event type byte ($00-$FF), see ETCO_EVENT_TYPES. */
  type: number
  /** Number of $FF bytes that preceded the type ("one more byte of events follows"). */
  ffPrefix?: number
  timestamp: number
}

/** ETCO / ETC. v2.4 §4.5. */
export interface EventTimingFrame extends Base<'etco'> {
  timestampFormat: TimestampFormat
  events: TimingEvent[]
}

/** MLLT / MLL. v2.4 §4.6. */
export interface MpegLookupFrame extends Base<'mllt'> {
  framesBetweenReference: number
  bytesBetweenReference: number
  millisecondsBetweenReference: number
  bitsForBytesDeviation: number
  bitsForMillisecondsDeviation: number
  references: { bytesDeviation: number; millisecondsDeviation: number }[]
}

/** SYTC / STC. v2.4 §4.7. BPM 0 = beat-free, 1 = single beat, 2-510 = tempo. */
export interface SyncTempoFrame extends Base<'sytc'> {
  timestampFormat: TimestampFormat
  tempos: { bpm: number; timestamp: number }[]
}

/** USLT / ULT. v2.4 §4.8. */
export interface UnsyncLyricsFrame extends Base<'uslt'> {
  encoding: TextEncoding
  /** ISO-639-2 code, three characters. */
  language: string
  description: string
  text: string
}

/** SYLT / SLT. v2.4 §4.9. */
export interface SyncLyricsFrame extends Base<'sylt'> {
  encoding: TextEncoding
  language: string
  timestampFormat: TimestampFormat
  /** See SYLT_CONTENT_TYPES. */
  contentType: number
  description: string
  entries: { text: string; timestamp: number }[]
}

/** COMM / COM. v2.4 §4.10. */
export interface CommentFrame extends Base<'comment'> {
  encoding: TextEncoding
  language: string
  description: string
  text: string
}

export type RvadChannel = 'right' | 'left' | 'rightBack' | 'leftBack' | 'center' | 'bass'

/** RVAD (v2.3 §4.12) / RVA (v2.2 §4.12). Values are raw integers of `bitsUsed` bits. */
export interface RelativeVolumeFrame extends Base<'rvad'> {
  bitsUsed: number
  channels: { channel: RvadChannel; increment: boolean; change: number | bigint; peak?: number | bigint }[]
}

/** RVA2 (v2.4 §4.11), also XRVA (Experimental RVA2 in v2.3). */
export interface RelativeVolume2Frame extends Base<'rva2'> {
  identification: string
  channels: {
    /** See RVA2_CHANNEL_TYPES. */
    channelType: number
    /** Signed 16-bit fixed point: dB × 512. */
    adjustment: number
    /** 0-255; 0 means no peak field. */
    bitsRepresentingPeak: number
    peak: number | bigint
  }[]
}

/** EQUA (v2.3 §4.13) / EQU (v2.2 §4.13). */
export interface EqualisationFrame extends Base<'equa'> {
  adjustmentBits: number
  bands: { increment: boolean; frequency: number; adjustment: number | bigint }[]
}

/** EQU2 (v2.4 §4.12). */
export interface Equalisation2Frame extends Base<'equ2'> {
  /** 0 = band, 1 = linear. */
  interpolation: number
  identification: string
  /** Frequency in 1/2 Hz units; adjustment is signed dB × 512. */
  points: { frequency: number; adjustment: number }[]
}

/** RVRB (v2.3 §4.14, v2.4 §4.13) / REV (v2.2 §4.14). */
export interface ReverbFrame extends Base<'rvrb'> {
  reverbLeft: number
  reverbRight: number
  bouncesLeft: number
  bouncesRight: number
  feedbackLeftToLeft: number
  feedbackLeftToRight: number
  feedbackRightToRight: number
  feedbackRightToLeft: number
  premixLeftToRight: number
  premixRightToLeft: number
}

/** APIC (v2.3 §4.15, v2.4 §4.14) / PIC (v2.2 §4.15). */
export interface PictureFrame extends Base<'picture'> {
  encoding: TextEncoding
  /** v2.3/v2.4: MIME type ("-->" for a link). v2.2: the 3-character image format, e.g. "PNG". */
  mimeType: string
  /** See PICTURE_TYPES. */
  pictureType: number
  description: string
  /** Picture bytes, or the ISO-8859-1 URL when mimeType is "-->". */
  data: Uint8Array
}

/** GEOB (v2.3 §4.16, v2.4 §4.15) / GEO (v2.2 §4.16). */
export interface GeneralObjectFrame extends Base<'geob'> {
  encoding: TextEncoding
  mimeType: string
  filename: string
  description: string
  data: Uint8Array
}

/** PCNT / CNT. At least 32 bits, grows by a byte when it overflows. */
export interface PlayCounterFrame extends Base<'pcnt'> {
  count: bigint
}

/** POPM / POP. */
export interface PopularimeterFrame extends Base<'popm'> {
  email: string
  /** 1 worst - 255 best, 0 unknown. */
  rating: number
  counter?: bigint
}

/** RBUF / BUF. */
export interface BufferSizeFrame extends Base<'rbuf'> {
  bufferSize: number
  embeddedInfo: boolean
  offsetToNextTag?: number
}

/** AENC (v2.3 §4.20, v2.4 §4.19) / CRA (v2.2 §4.21). */
export interface AudioEncryptionFrame extends Base<'aenc'> {
  owner: string
  previewStart: number
  previewLength: number
  encryptionInfo: Uint8Array
}

/** CRM (v2.2 §4.20 only). */
export interface EncryptedMetaFrame extends Base<'crm'> {
  owner: string
  explanation: string
  data: Uint8Array
}

/** LINK (v2.3 §4.21, v2.4 §4.20) / LNK (v2.2 §4.22). */
export interface LinkFrame extends Base<'link'> {
  frameId: string
  url: string
  additional: string[]
}

/** POSS (v2.3 §4.22, v2.4 §4.21). */
export interface PositionSyncFrame extends Base<'poss'> {
  timestampFormat: TimestampFormat
  position: number
}

/** USER (v2.3 §4.23, v2.4 §4.22). */
export interface TermsOfUseFrame extends Base<'user'> {
  encoding: TextEncoding
  language: string
  text: string
}

/** OWNE (v2.3 §4.24, v2.4 §4.23). */
export interface OwnershipFrame extends Base<'owne'> {
  encoding: TextEncoding
  /** Currency code + amount, e.g. "EUR9.99". */
  pricePaid: string
  /** YYYYMMDD. */
  purchaseDate: string
  seller: string
}

/** COMR (v2.3 §4.25, v2.4 §4.24). */
export interface CommercialFrame extends Base<'comr'> {
  encoding: TextEncoding
  /** One or more "CUR" + amount, separated by "/". */
  prices: string
  /** YYYYMMDD. */
  validUntil: string
  contactUrl: string
  /** See COMR_RECEIVED_AS. */
  receivedAs: number
  seller: string
  description: string
  logoMimeType?: string
  logo?: Uint8Array
}

/** ENCR (v2.3 §4.26, v2.4 §4.25). */
export interface EncryptionRegistrationFrame extends Base<'encr'> {
  owner: string
  methodSymbol: number
  data: Uint8Array
}

/** GRID (v2.3 §4.27, v2.4 §4.26). */
export interface GroupRegistrationFrame extends Base<'grid'> {
  owner: string
  groupSymbol: number
  data: Uint8Array
}

/** PRIV (v2.3 §4.28, v2.4 §4.27). */
export interface PrivateFrame extends Base<'priv'> {
  owner: string
  data: Uint8Array
}

/** SIGN (v2.4 §4.28). */
export interface SignatureFrame extends Base<'sign'> {
  groupSymbol: number
  signature: Uint8Array
}

/** SEEK (v2.4 §4.29). */
export interface SeekFrame extends Base<'seek'> {
  minimumOffset: number
}

/** ASPI (v2.4 §4.30). */
export interface SeekPointIndexFrame extends Base<'aspi'> {
  indexedDataStart: number
  indexedDataLength: number
  /** 8 or 16. */
  bitsPerIndexPoint: number
  fractions: number[]
}

/** CHAP (chapters addendum §3.1). */
export interface ChapterFrame extends Base<'chap'> {
  elementId: string
  startTime: number
  endTime: number
  /** 0xFFFFFFFF means "use the time". */
  startOffset: number
  endOffset: number
  frames: Frame[]
}

/** CTOC (chapters addendum §3.2). */
export interface TableOfContentsFrame extends Base<'ctoc'> {
  elementId: string
  topLevel: boolean
  ordered: boolean
  childElementIds: string[]
  frames: Frame[]
  /** Flag bits other than a and b, kept for round trips. */
  unknownFlagBits?: number
}

/** ATXT (accessibility addendum). `audio` is always the plain (unscrambled) audio. */
export interface AudioTextFrame extends Base<'atxt'> {
  encoding: TextEncoding
  mimeType: string
  scrambled: boolean
  equivalentText: string
  audio: Uint8Array
  unknownFlagBits?: number
}

/** RGAD (Replay Gain Adjustment, unofficial). Raw fields as documented on id3.org. */
export interface ReplayGainFrame extends Base<'rgad'> {
  /** The 4 peak amplitude bytes as an unsigned integer (an IEEE float per Hydrogenaudio). */
  peakAmplitude: number
  radioAdjustment: number
  audiophileAdjustment: number
}

/** A frame whose ID is not known: the body is kept as is. */
export interface UnknownFrame extends Base<'unknown'> {
  data: Uint8Array
}

/** A frame that could not be decoded (encrypted without a hook, broken compression or body). */
export interface UndecodableFrame extends Base<'undecodable'> {
  reason: 'encrypted' | 'compression-error' | 'invalid-body'
  message: string
  /** The bytes after the frame header extras, exactly as stored. */
  payload: Uint8Array
  /** v2.3 decompressed size / v2.4 data length indicator, as stored. */
  dataLength?: number
}

export type Frame =
  | TextFrame
  | UserTextFrame
  | UrlFrame
  | UserUrlFrame
  | InvolvedPeopleFrame
  | UniqueFileIdFrame
  | MusicCdIdFrame
  | EventTimingFrame
  | MpegLookupFrame
  | SyncTempoFrame
  | UnsyncLyricsFrame
  | SyncLyricsFrame
  | CommentFrame
  | RelativeVolumeFrame
  | RelativeVolume2Frame
  | EqualisationFrame
  | Equalisation2Frame
  | ReverbFrame
  | PictureFrame
  | GeneralObjectFrame
  | PlayCounterFrame
  | PopularimeterFrame
  | BufferSizeFrame
  | AudioEncryptionFrame
  | EncryptedMetaFrame
  | LinkFrame
  | PositionSyncFrame
  | TermsOfUseFrame
  | OwnershipFrame
  | CommercialFrame
  | EncryptionRegistrationFrame
  | GroupRegistrationFrame
  | PrivateFrame
  | SignatureFrame
  | SeekFrame
  | SeekPointIndexFrame
  | ChapterFrame
  | TableOfContentsFrame
  | AudioTextFrame
  | ReplayGainFrame
  | UnknownFrame
  | UndecodableFrame

export type FrameType = Frame['type']
export type FrameOf<T extends FrameType> = Extract<Frame, { type: T }>
/** A frame without id/flags, for constructing frames. */
export type FrameInit<T extends FrameType> = Omit<FrameOf<T>, 'type' | 'id' | 'flags'>
