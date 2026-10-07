// parseSvg() on the README diagrams the start page renders as elements.
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { parseSvg, type SvgNode } from "./svg-tree.ts";

const readme = (name: string) => readFileSync(new URL(`../../.github/readme/${name}.svg`, import.meta.url), "utf8");
const walk = (n: SvgNode, out: SvgNode[] = []): SvgNode[] => {
  out.push(n);
  for (const c of n.children) if (typeof c !== "string") walk(c, out);
  return out;
};
const text = (n: SvgNode): string => n.children.map((c) => (typeof c === "string" ? c : text(c))).join("");

describe("parseSvg", () => {
  for (const name of ["how-it-works", "formats"]) {
    it(`keeps every element of ${name}.svg`, () => {
      const source = readme(name).replace(/<!--[\s\S]*?-->/g, "");
      const root = parseSvg(source);
      expect(root.tag).toBe("svg");
      expect(walk(root).length).toBe(source.match(/<[a-zA-Z]/g)!.length);
    });

    it(`keeps the text of ${name}.svg, the style block included`, () => {
      const root = parseSvg(readme(name));
      const all = walk(root);
      const style = all.find((n) => n.tag === "style")!;
      expect(text(style)).toContain("font-family");
      expect(all.filter((n) => n.tag === "text").length).toBeGreaterThan(10);
    });
  }

  it("reads attributes, self-closing elements and nesting", () => {
    const root = parseSvg('<svg viewBox="0 0 2 2"><g class="a"><rect width="1" style="fill: red"/><text x="1">hi <tspan>there</tspan></text></g></svg>');
    expect(root).toEqual({
      tag: "svg", attrs: { viewBox: "0 0 2 2" }, children: [
        { tag: "g", attrs: { class: "a" }, children: [
          { tag: "rect", attrs: { width: "1", style: "fill: red" }, children: [] },
          { tag: "text", attrs: { x: "1" }, children: ["hi ", { tag: "tspan", attrs: {}, children: ["there"] }] },
        ] },
      ],
    });
  });
});
