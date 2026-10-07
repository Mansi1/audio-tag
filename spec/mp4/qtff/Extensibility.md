<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Extensibility",
  "metadataVersion" : "0.1.0",
  "role" : "article",
  "title" : "Extensibility"
}
-->

# Extensibility

Avoid issues building extensibility into your file.

## Overview

In order to allow metadata to be rewritten easily and without the need to rewrite the entire QuickTime movie file, free space atoms may occur anywhere in the definition of the metadata atom between the positions of other atoms contained by the metadata atom. Free space atoms may not be inserted between items in the metadata item list atom or within atoms in the metadata item list atom. This restriction on free space atom definition avoids the risk of confusing a free space atom with a meaning of a `‘free’` identifier or a value atom of type `‘free’` defined in the context of the metadata atom structure.

Similarly, UUID atoms for specific extensions may be placed in any position where a succession of atoms is permitted. Note that UUID atoms should not be created for atoms already defined using four-character codes.

Unrecognized atoms (that is, those atoms whose types not defined in the context of the metadata atom structure and are contained within the metadata item list atom) are ignored.

---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)