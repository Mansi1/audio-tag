# MP4 / M4A metadata references

MP4 files (`.m4a`, `.m4b`, `.mp4`, `.mov`) do not use ID3. Their tags are atoms ("boxes") inside the
movie atom. Downloaded 2026-10-06.

## Normative
- `qtff/*.md`: Apple **QuickTime File Format** specification, Markdown edition from
  developer.apple.com, split per page. Key pages:
  - `Atoms.md`: atom header, 64-bit sizes, size 0, full atoms (version + flags).
  - `File_type_compatibility_atom.md` (`ftyp`), `Movie_atom.md` (`moov`), `Movie_data_atom.md`
    (`mdat`), `Chunk_offset_atom.md` (`stco`/`co64`: absolute file offsets that change when the
    movie atom grows).
  - `Metadata_atoms_and_types.md` and its pages: `meta`, `hdlr`, `keys`, `ilst`, item atoms,
    `data`, `itif`, `name`, type and locale indicators, `Well-known_types.md`.
  - `User_data_atoms.md`: `udta` and the `©xxx` international text entries;
    `Language_code_values.md` (packed ISO-639-2/T codes).
  - `QuickTime_metadata_keys.md`: `mdta` keys such as `com.apple.quicktime.title`.

## iTunes item list (de facto; Apple no longer publishes the "iTunes Metadata Format" spec)
QTFF only defines the `mdta` handler and says "If the handler type is not 'mdta', the
interpretation is defined by another specification". iTunes files use handler `mdir` with
four-character item atoms (`©nam`, `trkn`, `covr`, `----`, ...). These references document it:
- `exiftool-QuickTime-tags.md`, `exiftool-itemlist.md`: ExifTool's ItemList table (every known
  item atom, its name and value type).
- `mutagen-mp4.md`: mutagen's MP4 documentation (value kinds per atom, data
  type codes 0-27 including iTunes-specific ones beyond QTFF's table).
- `atomicparsley-metalist.cpp.md`, `atomicparsley-AtomDefs.h.md`: AtomicParsley source (GPL; used as a
  reference only) showing the binary layouts of `trkn`, `disk` and `gnre`.
- `picard-tag-mapping.rst.md`, `picard-id3-mp4-mapping.md`: MusicBrainz Picard's mapping between
  ID3v2 frames and MP4 atoms, including the `----:com.apple.iTunes:NAME` freeform names.

## Not freely available
ISO/IEC 14496-12 (ISO base media file format) and 14496-14 (MP4) are paid ISO standards. QTFF
`Atoms.md` states that atoms are "functionally identical" to ISO boxes, and that full atoms are
ISO full boxes.
