// The phone layouts' data, read from the README diagrams.
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { boxes, formatRows } from "./diagram-mobile.ts";
import { parseSvg } from "./svg-tree.ts";
import { themeSvg } from "./themed-svg.ts";

const tree = (name: string) => parseSvg(themeSvg(readFileSync(new URL(`../../.github/readme/${name}.svg`, import.meta.url), "utf8"), name));

describe("boxes (how it works)", () => {
  it("finds the eight boxes in reading order, under their lane", () => {
    const found = boxes(tree("how-it-works"));
    expect(found.map((b) => b.lane)).toEqual(["READ", "READ", "READ", "READ", "WRITE", "WRITE", "WRITE", "WRITE"]);
    expect(found[0]).toMatchObject({ x: 32, y: 92, width: 176, height: 124 });
    for (let i = 1; i < 4; i++) expect(found[i].x).toBeGreaterThan(found[i - 1].x);
  });
});

describe("formatRows (where the tags live)", () => {
  const rows = formatRows(tree("formats"));

  it("finds the six formats in order, with their extensions", () => {
    expect(rows.map((r) => r.name)).toEqual(["MP3", "M4A · MP4", "FLAC", "Ogg", "AIFF", "WAV"]);
    expect(rows[1].extensions).toBe(".m4a .m4b .mp4 .mov");
  });

  it("reads each region in file order with its kind", () => {
    const mp3 = rows[0].regions.map((r) => `${r.label}:${r.kind}`);
    expect(mp3).toEqual(["ID3v2 header + frames:tag", "pad:free", "MPEG audio frames:audio", "Lyrics3:tag", "ID3v1:tag"]);
    const flac = rows[2].regions.map((r) => r.kind);
    expect(flac).toEqual(["header", "header", "tag", "tag", "free", "audio"]);
  });

  it("nests the boxes inside moov under it", () => {
    const m4a = rows[1].regions;
    const moov = m4a.find((r) => r.label === "moov")!;
    expect(moov.kind).toBe("container");
    expect(moov.children.map((c) => c.label)).toEqual(["trak · stco", "udta › meta › ilst"]);
    expect(m4a.map((r) => r.label)).toEqual(["ftyp", "moov", "free", "mdat · audio samples"]);
  });

  it("keeps each tag region's color", () => {
    expect(rows[0].regions[0].color).toBe("#3b82f6");
    expect(rows[5].regions.at(-1)!.color).toBe("#06b6d4");
  });
});
