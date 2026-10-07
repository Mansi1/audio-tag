// Which byte range of a file is what: the one owner of that question for the website. The playground's
// byte map only draws what this returns. VERIFIED: built from the `layout` every read result carries;
// lib/byte-map.test.ts checks full, ordered coverage on all six sample formats.
import type { ReadResult } from "audio-tag/browser";

/** tag: tag data the library reads and writes; header: structure the reader uses; free: padding for
 *  in-place writes; audio: the sound data; other: anything else. */
export type RegionKind = "tag" | "header" | "free" | "audio" | "other";

export interface Region {
  label: string;
  kind: RegionKind;
  start: number;
  end: number;
}

const FLAC_BLOCKS: Record<number, [string, RegionKind]> = {
  0: ["STREAMINFO", "header"],
  1: ["PADDING", "free"],
  2: ["APPLICATION", "other"],
  3: ["SEEKTABLE", "header"],
  4: ["VORBIS_COMMENT", "tag"],
  5: ["CUESHEET", "other"],
  6: ["PICTURE", "tag"],
};

const MP4_ATOMS: Record<string, RegionKind> = { ftyp: "header", moov: "tag", mdat: "audio", free: "free", skip: "free", wide: "free" };

// RIFF (WAV) and AIFF chunks: the tag chunks, the sound data, the rest is structure.
const CHUNKS: Record<string, RegionKind> = {
  "fmt ": "header", COMM: "header", FVER: "header",
  data: "audio", SSND: "audio",
  LIST: "tag", "id3 ": "tag", "ID3 ": "tag", NAME: "tag", AUTH: "tag", "(c) ": "tag", ANNO: "tag", COMT: "tag",
};

const padded = (n: number) => n + (n & 1);

/** The regions of a file, in order, covering bytes 0 … fileLength exactly once (gaps become "other"). */
export function byteMap(result: ReadResult, fileLength: number): Region[] {
  const found: Region[] = [];
  const add = (label: string, kind: RegionKind, start: number, end: number) => {
    if (end > start) found.push({ label, kind, start, end: Math.min(end, fileLength) });
  };

  switch (result.format) {
    case "mpeg": {
      const l = result.layout;
      for (const t of l.id3v2) add(`ID3v2.${t.tag.version.major}`, "tag", t.start, t.end);
      add("MPEG audio", "audio", l.audio.start, l.audio.end);
      if (l.lyrics3) add("Lyrics3", "tag", l.lyrics3.start, l.lyrics3.end);
      if (l.id3v1) add("ID3v1", "tag", l.id3v1.start, l.id3v1.end);
      break;
    }
    case "mp4":
      for (const a of result.layout.atoms) add(a.type, MP4_ATOMS[a.type] ?? "other", a.start, a.end);
      break;
    case "flac": {
      const l = result.layout;
      add("ID3v2 (in front)", "tag", 0, l.start);
      add("fLaC", "header", l.start, l.start + 4);
      for (const b of l.blocks) {
        const [label, kind] = FLAC_BLOCKS[b.type] ?? [`block ${b.type}`, "other"];
        add(label, kind, b.start, b.end);
      }
      add("audio frames", "audio", l.audioStart, fileLength);
      break;
    }
    case "ogg": {
      const l = result.layout;
      add("ID3v2 (in front)", "tag", 0, l.start);
      l.headerPages.forEach((p, i) => add(i === 0 ? "id header" : `header page ${i}`, i === 0 ? "header" : "tag", p.start, p.end));
      add("audio pages", "audio", l.headerEnd, fileLength);
      break;
    }
    case "aiff":
    case "riff": {
      const l = result.layout;
      add("ID3v2 (in front)", "tag", 0, l.start);
      add(result.format === "aiff" ? `FORM ${result.layout.formType}` : "RIFF WAVE", "header", l.start, l.start + 12);
      for (const c of l.chunks) add(c.id.trim(), CHUNKS[c.id] ?? "other", c.start, c.start + 8 + padded(c.size));
      break;
    }
  }

  // fill the gaps so the regions cover the whole file
  found.sort((a, b) => a.start - b.start);
  const regions: Region[] = [];
  let pos = 0;
  for (const r of found) {
    if (r.start < pos) continue; // overlapping layout entry: keep the first
    if (r.start > pos) regions.push({ label: "other", kind: "other", start: pos, end: r.start });
    regions.push(r);
    pos = r.end;
  }
  if (pos < fileLength) regions.push({ label: "other", kind: "other", start: pos, end: fileLength });
  return regions;
}
