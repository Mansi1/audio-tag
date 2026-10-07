// isPageRoute() and pageExists(): which dev-server requests are pages, and whether the page exists.
import { afterAll, describe, expect, it } from "bun:test";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { isPageRoute, pageExists } from "./dev-routes.ts";

describe("isPageRoute", () => {
  it("takes paths without an extension and .html paths", () => {
    for (const p of ["/", "/docs", "/docs.html", "/guide/", "/a/b/c"]) expect(isPageRoute(p)).toBe(true);
  });
  it("leaves files and Vite's own paths alone", () => {
    for (const p of ["/assets/site.css", "/components/runtime.js", "/@vite/client", "/@fs/x", "/node_modules/x", "/__defuss"]) expect(isPageRoute(p)).toBe(false);
  });
});

describe("pageExists", () => {
  const pages = mkdtempSync(join(tmpdir(), "pages-"));
  mkdirSync(join(pages, "guide"));
  for (const f of ["index.mdx", "docs.mdx", "about.md", "contact.html", "guide/index.mdx", "guide/setup.mdx"]) writeFileSync(join(pages, f), "");

  it("finds pages by path, with or without .html, and folders by their index", () => {
    for (const p of ["/", "/index.html", "/docs", "/docs.html", "/about", "/contact", "/guide/", "/guide", "/guide/setup"]) expect(pageExists(pages, p)).toBe(true);
  });
  it("reports missing pages", () => {
    for (const p of ["/nope", "/nope.html", "/a/b/c", "/guide/nope", "/docs/"]) expect(pageExists(pages, p)).toBe(false);
  });
  it("stays inside the pages folder", () => {
    expect(pageExists(pages, "/../../etc/passwd")).toBe(false);
  });

  afterAll(() => rmSync(pages, { recursive: true, force: true }));
});
