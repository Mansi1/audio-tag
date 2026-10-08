// highlight(): keywords, strings and comments of the code examples.
import { describe, expect, it } from "bun:test";
import { highlight } from "./highlight.ts";

const colored = (code: string) => highlight(code).filter((t) => t.kind).map((t) => `${t.kind}:${t.text}`);

describe("highlight", () => {
  it("colors keywords, strings and comments", () => {
    expect(colored("import { read } from 'audio-tag'\n// note\nconst x = await read(\"a\")")).toEqual([
      "keyword:import", "keyword:from", "string:'audio-tag'", "comment:// note", "keyword:const", "keyword:await", 'string:"a"',
    ]);
  });

  it("matches whole words only", () => {
    expect(colored("readFromBlob(imports, constant)")).toEqual([]);
  });

  it("keeps comment markers inside strings and escaped quotes", () => {
    expect(colored("const u = 'https://x.org/it\\'s' // end")).toEqual(["keyword:const", "string:'https://x.org/it\\'s'", "comment:// end"]);
  });

  it("gives back the code unchanged", () => {
    const code = "import { read } from 'audio-tag'\n\nconst { format } = read(bytes) // 'mpeg' | 'mp4'\nnpm install audio-tag";
    expect(highlight(code).map((t) => t.text).join("")).toBe(code);
  });
});
