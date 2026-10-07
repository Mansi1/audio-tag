<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Data_ordering",
  "metadataVersion" : "0.1.0",
  "role" : "article",
  "title" : "Data ordering"
}
-->

# Data ordering

Represent multiple representations of the same information, differing either by language or storage type or by the size or nature of the data.

## Overview

Multiple values for the same tag represent multiple representations of the same information, differing either by language or storage type or by the size or nature of the data. For example, an artist name may be supplied in three ways:

- as a large JPEG of their signature
- as a smaller 'thumbnail' JPEG of their signature
- as text

An application may then choose the variation of the the artist name to display based on the size it needs.

Data must be ordered in each item from the most-specific data to the most general. An application may, if it wishes, stop 'searching' for a value once it finds a value that it can display (it has an acceptable locale and type).

---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)