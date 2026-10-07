<!--
{
  "documentType" : "article",
  "framework" : "QuickTime File Format",
  "identifier" : "/documentation/QuickTime-File-Format/Location_metadata",
  "metadataVersion" : "0.1.0",
  "role" : "article",
  "title" : "Location metadata"
}
-->

# Location metadata

Storing the location coordinates, as well as several auxiliary pieces of information about a location, as metadata.

## Overview

Many systems have the ability to detect or establish their position in a coordinate reference system. The specification "ISO 6709:2008 Standard representation of geographic point location by coordinates" describes one way of storing such information. One of the common systems is the Global Positioning System (GPS) developed by the US Department of Defense. Other systems include the ability of some cellular telephone systems to triangulate the position of cell-phones, and the possibility that IEEE 802.11 Wireless Base Stations are tagged with their position (whereupon mobile units that can 'see' their signal can establish that they are probably 'near' that location).

This support is increasingly common in still and movie cameras, or composite devices (such as camera-phones) that can function as cameras.

Use the defined keys to store the location coordinates as metadata, as well as several auxiliary pieces of information about a location. For all the location metadata keys defined in this specification, the Metadata atom handler-type should be `‘mdta’`. See the com.apple.quicktime.location.ISO6709 entry in the [QuickTime metadata keys](https://developer.apple.com/documentation/QuickTime-File-Format/QuickTime_metadata_keys) table for a description of the main location metadata key, and the additional table describing auxiliary location metadata keys.

---

Copyright &copy; 2026 Apple Inc. All rights reserved. | [Terms of Use](https://www.apple.com/legal/internet-services/terms/site.html) | [Privacy Policy](https://www.apple.com/privacy/privacy-policy)