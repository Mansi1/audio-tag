<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Metadata_item_keys_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Metadata_item_keys_atom"
  },
  "title" : "Metadata item keys atom ('keys')"
}
-->

# Metadata item keys atom ('keys')

An atom that holds a list of the metadata keys that may be present in the metadata atom.

## Overview

The metadata item keys atom holds a list of the metadata keys that may be present in the metadata atom. This list is indexed starting with `1`; `0` is a reserved index value. The metadata item keys atom is a full atom with an atom type of `‘keys’`.

Note that:

- Indexes into the metadata item keys atom are 1-based (`1…entry_count`).
- Zero (`0`) is reserved and never used as an index.
- The structure of `key_value` depends upon the key namespace.

The following figure shows a typical metadata item keys atom.

![A diagram that shows a box, with the captions "Item keys atom" and "Type = 'keys'" inside the top of the box. Just below the captions is a box, inside the previous box, that extends almost the width of the containing box, and has the caption "Entry count = 4". Below that box are three columns of boxes, each with four rows. Each row of boxes is captioned "size", "namespace", and "value" from right to left. Outside the enclosing box there is a marker line that spans the four rows of boxes, with the caption "Key definitions."](https://developer.apple.com/documentation/quicktime-file-format/images/com.apple.qtff/metadata-item-keys-atom@2x.png)

The following figure shows an example of a metadata item keys atom consisting of three keys: two from one key namespace and a third from another key namespace.

|`'keys'`         |
|-----------------|
|`entry_count = 3`|

| |`key_size (uint32)`|`key_namespace (uint32)`|`key_value (uint8[])`          |
|-|-------------------|------------------------|-------------------------------|
|1|`38`               |`'mdta'`                |`com.apple.quicktime.copyright`|
|2|`35`               |`'mdta'`                |`com.apple.quicktime.author`   |
|3|`12`               |`'udta'`                |`@cpy`                         |

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Size)

A 32-bit unsigned integer that indicates the size in bytes of the atom structure.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Type)

A 32-bit unsigned integer value.

[`Version`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Version)

One byte.

[`Flags`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Flags)

Three bytes.

[`Entry_count`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Entry_count)

A 32-bit integer indicating the number of key arrays to follow in this atom.

[`Key_size`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Key_size)

A 32-bit integer indicating the size of the entire structure containing a key definition.

[`Key_namespace`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Key_namespace)

A 32-bit integer defining a naming scheme used for metadata keys.

[`Key_value_Key_size-8`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_item_keys_atom/Key_value_Key_size-8)

An array of 8-bit integers, each containing the actual name of the metadata key.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)