// Splits SVG markup into a tree of elements, so a diagram can be rendered as defuss elements instead of
// raw HTML. VERIFIED: defuss's server renderer cut dangerouslySetInnerHTML SVG off at its <style> block.
// Handles what the README diagrams use: elements, attributes in double quotes, text and comments. No
// entities, CDATA or processing instructions (svg-tree.test.ts covers both diagrams).

export interface SvgNode {
  tag: string;
  attrs: Record<string, string>;
  children: (SvgNode | string)[];
}

const TOKEN = /<!--[\s\S]*?-->|<\/([a-zA-Z][\w:-]*)\s*>|<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>|([^<]+)/g;
const ATTR = /([\w:-]+)="([^"]*)"/g;

/** The root element of `markup`; text between elements is kept as it is (whitespace included). */
export function parseSvg(markup: string): SvgNode {
  const root: SvgNode = { tag: "", attrs: {}, children: [] };
  const stack = [root];
  for (const [, close, open, attrs, selfClosing, text] of markup.matchAll(TOKEN)) {
    const parent = stack[stack.length - 1];
    if (text !== undefined) {
      if (stack.length > 1) parent.children.push(text);
    } else if (open) {
      const node: SvgNode = { tag: open, attrs: Object.fromEntries([...attrs.matchAll(ATTR)].map(([, k, v]) => [k, v])), children: [] };
      parent.children.push(node);
      if (!selfClosing) stack.push(node);
    } else if (close) {
      if (stack.pop()?.tag !== close) throw new Error(`svg: </${close}> does not close the open element`);
    }
  }
  const svg = root.children.find((c): c is SvgNode => typeof c !== "string" && c.tag === "svg");
  if (!svg || stack.length !== 1) throw new Error("svg: no complete <svg> root");
  return svg;
}
