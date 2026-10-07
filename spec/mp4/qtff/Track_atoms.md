<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Track_atoms",
  "metadataVersion" : "0.1.0",
  "role" : "collectionGroup",
  "title" : "Track atoms"
}
-->

# Track atoms

Atoms that define a single track of a movie.

## Overview

Track atoms define a single track of a movie. A movie may consist of one or more tracks. Each track is independent of the other tracks in the movie and carries its own temporal and spatial information. Each track atom contains its associated media atom.

Tracks are used specifically for the following purposes:

- To contain media data references and descriptions (media tracks).
- To contain modifier tracks (tweens, and so forth).
- To contain packetization information for streaming protocols (hint tracks). Hint tracks may contain references to media sample data or copies of media sample data. For more information about hint tracks, refer to [Hint media](https://developer.apple.com/documentation/QuickTime-File-Format/Hint_media).

> Note: A QuickTime movie cannot consist solely of hint tracks or modifier tracks; there must be at least one media track. Furthermore, media tracks cannot be deleted from a hinted movie, even if the hint tracks contain copies of the media sample data—in addition to the hint tracks, the entire unhinted movie must remain.

## Topics

### Describing tracks

[`Track atom ('trak')`](https://developer.apple.com/documentation/quicktime-file-format/Track_atom)

An atom that defines a single track of a movie.

[`Track header atom ('tkhd')`](https://developer.apple.com/documentation/quicktime-file-format/Track_header_atom)

An atom that specifies the characteristics of a single track within a movie.

[`Track exclude from autoselection atom ('txas')`](https://developer.apple.com/documentation/quicktime-file-format/Track_exclude_from_autoselection_atom)

An atom that indicates not to automatically select this track.

[Track aperture mode dimension atoms](https://developer.apple.com/documentation/QuickTime-File-Format/Track_aperture_mode_dimension_atoms)

Atoms that store information for each of the track aperture presentation modes.

[`Clipping atom ('clip')`](https://developer.apple.com/documentation/quicktime-file-format/Clipping_atom)

An atom that specifies the clipping regions for movies and for tracks.

[`Clipping region atom ('crgn')`](https://developer.apple.com/documentation/quicktime-file-format/Clipping_region_atom)

An atom that specifies the clipping region.

[`Track matte atom ('matt')`](https://developer.apple.com/documentation/quicktime-file-format/Track_matte_atom)

An atom you use to visually blend the track's image when it is displayed.

[`Compressed matte atom ('kmat')`](https://developer.apple.com/documentation/quicktime-file-format/Compressed_matte_atom)

An atom that specifies the image description structure and the matte data associated with a particular matte atom.

[`Edit atom ('edts')`](https://developer.apple.com/documentation/quicktime-file-format/Edit_atom)

An atom that defines the portions of the media that are to be used to build up a track for a movie.

[`Edit list atom ('elst')`](https://developer.apple.com/documentation/quicktime-file-format/Edit_list_atom)

An atom that maps from a time in a movie to a time in a media, and ultimately to media data.

[Playing with edit lists](https://developer.apple.com/documentation/QuickTime-File-Format/Playing_with_edit_lists)

Repeat a segment of a movie without copying media with edit lists.

[`Track load settings atom ('load')`](https://developer.apple.com/documentation/quicktime-file-format/Track_load_settings_atom)

An atom that indicates how the track is to be used in its movie.

[Track reference atoms](https://developer.apple.com/documentation/QuickTime-File-Format/Track_reference_atoms)

Atoms that defines relationships between tracks.

[Track input map atoms](https://developer.apple.com/documentation/QuickTime-File-Format/Track_input_map_atoms)

Atoms that define how data being sent to this track from its nonprimary sources is to be interpreted.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)