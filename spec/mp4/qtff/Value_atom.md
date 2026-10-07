<!--
{
  "availability" : [

  ],
  "documentType" : "symbol",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/quicktime-file-format/Value_atom",
  "metadataVersion" : "0.1.0",
  "role" : "Atom",
  "symbol" : {
    "kind" : "Atom",
    "modules" : [
      "QuickTime File Format"
    ],
    "preciseIdentifier" : "__docc_universal_symbol_reference_$Value_atom"
  },
  "title" : "Value atom"
}
-->

# Value atom

An atom that expresses a metadata value.

## Overview

The value of the metadata item is expressed as immediate data in a value atom. The value atom starts with two fields: a type indicator, and a locale indicator. Both the type and locale indicators are four bytes long. There may be multiple 'value' entries, using different type, country or language codes (see [Data ordering](https://developer.apple.com/documentation/QuickTime-File-Format/Data_ordering) for the required ordering).

## Topics

### Data fields

[`Type indicator`](https://developer.apple.com/documentation/quicktime-file-format/Value_atom/Type_indicator)

Four bytes that indicate a type of data that QuickTime supports.

[`Locale indicator`](https://developer.apple.com/documentation/quicktime-file-format/Value_atom/Locale_indicator)

A four-byte value that indicates a locale.



---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)