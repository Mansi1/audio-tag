<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Name_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Name_atom"
  },
  "title" : "Name atom ('name')"
}
-->

# Name atom ('name')

An atom you use to provide a name for a metadata item.

## Overview

The Name atom is a full atom with an atom type of `‘name’`. This atom contains a metadata name formatted as a string of UTF-8 characters, to fill the atom. It is optional. If it is not present, the item is unnamed, and cannot be referred to by name. Names are not user visible; they provide a way to refer to metadata items. The maximum length of a name may be limited in specific environments.

No two metadata items may have the same name.

## Topics

### Data fields

[`Version`](https://developer.apple.com/documentation/quicktime-file-format/Name_atom/Version)

One byte.

[`Flags`](https://developer.apple.com/documentation/quicktime-file-format/Name_atom/Flags)

Three bytes.

[`Name`](https://developer.apple.com/documentation/quicktime-file-format/Name_atom/Name)

An array of bytes, constituting a UTF-8 string, containing the name.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)