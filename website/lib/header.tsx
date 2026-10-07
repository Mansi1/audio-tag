// Top bar of every page. VERIFIED: in lib/, not components/, since defuss-ssg hydrates every component
// from components/ and this one needs no JavaScript.
import type { Props } from "defuss";

export interface HeaderProps extends Props {
  active: "home" | "docs";
}

export function Header({ active }: HeaderProps) {
  return (
    <header class="topbar">
      <div class="page">
        <a class="brand" href="index.html">
          <img src="assets/icon.svg" alt="" width="30" height="30" />
          audio-tag
        </a>
        <nav class="topnav" aria-label="Main">
          <a href="index.html#playground">Playground</a>
          <a class="optional" href="index.html#formats">Formats</a>
          <a href="docs.html" aria-current={active === "docs" ? "page" : undefined}>Docs</a>
          <a class="optional" href="https://github.com/Mansi1/audio-tag">GitHub</a>
        </nav>
        <button class="btn" data-variant="ghost" data-size="icon-sm" type="button" data-theme-toggle aria-label="Dark mode" aria-pressed="false">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
            <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
