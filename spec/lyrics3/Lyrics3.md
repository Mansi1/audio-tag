# Lyrics3.txt

The original file, unchanged, converted from `Lyrics3.txt`.

```text
== What is Lyrics3? ==
<<BR>>
||<tablewidth="100%" tablestyle="text-align: left;"> When Winamp introduced its plugin capabilities Kuo (Djohan) Shiang-shiang's Lyrics Displayer was one of the first plugins, and probably the first program that made a connection between MP3 audio and lyrics. The lyrics displayed by Kuo's Lyrics Displayer were stored in separate text files from which the program got it.<<BR>><<BR>>Petr Strnad saw the problems in this so he decided to make a lyrics tag, enabling the text to reside inside the audio file. This is done by creating a chunk of data which begins with "LYRICSBEGIN", ends with "LYRICSEND" and has the lyrics between these keywords. This data block is then saved in the audio file between the audio and the ID3 tag. If no ID3 tag is present one must be attached. || {{attachment:lyrics3_blocks.gif}} ''Internal layout of an Lyrics3 tagged file.'' ||
<<BR>>
The following simple rules applies to the lyrics inserted between the keywords:
 * The keywords "LYRICSBEGIN" and "LYRICSEND" must not be present in the lyrics.
 * The text is encoded with ISO-8859-1 character set
 * A byte in the text must not have the binary value 255.
 * The maximum length of the lyrics is 5100 bytes.
 * Newlines are made with CR+LF sequence.

If you are implementing a new Lyrics Tagging program, consider this version of Lyrics3 to be obsolete and use the [[Lyrics3v2|Lyrics3 v2.00 standard]].

To determine which version of Lyrics Tag is embedded in an MP3 file you first need to know if the file has an ID3v1 Tag or not. [[ID3v1|ID3v1 Tags]] are appended in the last 128 bytes of the MP3 file. If the file has an ID3v1 Tag, the Lyrics 2 Tag's end will be 137 bytes from the end of the file and those 9 bytes will contain the string 'LYRICSEND' for Lyrics3v1 tags and 'LYRICS200' for Lyrics3v2 Tags.

Lyrics3v1 Tags are really obsolete, but for completeness, here is the definition. (See [[Lyrics3v2|Lyrics3 v2.00]] for the current standard)

 * Begins with the text 'LYRICSBEGIN' string
 * Lyrics ASCII text embedded between begin and end tags
 * End with 'LYRICSEND' string
 * Is relatively arbitrary in length, however, it shouldn't be larger than 4096 bytes.
 * Locate the Lyrics3v1 Tag by seeking to the end tag first. The end tag is located either 9 bytes from the end of a file with no ID3v1 Tag, or 137 bytes from the end of a file containing ID3v1 Tag. Once the end tag is located seek back 5100 bytes and then search forward for the begin tag.
 * Timestamps are of the format '[mm:ss]' and may be embedded in the text at any location and may not contain spaces.
 * There are no delimiters between sections of an Lyrics3v1 Tag.
 * Timestamps must not necessarily increase with the lines... a song can go back to the refrain several times which can be only once in the text, and have several different timestamps on them.
```
