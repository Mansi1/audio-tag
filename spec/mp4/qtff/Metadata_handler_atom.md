<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Metadata_handler_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Metadata_handler_atom"
  },
  "title" : "Metadata handler atom ('hdlr')"
}
-->

# Metadata handler atom ('hdlr')

An atom that defines the structure used for all types of metadata stored within the metadata atom.

## Overview

The metadata handler atom is a full atom with an atom type of `‘hdlr’`. It defines the structure used for all types of metadata stored within the metadata atom.

> Note: A reader parsing a metadata atom should confirm the handler type in the metadata handler atom is 'mdta' before interpreting any other structures in the metadata atom according to the specification presented here. If the handler type is not 'mdta', the interpretation is defined by another specification.

## Topics

### Data fields

[`Size`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Size)

A 32-bit unsigned integer that indicates the size in bytes of the atom structure.

[`Type`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Type)

A 32-bit unsigned integer value.

[`Version`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Version)

One byte.

[`Flags`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Flags)

Three bytes.

[`Predefined`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Predefined)

A 32-bit integer.

[`Handler type`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Handler_type)

A 32-bit integer that indicates the structure used in the metadata atom.

[`Reserved`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Reserved)

An array of 3 const unsigned 32-bit integers.

[`Name`](https://developer.apple.com/documentation/quicktime-file-format/Metadata_handler_atom/Name)

A string with a human-readable name for a metadata type.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)