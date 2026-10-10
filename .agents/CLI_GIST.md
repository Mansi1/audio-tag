# CLI gist

<!-- Commands future agents need that the Makefile verbs do not cover (setup, env, data, deploy):
- VERIFIED[purpose] `cmd`: only after an observed success
- UNKNOWN[purpose] BC gap
Budget 2 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[CI parity: a fresh checkout without dist/] `git clone -q . $SCRATCH/c && cd $SCRATCH/c && npm ci && (cd website && bun install --frozen-lockfile) && make verify` BC passed 2026-10-08 after the lint/dist fix; the local gate always has a leftover dist/
- VERIFIED[e2e: reproduce a CI-only race locally] add `await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 20 }) // vae:probe` after `context.newPage()` in scripts/e2e.mjs, run `make e2e` alone (a parallel `make verify` rebuilds dist/ under it), remove the line BC reproduced the save/reload timeout of CI runs 37707341630 and 37710710505 (2026-10-08); the footer build-info check also fails at 20x, ignore it
- VERIFIED[bin audio-tag under yarn] in an empty dir outside the repo: `npx -y yarn@1 add <tgz> && npx -y yarn@1 audio-tag --port 5293`; yarn 4: `npm pack @yarnpkg/cli-dist@4.5.3`, `node package/bin/yarn.js` (nodeLinker: pnp works) BC 200s 2026-10-08
- VERIFIED[playwright screenshots: classic scroll bars on macOS] launch with channel "chromium" and ignoreDefaultArgs ["--hide-scrollbars"], and `defaults write com.google.chrome.for.testing AppleShowScrollBars -string Always` (delete it after) BC showed the 15 px list bar the user saw (2026-10-10)
- VERIFIED[make e2e while the user runs defuss-ssg dev] rsync the tree to $SCRATCH/copy without node_modules, dist, output, tmp and .ssg-temp; there `npm ci && (cd website && bun install --frozen-lockfile) && make e2e` BC passed 2026-10-10, dev server untouched
