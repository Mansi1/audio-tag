// <head> of every page (server only: lives in lib/, so defuss-ssg does not hydrate it).
import type { Props } from "defuss";
import { SITE } from "./site.ts";
import { UI_SCRIPTS } from "./ui.ts";

export interface HeadProps extends Props {
  title: string;
  description: string;
  /** The page's address below SITE ("" for home, "docs"), for og:url; none for the 404 page. */
  path?: string;
}

// Runs before anything else; no `&`, `<` or `>`, since the text is serialized as XML.
// 1. VERIFIED: turns off defuss-ssg 0.7.5's client-side navigation. Its popstate handler re-renders the page
//    without the hash after an in-page jump (#section links scroll back to the top), and its morphing page
//    change does not re-run the head scripts. The runtime installs it only when this flag is unset.
//    Upstream: kyr0/defuss#55.
// 2. Applies the remembered theme before the first paint.
const THEME = "window.__defuss_runtime_init = true; try { var t = localStorage.getItem('audio-tag-theme'); if (t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches) document.documentElement.classList.add('dark') } catch (e) {}";

// Link previews (WhatsApp, Slack, social sites) read Open Graph tags; the image is made by scripts/og-image.mjs.
export function Head({ title, description, path }: HeadProps) {
  return (
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="icon" href="assets/icon.svg" type="image/svg+xml" />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="audio-tag" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      {path === undefined ? null : <meta property="og:url" content={SITE + path} />}
      <meta property="og:image" content={`${SITE}assets/og.jpg`} />
      <meta property="og:image:type" content="image/jpeg" />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content="audio-tag: spec-exact tags for MP3, M4A, FLAC, Ogg, AIFF and WAV" />
      <meta name="twitter:card" content="summary_large_image" />
      <script>{THEME}</script>
      <link rel="stylesheet" href="assets/vendor/ui.css" />
      <link rel="stylesheet" href="assets/theme.css" />
      <link rel="stylesheet" href="assets/site.css" />
      <link rel="stylesheet" href="assets/components.css" />
      <script type="module" src="assets/vendor/core.min.js"></script>
      {UI_SCRIPTS.map((c) => <script type="module" src={`assets/vendor/${c}.min.js`}></script>)}
      <script type="module" src="assets/site.js"></script>
    </head>
  );
}
