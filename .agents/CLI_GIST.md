# CLI gist

<!-- Commands future agents need that the Makefile verbs do not cover (setup, env, data, deploy):
- VERIFIED[purpose] `cmd`: only after an observed success
- UNKNOWN[purpose] BC gap
Budget 2 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- VERIFIED[CI parity: a fresh checkout without dist/] `git clone -q . $SCRATCH/c && cd $SCRATCH/c && npm ci && (cd website && bun install --frozen-lockfile) && make verify` BC passed 2026-10-08 after the lint/dist fix; the local gate always has a leftover dist/
