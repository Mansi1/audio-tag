// prettyLinks(): page links without .html, as GitHub Pages serves them.
import { describe, expect, it } from "bun:test";
import { prettyLinks } from "./pretty-links.ts";

describe("prettyLinks", () => {
  it("drops .html from page links and turns index.html into the folder", () => {
    expect(prettyLinks('<a href="docs.html">Docs</a>')).toBe('<a href="docs">Docs</a>');
    expect(prettyLinks('<a class="brand" href="index.html">x</a>')).toBe('<a class="brand" href="./">x</a>');
    expect(prettyLinks('<a href="guide/intro.html">x</a>')).toBe('<a href="guide/intro">x</a>');
    expect(prettyLinks('<a href="guide/index.html">x</a>')).toBe('<a href="guide/">x</a>');
  });

  it("keeps the anchor", () => {
    expect(prettyLinks('<a href="index.html#playground">x</a>')).toBe('<a href="./#playground">x</a>');
    expect(prettyLinks('<a href="docs.html#mapping">x</a>')).toBe('<a href="docs#mapping">x</a>');
  });

  it("handles root-absolute site links", () => {
    expect(prettyLinks('<a href="/audio-tag/docs.html">x</a>')).toBe('<a href="/audio-tag/docs">x</a>');
    expect(prettyLinks('<a href="/audio-tag/index.html">x</a>')).toBe('<a href="/audio-tag/">x</a>');
  });

  it("leaves other links, stylesheets, scripts and other sites alone", () => {
    for (const html of [
      '<a href="#mapping">x</a>',
      '<a href="https://github.com/Mansi1/audio-tag">x</a>',
      '<a href="https://example.com/page.html">x</a>',
      '<a href="//cdn.example.com/a.html">x</a>',
      '<link rel="stylesheet" href="assets/site.css" />',
      '<link rel="alternate" href="feed.html" />',
      '<a href="assets/icon.svg">x</a>',
      '<a href="mailto:a@b.c">x</a>',
    ]) expect(prettyLinks(html)).toBe(html);
  });
});
