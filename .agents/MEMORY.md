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
- HYPOTHESIS[website build] a running `defuss-ssg dev` shares .ssg-temp/ and breaks `defuss-ssg build` BC 4/4 builds failed with it running, 5/5 passed before (kyr0/defuss#64); falsifier=a build failure with no dev server running
- UNKNOWN[test/riff|aiff 'reads a large file without the sound data'] failed once in a gate run, 0/6 reruns BC log overwritten; keep var/log/vae/tests.unit.log if it recurs
- UNKNOWN[Makefile test: website tsc] TS2345 at components/playground.tsx once in a gate run, not reproduced BC same TS 5.9.3 passed by hand
- VERIFIED[website dev 404 log] uses Vite's logger, not the ISO log format BC the user asked for it (2026-10-08)
- HYPOTHESIS[test/id3v2-frames 'never throws or hangs on mutated input' 10 s limit] fails under host CPU load BC 15.3 s and 20.0 s at load avg 9-10 on 8 cores (2026-10-08), each passed on the next run; falsifier=a failure at low load
