# FLAC

FLAC files keep their tags in a Vorbis comment metadata block, not in ID3. Some taggers still put an
ID3v2 tag in front of the stream or an ID3v1 tag at the end; neither is part of the format.
Downloaded 2026-10-06.

## Normative
- `rfc9639.md`: **RFC 9639, Free Lossless Audio Codec (FLAC)** (IETF, December 2024),
  from https://www.rfc-editor.org/rfc/rfc9639. Key sections:
  - §6 Format Layout Overview: "A FLAC bitstream consists of the fLaC (i.e., 0x664C6143) marker at
    the beginning of the stream, followed by a mandatory metadata block". An ID3v2 tag in front
    of it is therefore outside the format.
  - §8.6 Vorbis Comment: the tag block (UTF-8 `NAME=value` fields; same layout as in Ogg, see
    `../ogg/v-comment.md`). §8.8 Picture: modelled on the ID3v2 APIC frame.
  - §10 Container Mappings: FLAC in Ogg (§10.1), Matroska and MP4.

## Historical
- `format.md`: https://xiph.org/flac/format.html. The old format description was replaced by a
  pointer to RFC 9639; kept for its links.
- `ogg_mapping.md`: https://xiph.org/flac/ogg_mapping.html, the original FLAC-in-Ogg mapping,
  now RFC 9639 §10.1.
