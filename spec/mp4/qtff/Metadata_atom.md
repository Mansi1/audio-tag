<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Metadata_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Metadata_atom"
  },
  "title" : "Metadata atom ('meta')"
}
-->

# Metadata atom ('meta')

An atom that is the container for carrying metadata.

## Overview

The following figure shows a sample layout of the metadata atom.

![A diagram that shows a box, with the captions "Metadata atom", "Atom size", and "Type = 'meta'" inside the top of the box. Just below the captions is a box with a solid outline, inside the previous box, that extends almost the width of the containing box, and has the caption "Metadata handler atom 'hdlr'". Below that, also inside the Metadata atom box, is a box with a dotted outline that has the caption "Metadata header atom 'mhdr'". Below that, also inside the Metadata atom box, is a box with a solid outline that has the caption "Metadata item keys atom 'keys'". Below that, also inside the Metadata atom box, is a box with a solid outline that has the caption "Metadata item atom '](https://developer.apple.com/documentation/quicktime-file-format/images/com.apple.qtff/metadata-atom@2x.png)

The metadata atom requires atoms with a solid outline, and atoms with a dotted outline are optional.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Size)

A 32-bit integer that specifies the number of bytes in the atom.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Type)

A 32-bit integer that identifies the atom type.

[`Metadata handler atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Metadata_handler_atom)

An atom that defines the structure used for all types of metadata stored within the metadata atom.

[`Metadata header atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Metadata_header_atom)

An atom that holds the integer value for the next unique item identifier to assign.

[`Metadata item keys atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Metadata_item_keys_atom)

An atom that holds a list of the metadata keys that may be present in the metadata atom.

[`Metadata item list atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Metadata_item_list_atom)

An atom that holds a list of actual metadata values that are present in the metadata atom.

[`Country list atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Country_list_atom)

An atom that lists items that are suitable for more than one country.

[`Language list atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_atom/Language_list_atom)

An atom that lists items that are suitable for more than one language.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)