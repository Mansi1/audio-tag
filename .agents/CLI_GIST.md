# CLI gist

<!-- Commands future agents need that the Makefile verbs do not cover (setup, env, data, deploy):
- VERIFIED[purpose] `cmd`: only after an observed success
- UNKNOWN[purpose] BC gap
Budget 2 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[CI parity: a fresh checkout without dist/] `git clone -q . $SCRATCH/c && cd $SCRATCH/c && npm ci && (cd website && bun install --frozen-lockfile) && make verify` BC passed 2026-10-08 after the lint/dist fix; the local gate always has a leftover dist/
- VERIFIED[e2e: reproduce a CI-only race locally] add `await (await context.newCDPSession(page)).send('Emulation.setCPUThrottlingRate', { rate: 20 }) // vae:probe` after `context.newPage()` in scripts/e2e.mjs, run `make e2e` alone (a parallel `make verify` rebuilds dist/ under it), remove the line BC reproduced the save/reload timeout of CI runs 37707341630 and 37710710505 (2026-10-08); the footer build-info check also fails at 20x, ignore it
