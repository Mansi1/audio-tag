<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Direction_definition",
  "metadataVersion" : "0.1.0",
  "role" : "article",
  "title" : "Direction definition"
}
-->

# Direction definition

Define a direction in metadata keys.

## Overview

For the metadata keys which define a direction, com.apple.quicktime.direction.facing and com.apple.quicktime.direction.motion, directions are specified as a string consisting of one or two angles, separated by a slash if two occur. The first is a compass direction, expressed in degrees and decimal degrees, optionally preceded by the characters "+" or "-", and optionally followed by the character "M".  The direction is determined as accurately as possible; the nominal due north (zero degrees) is defined as facing along a line of longitude of the location system, unless the angle is followed by the "M" character indicating a magnetic heading. The second is an elevation direction, expressed in degrees and decimal degrees between `+90.0` and `-90.0`, with `0` being horizontal (level), `+90.0` being straight up, and `-90.0` being straight down (and for these two cases, the compass direction is irrelevant).

---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)