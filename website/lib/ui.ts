// The defuss-shadcn components the site uses: the one list config.ts copies from node_modules and
// lib/head.tsx loads. VERIFIED: only these ship; the whole library is 652 KB of CSS.
export const UI_COMPONENTS = [
  "accordion", "alert", "alert-dialog", "badge", "button", "card", "checkbox", "code-block", "docs-content",
  "docs-navigation", "empty-state", "file-input", "input", "kbd", "label", "separator", "table", "tabs",
  "textarea", "toast", "tooltip",
];

/** Components that ship a script; they run after core.min.js, in this order. */
export const UI_SCRIPTS = ["accordion", "alert-dialog", "file-input", "table", "tabs", "toast", "tooltip"];
