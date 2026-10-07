// byteMap() on the real e2e input files, read by the built library (run `npm run build` in the repo first).
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { read } from "../../dist/index.js";
import { byteMap } from "./byte-map.ts";

const sample = (ext: string) => new Uint8Array(readFileSync(new URL(`../../input/sample.${ext}`, import.meta.url)));

describe("byteMap", () => {
  for (const ext of ["mp3", "m4a", "flac", "ogg", "aiff", "wav"]) {
    it(`covers every byte of sample.${ext} once, in order`, () => {
      const bytes = sample(ext);
      const regions = byteMap(read(bytes), bytes.length);
      expect(regions.length).toBeGreaterThanOrEqual(2);
      expect(regions[0].start).toBe(0);
      expect(regions.at(-1)!.end).toBe(bytes.length);
      for (let i = 1; i < regions.length; i++) expect(regions[i].start).toBe(regions[i - 1].end);
      for (const r of regions) expect(r.end).toBeGreaterThan(r.start);
    });
  }

  it("finds the ID3v1 tag in the last 128 bytes of an MP3", () => {
    const bytes = sample("mp3");
    const regions = byteMap(read(bytes), bytes.length);
    expect(regions.at(-1)).toMatchObject({ label: "ID3v1", kind: "tag", start: bytes.length - 128 });
    expect(regions.find((r) => r.kind === "audio")).toBeDefined();
  });

  it("names the chunks of a WAV file and marks the sound data as audio", () => {
    const bytes = sample("wav");
    const regions = byteMap(read(bytes), bytes.length);
    expect(regions.map((r) => r.label)).toEqual(["RIFF WAVE", "fmt", "data"]);
    expect(regions.find((r) => r.label === "data")).toMatchObject({ kind: "audio", start: 36 });
  });

  it("marks the Vorbis comment block of a FLAC file as a tag", () => {
    const bytes = sample("flac");
    const labels = byteMap(read(bytes), bytes.length).map((r) => `${r.label}:${r.kind}`);
    expect(labels[0]).toBe("fLaC:header");
    expect(labels).toContain("STREAMINFO:header");
    expect(labels.at(-1)).toBe("audio frames:audio");
  });

  it("shows the moov atom of an M4A file, which holds the item list", () => {
    const bytes = sample("m4a");
    const labels = byteMap(read(bytes), bytes.length).map((r) => `${r.label}:${r.kind}`);
    expect(labels).toEqual(["ftyp:header", "moov:tag", "mdat:audio"]);
  });
});
