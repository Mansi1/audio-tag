// Page links without .html: "docs.html" → "docs", "index.html" → "./" (the folder). Only <a href> on this
// site changes: other sites, anchors, stylesheets and files that are not pages stay as they are.
// VERIFIED: scripts/serve.mjs serves them for the copy in the npm package (make e2e opens /website/dist/docs).
// HYPOTHESIS: GitHub Pages serves /audio-tag/docs from docs.html and a folder from its index.html; falsifier:
// a 404 at https://mansi1.github.io/audio-tag/docs after the next deploy.

// <a ... href="[path/]name.html[#anchor]"> with no scheme (https:, mailto:) and not protocol-relative (//)
const PAGE_LINK = /(<a\b[^>]*?\shref=")(?![a-z][a-z0-9+.-]*:|\/\/)([^"#]*?)([^"#/]+)\.html(#[^"]*)?"/gi;

export function prettyLinks(html: string): string {
  return html.replace(PAGE_LINK, (_, start: string, dir: string, page: string, anchor = "") =>
    `${start}${page === "index" ? dir || "./" : dir + page}${anchor}"`);
}
