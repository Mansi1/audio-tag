# Episodes

<!-- Newest last. The gate appends FAIL|DONE|FINDING; past 100 entries it trims only its own oldest DONE|FAIL|learned
Agents append `<UTC ISO> s=<session> LESSON <VAE-DIALECT>` only for a falsified HYPOTHESIS, a dead end, or a root cause.
Wrap: EVERY lead → test | .agents/VERIFY.py rule | one MEMORY line with BC, then delete; OR delete BC evidence. -->

2026-10-07T17:46:46Z s=e3d1b970 FAIL prose,layout,gitignore,lint=?,tests.unit=?,tests.e2e=?,coverage=?
2026-10-07T17:52:16Z s=e3d1b970 FAIL docs.pages,prose,package
2026-10-07T18:03:10Z s=e3d1b970 DONE fp=c5edbb61454b cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/verify.yml,AGENTS.md,ARCH.md(+8)
2026-10-07T18:03:10Z s=e3d1b970 FINDING README.md frame table (T02) learn=verifier: The prose gate check flags any reintroduced em dash in README.md.
2026-10-07T18:03:10Z s=e3d1b970 FINDING scripts/e2e.mjs (e2e coverage) learn=test: make e2e now fails if any of these controls breaks.
2026-10-07T18:08:31Z s=e3d1b970 FAIL env.example
2026-10-07T18:13:31Z s=e3d1b970 DONE fp=c22d44399e0c cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/verify.yml,AGENTS.md,ARCH.md(+9)
2026-10-07T18:13:31Z s=e3d1b970 FINDING scripts/serve.mjs:14 port learn=test: make e2e starts the installed copy with --port and the repository copy with PORT, so both paths stay covered.
2026-10-07T18:13:31Z s=e3d1b970 FINDING .env.example learn=verifier: The env.example gate check flags a missing key.
2026-10-07T18:21:12Z s=e3d1b970 FAIL prose
2026-10-07T18:26:24Z s=e3d1b970 DONE fp=d3e29e71dabf cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/verify.yml,AGENTS.md,ARCH.md(+170)
2026-10-07T18:26:24Z s=e3d1b970 FINDING spec/ (all converted pages) learn=verifier: The prose gate check flags any broken relative link in a changed page.
2026-10-07T18:26:24Z s=e3d1b970 FINDING .gitattributes learn=test: test/id3v1.node.test.ts reads generation.log and the 274 MP3s, so changed bytes fail it.
2026-10-07T18:35:04Z s=e3d1b970 DONE fp=5b3692f0f136 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/verify.yml,AGENTS.md,ARCH.md(+170)
2026-10-07T18:40:46Z s=e3d1b970 FAIL tests.e2e.1
2026-10-07T18:43:15Z s=e3d1b970 DONE fp=3af99cf31681 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/verify.yml,AGENTS.md,ARCH.md(+183)
2026-10-07T18:43:15Z s=e3d1b970 FINDING scripts/e2e.mjs:43 PER_FORMAT learn=test: make e2e builds every per-format function name from this map and calls it, so a stale entry fails the run.
2026-10-07T18:52:08Z s=e3d1b970 FAIL env.example,tests.unit
2026-10-07T18:56:13Z s=e3d1b970 DONE fp=3980cb82260d cov=94.0% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+230)
2026-10-07T18:56:13Z s=e3d1b970 FINDING test/build-info.test.ts learn=test: Every test runs in both vitest projects, so a node-only path API fails the jsdom run.
2026-10-07T18:56:13Z s=e3d1b970 FINDING website/site.js showBuildInfo, key 'line' learn=test: make e2e waits for the footer line to be visible when the build has a commit and hidden otherwise.
2026-10-07T18:56:13Z s=e3d1b970 FINDING README.md, spec/README.md, 11 src comments (tasks/ references) learn=verifier: The prose gate check flags broken relative links in changed pages.
2026-10-07T18:56:13Z s=e3d1b970 FINDING .env.example SOURCE_DATE_EPOCH learn=verifier: The env.example gate check flags a missing key.
2026-10-07T19:00:32Z s=e3d1b970 DONE fp=80473170f17f cov=94.0% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+230)
2026-10-07T19:06:09Z s=e3d1b970 DONE fp=7170d35800f2 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+227)
2026-10-07T19:12:36Z s=e3d1b970 DONE fp=12558507e543 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+228)
2026-10-07T19:14:35Z s=e3d1b970 DONE fp=ff57d684774d cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+228)
2026-10-07T19:19:33Z s=e3d1b970 DONE fp=a59349465cb3 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+228)
2026-10-07T19:35:00Z s=e3d1b970 FAIL tests.e2e.1
2026-10-07T19:55:25Z s=e3d1b970 FAIL prose,tests.e2e.1
2026-10-07T19:58:35Z s=e3d1b970 FAIL tests.e2e.1
2026-10-07T20:11:35Z s=e3d1b970 FAIL docs.pages,prose,package,tests.e2e.1
2026-10-07T20:21:38Z s=e3d1b970 FAIL docs.pages,tests.e2e.1
2026-10-07T20:39:22Z s=e3d1b970 FAIL tests.unit
2026-10-07T20:42:16Z s=e3d1b970 DONE fp=7c49cee185f9 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+259)
2026-10-07T20:42:16Z s=e3d1b970 FINDING website/lib/head.tsx THEME (defuss-ssg client nav) learn=test: make e2e clicks a docs menu link and requires the hash and the menu mark to follow.
2026-10-07T20:42:16Z s=e3d1b970 FINDING website/.npmignore learn=test: make e2e checks the installed package has website/dist/index.html.
2026-10-07T20:42:16Z s=e3d1b970 FINDING website/lib/pages/not-found.tsx COUNTDOWN learn=test: make e2e fails on page errors and visits 404.html, where the countdown runs.
2026-10-07T20:42:16Z s=e3d1b970 FINDING package.json files: website/dist/config.js learn=test: Root cause not reproduced; make e2e now asserts config.js is not in the installed package.
2026-10-07T20:42:16Z s=e3d1b970 FINDING website/assets/site.js scroll spy learn=test: make e2e checks the menu mark after a jump (desktop).
2026-10-07T20:42:16Z s=e3d1b970 FINDING website/lib/byte-map.ts formType learn=test: make test runs tsc on the website.
2026-10-07T20:42:16Z s=e3d1b970 FINDING website/components/playground.tsx Reset learn=test: make e2e checks Reset restores the loaded tags.
2026-10-07T21:01:04Z s=e3d1b970 DONE fp=d170d053b26e cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+259)
2026-10-07T21:10:12Z s=e3d1b970 DONE fp=6a0a1aaae09d cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+259)
2026-10-07T21:18:01Z s=e3d1b970 FAIL tests.unit
2026-10-07T21:21:52Z s=e3d1b970 FAIL tests.e2e.1,coverage
2026-10-07T21:26:03Z s=e3d1b970 DONE fp=6655cb256101 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+264)
2026-10-07T21:26:03Z s=e3d1b970 FINDING website/lib/diagram.tsx (raw SVG) learn=test: Where defuss truncates is not traced yet (no upstream issue); make e2e checks both diagrams render with their texts.
2026-10-07T21:26:03Z s=e3d1b970 FINDING website/package.json build (stale dist/) learn=test: make e2e asserts the package has no build config; a clean dist/ per build removes stale files.
2026-10-07T21:39:05Z s=e3d1b970 DONE fp=4ce61107528d cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+266)
2026-10-07T21:39:05Z s=e3d1b970 FINDING website/assets/site.css (truncated) learn=test: make e2e now checks that the layout CSS applies (docs grid, footer flex, playground grid) in both viewports.
2026-10-07T21:51:09Z s=e3d1b970 DONE fp=dbd2d2e46935 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+268)
2026-10-07T21:57:14Z s=e3d1b970 DONE fp=c4b4fa1702cc cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+268)
2026-10-07T22:03:17Z s=e3d1b970 DONE fp=5bd28b5ee1bc cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+270)
2026-10-07T22:22:32Z s=e3d1b970 DONE fp=f839fecc376f cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+270)
2026-10-07T22:29:36Z s=e3d1b970 DONE fp=30bf42dd0b2e cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+271)
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/docs.html:354 learn=none: Hand-written count next to a generated table; making the generator own the sentence is a larger change than this task.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/docs.html:166 + README.md:102 learn=none: Prose claim; no mechanical check links docs sentences to behaviour.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/docs.html low-level example + README.md:207 learn=none: Docs examples are not compiled; a doc-example typecheck would catch it but does not exist yet.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/docs.html Writing table: padding learn=none: Prose claim.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/index.html:109 #pick accept learn=none: No rule ties accept list to formats.
2026-10-07T22:29:36Z s=e3d1b970 FINDING scripts/e2e.mjs:144 import(join(...)) learn=none: Single occurrence; CI runs on Linux.
2026-10-07T22:29:36Z s=e3d1b970 FINDING ARCH.md mermaid (T07) learn=none: The static prose check only covers unbalanced quotes and unknown diagram types.
2026-10-07T22:29:36Z s=e3d1b970 FINDING scripts/serve.mjs:66 server.listen(port) learn=none: A LAN-reachability test needs a second interface address, which CI runners do not reliably have.
2026-10-07T22:29:36Z s=e3d1b970 FINDING spec/mp4/QTFF-Metadata.html learn=none: One-off download artefact.
2026-10-07T22:29:36Z s=e3d1b970 FINDING spec/aiff/AIFF-C.9.26.91.md, spec/riff/riffmci.md 'TBD' learn=none: Third-party wording; no general rule.
2026-10-07T22:29:36Z s=e3d1b970 FINDING README.md license note learn=none: Prose claim.
2026-10-07T22:29:36Z s=e3d1b970 FINDING tsup.config.ts types learn=none: Editor-only diagnostic; the config is not part of any typecheck project.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/lib/build-info.ts learn=none: The site build fails loudly if the import breaks again.
2026-10-07T22:29:36Z s=e3d1b970 FINDING scripts/e2e.mjs byte-map hex learn=none: Test-side race, fixed in the test.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/components/playground.tsx empty state learn=none: Markup follows the skill; no automated check of class names against the skill.
2026-10-07T22:29:36Z s=e3d1b970 FINDING test/riff.test.ts or test/aiff.test.ts: 'reads a large file without the sound data' learn=none: Cause not observed; if it recurs, keep var/log/vae/tests.unit.log of the failing run.
2026-10-07T22:29:36Z s=e3d1b970 FINDING Makefile test: website tsc (gate run) learn=none: Not reproduced; the failing log is kept in the session scratchpad (unit-fail-tsc.log).
2026-10-07T22:29:36Z s=e3d1b970 FINDING website (defuss-ssg dev server during builds) learn=none: The earlier one-off failures (SSR error at 22:57, config.js in the package, the tsc error) fit this cause; falsifier: one of them recurring with no dev server r
2026-10-07T22:29:36Z s=e3d1b970 FINDING .github/readme/how-it-works.svg 'the audio is referenced, not copied' learn=none: No automated text-fits-box check; the phone layout screenshot showed it.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/components/playground.tsx legend learn=none: Visual only; seen in a screenshot.
2026-10-07T22:29:36Z s=e3d1b970 FINDING website/config.ts notFoundDev log learn=none: Dev-only log format chosen by the user over the ISO rule; e2e covers the built site, not the dev server.
2026-10-07T22:33:07Z s=e3d1b970 FAIL prose
2026-10-07T22:41:54Z s=e3d1b970 DONE fp=bda692e7ce52 cov=93.9% paths=.claude/skills/update-docs/SKILL.md,.github/workflows/pages.yml,.github/workflows/verify.yml,AGENTS.md(+274)
