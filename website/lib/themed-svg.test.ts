// themeSvg() on the README diagrams the start page inlines.
import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { THEME_COLORS, themeSvg } from "./themed-svg.ts";

const readme = (name: string) => readFileSync(new URL(`../../.github/readme/${name}.svg`, import.meta.url), "utf8");

describe("themeSvg", () => {
  for (const name of ["how-it-works", "formats"]) {
    it(`leaves no themed color hard-coded in ${name}.svg`, () => {
      const out = themeSvg(readme(name), name);
      for (const hex of Object.keys(THEME_COLORS)) expect(out.toLowerCase()).not.toContain(hex);
      expect(out).toContain("var(--dg-");
    });

    it(`prefixes every id of ${name}.svg and the references to them`, () => {
      const out = themeSvg(readme(name), name);
      const ids = [...out.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      expect(ids.length).toBeGreaterThan(0);
      for (const id of ids) expect(id.startsWith(`${name}-`)).toBe(true);
      for (const [, ref] of out.matchAll(/url\(#([^)]+)\)/g)) expect(ids).toContain(ref);
      for (const ref of out.match(/aria-labelledby="([^"]+)"/)![1].split(" ")) expect(ids).toContain(ref);
    });
  }

  it("gives the two diagrams no id in common, so both can sit on one page", () => {
    const ids = (name: string) => new Set([...themeSvg(readme(name), name).matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    const a = ids("how-it-works");
    for (const id of ids("formats")) expect(a.has(id)).toBe(false);
  });

  it("drops the fixed size, so the diagram scales with the page", () => {
    const out = themeSvg(readme("formats"), "formats");
    const root = out.match(/<svg[^>]*>/)![0];
    expect(root).not.toMatch(/\s(width|height)="/);
    expect(root).toContain("viewBox=");
  });

  it("merges a themed fill and stroke on one element into one style attribute", () => {
    const out = themeSvg('<svg viewBox="0 0 1 1"><rect fill="#0f172a" stroke="#334155"/></svg>', "x");
    expect(out).toBe('<svg viewBox="0 0 1 1"><rect style="fill: var(--dg-bg); stroke: var(--dg-line)"/></svg>');
  });
});
