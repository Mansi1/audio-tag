<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Metadata_item_list_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Metadata_item_list_atom"
  },
  "title" : "Metadata item list atom ('ilst')"
}
-->

# Metadata item list atom ('ilst')

An atom that holds a list of actual metadata values that are present in the metadata atom.

## Overview

The metadata item list atom holds a list of actual metadata values that are present in the metadata atom. The metadata items are formatted as a list of items. The metadata item list atom is of type `‘ilst’` and contains a number of metadata items, each of which is an atom.

The following figure shows a metadata list atom and the item/key connection.

![A diagram that shows a box, with the captions "Metadata atom", "Atom size", and "Type = 'meta'" inside the top of the box. Next to that box is another box with the captions "Keys" and "entry_count = 4". There is an arrow pointing from the metadata atom box to the keys box. Inside the keys box, below the captions, are four vertically stacked boxes, with captions "Key 1", "Key 2", "Key 3" and "Key 4". The box with the caption "Key 3" is a different color that the other boxes. Inside the metadata item list atom box are three vertically stacked boxes, with the captions "key_index 2", "key_index 4", and "key_index 1". Each of those boxes contains three boxes. The first box has a solid outline that has the caption "Data" with three field names listed below: "the_type", "the_locale", and "value[]". The second and third boxes each have a dotted outline and are stacked vertically to the right of the box with the "Data" caption. The second box has the caption "itif" and the third box has the caption "name".](https://developer.apple.com/documentation/quicktime-file-format/images/com.apple.qtff/metadata-item-list-atom@2x.png)

## Topics

### Data fields

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_list_atom/Type)

A 32-bit integer that identifies the atom type.

[`Item list`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_list_atom/Item_list)

A list of metadata values and related keys.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)