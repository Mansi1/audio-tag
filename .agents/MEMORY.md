# Agent memory

<!-- One tagged line per durable fact NOT derivable from code, git or docs:
- VERIFIED[scope] fact BC evidence
- HYPOTHESIS[scope] claim BC observation; falsifier=`cmd`
- UNKNOWN[scope] gap BC missing evidence
[scope] = the narrowest path|module|command|condition the evidence covers, not a topic: the entry decides nothing
outside it, and recurrence inside one subsystem never widens it.
Every line carries its BC and stays ≤240 chars. Replace stale lines instead of appending.
Mechanizable lessons belong in tests or .agents/VERIFY.py.
Budget 4 KiB (`vae.py doctor --repo .`); entries are injected at session start. -->
- HYPOTHESIS[website build] a running `defuss-ssg dev` shares .ssg-temp/ and breaks `defuss-ssg build` BC 4/4 failed with it up (kyr0/defuss#64); 2026-10-10 ENOTEMPTY .ssg-temp, passed once it stopped; falsifier=a failure with no dev server
- HYPOTHESIS[test/riff|aiff 'reads a large file without the sound data'] its one gate failure was vitest's 5 s timeout BC it took 4.5|4.3 s building a 20 MB fixture via JS arrays (fixed in e2d5894); falsifier=a failure after e2d5894
- UNKNOWN[Makefile test: website tsc] TS2345 at components/playground.tsx once in a gate run, not reproduced BC same TS 5.9.3 passed by hand
- VERIFIED[website dev 404 log] uses Vite's logger, not the ISO log format BC the user asked for it (2026-10-08)
- VERIFIED[test/*: vitest toEqual] on a 2 MB Uint8Array takes 4.3 s vs Buffer.equals 1 ms BC probe 2026-10-08; compare large byte arrays natively
- VERIFIED[npm trusted publisher audio-tag] owner `Mansi1` (exact case), workflow publish.yml (called by verify.yml) BC run 37846071490 published 0.1.0-rc.1 with provenance after the case fix (2026-10-08)
- VERIFIED[npm name audio-tag] owned by npm user mansi1; `npm login` (npm 10.8.2) needs a TTY: `script -q /dev/null npm login` BC placeholder publish 2026-10-08 made stub 0.0.0-stage
- VERIFIED[website/assets/vendor/ui.css .input on a <select>] a select always matches :read-only, so .input:read-only greys it (opacity .7, muted bg); reset both BC computed-style probe 2026-10-09
- VERIFIED[website/components: defuss JSX on* handlers] event.currentTarget is not the element (delegated), use event.target BC e2e console "currentTarget.closest is not a function" on a <li onMouseDown> (2026-10-09)
- VERIFIED[website e2e: elementFromPoint/viewport checks] site.css sets html { scroll-behavior: smooth }, so scrollIntoView needs behavior: 'instant' before measuring BC probe 2026-10-09: arrows stayed at y≈2500 in a 900 px viewport
- VERIFIED[website/components: rows holding a Combobox] its list adds nested <li role=option> and an <input>, so select rows as `#list > li` and fields by structure BC picture rows and e2e counted options as rows (2026-10-09)
- VERIFIED[website/components: defuss render() into a filled container] it patches the old element and keeps attributes the new markup omits (a text input kept a hex pattern); empty it first BC probe with/without replaceChildren 2026-10-09
- VERIFIED[website/tsconfig.json paths → bun test] bun 1.4.2 no longer runs a paths target that is a .d.ts (1.3.9 fell back to the .js), so list `.d.ts` then `.js`; CI's setup-bun installs the latest bun, local is 1.3.9 BC CI run 38006384413 "Cannot find module 'audio-tag/browser'", reproduced with bun 1.4.2 and fixed (2026-10-10)
