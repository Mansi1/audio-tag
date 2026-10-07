<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Sample_table_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Sample_table_atom"
  },
  "title" : "Sample table atom ('stbl')"
}
-->

# Sample table atom ('stbl')

An atom that contains information for converting from media time to sample number to sample location.

## Overview

This atom also indicates how to interpret the sample (for example, whether to decompress the video data and, if so, how). This section describes the format and content of the sample table atom.

The sample table atom has an atom type of `'stbl'`. It can contain the sample description atom, the time-to-sample atom, the sync sample atom, the sample-to-chunk atom, the sample size atom, the chunk offset atom, and the shadow sync atom. Recent additions to the list of atom types that a sample table atom can contain are the optional sample group description and sample-to-group atoms included in [Audio priming-handling encoder delay in AAC](https://developer.apple.com/documentation/QuickTime-File-Format/Appendix_G_Audio_priming_handling_encoder_delay_in_AAC).

The sample table atom contains all the time and data indexing of the media samples in a track. Using tables, it is possible to locate samples in time, determine their type, and determine their size, container, and offset into that container.

If the track that contains the sample table atom references no data, then the sample table atom does not need to contain any child atoms (not a very useful media track).

If the track that the sample table atom is contained in does reference data, then the following child atoms are required: sample description, sample size, sample to chunk, and chunk offset. All of the subtables of the sample table use the same total sample count.

The sample description atom must contain at least one entry. A sample description atom is required because it contains the data reference index field that indicates which data reference atom to use to retrieve the media samples. Without the sample description, it is not possible to determine where the media samples are stored. The sync sample atom is optional. If the sync sample atom is not present, all samples are implicitly sync samples.

The layout of the sample table atom is as follows.

|Data                                                                                                                |Type    |
|--------------------------------------------------------------------------------------------------------------------|--------|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Size``                                 |4 bytes |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Type`` = `'stbl'`                      |4 bytes |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Sample_description_atom``              |`'stsd'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Time-to-sample_atom``                  |`'stts'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Composition_offset_atom``              |`'ctts'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Composition_shift_least_greatest_atom``|`'cslg'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Sync_sample_atom``                     |`'stss'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Partial_sync_sample_atom``             |`'stps'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Sample-to-chunk_atom``                 |`'stsc'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Sample_size_atom``                     |`'stsz'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Chunk_offset_atom``                    |`'stco'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Sample_dependency_flags_atom``         |`'sdtp'`|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Sample_table_atom/Shadow_sync_atom``                     |`'stsh'`|

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Size)

A 32-bit integer that specifies the number of bytes in this sample table atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Type)

A 32-bit integer that identifies the atom type.

[`Sample description atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Sample_description_atom)

An atom that stores information that allows you to decode samples in the media.

[`Time-to-sample atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Time-to-sample_atom)

An atom that stores duration information for a media's samples, providing a mapping from a time in a media to the corresponding data sample.

[`Composition offset atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Composition_offset_atom)

An atom you use to specify out-of-order video samples.

[`Composition shift least greatest atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Composition_shift_least_greatest_atom)

An atom that summarizes the calculated minimum and maximum offsets between decode and composition time, as well as the start and end times, for all samples.

[`Sync sample atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Sync_sample_atom)

An atom that identifies the key frames in the media.

[`Partial sync sample atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Partial_sync_sample_atom)

An atom that lists the partial sync samples.

[`Sample-to-chunk atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Sample-to-chunk_atom)

An atom that stores chunk information for the samples in a media.

[`Sample size atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Sample_size_atom)

An atom you use to specify the size of each sample in the media.

[`Chunk offset atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Chunk_offset_atom)

An atom that identifies the location of each chunk of data in the media's data stream.

[`Sample dependency flags atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Sample_dependency_flags_atom)

An atom that uses one byte per sample as a bit field that describes dependency information.

[`Shadow sync atom`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom/Shadow_sync_atom)

An atom reserved for future use.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)