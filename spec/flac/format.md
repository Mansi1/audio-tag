[![FLAC Logo](https://xiph.org/flac/images/logo130.gif)](https://xiph.org/flac/index.html)

[home](https://xiph.org/flac/index.html)
[faq](https://xiph.org/flac/faq.html)
[download](https://xiph.org/flac/download.html)
[links](https://xiph.org/flac/links.html)

[documentation](https://xiph.org/flac/documentation.html)
[changelog](https://xiph.org/flac/changelog.html)
[developers](https://xiph.org/flac/developers.html)

# Format

The FLAC format is described in great detail in **[RFC 9639](https://datatracker.ietf.org/doc/rfc9639/)**. That document also defines the mapping of FLAC in the [Ogg](https://www.rfc-editor.org/rfc/rfc9639.html#name-ogg-mapping) and [Matroska (mkv)](https://www.rfc-editor.org/rfc/rfc9639.html#name-matroska-mapping) containers, [provides implementation guidance](https://www.rfc-editor.org/rfc/rfc9639.html#name-numerical-considerations) and contains [examples walking through all decoding steps](https://www.rfc-editor.org/rfc/rfc9639.html#name-examples).

The [old description of the FLAC format](https://xiph.org/flac/old_format.html) that used to be on this page for many years served as the basis for the RFC.
While it lacks detail in certain places, requiring the reader to look for details in the libFLAC source code to fully understand it, it remains a useful overview and historical reference.

Additionally, there is a set of [FLAC format conformance test files](https://github.com/ietf-wg-cellar/flac-test-files) available to test whether a decoder has properly implemented all features of the FLAC format.

[show hidden anchors]

---

The old document used to be at this URL, so below is a mapping from the old anchors to the appropriate sections of the RFC. This preserves deep links to those anchors.

### Acknowledgments

See [section Acknowledgments of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-acknowledgments)

### Scope

See [section 1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-introduction)

### Architecture

See [section 4 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-conceptual-overview)

### Definitions

See [section 3 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-definitions)

### Blocking

See [section 4.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-blocking)

### Interchannel Decorrelation

See [section 4.2 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-interchannel-decorrelation)

### Prediction

See [section 4.3 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-prediction)

### Residual Coding

See [section 4.4 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-residual-coding)

### Format

See [section 5 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-format-principles)

### STREAMINFO

See [section 8.2 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-streaminfo)

### APPLICATION

See [section 8.4 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-application)

### PADDING

See [section 8.3 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-padding)

### SEEKTABLE

See [section 8.5 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-seek-table)

### VORBIS\_COMMENT

See [section 8.6 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-vorbis-comment)

### CUESHEET

See [section 8.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-cuesheet)

### PICTURE

See [section 8.8 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-picture)

### FLAC subset

See [section 7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-streamable-subset)

### STREAM

See [section 8 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-file-level-metadata)

### METADATA\_BLOCK

See [section 8.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-metadata-block-header)

### METADATA\_BLOCK\_HEADER

See [section 8.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-metadata-block-header)

### METADATA\_BLOCK\_DATA

See [section 8.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-metadata-block-header)

### METADATA\_BLOCK\_STREAMINFO

See [section 8.2 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-streaminfo)

### METADATA\_BLOCK\_PADDING

See [section 8.3 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-padding)

### METADATA\_BLOCK\_APPLICATION

See [section 8.4 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-application)

### METADATA\_BLOCK\_SEEKTABLE

See [section 8.5 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-seek-table)

### SEEKPOINT

See [section 8.5.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-seek-point)

### METADATA\_BLOCK\_VORBIS\_COMMENT

See [section 8.6 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-vorbis-comment)

### METADATA\_BLOCK\_CUESHEET

See [section 8.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-cuesheet)

### CUESHEET\_TRACK

See [section 8.7.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-cuesheet-track)

### CUESHEET\_TRACK\_INDEX

See [section 8.7.1.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-cuesheet-track-index-point)

### METADATA\_BLOCK\_PICTURE

See [section 8.8 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-picture)

### FRAME

See [section 9 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-frame-structure)

### FRAME\_HEADER

See [section 9.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-frame-header)

### FRAME\_FOOTER

See [section 9.3 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-frame-footer)

### SUBFRAME

See [section 9.2 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-subframes)

### SUBFRAME\_HEADER

See [section 9.2.1 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-subframe-header)

### SUBFRAME\_CONSTANT

See [section 9.2.3 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-constant-subframe)

### SUBFRAME\_FIXED

See [section 9.2.5 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-fixed-predictor-subframe)

### SUBFRAME\_LPC

See [section 9.2.6 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-linear-predictor-subframe)

### SUBFRAME\_VERBATIM

See [section 9.2.4 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-verbatim-subframe)

### RESIDUAL

See [section 9.2.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-coded-residual)

### RESIDUAL\_CODING\_METHOD\_PARTITIONED\_RICE

See [section 9.2.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-coded-residual)

### RICE\_PARTITION

See [section 9.2.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-coded-residual)

### RESIDUAL\_CODING\_METHOD\_PARTITIONED\_RICE2

See [section 9.2.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-coded-residual)

### RICE2\_PARTITION

See [section 9.2.7 of RFC 9639](https://www.rfc-editor.org/rfc/rfc9639.html#name-coded-residual)

---

Copyright (c) 2000-2009 Josh Coalson, 2011-2022 Xiph.Org Foundation
