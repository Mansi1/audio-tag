<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Metadata_item_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Metadata_item_atom"
  },
  "title" : "Metadata item atom"
}
-->

# Metadata item atom

An atom that holds a metadata value.

## Overview

Each item in the metadata item list atom is identified by its key. The atom type for each metadata item atom should be set equal to the index of the key for the metadata within the item atom, taking this index from the metadata item keys atom. In addition, each metadata item atom contains a Value Atom, to hold the value of the metadata item.

## Topics

### Data fields

[`Item_info`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_atom/Item_info)

An optional item information atom.

[`Name`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_atom/Name)

An optional name atom.

[`Data value atom`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_atom/Data_value_atom)

An array of value atoms.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)