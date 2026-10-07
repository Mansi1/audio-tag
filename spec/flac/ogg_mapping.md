[![FLAC Logo](https://xiph.org/flac/images/logo130.gif)](https://xiph.org/flac/index.html)

[home](https://xiph.org/flac/index.html)
[faq](https://xiph.org/flac/faq.html)
[download](https://xiph.org/flac/download.html)
[links](https://xiph.org/flac/links.html)

[documentation](https://xiph.org/flac/documentation.html)
[changelog](https://xiph.org/flac/changelog.html)
[developers](https://xiph.org/flac/developers.html)

# Ogg Mapping

This page specifies the way in which compressed FLAC data is encapsulated in an Ogg transport layer. It assumes basic knowledge of the [FLAC format](https://xiph.org/flac/format.html) and [Ogg structure](http://xiph.org/vorbis/doc/oggstream.html) and [framing](http://xiph.org/vorbis/doc/framing.html).

The original FLAC format includes a very thin transport system. This system of compressed FLAC audio data mixed with a thin transport has come to be known as 'native FLAC'. The transport consists of audio frame headers and footers which contain synchronization patterns, timecodes, and checksums (but notably not frame lengths), and a metadata system. It is very lightweight and does not support more elaborate transport mechanisms such as multiple logical streams, but it has served its purpose well.

The native FLAC transport is not a transport "layer" in the way of standard codec design because it cannot be entirely separated from the payload. Though the metadata system can be separated, the frame header includes both data that belongs in the transport (sync pattern, timecode, checksum) and data that belongs in the compressed packets (audio parameters like channel assignments, sample rate, etc).

This presents a problem when trying to encapsulate FLAC in other true transport layers; the choice has to be made between redundancy and complexity. In pursuit of correctness, a mapping could be created that removed from native FLAC the transport data, and merged the remaining frame header information into the audio packets. The disadvantage is that current native FLAC decoder software could not be used to decode because of the tight coupling with the transport. Either a separate decoding implementation would have to be created and maintained, or an Ogg FLAC decoder would have to synthesize native FLAC frames from Ogg FLAC packets and feed them to a native FLAC decoder.

The alternative is to treat native FLAC frames as Ogg packets and accept the transport redundancy. It turns out that this is not much of a penalty; a maximum of 12 bytes per frame will be wasted. Given the common case of stereo CD audio encoded with a blocksize of 4096 samples, a compressed frame will be 4-16 Kbytes. The redundancy amounts to a fraction of a percent.

In the interest of simplicity and expediency, the second method was chosen for the first official FLAC->Ogg mapping. A mapping version is included in the first packet so that a less redundant mapping can be defined in the future.

It should also be noted that support for encapsulating FLAC in Ogg has been present in the FLAC tools since version 1.0.1. However, the mappings used were never formalized and have insurmountable problems. For that reason, Ogg FLAC streams created with flac versions before 1.1.1 should be decoded and re-encoded with flac 1.1.1 or later (flac 1.1.1 can decode all previous Ogg FLAC files, but files made prior to 1.1.0 don't support seeking). Since the support for Ogg FLAC before FLAC 1.1.1 was limited, we hope this will not result in too much inconvenience.

Version 1.0 of the FLAC-to-Ogg mapping then is a simple identifying header followed by pure native FLAC data, as follows:

* The first packet of a stream consists of:
  + The one-byte packet type 0x7F
  + The four-byte ASCII signature "FLAC", i.e. 0x46, 0x4C, 0x41, 0x43
  + A one-byte binary major version number for the mapping, e.g. 0x01 for mapping version 1.0
  + A one-byte binary minor version number for the mapping, e.g. 0x00 for mapping version 1.0
  + A two-byte, big-endian binary number signifying the number of header (non-audio) packets, not including this one. This number may be zero (0x0000) to signify 'unknown' but be aware that some decoders may not be able to handle such streams.
  + The four-byte ASCII native FLAC signature "fLaC" according to the [FLAC format specification](https://xiph.org/flac/format.html#stream)
  + The [STREAMINFO](https://xiph.org/flac/format.html#metadata_block) metadata block for the stream.This first packet is the only packet in the first page of the stream. This results in a first Ogg page of exactly 79 bytes at the very beginning of the logical stream.
* This first page is marked 'beginning of stream' in the page flags.
* The first packet is followed by one or more header packets. Each such packet will contain a single [native FLAC metadata block](https://xiph.org/flac/format.html#metadata_block). The first of these must be a VORBIS\_COMMENT block. These packets may span page boundaries but the last will finish the page on which it ends, so that the first audio packet begins a page. The first byte of these metadata packets serves also as the packet type, and has a legal range of (0x01-0x7E,0x81-0xFE).
* The granule position of these first pages containing only headers is zero.
* The first audio packet of the logical stream begins a fresh Ogg page.
* Native FLAC audio frames appear as subsequent packets in the stream. Each packet corresponds to one FLAC audio frame. The first byte of each packet serves as the packet type. Since audio packets are native FLAC frames, this first byte will be always 0xFF according to the [native FLAC format specification](https://xiph.org/flac/format.html#frame_header).
* The last page is marked 'end of stream' in the page flags.
* FLAC packets may span page boundaries.
* The granule position of pages containing FLAC audio follows the same semantics as that for Ogg-encapsulated Vorbis as described [here](http://xiph.org/vorbis/doc/Vorbis_I_spec.html#x1-126000A).
* Redundant fields in the STREAMINFO packet may be set to zero (indicating "unknown" in native FLAC), which also facilitates single-pass encoding. These fields are: the minimum and maximum frame sizes, the total samples count, and the MD5 signature. "Unknown" values for these fields will not prevent a compliant native FLAC or Ogg FLAC decoder from decoding the stream.

It is intended that the first six bytes of any version of FLAC-to-Ogg mapping will share the same structure, namely, the four-byte signature and two-byte version number.

There is an implicit hint to the decoder in the mapping version number; mapping versions which share the same major version number should be decodable by decoders of the same major version number, e.g. a 1.x Ogg FLAC decoder should be able to decode any 1.y Ogg FLAC stream, even when x<y. If a mapping breaks this forward compatibility the major version number will be incremented.

---

Copyright (c) 2000-2009 Josh Coalson, 2011-2022 Xiph.Org Foundation
