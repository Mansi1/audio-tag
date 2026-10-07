// A README diagram rendered as defuss elements (server only), so its colors follow the light and dark
// theme. VERIFIED: the source is .github/readme/<name>.svg itself, one file for the README and the site;
// it becomes elements (lib/svg-tree.ts), not raw HTML, since defuss's server renderer cut raw SVG off at
// its <style> block. Below 640 px a phone layout from the same file replaces it (lib/diagram-mobile.ts):
// scaled to a phone, the 960-unit drawings have about 5 px text.
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { boxes, formatRows, type Region } from "./diagram-mobile.ts";
import { parseSvg, type SvgNode } from "./svg-tree.ts";
import { themeSvg } from "./themed-svg.ts";

type Name = "how-it-works" | "formats";

// the build runs in website/ (see config.ts)
const source = (name: Name) => readFileSync(resolve(process.cwd(), `../.github/readme/${name}.svg`), "utf8");
const tree = (name: Name, prefix: string) => parseSvg(themeSvg(source(name), prefix));

function Element({ node }: { node: SvgNode }): JSX.Element {
  const { xmlns: _namespace, ...attrs } = node.attrs; // defuss puts <svg> in the SVG namespace itself
  const Tag = node.tag as "g"; // any SVG element name from the file; "g" only gives JSX an intrinsic type
  return <Tag {...attrs}>{node.children.map((c) => (typeof c === "string" ? c : <Element node={c} />))}</Tag>;
}

/** "How it works" on a phone: each box cut out of the drawing (its own viewBox), stacked under its lane. */
// Drops the flow arrows: in a crop only their stubs would show; the stack draws its own arrows.
const withoutArrows = (node: SvgNode): SvgNode => ({
  ...node,
  children: node.children.filter((c) => typeof c === "string" || !(c.attrs.class ?? "").split(/\s+/).includes("flow")).map((c) => (typeof c === "string" ? c : withoutArrows(c))),
});

function StackedBoxes() {
  const found = boxes(tree("how-it-works", "how-it-works"));
  const widest = Math.max(...found.map((b) => b.width));
  return (
    <div class="diagram-narrow diagram-steps">
      {found.map((b, i) => {
        // every crop repeats the drawing's defs (arrow, hatching), so its ids need their own prefix
        const crop = withoutArrows(tree("how-it-works", `how-it-works-m${i}`));
        crop.attrs.viewBox = `${b.x - 6} ${b.y - 6} ${b.width + 12} ${b.height + 12}`;
        // as wide as the box is in the drawing, relative to the widest: the same text size in every box
        crop.attrs.style = `width: ${(((b.width + 12) / (widest + 12)) * 100).toFixed(1)}%`;
        delete crop.attrs["aria-labelledby"];
        crop.attrs["aria-hidden"] = "true";
        return (
          <div class="diagram-step">
            {i === 0 || found[i - 1].lane !== b.lane ? <h3 class="diagram-lane">{b.lane === "READ" ? "Read" : "Write"}</h3> : ""}
            <Element node={crop} />
          </div>
        );
      })}
    </div>
  );
}

function RegionItem({ region }: { region: Region }): JSX.Element {
  return (
    <li class={`k-${region.kind}`} style={region.color ? `--c: ${region.color}` : undefined}>
      <span>{region.label}</span>
      {region.children.length ? <ol class="region-list">{region.children.map((c) => <RegionItem region={c} />)}</ol> : ""}
    </li>
  );
}

/** "Where the tags live" on a phone: per format, its regions from the first byte (top) to the last. */
function FormatCards() {
  return (
    <div class="diagram-narrow diagram-formats">
      <p class="diagram-note">Each file from its first byte (top) to its last. Color: tags audio-tag reads and writes. Hatched: audio data.</p>
      {formatRows(tree("formats", "formats-m")).map((row) => (
        <section class="format-strip">
          <h3 style={row.labelStyle?.replace("fill:", "color:")}>{row.name} <small>{row.extensions}</small></h3>
          <ol class="region-list">{row.regions.map((r) => <RegionItem region={r} />)}</ol>
        </section>
      ))}
    </div>
  );
}

export function Diagram({ name }: { name: Name }) {
  return (
    <div class="diagram-box">
      <div class="diagram diagram-wide"><Element node={tree(name, name)} /></div>
      {name === "how-it-works" ? <StackedBoxes /> : <FormatCards />}
    </div>
  );
}
