<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Item_information_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Item_information_atom"
  },
  "title" : "Item information atom ('itif')"
}
-->

# Item information atom ('itif')

An atom that contains information about the item, including item-specific flags and item optional identifier.

## Overview

The optional item information atom contains information about the item: item-specific flags and item optional identifier. This ID must be unique within the metadata atom. To simplify assignment of item identifiers, the metadata header atom's nextItemInfo field can be used as described in [`Metadata header atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_header_atom).

The item information atom must be present if the item has an assigned ID or has nonzero flags.

No flags are currently defined; they should be set to `0` in this version of the specification.

The item information atom is a full atom with an atom type of `‘itif’`.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Item_information_atom/Size)

A 32-bit unsigned integer that indicates the size in bytes of the atom structure.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Item_information_atom/Type)

A 32-bit unsigned integer value.

[`Version`](https://developer.apple.com/documentation/quicktime-file-format/Item_information_atom/Version)

One byte.

[`Flags`](https://developer.apple.com/documentation/quicktime-file-format/Item_information_atom/Flags)

Three bytes.

[`Item_ID`](https://developer.apple.com/documentation/quicktime-file-format/Item_information_atom/Item_ID)

An unsigned 32-bit integer, unique within the container.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)