// Turns a README diagram (.github/readme/*.svg, drawn as a dark card) into inline SVG that follows the
// site's light and dark theme. VERIFIED: the README keeps the files as they are (it can only show images);
// the site inlines them, so CSS variables from assets/theme.css (--dg-*) can recolor them.

/** Colors of the dark card, by the theme variable that replaces them. Format colors and white text stay. */
export const THEME_COLORS: Record<string, string> = {
  "#0f172a": "--dg-bg",
  "#111c33": "--dg-box",
  "#334155": "--dg-line",
  "#1e293b": "--dg-hatch",
  "#273449": "--dg-hatch-stripe",
  "#f8fafc": "--dg-strong",
  "#e2e8f0": "--dg-text",
  "#94a3b8": "--dg-muted",
  "#64748b": "--dg-arrow",
  // the light label colors, readable on the dark card only
  "#60a5fa": "--dg-label-mpeg",
  "#93c5fd": "--dg-label-mpeg",
  "#a78bfa": "--dg-label-mp4",
  "#c4b5fd": "--dg-label-mp4",
  "#34d399": "--dg-label-flac",
  "#6ee7b7": "--dg-label-flac",
  "#fbbf24": "--dg-label-ogg",
  "#f472b6": "--dg-label-aiff",
  "#22d3ee": "--dg-label-riff",
};

const themed = (hex: string) => {
  const name = THEME_COLORS[hex.toLowerCase()];
  return name ? `var(${name})` : undefined;
};

/**
 * Inline-ready SVG: themed colors as CSS variables, ids prefixed with `prefix` (two diagrams on one page
 * must not share ids), and no fixed width or height (the viewBox keeps the aspect ratio).
 */
export function themeSvg(svg: string, prefix: string): string {
  let out = svg
    // ids and every reference to them
    .replace(/\sid="([^"]+)"/g, ` id="${prefix}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${prefix}-$1)`)
    .replace(/aria-labelledby="([^"]+)"/g, (_, ids: string) => `aria-labelledby="${ids.split(/\s+/).map((id) => `${prefix}-${id}`).join(" ")}"`)
    // the root scales with its container
    .replace(/<svg([^>]*)>/, (_, attrs: string) => `<svg${attrs.replace(/\s(width|height)="[^"]*"/g, "")}>`)
    // colors in <style> blocks: CSS accepts var() directly
    .replace(/<style>([\s\S]*?)<\/style>/g, (_, css: string) => `<style>${css.replace(/#[0-9a-fA-F]{6}\b/g, (hex) => themed(hex) ?? hex)}</style>`);

  // colors in presentation attributes: those do not take var(), so they move into one style attribute per element
  out = out.replace(/<([a-zA-Z]+)((?:\s[^<>]*?)?)(\/?)>/g, (tag, name: string, attrs: string, selfClosing: string) => {
    const styles: string[] = [];
    const rest = attrs.replace(/\s(fill|stroke|stop-color)="(#[0-9a-fA-F]{6})"/g, (attr, prop: string, hex: string) => {
      const value = themed(hex);
      if (!value) return attr;
      styles.push(`${prop}: ${value}`);
      return "";
    });
    return styles.length ? `<${name}${rest} style="${styles.join("; ")}"${selfClosing}>` : tag;
  });
  return out;
}
