<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Data_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Data_atom"
  },
  "title" : "Data atom ('data')"
}
-->

# Data atom ('data')

An atom that contains the type and locale specific value of metadata.

## Overview

The Data atom has an atom type of `‘data’`, and contains four bytes each of type and locale indicators, as specified in [Type indicator](https://developer.apple.com/documentation/QuickTime-File-Format/Type_indicator) and [Locale indicator](https://developer.apple.com/documentation/QuickTime-File-Format/Locale_indicator), and then the actual value of the metadata, formatted as required by the type.

## Topics

### Data fields

[`Type indicator`](https://developer.apple.com/documentation/quicktime-file-format/Data_atom/Type_indicator)

Four bytes that indicate a type of data that QuickTime supports.

[`Locale indicator`](https://developer.apple.com/documentation/quicktime-file-format/Data_atom/Locale_indicator)

A four-byte value that indicates a locale.

[`Value`](https://developer.apple.com/documentation/quicktime-file-format/Data_atom/Value)

An array of bytes containing the value of the metadata.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)