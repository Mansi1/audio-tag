<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Sample_atoms",
  "metadataVersion" : "0.1.0",
  "role" : "collectionGroup",
  "title" : "Sample atoms"
}
-->

# Sample atoms

Atoms that describe samples, which are single elements in a sequence of time-ordered data.

## Overview

QuickTime stores media data in samples. A sample is a single element in a sequence of time-ordered data. Samples are stored in the media, and they may have varying durations.

Samples are stored in a series of chunks in a media. Chunks are a collection of data samples in a media that allow optimized data access. A chunk may contain one or more samples. Chunks in a media may have different sizes, and the individual samples within a chunk may have different sizes from one another, as shown in the following figure.

![A diagram that represents a data stream as a vertical stack of boxes, with each box representing a sequentially numbered sample. The sample boxes have labels adjacent to them, that group samples into chunks. The first three boxes, samples one, two, and three, are grouped into chunk one. The next three boxes, samples four, five, and six, are grouped into chunk two. Sample seven is chunk three, sample eight is chunk four, and sample nine is chunk five.](https://developer.apple.com/documentation/quicktime-file-format/images/com.apple.qtff/data-stream@2x.png)

One way to describe a sample is to use a sample table atom. The sample table atom acts as a storehouse of information about the samples and contains a number of different types of atoms. The various atoms contain information that allows the media handler to parse the samples in the proper order. This approach enforces an ordering of the samples without requiring that the sample data be stored sequentially with respect to movie time in the actual data stream.

## Topics

### Describing samples

[`Sample table atom ('stbl')`](https://developer.apple.com/documentation/quicktime-file-format/Sample_table_atom)

An atom that contains information for converting from media time to sample number to sample location.

[Seeking with a QuickTime file](https://developer.apple.com/documentation/QuickTime-File-Format/Seeking_with_a_QuickTime_file)

Seek with a QuickTime file using child atoms.

[`Sample description atom ('stsd')`](https://developer.apple.com/documentation/quicktime-file-format/Sample_description_atom)

An atom that stores information that allows you to decode samples in the media.

[`Time-to-sample atom ('stts')`](https://developer.apple.com/documentation/quicktime-file-format/Time-to-sample_atom)

An atom that stores duration information for a media's samples, providing a mapping from a time in a media to the corresponding data sample.

[Creating video tracks at 30 frames per second](https://developer.apple.com/documentation/QuickTime-File-Format/Creating_video_tracks_at_30_frames_per_second)

Configure your time-to-sample atom for 30 frames per second.

[Creating video tracks at 29.97 frames per second](https://developer.apple.com/documentation/QuickTime-File-Format/Creating_video_tracks_at_2997_frames_per_second)

Configure your time-to-sample atom for 29.97 frames per second.

[Creating sound tracks at 44.1 kHz](https://developer.apple.com/documentation/QuickTime-File-Format/Creating_sound_tracks_at_441_kHz)

Configure your time-to-sample atom for sound at 44.1 kHz.

[`Composition offset atom ('ctts')`](https://developer.apple.com/documentation/quicktime-file-format/Composition_offset_atom)

An atom you use to specify out-of-order video samples.

[`Composition shift least greatest atom ('cslg')`](https://developer.apple.com/documentation/quicktime-file-format/Composition_shift_least_greatest_atom)

An atom that summarizes the calculated minimum and maximum offsets between decode and composition time, as well as the start and end times, for all samples.

[Using composition offset and composition shift least greatest atoms](https://developer.apple.com/documentation/QuickTime-File-Format/Using_composition_offset_and_composition_shift_least_greatest_atoms)

Calculate the offset shift when you store an out of order video stream's sample table.

[`Sync sample atom ('stss')`](https://developer.apple.com/documentation/quicktime-file-format/Sync_sample_atom)

An atom that identifies the key frames in the media.

[`Partial sync sample atom ('stps')`](https://developer.apple.com/documentation/quicktime-file-format/Partial_sync_sample_atom)

An atom that lists the partial sync samples.

[`Sample-to-chunk atom ('stsc')`](https://developer.apple.com/documentation/quicktime-file-format/Sample-to-chunk_atom)

An atom that stores chunk information for the samples in a media.

[Referencing two data files with a single track](https://developer.apple.com/documentation/QuickTime-File-Format/Referencing_two_data_files_with_a_single_track)

Use multiple sample descriptions reference data in multiple files for a track.

[`Sample size atom ('stsz')`](https://developer.apple.com/documentation/quicktime-file-format/Sample_size_atom)

An atom you use to specify the size of each sample in the media.

[`Chunk offset atom ('stco')`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom)

An atom that identifies the location of each chunk of data in the media's data stream.

[`Sample dependency flags atom ('sdtp')`](https://developer.apple.com/documentation/quicktime-file-format/Sample_dependency_flags_atom)

An atom that uses one byte per sample as a bit field that describes dependency information.

[Using sample atoms](https://developer.apple.com/documentation/QuickTime-File-Format/Using_sample_atoms)

Find samples or key frames in sample atoms.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)