// The tags of a file as they are stored: ID3v2 frames (MP3, and the ID3 chunk of AIFF and WAV), Vorbis comment
// fields (FLAC, Ogg) or iTunes items (M4A), as rows of an ID, a description and a value, one row per value.
// readRaw lists them for the playground's "Other tags"; writeRaw turns the edited rows back into the format's
// write input, which replaces the stored tags before the main form's metadata is applied (api.ts WriteInput).
// The main form's fields (title, artist, album, genre, date, track, comments, pictures) are left out of the rows
// and written back unchanged. ID3 frames that are not text (PRIV, POPM, experimental X…, Y…, Z…) are rows too, their
// value the frame body as hex bytes; M4A items that are not text are only listed, as are frames that cannot be
// edited as plain bytes (compressed, encrypted, grouped, unsynchronised, larger than 4 KB, undecodable).
// VERIFIED: lib/raw-tags.test.ts reads, edits and writes every format's sample through the built library.
import { createFrame, createTag, cloneFrame, FRAME_DEFINITIONS, getDefinition, writeID3v2 } from "audio-tag/browser";
import type { FLACTags, ID3v2Tag, MP4Item, MP4Tags, ReadResult, VorbisComment, WriteInput } from "audio-tag/browser";

export interface RawRow { id: string; description: string; value: string }

export interface RawTags {
  kind: "id3" | "vorbis" | "mp4";
  /** what the rows are, e.g. "ID3v2.4 frames" */
  title: string;
  rows: RawRow[];
  /** readable lines: what binary frames hold, and what is only listed and written back unchanged */
  fixed: string[];
  /** how many frames or items are only listed (not rows) */
  listed: number;
  /** suggestions for the ID: [id, name] */
  ids: [string, string][];
  /** the IDs that take a description (TXXX, WXXX) */
  described: string[];
  /** true when a row with this ID holds hex bytes (a binary ID3 frame), false for text */
  binary: (id: string) => boolean;
  /** true for an ID that no spec defines (an experimental XABC): its bytes may be typed as text or as hex */
  unknown: (id: string) => boolean;
  /** the form of an ID, as an <input pattern> (checked with the v flag), and its explanation */
  idPattern: string;
  idTitle: string;
}

// ---- ID3v2 ------------------------------------------------------------------------------------------------

type Major = 2 | 3 | 4;
type Frame = ID3v2Tag["frames"][number];
const EDITABLE_ID3 = new Set(["text", "user-text", "url", "user-url"]);
// title, artist, album artist, album, genre, recording time (v2.4, and v2.3/v2.2 year, date, time), track,
// comments and pictures, in all three versions
const MAIN_ID3 = new Set(["TIT2", "TT2", "TPE1", "TP1", "TPE2", "TP2", "TALB", "TAL", "TCON", "TCO", "TDRC", "TYER", "TDAT", "TIME", "TRDA", "TYE", "TDA", "TIM", "TRD", "TRCK", "TRK", "COMM", "COM", "APIC", "PIC"]);

function id3Tag(result: ReadResult): ID3v2Tag | undefined {
  if (result.format === "mpeg") return result.id3v2;
  if (result.format === "aiff") return result.aiff.id3v2;
  if (result.format === "riff") return result.riff.id3v2;
  return undefined;
}

// Everything of a frame but its header, short: "owner: x, data: 34 bytes".
function summary(frame: Frame): string {
  const parts = Object.entries(frame)
    .filter(([key]) => !["type", "id", "flags", "encoding"].includes(key))
    .map(([key, value]) => `${key}: ${value instanceof Uint8Array ? `${value.length} bytes` : typeof value === "object" ? JSON.stringify(value, (_k, item) => (typeof item === "bigint" ? `${item}` : item instanceof Uint8Array ? `${item.length} bytes` : item)) : String(value)}`);
  const text = parts.join(", ");
  return text.length > 90 ? `${text.slice(0, 89)}…` : text;
}

const MAX_HEX = 4096; // bytes; a larger body (an embedded file in GEOB, say) is only listed

/** "6d 65 00 01" */
export const toHex = (bytes: Uint8Array) => [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join(" ");

/** The bytes as UTF-8 text, or undefined when they are not readable text (invalid UTF-8, control characters). */
export function textOfHex(hex: string): string | undefined {
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(fromHex(hex, "value"));
    // eslint-disable-next-line no-control-regex -- control characters are what is checked for
    return /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(text) ? undefined : text;
  } catch {
    return undefined;
  }
}

/** Text as UTF-8 bytes, in hex: "hé" → "68 c3 a9". */
export const hexOfText = (text: string) => toHex(new TextEncoder().encode(text));

/** Bytes from hex digits; spaces and line breaks are ignored. */
export function fromHex(text: string, id: string): Uint8Array {
  const digits = text.replace(/\s+/g, "");
  if (!/^(?:[0-9a-fA-F]{2})*$/.test(digits)) throw new Error(`${id}: the value of a binary frame is hex bytes, like 6d 65 00 01`);
  return Uint8Array.from(digits.match(/../g) ?? [], (pair) => parseInt(pair, 16));
}

// The body of a frame that is stored as plain bytes, or undefined when it is not (flags that transform the body,
// undecodable, too large). Encoded through the public writer: a tag with only this frame, after its tag and frame
// headers (10 + 10 bytes; 10 + 6 in v2.2), as no flag adds bytes there.
function plainBody(frame: Frame, major: Major): Uint8Array | undefined {
  const { compression, encryptionMethod, groupId, unsynchronisation, dataLengthIndicator } = frame.flags;
  if (frame.type === "undecodable" || compression || encryptionMethod !== undefined || groupId !== undefined || unsynchronisation || dataLengthIndicator) return undefined;
  const body = frame.type === "unknown" ? frame.data : writeID3v2(createTag(major, [frame]), { padding: 0 }).bytes.subarray(10 + (major === 2 ? 6 : 10));
  return body.length <= MAX_HEX ? body : undefined;
}

const isTextFrame = (frame: Frame) => EDITABLE_ID3.has(frame.type);

function readID3(tag: ID3v2Tag | undefined): RawTags {
  const major = (tag?.version.major ?? 4) as Major;
  const rows: RawRow[] = [];
  const fixed: string[] = [];
  for (const frame of tag?.frames ?? []) {
    if (MAIN_ID3.has(frame.id)) continue;
    if (frame.type === "text") for (const value of frame.values) rows.push({ id: frame.id, description: "", value });
    else if (frame.type === "user-text") for (const value of frame.values) rows.push({ id: frame.id, description: frame.description, value });
    else if (frame.type === "url") rows.push({ id: frame.id, description: "", value: frame.url });
    else if (frame.type === "user-url") rows.push({ id: frame.id, description: frame.description, value: frame.url });
    else {
      const body = plainBody(frame, major);
      if (body) rows.push({ id: frame.id, description: "", value: toHex(body) });
      // what a binary frame holds, readable, next to its hex row; or why it is only listed
      fixed.push(`${frame.id} · ${getDefinition(frame.id, major)?.name ?? frame.type} · ${summary(frame)}${body ? "" : " · kept as it is"}`);
    }
  }
  // a frame is text when its definition says so (T… and W… IDs count as text and URL frames, v2.4 §4.2/§4.3),
  // otherwise its value is bytes: PRIV, POPM, and IDs that no definition knows, like an experimental XABC
  // (an empty ID is text, as most frames are: a new row starts with a text field)
  const binary = (id: string) => !!id.trim() && !EDITABLE_ID3.has(getDefinition(id.trim().toUpperCase(), major)?.type ?? "");
  const unknown = (id: string) => !!id.trim() && !getDefinition(id.trim().toUpperCase(), major);
  // the list names each ID with what its value is: "(TEXT) Composer", "(BYTE) Private frame"
  const ids = FRAME_DEFINITIONS.filter((definition) => definition.ids[major] && !MAIN_ID3.has(definition.ids[major]!))
    .map((definition): [string, string] => [definition.ids[major]!, `${EDITABLE_ID3.has(definition.type) ? "(TEXT)" : "(BYTE)"} ${definition.name}`])
    .sort(([a], [b]) => a.localeCompare(b));
  const described = major === 2 ? ["TXX", "WXX"] : ["TXXX", "WXXX"];
  // SPEC: v2.4 structure §4.1 and v2.3 §3.3: four characters A-Z and 0-9; v2.2 §3.2: three. Lower case is
  // accepted here and written in upper case.
  const length = major === 2 ? 3 : 4;
  return { kind: "id3", title: `ID3v2.${major} frames`, rows, fixed, listed: fixed.filter((line) => line.endsWith("kept as it is")).length, ids, described, binary, unknown,
    idPattern: `[A-Za-z0-9]{${length}}`, idTitle: `${length} characters, A–Z and 0–9; X…, Y… and Z… are free for experiments` };
}

// v2.4 keeps several values in one frame; v2.2/v2.3 hold one, where "/" separates several (v2.3 §4.2.1).
const values = (list: string[], major: Major) => (major === 4 ? list : [list.join("/")]);
// UTF-8 in v2.4; before, ISO-8859-1 when it fits, else UTF-16 with BOM (v2.4 structure §4, v2.3 §4).
const encoding = (texts: string[], major: Major) => (major === 4 ? 3 : texts.every((text) => [...text].every((char) => char.charCodeAt(0) <= 0xff)) ? 0 : 1);

function writeID3(tag: ID3v2Tag | undefined, rows: RawRow[]): ID3v2Tag {
  const major = (tag?.version.major ?? 4) as Major;
  const frames = tag?.frames ?? [];
  // the main form's frames and the ones only listed stay as they are; the others come from the rows
  const isRow = (frame: Frame) => !MAIN_ID3.has(frame.id) && (isTextFrame(frame) || plainBody(frame, major) !== undefined);
  const kept = frames.filter((frame) => !isRow(frame)).map(cloneFrame);
  const out: ID3v2Tag = tag ? { ...tag, frames: kept } : createTag(4, kept);
  // binary frames whose ID and bytes did not change are written back as they were (decoded, with their flags)
  const unchanged = frames.filter((frame) => isRow(frame) && !isTextFrame(frame)).map((frame) => ({ frame, id: frame.id, hex: toHex(plainBody(frame, major)!), used: false }));
  const groups = new Map<string, RawRow[]>();
  for (const row of rows) {
    const id = row.id.trim().toUpperCase();
    if (!id || !row.value.trim()) continue;
    const key = `${id}\0${row.description}`;
    groups.set(key, [...(groups.get(key) ?? []), { ...row, id }]);
  }
  for (const group of groups.values()) {
    const { id, description } = group[0];
    const texts = group.map((row) => row.value);
    const type = getDefinition(id, major)?.type;
    if (!type || !EDITABLE_ID3.has(type)) {
      // any other frame, known or not (PRIV, POPM, an experimental XABC): its body from the hex value
      for (const row of group) {
        const bytes = fromHex(row.value, id);
        const same = unchanged.find((old) => !old.used && old.id === id && old.hex === toHex(bytes));
        if (same) same.used = true;
        out.frames.push(same ? cloneFrame(same.frame) : createFrame("unknown", id, { data: bytes }, major));
      }
    } else if (type === "text") out.frames.push(createFrame("text", id, { encoding: encoding(texts, major), values: values(texts, major) }, major));
    else if (type === "user-text") out.frames.push(createFrame("user-text", id, { encoding: encoding([description, ...texts], major), description, values: values(texts, major) }, major));
    else if (type === "url") for (const url of texts) out.frames.push(createFrame("url", id, { url }, major));
    else if (type === "user-url") for (const url of texts) out.frames.push(createFrame("user-url", id, { encoding: encoding([description], major), description, url }, major));
  }
  return out;
}

// ---- Vorbis comments (FLAC, Ogg) --------------------------------------------------------------------------------

// The main form's fields (flac/mapping.ts: TITLE, ARTIST, ALBUMARTIST, ALBUM, GENRE, DATE, track, COMMENT/DESCRIPTION)
const MAIN_VORBIS = new Set(["TITLE", "ARTIST", "ALBUMARTIST", "ALBUM", "GENRE", "DATE", "TRACKNUMBER", "TRACKTOTAL", "TOTALTRACKS", "COMMENT", "DESCRIPTION"]);
// The other names flac/mapping.ts reads and writes
const VORBIS_NAMES: [string, string][] = [
  ["SUBTITLE", "Subtitle"], ["GROUPING", "Grouping"], ["DISCSUBTITLE", "Disc subtitle"], ["CONDUCTOR", "Conductor"], ["REMIXER", "Remixer"],
  ["LABEL", "Publisher"], ["ORGANIZATION", "Publisher"], ["COPYRIGHT", "Copyright"], ["ENCODEDBY", "Encoded by"], ["ENCODERSETTINGS", "Encoder settings"],
  ["ISRC", "ISRC"], ["MOOD", "Mood"], ["KEY", "Key"], ["RELEASEDATE", "Release date"], ["ORIGINALDATE", "Original release date"],
  ["COMPOSER", "Composer"], ["LYRICIST", "Lyricist"], ["LANGUAGE", "Language"], ["LYRICS", "Lyrics"], ["DISCNUMBER", "Disc"], ["DISCTOTAL", "Discs"],
  ["BPM", "BPM"], ["COMPILATION", "Compilation"], ["TITLESORT", "Sort title"], ["ARTISTSORT", "Sort artist"], ["ALBUMSORT", "Sort album"],
  ["ALBUMARTISTSORT", "Sort album artist"], ["COMPOSERSORT", "Sort composer"],
];

function vorbisOf(result: ReadResult): VorbisComment | undefined {
  if (result.format === "flac") return result.flac.vorbis;
  if (result.format === "ogg") return result.ogg.vorbis;
  return undefined;
}

function readVorbis(vorbis: VorbisComment | undefined): RawTags {
  const rows = (vorbis?.fields ?? []).filter((field) => !MAIN_VORBIS.has(field.name.toUpperCase())).map((field) => ({ id: field.name, description: "", value: field.value }));
  // SPEC: RFC 9639 §8.6 (as flac/vorbis.ts): field names are "U+0020 through U+007E, excluding U+003D" (=)
  return { kind: "vorbis", title: "Vorbis comment fields", rows, fixed: vorbis ? [`Vendor · ${vorbis.vendor}`] : [], listed: 0, ids: VORBIS_NAMES, described: [], binary: () => false, unknown: () => false,
    idPattern: "[ -<>-~]+", idTitle: "Letters, digits, spaces and punctuation, but no =" };
}

function writeVorbis(vorbis: VorbisComment | undefined, rows: RawRow[]): VorbisComment {
  const kept = (vorbis?.fields ?? []).filter((field) => MAIN_VORBIS.has(field.name.toUpperCase()));
  const edited = rows.filter((row) => row.id.trim() && row.value.trim()).map((row) => ({ name: row.id.trim().toUpperCase(), value: row.value }));
  return { vendor: vorbis?.vendor ?? "audio-tag", fields: [...kept, ...edited] };
}

// ---- iTunes items (M4A) -------------------------------------------------------------------------------------

// The main form's items (mp4/mapping.ts): title, artist, album artist, album, genre (text and ID3v1 number),
// date, track, comment, cover
const MAIN_MP4 = new Set(["©nam", "©ART", "aART", "©alb", "©gen", "gnre", "©day", "trkn", "©cmt", "covr"]);
const FF = "----:com.apple.iTunes:";
// The other text items mp4/mapping.ts reads and writes
const MP4_KEYS: [string, string][] = [
  ["©wrt", "Composer"], ["©con", "Conductor"], ["©grp", "Grouping"], ["©st3", "Subtitle"], ["©pub", "Publisher"], ["cprt", "Copyright"],
  ["©enc", "Encoded by"], ["©too", "Encoder settings"], ["©lyr", "Lyrics"], ["sonm", "Sort title"], ["soar", "Sort artist"], ["soal", "Sort album"],
  ["soaa", "Sort album artist"], ["soco", "Sort composer"], [`${FF}SUBTITLE`, "Subtitle"], [`${FF}REMIXER`, "Remixer"], [`${FF}LABEL`, "Publisher"],
  [`${FF}ISRC`, "ISRC"], [`${FF}MOOD`, "Mood"], [`${FF}initialkey`, "Key"], [`${FF}DISCSUBTITLE`, "Disc subtitle"], [`${FF}RELEASEDATE`, "Release date"],
  [`${FF}LYRICIST`, "Lyricist"], [`${FF}LANGUAGE`, "Language"], [`${FF}CONDUCTOR`, "Conductor"],
];
const UTF8 = 1; // QTFF well-known data type 1: UTF-8 text
const isText = (item: MP4Item) => item.values.length > 0 && item.values.every((value) => value.type === UTF8);

function readMP4(tags: MP4Tags): RawTags {
  const rows: RawRow[] = [];
  const fixed: string[] = [];
  const decoder = new TextDecoder();
  for (const item of tags.itunes?.items ?? []) {
    if (MAIN_MP4.has(item.key)) continue;
    if (isText(item)) for (const value of item.values) rows.push({ id: item.key, description: "", value: decoder.decode(value.data) });
    else fixed.push(`${item.key} · ${item.values.map((value) => `type ${value.type}, ${value.data.length} bytes`).join("; ")}`);
  }
  // an atom name of four characters (©wrt, cprt), or a freeform item ----:mean:name (mp4/mapping.ts FF)
  return { kind: "mp4", title: "iTunes items", rows, fixed, listed: fixed.length, ids: MP4_KEYS, described: [], binary: () => false, unknown: () => false,
    idPattern: "[^:]{4}|----:[^:]+:[^:]+", idTitle: "Four characters, like ©wrt, or ----:com.apple.iTunes:NAME" };
}

function writeMP4(tags: MP4Tags, rows: RawRow[]): MP4Tags {
  const items = tags.itunes?.items ?? [];
  const kept = items.filter((item) => MAIN_MP4.has(item.key) || !isText(item));
  const groups = new Map<string, string[]>();
  for (const row of rows) if (row.id.trim() && row.value.trim()) groups.set(row.id.trim(), [...(groups.get(row.id.trim()) ?? []), row.value]);
  const encoder = new TextEncoder();
  const edited = [...groups].map(([key, texts]): MP4Item => ({
    key,
    values: texts.map((text) => ({ type: UTF8, locale: 0, data: encoder.encode(text) })),
    ...(items.find((item) => item.key === key)?.extra ? { extra: items.find((item) => item.key === key)!.extra } : {}),
  }));
  return { ...tags, itunes: { ...tags.itunes, items: [...kept, ...edited] } };
}

// ---- per format -------------------------------------------------------------------------------------------

/** The stored tags of a read file, as rows. */
export function readRaw(result: ReadResult): RawTags {
  if (result.format === "mp4") return readMP4(result.mp4);
  if (result.format === "flac" || result.format === "ogg") return readVorbis(vorbisOf(result));
  return readID3(id3Tag(result));
}

/** The write input that stores rows as the file's tags; pass it to write() or writeToBlob() with the metadata. */
export function writeRaw(result: ReadResult, rows: RawRow[]): Partial<WriteInput> {
  if (result.format === "mp4") return { mp4: writeMP4(result.mp4, rows) };
  if (result.format === "flac") return { flac: { ...(result.flac as FLACTags), vorbis: writeVorbis(result.flac.vorbis, rows) } };
  if (result.format === "ogg") return { ogg: { vorbis: writeVorbis(result.ogg.vorbis, rows), pictures: result.ogg.pictures } };
  return { id3v2: writeID3(id3Tag(result), rows) };
}
