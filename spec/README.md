# ID3 Tag Specifications

Downloaded 2026-10-05 from https://id3.org (official ID3 site) and the official
text mirrors at https://github.com/id3/ID3v2.3 and https://github.com/id3/ID3v2.4.

Every file here is Markdown. Plain-text sources (the official text, or the id3.org wiki source via `?action=raw`)
keep their exact text inside a ```` ```text ```` block; pages that were only HTML or PDF were converted with
[markitdown](https://github.com/microsoft/markitdown) on 2026-10-07, so their layout differs from the original.

## ID3v1 / ID3v1.1 (128-byte tag at end of file)
- `id3v1/ID3v1.md`: ID3v1 and v1.1 layout (the genre list is in the v2.x appendices)

## ID3v2.2 (id3v2-00, 1998, 3-char frame IDs)
- `id3v2/v2.2/id3v2-00.md`

## ID3v2.3.0 (1999, the most widely deployed version)
- `id3v2/v2.3/id3v2.3.0.md`: official text
- `id3v2/v2.3/id3guide.md`: ID3 guide / overview

## ID3v2.4.0 (2000, current version)
- `id3v2/v2.4/id3v2.4.0-structure.md`: tag structure (header, footer, sync-safe ints, flags)
- `id3v2/v2.4/id3v2.4.0-frames.md`: native frames
- `id3v2/v2.4/id3v2.4.0-changes.md`: changes from v2.3

## ID3v2 addenda (informal standards)
- `id3v2/addenda/id3v2-chapters-1.0.md`: CHAP / CTOC frames
- `id3v2/addenda/id3v2-accessibility-1.0.md`: accessibility frames

## Lyrics3 (non-ID3 lyrics tag, placed before ID3v1)
- `lyrics3/Lyrics3.md`, `lyrics3/Lyrics3v2.md`

## Extensions and de-facto conventions
- `id3v2/extensions/iTunes*.md`: iTunes frames (TCMP compilation flag, iTunNORM, and others)
- `id3v2/extensions/Experimental-RVA2.md`, `id3v2/extensions/Replay-Gain-Adjustment.md`

## Referenced standards (as summarized on id3.org)
- `id3v2/reference/ISO-639-2-language.md`: language codes (COMM, USLT, ...)
- `id3v2/reference/ISO-4217-currency.md`: currency codes (OWNE, COMR)
- `id3v2/reference/ISO-3901-ISRC.md`: ISRC (TSRC)

## Misc
- `id3/Compliance-Issues.md`: known spec ambiguities and real-world quirks
- `id3/FAQ.md`, `id3/Introduction.md`, `id3/Implementations.md`
- `id3/collected-ideas.md`: proposals collected for v2.3
- `id3/Developer-Information.md`: index of specs plus "Unofficial Frames Seen in the Wild"

## MP4 / M4A tags (not ID3)
- `mp4/README.md`: Apple QuickTime File Format spec (metadata atoms, user data, container), plus the de facto iTunes item-list references (ExifTool, mutagen, AtomicParsley, Picard)

## Other containers (not ID3): FLAC, Ogg, WAV, AIFF
Downloaded 2026-10-06. Each has its own tag format; ID3 tags only appear in them by convention.
FLAC, Ogg, AIFF and WAV are implemented.
- `flac/README.md`: RFC 9639 (FLAC), with the Vorbis comment metadata block
- `ogg/README.md`: RFC 3533 (Ogg), the Vorbis comment specification, the Vorbis I spec and RFC 7845 (Opus)
- `riff/README.md`: the RIFF/WAVE specifications (IBM/Microsoft 1991, Microsoft 1994), and the `id3 ` chunk
- `aiff/README.md`: AIFF 1.3 and AIFF-C (Apple), and the `ID3 ` chunk

## Test suites
- [`../test/fixtures/id3v1/`](../test/fixtures/id3v1/) (test fixtures, not in this folder): Martin Nilsson's official ID3v1/v1.1 test suite (274 files; free for non-commercial use, not normative)
