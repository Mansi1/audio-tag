<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Track_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Track_atom"
  },
  "title" : "Track atom ('trak')"
}
-->

# Track atom ('trak')

An atom that defines a single track of a movie.

## Overview

Track atoms have an atom type value of `'trak'`. The track atom requires a track header atom (`'tkhd'`) and a media atom (`'mdia'`). Other child atoms are optional, and may include a track clipping atom (`'clip'`), a track matte atom (`'matt'`), an edit atom (`'edts'`), a track reference atom (`'tref'`), a track load settings atom (`'load'`), a track input map atom (`'imap'`), and a user data atom (`'udta'`).

> Note: The track atom layout contains an optional track profile atom `‘prfl’`. Track profile atoms are deprecated in the current version of QuickTime but may be present in existing QuickTime files. The inclusion here documents existing content containing profile atoms, they should not be used for new development.

The layout of a track atom is as follows.

|Data                                                                                                         |Type    |
|-------------------------------------------------------------------------------------------------------------|--------|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Size``                                 |4 bytes |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Type``                                 |4 bytes |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_profile_atom``                   |`'prfl'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_header_atom``                    |`'tkhd'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_aperture_mode_dimensions_atom``  |`'tapt'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Clipping_atom``                        |`'clip'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_matte_atom``                     |`'matt'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Edit_atom``                            |`'edts'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_reference_atom``                 |`'tref'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_exclude_from_autoselection_atom``|`'txas'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_load_settings_atom``             |`'load'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Track_input_map_atom``                 |`'imap'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/Media_atom``                           |`'mdia'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Track_atom/User-defined_data_atom``               |`'udta'`|

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Size)

A 32-bit integer that specifies the number of bytes in this track atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Type)

A 32-bit integer that identifies the atom type.

[`Track profile atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_profile_atom)

A child atom of movie atoms or track atoms.

[`Track header atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_header_atom)

An atom that specifies the characteristics of a single track within a movie.

[`Track aperture mode dimensions atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_aperture_mode_dimensions_atom)

A container atom that stores information for video correction in the form of three required atoms.

[`Clipping atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Clipping_atom)

An atom that specifies the clipping regions for movies and for tracks.

[`Track matte atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_matte_atom)

An atom you use to visually blend the track's image when it is displayed.

[`Edit atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Edit_atom)

An atom that defines the portions of the media that are to be used to build up a track for a movie.

[`Track reference atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_reference_atom)

An atom that defines relationships between tracks.

[`Track exclude from autoselection atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_exclude_from_autoselection_atom)

An atom that indicates not to automatically select this track.

[`Track load settings atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_load_settings_atom)

An atom that indicates how the track is to be used in its movie.

[`Track input map atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Track_input_map_atom)

An atom that defines how data being sent to this track from its nonprimary sources is to be interpreted.

[`Media atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/Media_atom)

An atom that describes and defines a track's media type and sample data.

[`User-defined data atom`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom/User-defined_data_atom)

An atom you use to define and store data associated with a QuickTime object.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)