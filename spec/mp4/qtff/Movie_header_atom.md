<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Movie_header_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Movie_header_atom"
  },
  "title" : "Movie header atom ('mvhd')"
}
-->

# Movie header atom ('mvhd')

An atom that specifies the characteristics of an entire QuickTime movie.

## Overview

You use the movie header atom to specify the characteristics of an entire QuickTime movie. The data contained in this atom defines characteristics of the entire QuickTime movie, such as time scale and duration. It has an atom type value of `'mvhd'`.

The following table shows the layout of the movie header atom. The movie header atom is a leaf atom.

|Data field                                                                                       |Bytes|
|-------------------------------------------------------------------------------------------------|-----|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Size``              |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Type``              |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Version``           |1    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Flags``             |3    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Creation_time``     |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Modification_time`` |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Time_scale``        |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Duration``          |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Preferred_rate``    |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Preferred_volume``  |2    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Matrix_structure``  |36   |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Preview_time``      |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Preview_duration``  |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Poster_time``       |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Selection_time``    |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Selection_duration``|4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Current_time``      |4    |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Movie_header_atom/Next_track_ID``     |4    |

> Note: Set the creation and modification date with coordinated universal time (UTC). In prior versions of the QuickTime file format, this was not specified, and these fields were commonly set to local time for the time zone where the movie was created.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Size)

A 32-bit integer that specifies the number of bytes in this movie header atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Type)

A 32-bit integer that identifies the atom type.

[`Version`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Version)

A 1-byte specification of the version of this movie header atom.

[`Flags`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Flags)

Three bytes of space for future movie header flags.

[`Creation time`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Creation_time)

A 32-bit integer that specifies the creation calendar date and time for the movie atom.

[`Modification time`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Modification_time)

A 32-bit integer that specifies the calendar date and time of the last change to the movie atom.

[`Time scale`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Time_scale)

A time value that indicates the time scale for this movie.

[`Duration`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Duration)

A time value that indicates the duration of the movie in time scale units.

[`Preferred rate`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Preferred_rate)

A 32-bit fixed-point number that specifies the rate at which to play this movie.

[`Preferred volume`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Preferred_volume)

A 16-bit fixed-point number that specifies how loud to play this movie's sound.

[`Reserved`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Reserved)

Ten bytes reserved for use by Apple.

[`Matrix structure`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Matrix_structure)

The matrix structure associated with this movie.

[`Preview time`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Preview_time)

The time value in the movie at which the preview begins.

[`Preview duration`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Preview_duration)

The duration of the movie preview in movie time scale units.

[`Poster time`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Poster_time)

The time value of the time of the movie poster.

[`Selection time`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Selection_time)

The time value for the start time of the current selection.

[`Selection duration`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Selection_duration)

The duration of the current selection in movie time scale units.

[`Current time`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Current_time)

The time value for current time position within the movie.

[`Next track ID`](https://developer.apple.com/documentation/quicktime-file-format/Movie_header_atom/Next_track_ID)

A 32-bit integer that indicates a value to use for the track ID number of the next track added to this movie.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)