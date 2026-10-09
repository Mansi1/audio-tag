import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import type { SsgPlugin } from "defuss-ssg";
import type { Plugin } from "vite";
import { UI_COMPONENTS, UI_SCRIPTS } from "./lib/ui.ts";
import { prettyLinks } from "./lib/pretty-links.ts";
import { isPageRoute, pageExists } from "./lib/dev-routes.ts";
import { SITE } from "./lib/site.ts";

const UI = "node_modules/defuss-shadcn/dist/components";
// The library build the playground loads at run time: one self-contained ESM file (scripts/minify.mjs).
const LIBRARY = "../dist/browser.min.js";
// Where the built components load `audio-tag/browser` from, below dist/ (see libraryUrl).
const LIBRARY_URL = "assets/vendor/audio-tag/browser.min.js";

// VERIFIED: copies the UI from node_modules into assets/vendor/ before the build copies assets, so the site
// works offline (no CDN): one ui.css (core first, then each component) and one script per module, since
// the component scripts are separate modules that must not be concatenated. The library build goes there
// too, without its 828 KB source map: browsers fetch the map only with the developer tools open.
const vendor: SsgPlugin = {
  name: "vendor-ui",
  phase: "pre",
  mode: "both",
  fn: () => {
    if (!existsSync(LIBRARY)) throw new Error(`${LIBRARY} is missing: build the library first (npm run build in the repository root)`);
    mkdirSync("assets/vendor/audio-tag", { recursive: true });
    copyFileSync(LIBRARY, "assets/vendor/audio-tag/browser.min.js");
    const css = [`${UI}/core.min.css`, ...UI_COMPONENTS.map((c) => `${UI}/${c}/${c}.min.css`)];
    writeFileSync("assets/vendor/ui.css", css.map((f) => readFileSync(f, "utf8")).join("\n"));
    copyFileSync(`${UI}/core.min.js`, "assets/vendor/core.min.js");
    for (const c of UI_SCRIPTS) copyFileSync(`${UI}/${c}/${c}.min.js`, `assets/vendor/${c}.min.js`);
    // Each component keeps its CSS next to it (components/**/*.css); the page links them as one file, in path order.
    const own = readdirSync("components", { recursive: true, encoding: "utf8" }).filter((f) => f.endsWith(".css")).sort();
    writeFileSync("assets/components.css", own.map((f) => `/* components/${f} */\n${readFileSync(`components/${f}`, "utf8")}`).join("\n"));
  },
};

// VERIFIED: defuss-ssg 0.7.5 writes no doctype (quirks mode) and absolute /components/ URLs with a
// ?v=Date.now() cache-bust into its hydration scripts. Page-relative URLs make one build work under
// /audio-tag/ (GitHub Pages) and /website/dist/ (the copy in the npm package). The runtime resolves
// data-hydrate-src|runtime from components/ itself, so those become "./X". 404.html is served by GitHub
// Pages at any depth, so its URLs are absolute. Upstream: kyr0/defuss#57 (doctype), #58 (sub-path), #59 (cache-bust).
const htmlFix: SsgPlugin = {
  name: "html-fix",
  phase: "page-html",
  mode: "both",
  fn: (html: string, outputPath: string) => {
    let out = "<!doctype html>\n" + html
      .replace(/(data-hydrate-(?:src|runtime)=")\/components\//g, "$1./")
      .replaceAll('"/components/', '"./components/')
      .replace(/"\?v=" \+ Date\.now\(\)/g, '""');
    if (outputPath.endsWith("404.html")) out = out.replace(/(href|src)="(?:\.\/)?(assets|components)\//g, '$1="/audio-tag/$2/');
    return out;
  },
};

// Page links without .html, as GitHub Pages serves them ("docs.html" → "docs", "index.html" → "./");
// scripts/serve.mjs resolves them the same way for the offline copy. The rewrite is lib/pretty-links.ts.
const githubPages: SsgPlugin = {
  name: "github-pages",
  phase: "page-html",
  mode: "both",
  fn: (html: string) => prettyLinks(html),
};
// VERIFIED: in `dev`, defuss-ssg renders pages without running its page-html plugins, but passes the HTML
// through Vite's transformIndexHtml; this Vite plugin rewrites the links there (the dev server serves
// /docs and / as well).
const githubPagesDev = { name: "github-pages-dev", transformIndexHtml: (html: string) => prettyLinks(html) };

// The dev server answers a missing page with the site's 404 page and status 404, as GitHub Pages does
// (it answered "Cannot GET /x"). Only page routes (lib/dev-routes.ts): a missing file stays a plain 404. The
// 404 page links to the published site and points its assets at /audio-tag/ only in the build, so here they
// point to the dev server. VERIFIED: each one is logged through Vite's logger ("[vite] page not found ...").
const PAGES = resolve(process.cwd(), "pages");
const notFoundDev: Plugin = {
  name: "not-found-dev",
  configureServer(server) {
    const log = server.config.logger;
    server.middlewares.use(async (req, res, next) => {
      const path = new URL(req.url ?? "/", "http://dev").pathname;
      if ((req.method !== "GET" && req.method !== "HEAD") || path === "/404.html" || !isPageRoute(path) || pageExists(PAGES, path)) return next();
      const origin = `http://${req.headers.host}`;
      try {
        const page = await fetch(`${origin}/404.html`);
        const html = (await page.text())
          .replace(/(href|src)="(?:\.\/)?(assets|components)\//g, '$1="/$2/')
          .replaceAll(SITE, `${origin}/`);
        log.warn(`page not found, serving the 404 page path=${path} status=404`, { timestamp: true });
        res.statusCode = 404;
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.setHeader("Cache-Control", "no-store");
        res.end(req.method === "HEAD" ? undefined : html);
      } catch (error) {
        log.error(`could not render the 404 page path=${path} error=${JSON.stringify(String(error))}`, { timestamp: true });
        next();
      }
    });
  },
};

// VERIFIED: defuss-ssg also writes the compiled config into the output; it must not ship (kyr0/defuss#60).
const dropConfig: SsgPlugin = {
  name: "drop-config",
  phase: "post",
  mode: "build",
  fn: () => {
    if (existsSync("dist/config.js")) rmSync("dist/config.js");
  },
};

// Points each built component and shared chunk at the vendored library relative to its own folder, so it resolves
// under /audio-tag/ (GitHub Pages) and /website/dist/ (the npm package) alike. A fixed "../" path (rollup
// output.paths) suited components/*.js only: a shared module that imports the library lands in components/chunks/,
// one folder deeper, and its import 404ed (VERIFIED: chunks/OtherTags-*.js asked for components/assets/…).
const libraryUrl: Plugin = {
  name: "library-url",
  renderChunk(code, chunk) {
    const up = "../".repeat(chunk.fileName.split("/").length); // playground.js → ../, chunks/x.js → ../../
    return code.replace(/(["'])audio-tag\/browser\1/g, `$1${up}${LIBRARY_URL}$1`);
  },
};

export default {
  plugins: [vendor, htmlFix, githubPages, dropConfig],
  viteConfig: {
    // the playground runs the current library build, as users get it from the package
    // (the build runs in website/; this config is compiled elsewhere, so not import.meta.url). The alias serves
    // rendering at build time and the dev server; the built component loads the vendored file instead of
    // bundling the library, so the browser caches it apart from the playground code.
    resolve: { alias: { "audio-tag/browser": resolve(process.cwd(), "../dist/browser.js") } },
    build: { rollupOptions: { external: ["audio-tag/browser"] } },
    plugins: [githubPagesDev, notFoundDev, libraryUrl],
  },
};
