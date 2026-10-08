// A code example with syntax colors (lib/highlight.ts) and a copy button. VERIFIED: assets/site.js copies the
// text, since every page loads it already; a hydrated island per block would add a runtime for one click.
import { highlight } from "./highlight.ts";

export function CodeBlock({ code, label, class: cls }: { code: string; label?: string; class?: string }) {
  return (
    <div class="code-block">
      <pre class={cls} aria-label={label}><code>{highlight(code).map((t) => (t.kind ? <span class={`code-${t.kind}`}>{t.text}</span> : t.text))}</code></pre>
      <button type="button" class="copy-btn" data-copy aria-label="Copy code">Copy</button>
    </div>
  );
}
