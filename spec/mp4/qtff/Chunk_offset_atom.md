<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Chunk_offset_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Chunk_offset_atom"
  },
  "title" : "Chunk offset atom ('stco')"
}
-->

# Chunk offset atom ('stco')

An atom that identifies the location of each chunk of data in the media's data stream.

## Overview

Chunk offset atoms have an atom type of `'stco'`.

The chunk-offset table gives the index of each chunk into the containing file. There are two variants, permitting the use of 32-bit or 64-bit offsets. The latter is useful when managing very large movies. Only one of these variants occurs in any single instance of a sample table atom.

Note that offsets are file offsets, not the offset into any atom within the file (for example, a `'mdat'` atom). This permits referring to media data in files without any atom structure. However, be careful when constructing a self-contained QuickTime file with its metadata (movie atom) at the front because the size of the movie atom affects the chunk offsets to the media data.

> Note: The sample table atom can contain a 64-bit chunk offset atom (`STChunkOffset64AID = 'co64'`). When this atom appears, it is used in place of the original chunk offset atom, which can contain only 32-bit offsets. When QuickTime writes movie files, it uses the 64-bit chunk offset atom only if there are chunks that use the high 32-bits of the chunk offset. Otherwise, the original 32-bit chunk offset atom is used to ensure compatibility with previous versions of QuickTime.

The layout of a chunk offset atom is as follows.

|Chunk offset atom data field                                                                     |Bytes   |
|-------------------------------------------------------------------------------------------------|--------|
|``doc://com.apple.qtff/documentation/quicktime-file-format/Chunk_offset_atom/Size``              |4       |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Chunk_offset_atom/Type`` = `'stco'`   |4       |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Chunk_offset_atom/Version``           |1       |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Chunk_offset_atom/Flags``             |3       |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Chunk_offset_atom/Number_of_entries`` |4       |
|``doc://com.apple.qtff/documentation/quicktime-file-format/Chunk_offset_atom/Chunk_offset_table``|Variable|

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom/Size)

A 32-bit integer that specifies the number of bytes in this chunk offset atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom/Type)

A 32-bit integer that identifies the atom type.

[`Version`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom/Version)

A 1-byte specification of the version of this chunk offset atom.

[`Flags`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom/Flags)

A 3-byte space for chunk offset flags.

[`Number of entries`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom/Number_of_entries)

A 32-bit integer containing the count of entries in the chunk offset table.

[`Chunk offset table`](https://developer.apple.com/documentation/quicktime-file-format/Chunk_offset_atom/Chunk_offset_table)

A chunk offset table consisting of an array of offset values.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)