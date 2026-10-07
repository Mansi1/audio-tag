<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Movie_data_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Movie_data_atom"
  },
  "title" : "Movie data atom ('mdat')"
}
-->

# Movie data atom ('mdat')

An atom that contains movie data.

## Overview

As with the free and skip atoms, the movie data atom is structured quite simply. It consists of an atom header (atom size and type fields), followed by the movie's media data. Your application can understand the data in this atom only by using the metadata stored in the movie atom. This atom can be quite large, and may exceed 2^32 bytes, in which case the size field will be set to `1`, and the header will contain a 64-bit extended size field.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Movie_data_atom/Size)

A 32-bit integer that specifies the number of bytes in this media data atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Movie_data_atom/Type)

A 32-bit integer that identifies the atom type.

[`Extended size`](https://developer.apple.com/documentation/quicktime-file-format/Movie_data_atom/Extended_size)

A 64-bit integer that specifies the number of bytes in this media data atom.

[`Movie media data`](https://developer.apple.com/documentation/quicktime-file-format/Movie_data_atom/Movie_media_data)

The movie's media data.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)