# Lyrics3v2.txt

The original file, unchanged, converted from `Lyrics3v2.txt`.

```text
== What is Lyrics3 v2.00? ==
<<BR>>
||<tablewidth="100%" tablestyle="text-align: left;">The Lyrics3 v2.00 tag is more complicated than the previous Lyrics3 tag but has a lot more capabilities. Just like the old Lyrics3 tag it resides between the audio and the ID3 tag, which must be present. The tag uses only text for everything from content to size descriptors, which are represented as numerical strings. This makes it easier to implement a Lyrics3 v2.00 reader. <<BR>><<BR>>The Lyrics3 block, after the MP3 audio and before the ID3 tag, begins with the word "LYRICSBEGIN" after which a number of field records follows. The Lyrics3 block ends with a six character size descriptor and the string "LYRICS200". The size value includes the "LYRICSBEGIN" string, but does not include the 6 character size descriptor and the trailing "LYRICS200" string.<<BR>><<BR>>Lyrics3 v2.00 uses fields to represent information. The data in a field can consist of ASCII characters in the range 01 to 254 according to the standard. As the ASCII character map is only defined from 00 to 128 ISO-8859-1 might be assumed. Numerical fields are 5 or 6 characters long, depending on location, and are padded with zeroes.<<BR>><<BR>>Only the size of the tag sets the limit for how many fields may be present. All fields uses a simple structure that includes a three character field ID, six characters describing the size of the information and the actual information. This makes it possible to read unknown fields and write them back when saving the tag. There are no required fields in the tag, but at least one field must exist. Fields can appear in any order in the tag, except the indication (IND) field which must be the first field if used. Fields that include more then one line uses [CR][LF] delimiters between lines. || {{attachment:lyrics32.gif}} ||


<<BR>>

=== Defined fields ===
The following list is a list of currently defined field IDs. More fields might be added if needed on newer versions of the Lyrics3 v2.00  specifications. Unknown fields should be ignored.

|| ID || Max size || Description ||
||IND || 00003 || Indications field. This is always three (3) characters big in v2.00, but might be bigger in a future standard. The first byte indicates wether or not a lyrics field is present. "1" for present and "0" for otherwise. The second character indicates if there is a timestamp in the lyrics. Again "1" for yes and "0" for no. The third character inhibits tracks for random selection - "1" if inhibited and "0" if not. ||
|| LYR || 99999 || Lyrics multi line text. Timestamps can be used anywhere in the text in any order. Timestamp format is [mm:ss] (no spaces allowed in the timestamps). ||
|| INF || 99999 || Additional information multi line text. ||
|| AUT || 00250 || Lyrics/Music Author name. ||
|| EAL || 00250 || Extended Album name. ||
|| EAR || 00250 || Extended Artist name. ||
|| ETT || 00250 || Extended Track Title. ||
|| IMG || 99999 || Link to an image files (BMP or JPG format). Image lines include filename, description and timestamp separated by delimiter - two ASCII chars 124 ("{{{||}}}"). Description and timestamp are optional, but if timestamp is used, and there is no description, two delimiters ("{{{||||}}}") should be used between the filename and the timestamp. Multiple images are allowed by using a [CR][LF] delimiter between each image line. No [CR][LF] is needed after the last image line. Number of images is not limited (except by the field size).<<BR>> '''Filename''' can be in one of these formats: <<BR>> * Filename only - when the image is located in the same path as the MP3 file (preferred, since if you move the mp3 file this will still be correct)<<BR>> * Relative Path + Filename - when the image is located in a subdirectory below the MP3 file (i.e. images\cover.jpg) <<BR>> * Full path + Filename - when the image is located in a totally different path or drive. This will not work if the image is moved or drive letters has changed, and so should be avoided if possible (i.e. c:\images\artist.jpg) <<BR>>'''Description''' can be up to 250 chars long.<<BR>> '''Timestamp''' must be formatted like the lyrics timestamp which is "[mm:ss]". If an image has a timestamp, then the visible image will automatically switch to that image on the timestamp play time, just the same as the selected lyrics line is switched based on timestamps. ||

The extended Album, Artist and Track are an extension to the fields in the ID3v1 tag - which are limited to 30 chars. If these extended fields exist, make sure their first 30 chars are exactly the same as the ones in the ID3v1 tag. If they are the same, display the extended field. If not, display the one from the ID tag. These 'mismatched' extended fields, should be removed when saving the lyrics tag.

When saving the extended fields, make sure to copy the first 30 chars of each field to the ID3 tag matching fields. It is recommended NOT to save extended fields at all, if they are not larger then 30 chars.

=== Example ===

The following includes all the information from after the mp3 data until the ID tag. Please note that unless a [CR][LF] is at the end of the line, no [CR] or [LF] should be added between lines.

{{{
LYRICSBEGIN
IND00003
110
EAL00041
Album name that is larger then 30 chars !
EAR00050
Artist name or band that is larger then 30 chars !
ETT00042
Track name which is larger then 30 chars !
INF00090
This track was actually recorded in several places around the world[CR][LF]
and mixed at the US[CR][LF]
AUT00048
The lyrics were written by someone.. is it you ?
IMG00086
album_cover.jpg||Album cover||[00:10][CR][LF]
jumping.jpg||He jumps at the audience!||[01:00]
LYR00630
[00:02]Let's talk about time[CR][LF]
[00:02]tickin' away every day[CR][LF]
[00:05]so wake on up before it's gone away[CR][LF]
[00:10]catch the 411 and stay up like the sun[CR][LF]
[00:20]remind yourself what's done and done[CR][LF]
[00:32]so let yesterday stay with the bygones[CR][LF]
[00:40]keep your body and soul and your mind on[CR][LF]
[00:55]the right track infact you gotta stay on[CR][LF]
[01:20]the real black[CR][LF]
[CR][LF]
Chorus:[CR][LF]
[01:25][05:45]Time is tickin' away[CR][LF]
[01:42][05:55]you've gotta - live your life -[CR][LF]
[02:11][06:24]day by day[CR][LF]
[02:26][06:35]happy or sad, good or bad[CR][LF]
[02:31][06:42]life is too short[CR][LF]
[02:58][07:13]you've gotta - keep your head -[CR][LF]
[03:01][07:19](Repeat)[CR][LF]
001065LYRICS200
}}}


 * The indications field size is two bytes. They are two '1', which mean that LYR field is to be found in the tag, and timestamps are used in it.
 * The extended Album text size is 41 chars The extended Artist name size is 50 chars 
 * The extended Track name size is 42 chars 
 * The Additional information size is 90 chars 
 * The Lyrics Author size is 48 chars 
 * The Image file link size is 86 chars 
 * The Lyrics text size is 630 chars 
All the fields together (with the 'LYRICSBEGIN') is 001064 chars.

The ID3v1 tag that comes after this example should have : 
 * Album field: 'Album name that is larger then' 
 * Artist field: 'Artist name or band that is la' 
 * Title field: 'Track name which is larger the'

How to read a Lyrics 3 v2.00 tag Here is a step by step description of how to read the lyrics3 v2.00 tag:

 1. Read the 9 bytes before the ID3v1 tag, if any. Those 9 bytes must be LYRICS200.
 1. Read the previous 6 bytes, which are text digits that, when interpreted as a number, give you the total number of bytes in the Lyrics3 v2.00 tag field, including the LYRICSBEGIN header, but not including the trailing Tag size and LYRICS200 end string.
 1. Seek back in the file from the beginning of the tag size field, the number of bytes read in the previous step.
 1. Read 11 bytes forward. These 11 bytes must read LYRICSBEGIN.
 1. Start reading fields until you have read the number of bytes retrieved in step 2.
Here is a step by step description on how to read fields:

 1. Read 3 chars, which are the field ID.
 1. Read 5 characters as a number which contain the number of bytes of data for this field.
 1. If you already read LSZ bytes including the 'LYRICSBEGIN' then stop reading fields. If not, go back to 1.
Note: If you happen to read a Field ID that is not listed in the standard on this page, keep the information and be sure to write it back to the MP3 file. Such fields may be included in future standards so the data should be retained. Contact information

The Lyrics3 v2.00 tag specification was written by Peter Strnad and Alon Gingold.
```
