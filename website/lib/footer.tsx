// Footer of every page (server only): the build this site shows. VERIFIED: read from the library's
// dist/build-info.json at generation time (no fetch); make e2e compares it with the installed package.
import { buildInfo as info } from "./build-info.ts";

const kb = (n: number) => `${(n / 1024).toFixed(1)} KB`;

export function Footer() {
  const bundle = info.sizes.bundles["dist/browser.min.js"];
  return (
    <footer class="site-footer">
      <div class="page">
        <span>MIT licensed · built with <a href="https://github.com/kyr0/defuss">defuss</a> and <a href="https://github.com/kyr0/defuss-shadcn">defuss-shadcn</a></span>
        <span class="build" data-build="line">
          v<span data-build="version">{info.version}</span>
          {info.commit ? <span> · <a data-build="commit" href={`https://github.com/Mansi1/audio-tag/commit/${info.commit}`}>{info.commit}</a></span> : ""}
          {" · "}<time data-build="date" datetime={info.date}>{info.date.slice(0, 16).replace("T", " ")} UTC</time>
          {" · "}<span data-build="size">{kb(bundle.gzip)} gzipped</span>
        </span>
      </div>
    </footer>
  );
}
