<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Calendar_date_and_time_values",
  "metadataVersion" : "0.1.0",
  "role" : "article",
  "title" : "Calendar date and time values"
}
-->

# Calendar date and time values

QuickTime movies store date and time information in Macintosh date format.

## Overview

The Macintosh date format is a 32-bit value indicating the number of seconds that have passed since midnight January 1, 1904.

This value does not specify a time zone. Common practice is to use local time for the time zone where the value is generated.

It is strongly recommended that all calendar date and time values be stored using UTC time, so that all files have a time and date relative to the same time zone.

---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)