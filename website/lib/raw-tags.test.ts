// readRaw() and writeRaw() on the real e2e input files, through the built library (run `npm run build` first).
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { createFrame, createTag, read, write } from "../../dist/index.js";
import { fromHex, hexOfText, readRaw, textOfHex, writeRaw, type RawRow } from "./raw-tags.ts";

const sample = (name: string) => new Uint8Array(readFileSync(new URL(`../../input/${name}`, import.meta.url)));
// a sample with main-form and other tags written by the library itself
const tagged = (name: string) =>
  write(sample(name), { metadata: { title: "Kept title", composer: ["C1", "C2"], bpm: 120, isrc: "USRC17607839", userText: { CATALOG: "AB-1" } } }).bytes;
const rows = (bytes: Uint8Array) => readRaw(read(bytes)).rows;
// an MP3 with a PRIV frame (owner "me", bytes 01 02 03) and a POPM frame, written by the library
const binary = () => {
  const tag = createTag(4, [
    createFrame("text", "TIT2", { encoding: 3, values: ["Kept title"] }),
    createFrame("priv", "PRIV", { owner: "me", data: new Uint8Array([1, 2, 3]) }),
    createFrame("popm", "POPM", { email: "a@b.c", rating: 200 }),
  ]);
  return write(sample("sample.mp3"), { id3v2: tag }).bytes;
};
const save = (bytes: Uint8Array, edited: RawRow[], metadata = {}) => read(write(bytes, { ...writeRaw(read(bytes), edited), metadata }).bytes);

describe("readRaw", () => {
  it("lists ID3v2 text frames per value with their IDs, without the main form's frames", () => {
    const raw = readRaw(read(tagged("sample.mp3")));
    expect(raw.title).toBe("ID3v2.4 frames");
    expect(raw.rows).toContainEqual({ id: "TCOM", description: "", value: "C1" });
    expect(raw.rows).toContainEqual({ id: "TCOM", description: "", value: "C2" });
    expect(raw.rows).toContainEqual({ id: "TXXX", description: "CATALOG", value: "AB-1" });
    expect(raw.rows.some((row) => row.id === "TIT2")).toBe(false);
    expect(raw.ids).toContainEqual(["TCOM", "(TEXT) Composer"]);
    expect(raw.described).toEqual(["TXXX", "WXXX"]);
  });

  it("lists pictures and other non-text frames of no row; the main form shows pictures", () => {
    const raw = readRaw(read(sample("sample.pictures.mp3")));
    expect(raw.rows).toEqual([]);
    expect(raw.fixed).toEqual([]);
  });

  it("lists Vorbis fields and iTunes text items, keeps numbers as listed items", () => {
    expect(rows(tagged("sample.flac"))).toContainEqual({ id: "COMPOSER", description: "", value: "C2" });
    expect(rows(tagged("sample.ogg"))).toContainEqual({ id: "ISRC", description: "", value: "USRC17607839" });
    const mp4 = readRaw(read(tagged("sample.m4a")));
    expect(mp4.rows).toContainEqual({ id: "©wrt", description: "", value: "C1" });
    expect(mp4.rows.some((row) => row.id === "©nam")).toBe(false);
    expect(mp4.fixed.some((line) => line.startsWith("tmpo · type 21"))).toBe(true);
  });
});

describe("writeRaw", () => {
  for (const name of ["sample.mp3", "sample.flac", "sample.ogg", "sample.m4a", "sample.aiff", "sample.wav"]) {
    it(`stores edited rows of ${name} and keeps the main form's tags`, () => {
      const bytes = tagged(name);
      const edited = rows(bytes).filter((row) => row.value !== "C1").map((row) => (row.value === "C2" ? { ...row, value: "C3" } : row));
      const back = save(bytes, edited);
      expect(back.metadata.composer).toEqual(["C3"]);
      expect(back.metadata.isrc).toBe("USRC17607839");
      expect(back.metadata.title).toBe("Kept title");
    });
  }

  it("adds ID3 frames, a TXXX and a WXXX with descriptions, together with a main form change", () => {
    const bytes = tagged("sample.mp3");
    const back = save(bytes, [...rows(bytes), { id: "TPUB", description: "", value: "Label" }, { id: "WXXX", description: "Spotify", value: "https://open.spotify.com/album/x" }], { title: "New title" });
    expect(back.metadata.publisher).toBe("Label");
    expect(back.metadata.userUrls).toEqual({ Spotify: "https://open.spotify.com/album/x" });
    expect(back.metadata.userText).toEqual({ CATALOG: "AB-1" });
    expect(back.metadata.title).toBe("New title");
  });

  it("adds an ID3v2 tag to an MP3 that has only ID3v1, keeping its title", () => {
    const bytes = sample("sample.mp3");
    const before = read(bytes);
    expect(before.format === "mpeg" && before.id3v2).toBeFalsy();
    const back = save(bytes, [{ id: "TCOM", description: "", value: "New" }]);
    expect(back.metadata.composer).toEqual(["New"]);
    expect(back.metadata.title).toBe(before.metadata.title);
  });

  it("keeps listed-only M4A items byte for byte", () => {
    const bytes = tagged("sample.m4a");
    const tmpo = (data: Uint8Array) => read(data).format === "mp4" && (read(data) as any).mp4.itunes.items.find((item: any) => item.key === "tmpo");
    const back = write(bytes, writeRaw(read(bytes), rows(bytes))).bytes;
    expect(Buffer.from(tmpo(back).values[0].data).equals(Buffer.from(tmpo(bytes).values[0].data))).toBe(true);
  });
});

describe("binary ID3 frames", () => {
  const frames = (bytes: Uint8Array) => (read(bytes) as any).id3v2.frames.filter((frame: any) => frame.id !== "TIT2");

  it("lists them as hex rows, with what they hold", () => {
    const raw = readRaw(read(binary()));
    expect(raw.rows).toContainEqual({ id: "PRIV", description: "", value: "6d 65 00 01 02 03" });
    expect(raw.rows.some((row) => row.id === "POPM")).toBe(true);
    expect(raw.fixed.some((line) => line.startsWith("PRIV · Private frame · owner: me"))).toBe(true);
    expect(raw.ids).toContainEqual(["PRIV", "(BYTE) Private frame"]);
  });

  it("knows which IDs hold bytes: binary and unknown frames, not text or URL frames", () => {
    const holdsBytes = readRaw(read(binary())).binary;
    expect(["PRIV", "POPM", "XABC", "priv"].every(holdsBytes)).toBe(true);
    expect(["TCOM", "TXXX", "WXXX", "WOAR", "TZZZ", ""].some(holdsBytes)).toBe(false);
    expect(readRaw(read(sample("sample.flac"))).binary("COMPOSER")).toBe(false);
  });

  it("knows which IDs no spec defines, whose bytes may be text", () => {
    const { unknown } = readRaw(read(binary()));
    expect(["XTST", "ABCD", "Z123", "xtst"].every(unknown)).toBe(true);
    expect(["PRIV", "TCOM", "TZZZ", "WZZZ", ""].some(unknown)).toBe(false);
  });

  it("turns text into UTF-8 bytes and back, and refuses bytes that are not readable text", () => {
    expect(hexOfText("héllo")).toBe("68 c3 a9 6c 6c 6f");
    expect(textOfHex("68 c3 a9 6c 6c 6f")).toBe("héllo");
    expect(textOfHex("")).toBe("");
    expect(textOfHex("c3 28")).toBeUndefined(); // not UTF-8
    expect(textOfHex("01 02 03")).toBeUndefined(); // control characters
    expect(textOfHex("61 0a 62")).toBe("a\nb");
  });

  it("writes unchanged rows back as they were, edited and new ones from their hex", () => {
    const bytes = binary();
    const before = frames(bytes);
    expect(frames(write(bytes, writeRaw(read(bytes), rows(bytes))).bytes)).toEqual(before);
    const edited = rows(bytes).map((row) => (row.id === "PRIV" ? { ...row, value: "6d 65 00 0a 0b" } : row));
    const back = frames(write(bytes, writeRaw(read(bytes), [...edited, { id: "xabc", description: "", value: "01 02 03" }])).bytes);
    expect(back.find((frame: any) => frame.id === "PRIV")).toMatchObject({ type: "priv", owner: "me", data: new Uint8Array([10, 11]) });
    expect(back.find((frame: any) => frame.id === "XABC")).toMatchObject({ type: "unknown", data: new Uint8Array([1, 2, 3]) });
    expect(back.find((frame: any) => frame.id === "POPM")).toEqual(before.find((frame: any) => frame.id === "POPM"));
  });

  it("refuses a value that is not hex bytes", () => {
    expect(() => fromHex("6d 6", "PRIV")).toThrow("PRIV: the value of a binary frame is hex bytes");
    expect(() => writeRaw(read(binary()), [{ id: "PRIV", description: "", value: "zz" }])).toThrow("PRIV: the value of a binary frame is hex bytes");
    expect(fromHex("6D 65\n00", "PRIV")).toEqual(new Uint8Array([0x6d, 0x65, 0]));
  });
});

describe("ID patterns", () => {
  const accepts = (pattern: string, id: string) => new RegExp(`^(?:${pattern})$`, "v").test(id);
  it("follow each format's rule for IDs", () => {
    const id3 = readRaw(read(binary())).idPattern;
    expect(["TCOM", "tcom", "XABC", "PRIV"].every((id) => accepts(id3, id))).toBe(true);
    expect(["TCM", "T$OM", "TCOMX"].some((id) => accepts(id3, id))).toBe(false);
    const vorbis = readRaw(read(sample("sample.flac"))).idPattern;
    expect(accepts(vorbis, "MY FIELD") && !accepts(vorbis, "A=B")).toBe(true);
    const mp4 = readRaw(read(sample("sample.m4a"))).idPattern;
    expect(["©wrt", "----:com.apple.iTunes:ISRC"].every((id) => accepts(mp4, id)) && !accepts(mp4, "©wr")).toBe(true);
  });
});
