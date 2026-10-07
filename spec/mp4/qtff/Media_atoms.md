<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Media_atoms",
  "metadataVersion" : "0.1.0",
  "role" : "collectionGroup",
  "title" : "Media atoms"
}
-->

# Media atoms

Atoms that describe and define a track's media type and sample data.

## Overview

The media atom contains information that specifies:

- The media type, such as sound, video or timed metadata
- The media handler component used to interpret the sample data
- The media timescale and track duration
- Media-and-track-specific information, such as sound volume or graphics mode
- The media data references, which typically specify the file where the sample data is stored
- The sample table atoms, which, for each media sample, specify the sample description, duration, and byte offset from the data reference

## Topics

### Describing media

[`Media atom ('mdia')`](https://developer.apple.com/documentation/quicktime-file-format/Media_atom)

An atom that describes and defines a track's media type and sample data.

[`Media header atom ('mdhd')`](https://developer.apple.com/documentation/quicktime-file-format/Media_header_atom)

An atom that specifies the characteristics of a media, including time scale and duration.

[`Extended language tag atom ('elng')`](https://developer.apple.com/documentation/quicktime-file-format/Extended_language_tag_atom)

An atom that represents media language information.

[`Handler reference atom ('hdlr')`](https://developer.apple.com/documentation/quicktime-file-format/Handler_reference_atom)

An atom that specifies the media handler component that is to be used to interpret the media's data.

[Media information atoms](https://developer.apple.com/documentation/QuickTime-File-Format/Media_information_atoms)

An atom that contains a number of other atoms that define specific characteristics of the video media data.

[`Video media information atom ('minf')`](https://developer.apple.com/documentation/quicktime-file-format/Video_media_information_atom)

An atom that contains a number of other atoms that define specific characteristics of the video media data.

[`Video media information header atom ('vmhd')`](https://developer.apple.com/documentation/quicktime-file-format/Video_media_information_header_atom)

An atom that defines specific color and graphics mode information.

[`Sound media information atom ('minf')`](https://developer.apple.com/documentation/quicktime-file-format/Sound_media_information_atom)

An atom that contains a number of other atoms that define specific characteristics of the sound media data.

[`Sound media information header atom ('smhd')`](https://developer.apple.com/documentation/quicktime-file-format/Sound_media_information_header_atom)

An atom that stores the sound media's control information, such as balance.

[`Base media information atom ('minf')`](https://developer.apple.com/documentation/quicktime-file-format/Base_media_information_atom)

An atom that stores the media information for media types such as timed metadata, text, MPEG, time code, and music.

[`Base media information header atom ('gmhd')`](https://developer.apple.com/documentation/quicktime-file-format/Base_media_information_header_atom)

An atom that indicates that this media information atom pertains to a base media.

[`Base media info atom ('gmin')`](https://developer.apple.com/documentation/quicktime-file-format/Base_media_info_atom)

An atom that defines the media's control information, including graphics mode and balance information.

[`Data information atom ('dinf')`](https://developer.apple.com/documentation/quicktime-file-format/Data_information_atom)

An atom that specifies the data handler component that provides access to the media data.

[`Media data reference atom ('dref')`](https://developer.apple.com/documentation/quicktime-file-format/Media_data_reference_atom)

An atom that contains tabular data that instructs the data handler component how to access the media's data.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)