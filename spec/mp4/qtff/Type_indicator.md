<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Type_indicator",
  "metadataVersion" : "0.1.0",
  "role" : "article",
  "title" : "Type indicator"
}
-->

# Type indicator

Four bytes that indicate a type of data that QuickTime supports.

## Overview

The type indicator is formed of four bytes split between two fields. The first byte indicates the set of types from which the type is drawn. The second through fourth byte forms the second field and its interpretation depends upon the value in the first field.

The indicator byte must have a value of `0`, meaning the type is drawn from the well-known set of types. All other values are reserved.

If the type indicator byte is `0`, the following 24 bits hold the well-known type. Please refer to the list of [Well-known types](https://developer.apple.com/documentation/QuickTime-File-Format/Well-known_types).

---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)