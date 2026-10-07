<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Movie_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Movie_atom"
  },
  "title" : "Movie atom ('moov')"
}
-->

# Movie atom ('moov')

An atom that specifies the information that defines a movie.

## Overview

You use movie atoms to specify the information that defines a movie — that is, the information that allows your application to interpret the sample data that is stored elsewhere. The movie atom usually contains a movie header atom, which defines the time scale and duration information for the entire movie, as well as its display characteristics. Existing movies may contain a movie profile atom, which summarizes the main features of the movie, such as the necessary codecs and maximum bit rate. In addition, the movie atom contains a track atom for each track in the movie.

The movie atom has an atom type of `'moov'`. It contains other types of atoms, including at least one of three possible atoms—the movie header atom (`'mvhd'`), the compressed movie atom (`'cmov'`), or a reference movie atom (`'rmra'`). An uncompressed movie atom can contain both a movie header atom and a reference movie atom, but it must contain at least one of the two. It can also contain several other atoms, such as a clipping atom (`'clip'`), one or more track atoms (`'trak'`), a color table atom (`'ctab'`), and a user data atom (`'udta'`).

Compressed movie atoms and reference movie atoms are discussed separately. This section describes normal uncompressed movie atoms.

The layout of movie atom is as follows.

|Data                                                                                           |Type     |
|-----------------------------------------------------------------------------------------------|---------|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Size``                   |4 bytes  |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Type`` = `'moov'`        |4 bytes  |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Profile_atom``           |`'prfl'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Movie_header_atom``      |`'mvhd'`‡|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Movie_clipping_atom``    |`'clip'` |
|One or more ``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Track_atoms``|`'trak'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/User_data_atom``         |`'udta'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Color_table_atom``       |`'ctab'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Compressed_movie_atom``  |`'cmov'` |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_atom/Reference_movie_atom``   |`'rmra'` |

‡ denotes required atom.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Size)

The number of bytes in this movie atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Type)

The type of this movie atom.

[`Profile atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Profile_atom)

An atom that summarizes the features and complexity of a movie.

[`Movie header atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Movie_header_atom)

An atom that specifies the characteristics of an entire QuickTime movie.

[`Movie clipping atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Movie_clipping_atom)

An atom that specifies the clipping regions for movies and for tracks.

[`Track atoms`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Track_atoms)

One or more atoms that define a single track of a movie.

[`User data atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/User_data_atom)

An atom where you define and store data associated with a QuickTime object.

[`Color table atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Color_table_atom)

An atom that defines a list of preferred colors for displaying the movie on devices that support only 256 colors.

[`Compressed movie atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Compressed_movie_atom)

An atom you use to reduce file size and startup latency by compressing movie resources.

[`Reference movie atom`](https://developer.apple.com/documentation/quicktime-file-format/Movie_atom/Reference_movie_atom)

A reference movie atom contains references to one or more movies.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)