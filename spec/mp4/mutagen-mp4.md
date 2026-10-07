# mutagen-mp4.txt

The original file, unchanged, converted from `mutagen-mp4.txt`.

```text

  MP4 — mutagen
            mutagen
Changelog
User Guide
API Reference
Main Module
AAC
AC3
AIFF
APEv2
ASF
DSDIFF
DSF
FLAC
ID3
Monkey’s Audio
MP3
MP4
Musepack
OGG
Ogg FLAC
Ogg Opus
Ogg Speex
Ogg Theora
Ogg Vorbis
OptimFROG
Standard MIDI File
TAK
TrueAudio
Vorbis Comment
WAVE
WavPack
Command Line Tools
Developer Guide
Contact
          mutagen
          API Reference
      MP4
             View page source
MP4
Read and write MPEG-4 audio files with iTunes metadata.
This module will read MPEG-4 audio information and metadata,
as found in Apple’s MP4 (aka M4A, M4B, M4P) files.
There is no official specification for this format. The source code
for TagLib, FAAD, and various MPEG specifications at
http://developer.apple.com/documentation/QuickTime/QTFF/
http://www.geocities.com/xhelmboyx/quicktime/formats/mp4-layout.txt
http://standards.iso.org/ittf/PubliclyAvailableStandards/c041828_ISO_IEC_14496-12_2005(E).zip
http://wiki.multimedia.cx/index.php?title=Apple_QuickTime
were all consulted.
MP4
class mutagen.mp4.MP4(filething)
Bases: FileType
An MPEG-4 audio file, probably containing AAC.
If more than one track is present in the file, the first is used.
Only audio (‘soun’) tracks will be read.
Parameters:
filething (filething)
info
Type:
MP4Info
tags
Type:
MP4Tags
class MP4Chapters
Bases: Sequence
MPEG-4 Chapter information.
Supports the ‘moov.udta.chpl’ box.
A sequence of Chapter objects with the following members:start (float): position from the start of the file in seconds
title (str): title of the chapter
save(filething=None, padding=None)
pprint()
Returns:
stream information, comment key=value pairs and chapters.
Return type:
text
add_tags()
Adds new tags to the file.
Raises:
mutagen.MutagenError – if tags already exist or adding is not possible.
static score(filename, fileobj, header_data)
Returns a score for how likely the file can be parsed by this type.
Parameters:
filename (fspath) – a file path
fileobj (fileobj) – a file object open in rb mode. Position is
undefined
header (bytes) – data of undefined length, starts with the start of
the file.
Returns:
negative if definitely not a matching type, otherwise a score,the bigger the more certain that the file can be loaded.
Return type:
int
class mutagen.mp4.MP4Tags
Bases: DictProxy, Tags
Dictionary containing Apple iTunes metadata list key/values.
Keys are four byte identifiers, except for freeform (’—-‘)
keys. Values are usually unicode strings, but some atoms have a
special structure:
Text values (multiple values per key are supported):
‘\xa9nam’ – track title
‘\xa9alb’ – album
‘\xa9ART’ – artist
‘aART’ – album artist
‘\xa9wrt’ – composer
‘\xa9day’ – year
‘\xa9cmt’ – comment
‘desc’ – description (usually used in podcasts)
‘purd’ – purchase date
‘\xa9grp’ – grouping
‘\xa9gen’ – genre
‘\xa9lyr’ – lyrics
‘purl’ – podcast URL
‘egid’ – podcast episode GUID
‘catg’ – podcast category
‘keyw’ – podcast keywords
‘\xa9too’ – encoded by
‘cprt’ – copyright
‘soal’ – album sort order
‘soaa’ – album artist sort order
‘soar’ – artist sort order
‘sonm’ – title sort order
‘soco’ – composer sort order
‘sosn’ – show sort order
‘tvsh’ – show name
‘\xa9wrk’ – work
‘\xa9mvn’ – movement
Boolean values:
‘cpil’ – part of a compilation
‘pgap’ – part of a gapless album
‘pcst’ – podcast (iTunes reads this only on import)
Tuples of ints (multiple values per key are supported):
‘trkn’ – track number, total tracks
‘disk’ – disc number, total discs
Integer values:
‘tmpo’ – tempo/BPM
‘\xa9mvc’ – Movement Count
‘\xa9mvi’ – Movement Index
‘shwm’ – work/movement
‘stik’ – Media Kind
‘hdvd’ – HD Video
‘rtng’ – Content Rating
‘tves’ – TV Episode
‘tvsn’ – TV Season
‘plID’, ‘cnID’, ‘geID’, ‘atID’, ‘sfID’, ‘cmID’, ‘akID’ – Various iTunes
Internal IDs
Others:
‘covr’ – cover artwork, list of MP4Cover objects (which are
tagged strs)
‘gnre’ – ID3v1 genre. Not supported, use ‘\xa9gen’ instead.
The freeform ‘—-’ frames use a key in the format ‘—-:mean:name’
where ‘mean’ is usually ‘com.apple.iTunes’ and ‘name’ is a unique
identifier for this frame. The value is a str, but is probably
text that can be decoded as UTF-8. Multiple values per key are
supported.
MP4 tag data cannot exist outside of the structure of an MP4 file,
so this class should not be manually instantiated.
Unknown non-text tags and tags that failed to parse will be written
back as is.
delete(filename)
Remove the metadata from the given filename.
pprint()
Returns:
tag information
Return type:
text
class mutagen.mp4.MP4Info
Bases: StreamInfo
MPEG-4 stream information.
bitrate
bitrate in bits per second, as an int
Type:
int
length
file length in seconds, as a float
Type:
float
channels
number of audio channels
Type:
int
sample_rate
audio sampling rate in Hz
Type:
int
bits_per_sample
bits per sample
Type:
int
codec
if starting with "mp4a" uses an mp4a audio codec
(see the codec parameter in rfc6381 for details e.g.
"mp4a.40.2")
for everything else see a list of possible values at
http://www.mp4ra.org/codecs.html
e.g. "mp4a", "alac", "mp4a.40.2", "ac-3" etc.
Type:
mutagen.text
codec_description
Name of the codec used (ALAC, AAC LC, AC-3…). Values might
change in the future, use for display purposes only.
Type:
mutagen.text
pprint()
Returns:
Print stream information
Return type:
text
class mutagen.mp4.MP4Cover(data, *args, **kwargs)
A cover artwork.
imageformat
format of the image
(either FORMAT_JPEG or FORMAT_PNG)
Type:
AtomDataType
class mutagen.mp4.MP4FreeForm(data, *args, **kwargs)
A freeform value.
dataformat
format of the data (see AtomDataType)
Type:
AtomDataType
class mutagen.mp4.AtomDataType
Enum for dataformat attribute of MP4FreeForm.
Added in version 1.25.
IMPLICIT = <AtomDataType.IMPLICIT: 0>
for use with tags for which no type needs to be indicated because
only one type is allowed
UTF8 = <AtomDataType.UTF8: 1>
without any count or null terminator
UTF16 = <AtomDataType.UTF16: 2>
also known as UTF-16BE
SJIS = <AtomDataType.SJIS: 3>
deprecated unless it is needed for special Japanese characters
HTML = <AtomDataType.HTML: 6>
the HTML file header specifies which HTML version
XML = <AtomDataType.XML: 7>
the XML header must identify the DTD or schemas
UUID = <AtomDataType.UUID: 8>
also known as GUID; stored as 16 bytes in binary (valid as an ID)
ISRC = <AtomDataType.ISRC: 9>
stored as UTF-8 text (valid as an ID)
MI3P = <AtomDataType.MI3P: 10>
stored as UTF-8 text (valid as an ID)
GIF = <AtomDataType.GIF: 12>
(deprecated) a GIF image
JPEG = <AtomDataType.JPEG: 13>
a JPEG image
PNG = <AtomDataType.PNG: 14>
PNG image
URL = <AtomDataType.URL: 15>
absolute, in UTF-8 characters
DURATION = <AtomDataType.DURATION: 16>
in milliseconds, 32-bit integer
DATETIME = <AtomDataType.DATETIME: 17>
in UTC, counting seconds since midnight, January 1, 1904;
32 or 64-bits
GENRES = <AtomDataType.GENRES: 18>
a list of enumerated values
INTEGER = <AtomDataType.INTEGER: 21>
a signed big-endian integer with length one of { 1,2,3,4,8 } bytes
RIAA_PA = <AtomDataType.RIAA_PA: 24>
RIAA parental advisory; { -1=no, 1=yes, 0=unspecified },
8-bit ingteger
UPC = <AtomDataType.UPC: 25>
Universal Product Code, in text UTF-8 format (valid as an ID)
BMP = <AtomDataType.BMP: 27>
Windows bitmap image
EasyMP4
class mutagen.easymp4.EasyMP4(filelike)
Bases: MP4
Like MP4, but uses EasyMP4Tags for
tags.
info
Type:
mutagen.mp4.MP4Info
tags
Type:
EasyMP4Tags
classmethod RegisterTextKey(key, atomid)
Register a text key.
If the key you need to register is a simple one-to-one mapping
of MP4 atom name to EasyMP4Tags key, then you can use this
function:
EasyMP4Tags.RegisterTextKey("artist", "©ART")
classmethod RegisterKey(key, getter=None, setter=None, deleter=None, lister=None)
Register a new key mapping.
A key mapping is four functions, a getter, setter, deleter,
and lister. The key may be either a string or a glob pattern.
The getter, deleted, and lister receive an MP4Tags instance
and the requested key name. The setter also receives the
desired value, which will be a list of strings.
The getter, setter, and deleter are used to implement __getitem__,
__setitem__, and __delitem__.
The lister is used to implement keys(). It should return a
list of keys that are actually in the MP4 instance, provided
by its associated getter.
class mutagen.easymp4.EasyMP4Tags
Bases: DictMixin, Tags
A file with MPEG-4 iTunes metadata.
Like Vorbis comments, EasyMP4Tags keys are case-insensitive ASCII
strings, and values are a list of Unicode strings (and these lists
are always of length 0 or 1).
If you need access to the full MP4 metadata feature set, you should use
MP4, not EasyMP4.
classmethod RegisterKey(key, getter=None, setter=None, deleter=None, lister=None)
Register a new key mapping.
A key mapping is four functions, a getter, setter, deleter,
and lister. The key may be either a string or a glob pattern.
The getter, deleted, and lister receive an MP4Tags instance
and the requested key name. The setter also receives the
desired value, which will be a list of strings.
The getter, setter, and deleter are used to implement __getitem__,
__setitem__, and __delitem__.
The lister is used to implement keys(). It should return a
list of keys that are actually in the MP4 instance, provided
by its associated getter.
classmethod RegisterTextKey(key, atomid)
Register a text key.
If the key you need to register is a simple one-to-one mapping
of MP4 atom name to EasyMP4Tags key, then you can use this
function:
EasyMP4Tags.RegisterTextKey("artist", "©ART")
classmethod RegisterIntKey(key, atomid, min_value=0, max_value=65535)
Register a scalar integer key.
classmethod RegisterFreeformKey(key, name, mean='com.apple.iTunes')
Register a text key.
If the key you need to register is a simple one-to-one mapping
of MP4 freeform atom (—-) and name to EasyMP4Tags key, then
you can use this function:
EasyMP4Tags.RegisterFreeformKey(
    "musicbrainz_artistid", "MusicBrainz Artist Id")
pprint()
Print tag key=value pairs.
         Previous
        Next 
    © Copyright 2016, Joe Wreschnig, Michael Urman, Lukáš Lalinský, Christoph Reiter, Ben Ockmore & others.
  Built with Sphinx using a
    theme
    provided by Read the Docs.
```
