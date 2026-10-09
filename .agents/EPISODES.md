# Episodes

<!-- Newest last. The gate appends FAIL|DONE|FINDING; past 100 entries it trims only its own oldest DONE|FAIL|learned
Agents append `<UTC ISO> s=<session> LESSON <VAE-DIALECT>` only for a falsified HYPOTHESIS, a dead end, or a root cause.
Wrap: EVERY lead → test | .agents/VERIFY.py rule | one MEMORY line with BC, then delete; OR delete BC evidence. -->

2026-10-08T14:02:55Z s=3a87391b FINDING test/ogg-helpers.ts:page|ogg.test.ts:checkPages learn=test: the CRC test asserts pageCrc equals the bitwise reference; test speed itself is not pinned (host-dependent)
2026-10-08T14:48:50Z s=3a87391b DONE fp=5e222d589788 cov=94.0% paths=.github/workflows/pages.yml,.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md(+15)
2026-10-08T15:45:21Z s=7143a713 DONE fp=d0ff48ce4494 cov=? paths=plans/2026-10-08_15-43_release-candidate.md
2026-10-08T16:09:43Z s=7143a713 DONE fp=1e893b8342a9 cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+10)
2026-10-08T16:09:43Z s=7143a713 FINDING plans/2026-10-08_15-43_release-candidate.md:47 B01 learn=memory: probe commands recorded in .agents/CLI_GIST.md; yarn is not installed, so no gate test
2026-10-08T16:09:43Z s=7143a713 FINDING plans/2026-10-08_15-43_release-candidate.md:M1 probe learn=memory: recorded in CLI_GIST as 'outside the repo'
2026-10-08T16:31:19Z s=7143a713 DONE fp=6128b029d128 cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+10)
2026-10-08T21:30:59Z s=7143a713 DONE fp=8011ac24dff6 cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+10)
2026-10-08T21:30:59Z s=7143a713 FINDING plans/2026-10-08_15-43_release-candidate.md:25 B09 learn=memory: MEMORY line replaces the stale UNKNOWN about the CI publish path
2026-10-08T21:31:10Z s=7143a713 DONE fp=db24a6bd54b2 cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+10)
2026-10-08T21:35:23Z s=7143a713 FAIL tests.e2e.1
2026-10-08T21:38:08Z s=7143a713 DONE fp=72f8b2a729ac cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+10)
2026-10-08T21:38:08Z s=7143a713 FINDING scripts/e2e.mjs:247 save learn=none: intermittent under host load, cause not isolated; falsifier=a download timeout on an idle host
2026-10-08T21:38:08Z s=7143a713 FINDING CHANGELOG.md:3 learn=test: make lint runs scripts/release-notes.mjs
2026-10-08T21:40:20Z s=7143a713 DONE fp=66c341dbae70 cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+9)
2026-10-08T21:57:18Z s=7143a713 DONE fp=7f6d247feb5a cov=94.0% paths=.github/workflows/publish.yml,.github/workflows/verify.yml,ARCH.md,CHANGELOG.md(+9)
2026-10-09T16:55:54Z s=f5032668 DONE fp=9c9118d0b061 cov=94.0% paths=scripts/e2e.mjs,website/assets/site.css,website/components/playground.tsx
2026-10-09T17:08:10Z s=f5032668 DONE fp=2f62398d9b3e cov=94.0% paths=scripts/e2e.mjs,website/assets/site.css,website/components/playground.tsx
2026-10-09T17:19:28Z s=f5032668 DONE fp=76eb3ffc299b cov=94.0% paths=scripts/e2e.mjs,website/assets/site.css,website/components/playground.tsx
2026-10-09T17:19:28Z s=f5032668 FINDING website/components/playground.tsx:onAddPictures learn=test: make e2e now picks twice and counts the saved pictures
2026-10-09T17:27:19Z s=f5032668 DONE fp=2ff41df75cf6 cov=94.0% paths=scripts/e2e.mjs,website/assets/site.css,website/components/playground.tsx
2026-10-09T17:27:19Z s=f5032668 FINDING website/components/playground.tsx:drawPictures learn=test: make e2e checks the picture box info line
2026-10-09T17:44:34Z s=f5032668 DONE fp=434071b9bc78 cov=94.0% paths=scripts/e2e.mjs,website/assets/site.css,website/components/playground.tsx
2026-10-09T17:44:34Z s=f5032668 FINDING website/components/playground.tsx:CommentRow option onMouseDown learn=test: make e2e picks a language with the mouse; MEMORY line for the defuss event gotcha
2026-10-09T17:44:34Z s=f5032668 FINDING website/components/playground.tsx:languageKey|openLanguages learn=test: make e2e covers click-open, filter, Enter, mouse pick and free text
2026-10-09T17:57:39Z s=f5032668 DONE fp=4b5346690973 cov=94.0% paths=scripts/e2e.mjs,website/README.md,website/assets/site.css,website/components/playground.tsx(+1)
2026-10-09T18:08:39Z s=f5032668 DONE fp=8ecfa3fe1b72 cov=94.0% paths=scripts/e2e.mjs,website/README.md,website/assets/site.css,website/components/icon/ChevronIcon.tsx(+7)
2026-10-09T18:08:39Z s=f5032668 FINDING website/config.ts:vendor|website/lib/head.tsx learn=test: make e2e checks that the component CSS applies
2026-10-09T18:17:59Z s=f5032668 DONE fp=e166d394175d cov=94.0% paths=scripts/e2e.mjs,website/README.md,website/assets/site.css,website/components/icon/ChevronIcon.tsx(+7)
2026-10-09T18:17:59Z s=f5032668 FINDING website/components/input/Combobox.tsx:open learn=test: make e2e checks the genre completion and the saved genres
2026-10-09T18:17:59Z s=f5032668 FINDING scripts/e2e.mjs:arrow cursor check learn=memory: recurring trap for viewport-based checks on this site
2026-10-09T18:28:47Z s=f5032668 DONE fp=4a14e7c3b118 cov=94.0% paths=scripts/e2e.mjs,website/README.md,website/assets/site.css,website/components/icon/CheckIcon.tsx(+8)
2026-10-09T18:28:47Z s=f5032668 FINDING website/components/input/Combobox.tsx:open learn=test: make e2e checks the checked options
2026-10-09T18:28:47Z s=f5032668 FINDING scripts/e2e.mjs:servers learn=none: the leak is fixed and probed; what removed tooltip.min.js from website/dist during that one run is not established (no dev server or second build was found runn
2026-10-09T18:33:09Z s=f5032668 DONE fp=1aa92bd4e715 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,website/README.md(+10)
2026-10-09T19:05:19Z s=f5032668 DONE fp=3ccd8193c272 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,website/README.md(+15)
2026-10-09T19:05:19Z s=f5032668 FINDING website/components/OtherTags.tsx:UNSUPPORTED learn=test: make e2e checks the hidden M4A fields
2026-10-09T19:05:19Z s=f5032668 FINDING website/components/OtherTags.tsx:otherTagChanges|canonical learn=test: make e2e saves and reads back every kind of field
2026-10-09T19:23:24Z s=f5032668 DONE fp=6500b0efc735 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,website/README.md(+17)
2026-10-09T19:23:24Z s=f5032668 FINDING website/lib/raw-tags.ts learn=test: lib/raw-tags.test.ts
2026-10-09T19:23:24Z s=f5032668 FINDING website/config.ts:libraryUrl learn=test: make e2e fails on failed requests and checks the served library
2026-10-09T19:23:24Z s=f5032668 FINDING website/components/OtherTags.tsx|scripts/e2e.mjs learn=test: make e2e
2026-10-09T19:42:43Z s=f5032668 FAIL coverage
2026-10-09T19:45:06Z s=f5032668 FAIL tests.unit,coverage
2026-10-09T19:48:36Z s=f5032668 FAIL tests.unit,tests.e2e.1,coverage
2026-10-09T19:52:20Z s=f5032668 FAIL tests.unit,tests.e2e.1
2026-10-09T19:54:36Z s=f5032668 DONE fp=aa14e123408e cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,website/README.md(+17)
2026-10-09T19:54:36Z s=f5032668 FINDING website/components/input/Combobox.tsx:show|position learn=test: make e2e checks the frame ID list opens whole and on top
2026-10-09T20:13:06Z s=f5032668 FAIL tests.unit,tests.e2e.1
2026-10-09T20:18:38Z s=f5032668 DONE fp=a8ac59bd0365 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+18)
2026-10-09T20:18:38Z s=f5032668 FINDING website/components/input/Combobox.css:.combo-list learn=test: make e2e wheels past the genre list end and checks the page did not move
2026-10-09T20:18:38Z s=f5032668 FINDING test/id3v2-frames.test.ts:never throws or hangs on mutated input learn=test: the test measures CPU time now; MEMORY hypothesis removed
2026-10-09T20:27:05Z s=f5032668 DONE fp=ebc3f78e5b27 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+18)
2026-10-09T20:27:05Z s=f5032668 FINDING scripts/e2e.mjs:wheel check learn=none: stale box under load inferred from listAtEnd false, not reproduced; falsifier = a failure with open true and listAtEnd false after hover()
2026-10-09T20:38:03Z s=f5032668 DONE fp=646927da4aa4 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+16)
2026-10-09T20:38:03Z s=f5032668 FINDING website/components/input/Combobox.css:.select-chevron learn=test: make e2e checks the rotation
2026-10-09T20:38:03Z s=f5032668 FINDING website/components/playground.tsx:PictureRow|PICTURE_TYPE_PATTERN learn=test: make e2e sets the type by name and checks refusal
2026-10-09T20:38:03Z s=f5032668 FINDING website/components/playground.tsx:drawPictures|scripts/e2e.mjs learn=memory: rows that contain a Combobox hold nested li and input elements
2026-10-09T20:54:50Z s=f5032668 DONE fp=66cf71da6d64 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+16)
2026-10-09T20:54:50Z s=f5032668 FINDING website/lib/raw-tags.ts:plainBody|writeID3 learn=test: lib/raw-tags.test.ts and make e2e
2026-10-09T20:54:50Z s=f5032668 FINDING website/lib/raw-tags.ts:idPattern learn=test: unit test 'ID patterns' and make e2e
2026-10-09T21:22:21Z s=f5032668 DONE fp=24baa6772fec cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+18)
2026-10-09T21:22:21Z s=f5032668 FINDING website/components/input/HexInput.tsx|RowList.tsx|lib/raw-tags.ts learn=test: lib/raw-tags.test.ts and make e2e
2026-10-09T21:22:21Z s=f5032668 FINDING website/components/input/RowList.tsx:changed learn=test: make e2e types text after a hex-to-text switch; MEMORY line on defuss render
2026-10-09T21:22:31Z s=f5032668 DONE fp=e94abfa507f5 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+18)
2026-10-09T21:40:54Z s=f5032668 DONE fp=1ee4421007ae cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+20)
2026-10-09T21:40:54Z s=f5032668 FINDING website/components/input/BytesInput.tsx|lib/raw-tags.ts:unknown|textOfHex learn=test: lib/raw-tags.test.ts and make e2e
2026-10-09T23:04:06Z s=f5032668 DONE fp=ba3f79bdf1ef cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+20)
2026-10-09T23:04:06Z s=f5032668 FINDING website/components/input/Combobox.tsx:strict|remember|settle learn=test: make e2e leaves strict fields with junk and lower case
2026-10-09T23:27:42Z s=f5032668 DONE fp=03d5975c28a6 cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+20)
2026-10-09T23:27:42Z s=f5032668 FINDING website/components/input/Combobox.css:.combo-list learn=memory: how to see classic scroll bars in the test browser
2026-10-09T23:38:31Z s=f5032668 DONE fp=105afb3dcddf cov=94.0% paths=Makefile,README.md,scripts/e2e.mjs,test/id3v2-frames.test.ts(+20)
2026-10-09T23:38:31Z s=f5032668 FINDING website/components/input/Combobox.css:.combo-list box-sizing learn=test: make e2e compares list and field widths
2026-10-09T23:43:41Z s=f5032668 DONE fp=0a25f98811db cov=94.0% paths=CHANGELOG.md,Makefile,README.md,scripts/e2e.mjs(+21)
2026-10-09T23:43:41Z s=f5032668 FINDING website/components/playground.tsx:CommentRow pattern learn=none: one-off redundancy, nothing to check mechanically
2026-10-09T23:43:41Z s=f5032668 FINDING website/assets/site.css:.select select learn=none: a visual style; e2e already checks the page renders, a pixel check would pin styling
2026-10-09T23:43:41Z s=f5032668 FINDING website/components/input/Combobox.tsx learn=none: behavior unchanged and already covered by make e2e
2026-10-09T23:43:41Z s=f5032668 FINDING scripts/e2e.mjs:inputCss learn=none: caught by running e2e; no recurring pattern
2026-10-09T23:43:41Z s=f5032668 FINDING website/components/input/Combobox.tsx:option id learn=none: documented on the id prop
2026-10-09T23:43:41Z s=f5032668 FINDING website/components/input/Combobox.css learn=none: one-off
2026-10-09T23:43:41Z s=f5032668 FINDING .githooks/pre-push|Makefile:setup learn=none: the hook is the mechanism itself
2026-10-09T23:43:41Z s=f5032668 FINDING website/components/input/RowList.tsx learn=none: covered by the existing comment checks
2026-10-09T23:43:41Z s=f5032668 FINDING website/.gitignore learn=none: ignore rule is the guard
2026-10-09T23:43:41Z s=f5032668 FINDING scripts/e2e.mjs:frame ID list check learn=memory: cause (stale one-frame position under load) not established; falsifier = the waiting check failing with a box outside the viewport
2026-10-09T23:43:41Z s=f5032668 FINDING CHANGELOG.md:Unreleased learn=test: make lint runs scripts/release-notes.mjs
2026-10-09T23:55:54Z s=dfc79eed DONE fp=e132119deb8e cov=94.0% paths=website/tsconfig.json
2026-10-09T23:55:54Z s=dfc79eed FINDING website/tsconfig.json:13 paths audio-tag/browser learn=memory: depends on the bun version CI installs; a test cannot pin it, MEMORY line records it
