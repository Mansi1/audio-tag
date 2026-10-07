# Ogg and Vorbis comments

Ogg files (Vorbis, Opus, FLAC in Ogg) keep their tags in a Vorbis comment header packet inside the
Ogg stream, not in ID3. Downloaded 2026-10-06.

## Normative
- `rfc3533.md`: **RFC 3533, The Ogg Encapsulation Format Version 0**, from
  https://www.rfc-editor.org/rfc/rfc3533. Pages, the `OggS` capture pattern, CRC and how packets
  are split across pages (a comment packet can span several pages).
- `v-comment.md`: **Ogg Vorbis I format specification: comment field and header**, from
  https://xiph.org/vorbis/doc/v-comment.html. The comment layout shared by Vorbis, Opus and FLAC:
  vendor string, then a list of UTF-8 `NAME=value` fields, all lengths 32-bit little-endian; the
  recommended field names (TITLE, ARTIST, ALBUM, ...).
- `Vorbis_I_spec.md`: **Vorbis I specification**, from
  https://xiph.org/vorbis/doc/Vorbis_I_spec.html. §4.2.3 the comment header packet (type 3,
  `vorbis` signature, framing bit); §5 the comment field layout (same as `v-comment.md`).
- `rfc7845.md`: **RFC 7845, Ogg Encapsulation for the Opus Audio Codec**, from
  https://www.rfc-editor.org/rfc/rfc7845. §5.2 Comment Header (`OpusTags`), the same comment
  layout without the framing bit.

## De facto
- `xiph-VorbisComment.md`: the Xiph wiki page **VorbisComment**, from
  https://wiki.xiph.org/VorbisComment (downloaded 2026-10-07). Defines `METADATA_BLOCK_PICTURE`:
  base64 (RFC 4648, padded, no line feeds) of a FLAC picture block, "the preferred and recommended
  way of embedding cover art within VorbisComments".

FLAC in Ogg is in `../flac/rfc9639.md` §10.1.
