// The data of the README diagrams' phone layouts, read from the parsed SVG (lib/svg-tree.ts), so the README
// file stays the one source. VERIFIED: at phone width the 960-unit diagrams scale their text to about 5 px;
// lib/diagram-mobile.test.ts reads both real files.
import type { SvgNode } from "./svg-tree.ts";

const children = (n: SvgNode) => n.children.filter((c): c is SvgNode => typeof c !== "string");
const text = (n: SvgNode): string => n.children.map((c) => (typeof c === "string" ? c : text(c))).join("").trim();
const num = (n: SvgNode, attr: string) => Number(n.attrs[attr] ?? 0);
const hasClass = (n: SvgNode, name: string) => (n.attrs.class ?? "").split(/\s+/).includes(name);
const walk = (n: SvgNode, out: SvgNode[] = []): SvgNode[] => {
  out.push(n);
  for (const c of children(n)) walk(c, out);
  return out;
};

export interface Box {
  lane: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

/** "How it works": every box (rect.box), in reading order, with the lane label (text.lane) above it. */
export function boxes(root: SvgNode): Box[] {
  const all = walk(root);
  const lanes = all.filter((n) => n.tag === "text" && hasClass(n, "lane")).map((n) => ({ y: num(n, "y"), name: text(n) }));
  return all
    .filter((n) => n.tag === "rect" && hasClass(n, "box"))
    .map((n) => ({ x: num(n, "x"), y: num(n, "y"), width: num(n, "width"), height: num(n, "height") }))
    .sort((a, b) => a.y - b.y || a.x - b.x)
    .map((b) => ({ ...b, lane: lanes.filter((l) => l.y < b.y).sort((p, q) => q.y - p.y)[0]?.name ?? "" }));
}

export type RegionKind = "tag" | "header" | "free" | "audio" | "container";

export interface Region {
  label: string;
  kind: RegionKind;
  /** The format color of a tag, header, free or container region. */
  color?: string;
  /** Regions drawn inside a container (moov). */
  children: Region[];
}

export interface FormatRow {
  name: string;
  extensions: string;
  /** The label's style (a themed color), for the heading. */
  labelStyle?: string;
  regions: Region[];
}

function kindOf(rect: SvgNode): RegionKind {
  const fill = rect.attrs.fill ?? "";
  if (fill.startsWith("url(")) return "audio";
  if (fill === "none") return rect.attrs["stroke-dasharray"] ? "free" : "container";
  if (rect.attrs["fill-opacity"]) return "header";
  return "tag";
}

/** "Where the tags live": each format row (a <g> with a 16-px name), its regions in file order. */
export function formatRows(root: SvgNode): FormatRow[] {
  const rows: FormatRow[] = [];
  for (const g of walk(root).filter((n) => n.tag === "g")) {
    const parts = children(g);
    const name = parts.find((n) => n.tag === "text" && hasClass(n, "sans") && n.attrs["font-size"] === "16");
    if (!name) continue;
    const extensions = parts.find((n) => n.tag === "text" && hasClass(n, "grey") && !hasClass(n, "seg"));
    // each region is a rect followed by its label
    const drawn: (Region & { x: number; end: number })[] = [];
    parts.forEach((rect, i) => {
      const label = parts[i + 1];
      if (rect.tag !== "rect" || label?.tag !== "text") return;
      const kind = kindOf(rect);
      const color = kind === "audio" ? undefined : rect.attrs.fill && rect.attrs.fill !== "none" ? rect.attrs.fill : rect.attrs.stroke;
      drawn.push({ label: text(label), kind, color, children: [], x: num(rect, "x"), end: num(rect, "x") + num(rect, "width") });
    });
    // regions drawn inside a container's span belong to it
    const regions: Region[] = [];
    for (const r of drawn) {
      const parent = drawn.find((c) => c !== r && c.kind === "container" && r.x > c.x && r.end < c.end);
      const { x: _x, end: _end, ...region } = r;
      if (parent) parent.children.push(region);
      else regions.push(r);
    }
    const strip = (r: Region & { x?: number; end?: number }): Region => {
      const { x: _x, end: _end, ...rest } = r;
      return { ...rest, children: rest.children.map(strip) };
    };
    rows.push({ name: text(name), extensions: extensions ? text(extensions) : "", labelStyle: name.attrs.style, regions: regions.map(strip) });
  }
  return rows;
}
