[Jump to content](#bodyContent)

[ ]

Main menu

Main menu

move to sidebar
hide

Navigation

* [Main Page](https://wiki.xiph.org/Main_Page)

Audio

* [FLAC](https://wiki.xiph.org/FLAC)
* [Opus](https://wiki.xiph.org/OpusFAQ)
* [Speex](https://wiki.xiph.org/Speex)
* [Vorbis](https://wiki.xiph.org/Vorbis)

Video

* [Daala](https://wiki.xiph.org/Daala)
* [Dirac](https://wiki.xiph.org/Dirac)
* [Theora](https://wiki.xiph.org/Theora)

Text

* [Kate](https://wiki.xiph.org/Kate)
* [XSPF](https://wiki.xiph.org/XSPF)

Container

* [Ogg](https://wiki.xiph.org/Ogg)
* [Skeleton](https://wiki.xiph.org/Ogg_Skeleton)

Streaming

* [Icecast](https://wiki.xiph.org/Icecast_Project)

[**XiphWiki**](https://wiki.xiph.org/Main_Page)

[Search](https://wiki.xiph.org/Special%3ASearch "Search XiphWiki [f]")

Search

[ ]

Appearance

* [Log in](https://wiki.xiph.org/index.php?title=Special:UserLogin&returnto=VorbisComment "You are encouraged to log in; however, it is not mandatory [o]")

[ ]

Personal tools

* [Log in](https://wiki.xiph.org/index.php?title=Special:UserLogin&returnto=VorbisComment "You are encouraged to log in; however, it is not mandatory [o]")

## Contents

move to sidebar
hide

* Beginning
* [1
  Recommended field names](#Recommended_field_names)
* [2
  Proposed field names](#Proposed_field_names)

  Toggle Proposed field names subsection
  + [2.1
    Cover art](#Cover_art)
    - [2.1.1
      METADATA\_BLOCK\_PICTURE](#METADATA_BLOCK_PICTURE)
      * [2.1.1.1
        General encoding/decoding](#General_encoding/decoding)
      * [2.1.1.2
        Block handling](#Block_handling)
      * [2.1.1.3
        Linked images](#Linked_images)
      * [2.1.1.4
        Image dimension fields](#Image_dimension_fields)
      * [2.1.1.5
        Multiple blocks](#Multiple_blocks)
      * [2.1.1.6
        Playback tests](#Playback_tests)
    - [2.1.2
      Unofficial COVERART field (deprecated)](#Unofficial_COVERART_field_(deprecated))
      * [2.1.2.1
        Conversion to METADATA\_BLOCK\_PICTURE](#Conversion_to_METADATA_BLOCK_PICTURE)
  + [2.2
    Chapter Extension](#Chapter_Extension)
  + [2.3
    Date and time](#Date_and_time)
    - [2.3.1
      ISO proposal](#ISO_proposal)
  + [2.4
    ENCODER](#ENCODER)
    - [2.4.1
      Proposal: Inclusion of URL in ENCODER value](#Proposal:_Inclusion_of_URL_in_ENCODER_value)
    - [2.4.2
      Proposal: ENCODED\_BY](#Proposal:_ENCODED_BY)
  + [2.5
    Improving license data](#Improving_license_data)
    - [2.5.1
      New RIGHTS field name proposal](#New_RIGHTS_field_name_proposal)
    - [2.5.2
      Improving existing fields proposal](#Improving_existing_fields_proposal)
  + [2.6
    Geo Location fields](#Geo_Location_fields)
  + [2.7
    Replay Gain](#Replay_Gain)
  + [2.8
    Tantalos resource ID](#Tantalos_resource_ID)
* [3
  Other (non-proposed field names)](#Other_(non-proposed_field_names))

  Toggle Other (non-proposed field names) subsection
  + [3.1
    VCLT playlist format](#VCLT_playlist_format)
* [4
  Implementations](#Implementations)

[ ]

Toggle the table of contents

# VorbisComment

* [Page](https://wiki.xiph.org/VorbisComment "View the content page [c]")
* [Discussion](https://wiki.xiph.org/Talk%3AVorbisComment "Discussion about the content page [t]")

[ ]
English

* [Read](https://wiki.xiph.org/VorbisComment)
* [View source](https://wiki.xiph.org/index.php?title=VorbisComment&action=edit "This page is protected.
  You can view its source [e]")
* [View history](https://wiki.xiph.org/index.php?title=VorbisComment&action=history "Past revisions of this page [h]")

[ ]
Tools

Tools

move to sidebar
hide

Actions

* [Read](https://wiki.xiph.org/VorbisComment)
* [View source](https://wiki.xiph.org/index.php?title=VorbisComment&action=edit)
* [View history](https://wiki.xiph.org/index.php?title=VorbisComment&action=history)

General

* [What links here](https://wiki.xiph.org/Special%3AWhatLinksHere/VorbisComment "A list of all wiki pages that link here [j]")
* [Related changes](https://wiki.xiph.org/Special%3ARecentChangesLinked/VorbisComment "Recent changes in pages linked from this page [k]")
* Printable version
* [Permanent link](https://wiki.xiph.org/index.php?title=VorbisComment&oldid=16339 "Permanent link to this revision of this page")
* [Page information](https://wiki.xiph.org/index.php?title=VorbisComment&action=info "More information about this page")

Appearance

move to sidebar
hide

From XiphWiki

VorbisComment is a base-level [Metadata](https://wiki.xiph.org/Metadata "Metadata") format initially created for use with Ogg [Vorbis](https://wiki.xiph.org/Vorbis "Vorbis"). It has since been adopted in the specifications of
[Ogg](https://wiki.xiph.org/Ogg "Ogg") encapsulations for other Xiph.Org codecs including [Theora](https://wiki.xiph.org/Theora "Theora"), [Speex](https://wiki.xiph.org/Speex "Speex") and [FLAC](https://wiki.xiph.org/FLAC "FLAC").

The use case for VorbisComment is given as:

> ... much like someone jotting a quick note on the bottom of a CDR. It should be a little information to remember the disc by and explain it to others; a short, to-the-point text note that need not only be a couple words, but isn't going to be more than a short paragraph.[[1]](http://xiph.org/vorbis/doc/v-comment.html)

VorbisComments are typically used to provide basic information like the title and copyright holder of a work.
As such the scope is similar to that of ID3 tags used with MP3 files.
VorbisComment is widely supported on [portable Ogg Vorbis players](https://wiki.xiph.org/VorbisHardware "VorbisHardware") as well as streaming, editing and playback software.

Although the syntax of VorbisComment is well-specified, various conventions exist for the field names in use.
The goal for this page is to codify best practices and collect proposals for standardization of VorbisComment field names.

VorbisComments are typically encoded as the second packet in a codec stream. When VorbisComments are included in the first (ie. Theora) stream of an Ogg Theora file, they are assumed to cover all streams in the multiplexed group. [[2]](http://lists.xiph.org/pipermail/vorbis-dev/2008-December/019676.html)

VorbisComment is the simplest and most widely-supported mechanism for storing metadata with Xiph.Org codecs. For other existing and proposed mechanisms, see [Metadata](https://wiki.xiph.org/Metadata "Metadata").

## Recommended field names

The current [VorbisComment recommendation](http://xiph.org/vorbis/doc/v-comment.html) contains a recommended set
of field names for comments.

## Proposed field names

Some proposals for extra field names:

* [Ogg Vorbis Comment Field Recommendations](http://age.hobba.nl/audio/mirroredpages/ogg-tagging.html)
* [Proposals for extending Ogg Vorbis comments](https://web.archive.org/web/20120429102447/http%3A//reallylongword.org/vorbiscomment/)
* [Field names](https://wiki.xiph.org/Field_names "Field names")

Comments are intended to be free-form, but for the purposes of interoperability, it is helpful to define tag sets for particular applications, and provide some guidelines for machine parsing. Note that some field names have to be non-free-form to achieve machine parsing.

### Cover art

#### METADATA\_BLOCK\_PICTURE

The [binary FLAC picture structure](http://flac.sourceforge.net/format.html#metadata_block_picture) is base64 encoded and placed within a VorbisComment with the tag name "METADATA\_BLOCK\_PICTURE". This is the preferred and recommended way of embedding cover art within VorbisComments. It has the following benefits:

* Easy to use for developers since the identical (or similar) structure is also used by FLAC and MP3.
* The cover art can either be linked or embedded within the stream.
* Common picture file formats are supported (jpg and png).
* A description may be included and the picture type (front cover, back cover...) and image mime type are provided.
* Base64 encoded data is invariant under UTF-8 and a valid UTF-8 string, so obeys the rules for comment data.

Implementations interpreting or writing picture blocks should note the following details:

##### General encoding/decoding

* Failure to decode a picture block should not prevent playback of the file (failure to deal with the particularly large packet required by the comment header is a separate problem with the player implementation).
* Base64 encoding is used as in section 4 of [RFC4648](http://www.faqs.org/rfcs/rfc4648.html). We note that line feeds are not allowed and padding characters ('=') are required.
* Applications adding picture blocks should inform users that some applications or hardware may not support them and should provide a method to remove the blocks (this is expected to be trivial for applications capable of adding them).

##### Block handling

* The unencoded format is that of the [FLAC picture block](http://flac.sourceforge.net/format.html#metadata_block_picture). The fields are stored in big endian order as in FLAC, picture data is stored according to the relevant standard.
* Picture data should be stored in PNG or JPEG formats or linked separately. It is recommended readers support both PNG and JPEG
* Allowed values for the MIME string are "image/", "image/png", "image/jpeg" and "-->" (the link indicator) and "" (length 0). An empty MIME string indicates type "image/"
* Fields present in the ID3V2.4.0 [Attached Picture Frame](http://www.id3.org/id3v2.4.0-frames#line-1085) (APIC Frame) take the same interpretation as in the ID3V2.4.0 format with the following exceptions (following the FLAC format):
  + The description field is UTF-8 (encoded without ID3V2's initial 'encoding byte')
  + String fields are not null terminated: their preceding length fields are used instead.

##### Linked images

Support for linked images is optional for applications handling picture blocks. When a linked picture is indicated the following rules are observed:

* The picture data is a complete URL indicating the picture to be used, relative URLs are allowed (note relative URLs do not start with a protocol specifier and are retrieved with the same protocol as the file being processed).
* Links are ISO-8859-1 encoded
* Applications MAY retrieve linked images via the file:// protocol.
* Applications MUST obtain user approval if they wish to retrieve images via remote protocols.
* Link targets may become unavailable: applications supporting linked images SHOULD recover gracefully from this and MAY report the absence to the user.
* The type of the linked file is not restricted to JPEG and JFIF and applications MAY support other formats
* If the application does not support linked images, the target is unavailable, not permitted or an unknown format the picture block should be skipped.
* Applications may make links available to users, this is of particular use when links are unsupported or of unsupported type

##### Image dimension fields

* The height, width, colour depth and 'number of colours' fields are for purely informational purposes. Applications MUST NOT use them for decoding purposes, but MAY display them to the user and MAY use them to make a decision whether to skip the block (for example if selecting the most appropriate among multiple blocks).
* Applications writing picture blocks MUST set these fields correctly OR set them all to zero.

##### Multiple blocks

* Multiple image blocks MAY be included as separate METADATA\_BLOCK\_PICTURE comments.
* There may only be one each of picture type (APIC type) 1 and 2 in a Vorbis stream.
* Block order is significant for some types and applications should preserve the comment order when reading or writing VorbisComment headers. The block order may be used to determine the order pictures are presented to the user.

##### Playback tests

Embedding a picture into the file might break playback of existing players (especially hardware players, software players could be updated easily). A workaround would be to link the picture within the tag. Furthermore users should become informed in some way that embedding a picture COULD cause problems (as stated above).

In order to test if there are playback problems, there are test files available [here](http://www.audioranger.com/coverart_mk.ogg) and [here](http://www.audioranger.com/coverart_im.ogg). You're invited to download one of these test files (or both), test playback on your software and hardware players, and report the results here on the wiki.

**Tested software players**

* Audacious 1.5.1: no problem
* foobar2000: no problems
* Gnome: built-in preview playback: no problem
* MediaMonkey: no problems
* Media Player Classic (unicode build) 6.4.9.1: no problem
* MPlayer 1.1: no problem
* RoarAudio: no problems (server and client side)
* Rythmbox 0.11.6: no problem
* Totem 2.24.3: no problem
* VLC 0.9.4/0.9.6: doesn't play
  + Patch send to VLC to fix this - should get in 1.0.0
* WinAmp: no problems
* Windows Media Player 11: no problem
* XMMS 1.2.11: no problem
* XMPlay 3.4.2: no problem
* Nero ShowTime: no problem
* Songbird 1.8.0: no problem, able to show and edit embedded pictures

**Tested hardware players**

* Logitech Squeezebox: Supported as of January 2009 (server version 7.3.3)
* Sandisk Sansa Fuze (Firmware 01.01.22): Hangs up when trying to playback the demo file - had to reset the player
  + Note: The "Fuze" can play ogg vorbis files which have embedded pictures from "Easytag"
* Cowon iAudio U3 (Firmware 1.29, 4 GB): works
* Cowon D2: no problem (latest Firmware: 2.59, 8GB Version)
* iRiver E100: no problem (latest Firmware: 1.16 G\_U, 8GB Version)
* iRiver T20: doesn't play (firmware: 1.71, 1GB)
* Samsung YP-R1: no problem (latest Firmware: 3.07, 16GB Version)

**Tested tag editors**

* Easytag 2.1.6: can open the file to edit the normal tag fields
* MP3Tag 2.42e: can open the file to edit the normal tag fields
* MP3Tag 2.47b: is able to show and edit embedded pictures

**Tested other software**

* Total Recorder: capable to work with artwork according to the specification.

#### Unofficial COVERART field (deprecated)

There also exists an unofficial, not well supported comment field named "COVERART". It includes a base64-encoded string of the binary picture data (usually a JPEG file, but this could be a different file format too). The disadvantages are that

* no additional information like a description about the cover art or its type (front cover, back cover etc.) is provided,
* the cover art can't be linked
* the base64 string is displayed within many tag editors as plain text because of their missing support for this "COVERART" field
* it may breaks the playback on hardware players because of a large VorbisComment header

The unofficial "COVERART" field is supported for example by such software as AudioShell (<http://www.softpointer.com/AudioShell.htm>) - read/write, and Total Recorder ([http://www.totalrecorder.com/)-](http://www.totalrecorder.com/%29-) only read.

##### Conversion to METADATA\_BLOCK\_PICTURE

Old "COVERART" tags should be converted to the new METADATA\_BLOCK\_PICTURE tag (see above for its specification). This conversion is straightforward and is suggested to be done the following way:

* Decode the COVERART tag. A program MAY check the signature of the embedded picture in order to determine whether it is an allowed type. Lossless conversion from disallowed types to allowed types MAY be carried out.
* Fill out the FLAC block with the binary picture data. If the MIME type of the picture is unknown or can't be determined, the MIME type "image/" MAY be used instead. Supplying image dimensions, color depth etc. is optional (see specification above).
* In the absence of other information the picture type 'Other' should be used. Applications may want to allow users to select a default type or specify the type to use.
* Encode the new picture block, remove the COVERART tag from the comments and add the METADATA\_BLOCK\_PICTURE entry.
* If multiple tags are being converted the order of the METADATA\_BLOCK\_PICTURE tags should be the same as that of the COVERART tags they are replacing.

### Chapter Extension

These are used to include navigation points, for example:

```
CHAPTER001=00:00:00.000
CHAPTER001NAME=Chapter 1
CHAPTER001URL=http://...
```

See the [Chapter Extension](https://wiki.xiph.org/Chapter_Extension "Chapter Extension") page for more details.

### Date and time

The goal is to specify **one** standard format for describing date and/or time.

#### ISO proposal

The date format for any field describing a date must follow the ISO 8601 standard: YYYY-MM-DD, shortened to just YYYY-MM or simply YYYY.

We have been recommending this usage with the DATE tag for some time. It is proposed that the spec be amended to include this information for machinability.

The time format for any field **except** track duration must be specified with leading T and ending with a time zone. Schemas with and without dates:

```
YYYY-MM-DDTHH:MM:SS+TS
```

```
THH:MM+TZ
```

### ENCODER

The goal is to attribute encoder software. This value can be used in the future to determine which files can be improved by being re encoded with a newer version.

:   **Comment**: What is lacking from the vendor string present in the spec from the start? All libvorbis and encoder tunings I'm aware of have recorded the encoder version here.

Rationale for not using the vendor string:

* The vendor string is usually used to store the name and version of the underlying codec library
* The idea of ENCODER is to store the name of the user-visible application, for example ffmpeg2theora.
* It can be useful for debugging to store the name and version of the calling application.
* The libvorbis API does not let applications override the vendor string.

#### Proposal: Inclusion of URL in ENCODER value

The encoder field name must be a unique URL providing both encoder software name and version. If no unique URL address is available were both name and version is available; then the version number can be specified by separating with a space character. For example:

ENCODER=http://flac.sourceforge.net/ 1.2.1

* Note that ffmpeg2theora uses ENCODER, but does not include a url. *Added by Rillian on September 17, 2007*

#### Proposal: ENCODED\_BY

I've also seen ENCODED\_BY. *Added by Rillian on September 17, 2007*

:   ENCODED\_BY is usually the person who did the encoding. This should not be part of the recommendation due to legal problems around deliberate and accidental distribution to third parties. Basically the name of the encoder should not be included to protect encoders from their own egos and possible legal prosecution. *Added by Aleksandersen on September 20, 2007*

### Improving license data

The goal is to provide a method for proclaiming license and copyright information (basically clarifying 'distribution rights (if any) and ownership').

The [specification document](http://xiph.org/vorbis/doc/v-comment.html) describes LICENSE and COPYRIGHT fields. But is not clear enough about whether these should be machine-readable.

We should consider working together with Creative Commons to have complementary and interlinked information on the Creative Commons and Xiph wikis. Refer to the [Ogg page](http://wiki.creativecommons.org/Ogg) in the Creative Commons wiki.

#### New RIGHTS field name proposal

One proposal is to replace the COPYRIGHT and LICENSE field names with RIGHTS. RIGHTS must be a human-readable copyright statement. Basic example:

RIGHTS=Copyright © Recording Company Inc. All distribution rights reserved.

But this is not machine-readable. Adding two complementary field names should do the trick: RIGHTS-DATE, describing the date of copyright; and RIGHTS-URI, providing a method for linking to a license. Software agents can assume that multiple songs uses the sameURIs, such as in the case for Creative Commons. Full example:

RIGHTS=Copyright © 2019 Recording Company Inc. All distribution rights reserved.
RIGHTS-DATE=2019-04
RIGHTS-URI=http://somewhere.com/license.xhtml

Software such as for multimedia management and playback are encouraged to display the RIGHTS statement as a linked phrase using RIGHTS-URI.

RIGHTS-DATE does not need to be displayed as it is required in the human readable version by international copyright agreements. RIGHTS-DATE can be used to determine when a copyrighted work falls under the public domain and related matters. (*The Beatles'* copyright on their original studio recordings (not the remixes) are soon expiering. So mechanisms such as the RIGHTS-DATE are indeed required in music management and filesharing software!)

To remain machine-readable it would be required to have at most one instance of each RIGHTS field name. All fields would of course remain optional.

The *Dublin Core Metadata Initiative* recommends the use of 'rights' to describe license and copyright matters. The web feed format Atom 1.0 has implemented a rights element in their specification.

:   **Comment**: The triplet RIGHTS, RIGHTS-DATE, RIGHTS-URI is an example of structured metadata. VorbisComments are inherently unstructured, and this should be respected. Structured metadata belongs in a different stream, such as XML (using [XMLEmbedding](https://wiki.xiph.org/Metadata#XMLEmbedding "Metadata")).

#### Improving existing fields proposal

Similar to the DATE tag above, we have generally recommended that a URL uniquely identifying the license be included in the LICENSE field to allow machine identification of the license. This is in agreement with the proposal in the Creative Commons wiki. Since the COPYRIGHT field is a human-readable statement of the copyright, like the proposed RIGHTS tag above, some people include a license url there. Therefore if a url can't be found in a LICENSE tag if any, applications should use one from the COPYRIGHT tag, if any. Contact information for verification, attribution, relicensing, etc. can be obtained from the COPYRIGHT field, but Creative Commons also recommend a separate CONTACT tag for this information. This is reasonable, so we propose it be included.

### Geo Location fields

The existing LOCATION field is meant to carry a human readable location for the recording/creation of the media file.

Having geographical coordinates according to [WGS84](http://en.wikipedia.org/wiki/World_Geodetic_System) can be useful as well, especially in a form that can be machine parsed. The agreed format is similar to this [geo microformat](http://en.wikipedia.org/wiki/Geo_%28microformat%29):

GEO\_LOCATION= *latitude* ; *longitude* [; *elevation* ]

where each value is a fixed point decimal number formatted in the C locale with a period (.) for the radix. Values are separated with a ';' and white space is not significant. The elevation is optional.

*latitude* is the geo latitude location of where the media has been recorded or produced in decimal degrees according to WGS84 (zero at the equator, negative values for southern latitudes) (C double).

*longitude* is the geo longitude location of where the media has been recorded or produced in decimal degrees according to WGS84 (zero at the prime meridian in Greenwich/UK, negative values for western longitudes). (C double).

*elevation* is the geo elevation of where the media has been recorded or produced in meters according to WGS84 (zero is average sea level) (C double).

### Replay Gain

The REPLAYGAIN\_\* fields implement the Replay Gain proposal for storing a track relative volume adjustment, which can be used to "fix" quiet or loud sounding Vorbis or FLAC streams. The set of tags is intended to be machine parsed, and has the following form:

```
REPLAYGAIN_TRACK_GAIN=-7.03 dB
REPLAYGAIN_TRACK_PEAK=1.21822226
REPLAYGAIN_ALBUM_GAIN=-6.37 dB
REPLAYGAIN_ALBUM_PEAK=1.21822226
```

See <http://www.replaygain.org/> for detailed information about Replay Gain and how the different values are calculated.

### Tantalos resource ID

Tantalos is a protocol to auto locate and access content in a network scope (normally 'LAN' but can also be bigger like 'company network'). It uses UUIDs to identify resources. There are two groups of those UUIDs: IDs generated using the meta data of the track and IDs generated in some other way (for example random IDs, see UUID specs). The later group may need to be passed with the track. The VCLT Playlist format (see below) uses 'HASH={UUID}id...' with hex-dash format for this (HASH={UUID}e278173d-4d6d-4c66-95ec-4ec85eedc7d1).
--[Ph3-der-loewe](https://wiki.xiph.org/User%3APh3-der-loewe "User:Ph3-der-loewe") 02:05, 13 December 2011 (PST)

## Other (non-proposed field names)

### VCLT playlist format

The VCLT playlist format uses some *keys* which look like VorbisComments but they aren't nor they are proposed to become (expect for HASH). This includes the keys STREAMURL, FILENAME, FILEURL, LENGTH, HASH (see above for this one), SIGNALINFO, AUDIOINFO and OFFSET. You can find more infos about those at <https://bts.keep-cool.org/wiki/Specs/VCLT>.

## Implementations

* [OggImporter](http://sbooth.org/importers/) – imports Ogg Vorbis and Ogg FLAC files to Spotlight.
* vorbiscomment – a commandline tool, part of [VorbisTools](https://wiki.xiph.org/VorbisTools "VorbisTools").
* [oggz-comment](http://www.xiph.org/oggz/) – a commandline tool, part of [Oggz](https://wiki.xiph.org/Oggz "Oggz") tool. It can add comments to multitrack and video files.

Retrieved from "<https://wiki.xiph.org/index.php?title=VorbisComment&oldid=16339>"

* This page was last edited on 26 April 2016, at 20:48.
* Content is available under [CC BY 3.0 and revised BSD](https://wiki.xiph.org/XiphWiki%3ACopyrights "XiphWiki:Copyrights") unless otherwise noted.

* [Privacy policy](https://wiki.xiph.org/XiphWiki%3APrivacy_policy)
* [About XiphWiki](https://wiki.xiph.org/XiphWiki%3AAbout)
* [Disclaimers](https://wiki.xiph.org/XiphWiki%3AGeneral_disclaimer)

* [![Powered by MediaWiki](https://wiki.xiph.org/resources/assets/mediawiki_compact.svg)](https://www.mediawiki.org/)

Search

Search

[ ]

Toggle the table of contents

VorbisComment

Add topic
