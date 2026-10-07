# RIFF / WAV

WAV files are RIFF files: a `RIFF` header with form type `WAVE`, then chunks (four-character ID,
32-bit little-endian size, data padded to an even length). Their own tags are the `LIST`/`INFO`
chunk; ID3 tags go in an `id3 ` (or `ID3 `) chunk. Downloaded 2026-10-06.

## Normative
- `riffmci.md`: **Multimedia Programming Interface and Data Specifications 1.0** (IBM and
  Microsoft, 1991-08), from https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/Docs/riffmci.pdf.
  The full document. Chapter 2: chunks (little-endian sizes, pad byte), `RIFF` forms, the `LIST`
  chunk, the `INFO` list and its IDs (`INAM`, `IART`, `ICMT`, ...), strings (ZSTR), `CSET` (code
  page; ISO 8859-1 when absent) and `JUNK`. Chapter 3: the WAVE form (`fmt `, `fact`, `cue `,
  `plst`, `LIST adtl`, `data`).
- `RIFFNEW.md`: **New Multimedia Data Types and Data Techniques, Revision 3.0** (Microsoft,
  1994-04-15), the WAVE update, from
  https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/Docs/RIFFNEW.pdf.
- `microsoft-RIFF.md`: **Resource Interchange File Format (RIFF)** (Microsoft Learn), from
  https://learn.microsoft.com/en-us/windows/win32/xaudio2/resource-interchange-file-format--riff-.
  The chunk layout: ID, size, data, `RIFF` and `LIST` chunks with a form or list type.

## De facto
- `WAVE.md`: McGill University's WAVE overview, from
  https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/WAVE/WAVE.html. Where the specs above came
  from, and the later extensions (WAVE_FORMAT_EXTENSIBLE).
- `exiftool-RIFF-tags.md`: ExifTool's RIFF tag table, from https://exiftool.org/TagNames/RIFF.html.
  Lists the `LIST`/`INFO` tag IDs and documents the `id3 ` and `ID3 ` chunks that hold an ID3v2
  tag. No spec defines these chunks; they are what taggers write.
