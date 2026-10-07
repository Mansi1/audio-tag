# AIFF / AIFF-C

AIFF files are IFF files: a `FORM` header with form type `AIFF` (or `AIFC`), then chunks
(four-character ID, 32-bit **big-endian** size, data padded to an even length). Their own text
chunks are `NAME`, `AUTH`, `(c) `, `ANNO` and `COMT`; ID3 tags go in an `ID3 ` chunk.
Downloaded 2026-10-06.

## Normative
- `AIFF-1.3.md`: **Audio Interchange File Format "AIFF", Version 1.3** (Apple, 1989-01-04), from
  https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf. The FORM container,
  the chunk layout and the text chunks.
- `AIFF-C.9.26.91.md`: **Audio Interchange File Format AIFF-C** (Apple draft, 1991-09-26), from
  https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-C.9.26.91.pdf. The `AIFC`
  form type for compressed audio; same chunk rules.

## De facto
- `AIFF.md`: McGill University's AIFF overview, from
  https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/AIFF.html.
- `exiftool-AIFF-tags.md`: ExifTool's AIFF tag table, from https://exiftool.org/TagNames/AIFF.html.
  Documents the `ID3 ` chunk that holds an ID3v2 tag. No spec defines it; it is what taggers
  write.
