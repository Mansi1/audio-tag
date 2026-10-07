<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Media_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Media_atom"
  },
  "title" : "Media atom ('mdia')"
}
-->

# Media atom ('mdia')

An atom that describes and defines a track's media type and sample data.

## Overview

The media atom has an atom type of `'mdia'`. It must contain a media header atom (`'mdhd'`), and it can contain a handler reference (`'hdlr'`) atom, media information (`'minf'`) atom, and user data (`'udta'`) atom.

> Note: Do not confuse the media atom (`'mdia'`) with the media data atom (`'mdat'`). The media atom contains only references to media data; the media data atom contains the actual media samples.

The layout of a media atom is as follows.

|Data                                                                                              |Type     |
|--------------------------------------------------------------------------------------------------|---------|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/Size``                      |4 bytes  |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/Type`` = `'mdia'`           |4        |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/Media_header_atom``         |`'mdhd'`‡|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/Extended_language_tag_atom``|`'elng'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/Handler_reference_atom``    |`'hdlr'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/Media_information_atom``    |`'minf'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Media_atom/User_data_atom``            |`'udta'` |

‡ denotes required atom.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/Size)

A 32-bit integer that specifies the number of bytes in this media atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/Type)

A 32-bit integer that identifies the atom type.

[`Media header atom`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/Media_header_atom)

This atom contains the standard media information.

[`Extended language tag atom`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/Extended_language_tag_atom)

This atom contains the extended language tag describing the media language.

[`Handler reference atom`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/Handler_reference_atom)

This atom identifies the media handler component that is to be used to interpret the media data.

[`Media information atom`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/Media_information_atom)

This atom contains data specific to the media type for use by the media handler component.

[`User data atom`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom/User_data_atom)

An atom where you define and store data associated with a QuickTime object.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)