welcome: [please sign in](https://id3.org/iTunes?action=login)

[![ID3.org Logo](https://id3.org/images/id3v2.gif)  The Audience is informed](https://id3.org/Home)

# Quick Links

* [Home](https://id3.org/Home)
* [Introduction](https://id3.org/Introduction)
* [Developer Information](https://id3.org/Developer%20Information)
* [Implementations](https://id3.org/Implementations)
* [Compliance Issues](https://id3.org/Compliance%20Issues)
* [Contributors](https://id3.org/Contributors)
* [FAQ](https://id3.org/FAQ)
* [MailingList](https://id3.org/MailingList)
* [RecentChanges](https://id3.org/RecentChanges)
* [FindPage](https://id3.org/FindPage)
* [HelpContents](https://id3.org/HelpContents)

# Search Wiki

# Page Tools

* Page Locked
* Comments
* [page history](https://id3.org/iTunes?action=info)
* [upload & manage files](https://id3.org/iTunes?action=AttachFile)
* [ more options ]

  + [Raw Text](https://id3.org/iTunes?action=raw)
  + [Print View](https://id3.org/iTunes?action=print)
  + [Render as Docbook](https://id3.org/iTunes?action=RenderAsDocbook)
  + [Delete Cache](https://id3.org/iTunes?action=refresh)
  + [Check Spelling](https://id3.org/iTunes?action=SpellCheck)
  + [Like Pages](https://id3.org/iTunes?action=LikePages)
  + [Local Site Map](https://id3.org/iTunes?action=LocalSiteMap)
  + Rename Page
  + Delete Page
  + Subscribe User
  + Remove Spam
  + revert to this revision
  + Package Pages
  + [Sync Pages](https://id3.org/iTunes?action=SyncPages)
  + [Load](https://id3.org/iTunes?action=Load)
  + [Save](https://id3.org/iTunes?action=Save)
  + [SlideShow](https://id3.org/iTunes?action=SlideShow)

location: [iTunes](https://id3.org/iTunes)

## iTunes

iTunes is clearly the most used id3 implementation.

It can write 2.2, 2.3 and 2.4. The support in general is good.

### Custom Tags

It does use some custom frames for things, even when there are standard frames for them (e.g. normalization)

```
Field              v2.3/v2.4   v2.2
------------------ ---------   ----
Title Sort         TSOT        TST
Artist Sort        TSOP        TSP
Album Sort         TSOA        TSA
Album Artist Sort  TSO2        TS2
Composer Sort      TSOC        TSC
```

[iTunes Compilation Flag](https://id3.org/iTunes%20Compilation%20Flag)

[iTunes Normalization settings](https://id3.org/iTunes%20Normalization%20settings)

[Developer Information#Unofficial Frames Seen in the Wild](https://id3.org/Developer%20Information#Unofficial_Frames_Seen_in_the_Wild)

### 2.4 Frame Length Issues

In earlier version of iTunes the major problem with the implementations was that the 2.4 support gets the frame length wrong when writing frames > 127 bytes. It treats the frame lengths as not sync-safe integers (as 2.3 did) rather than sync-safe integers (as 2.4 specifies). This makes supporting it problematic. You can usually correct to read a frame that iTunes has written by looking for the next frame signature and trying it as a non sync-safe integer if you don't find it. BUT it means that iTunes can only handle one large frame added to the file and it MUST be at the end of the tag. What happens is that iTunes will read the size as much larger than it really is and get all of the frame plus some more. But if it is at the end of the tag, it is harmless. Images are correctly displayed since they have size information in them and the trailing "junk" is just dropped.

However this issue was fixed about iTunes 8

### Handling of null seperated values in ID3v24

ID3v24 allows multiple values in a single field, separated by nulls, I tried this with the TCON (genre) field wth mixed results. If the fields are encoded as ISO-8859-1 (Encoding Type 0) iTunes displays the first genre only which is acceptable. But if you encoded the fields as UTF-8 (Encoding Type 3) then iTunes displays all the genres concatenated together as one genre (i.e [RockElectronicGoth](https://id3.org/RockElectronicGoth))

## User Experiences

**These sections reflect user experiences, not necessarily the view of ID3.org!**

The term **"Field" refers to iTunes**, the term **"Frames" refers to the analog** (but not necessarily same part) **within the ID3 standard**.

### iTunes - Bad Implementations

#### Field "Year"

Accepts the input of 4 characters and maps them to the id3v2.3.0 frame TYER [id3v2.3.0#TYER](https://id3.org/id3v2.3.0#TYER) although the newer id3v2.4.0 frame TDRC [id3v2.4.0-frames#line-586](https://id3.org/id3v2.4.0-frames#line-586) allows a (partially) complete full ISO 8601 date-time-stamps in the form of yyyy-MM-ddTHH:mm:ss!

As a workaround I put the longer date format at the end of the title, for audio files where it is necessary, i.e. "Ice Mix at Hot Club on 2008-07-05".

#### Frame "Solo Artist" TPE1 versus frame "Band/Orchestra" TPE2

iTunes (as of x.x.x in around 2006-05, read this [forum post](http://answers.google.com/answers/threadview?id=717154)) does not differentiate these 2 frames, and simply consideres one over the other just by chance rather than a system, and drops the other!

To Apple: Correct this, so that it reflects the standard! And make use of the differentiated frames, i.e. the user could separately search for "Bob Marley" and/or "The Wailers"!

As of iTunes 7 (confirm?) the TPE1 frame is used for the "Artist" field, and the TPE2 frame is used for "Album artist".

Is this behavior correct?

I consider different Real Live cases:

##### DJ Mix Album

* TPE1 = Music Producers
* TPE2 = DJ

##### Feature Artist

* Feature Artist very likely is denoted somewhere within TIT2, but should be in TPE1.
* Main producer/band/act should be TPE2.

##### DJ Mix Album with tracks with Feature Artist

* Here the system definitely explodes!
* 3 types of artists (DJ, main producer/band/act, feature artist) but only 2 frames.

##### Conclusion

* Not very well suited.
* What does the standard foresee for feature artists?
* "Musician credits list" TMCL, "Involved people list" TIPL? ...

### iTunes - Missing Implementations

#### Field "Rating"

iTunes "Rating" field (1-5 stars) is not saved into the standard POP "Popularimeter" frame [id3v2.4.0-frames#line-1166](https://id3.org/id3v2.4.0-frames#line-1166).

[Read this forum post](http://forums.mp3tag.de/index.php?showtopic=4316)

#### Unused ID3 Frames

The following frames are described within the standard, but iTunes does not make make them useable/accessible via the user interface!

##### Frame TEXT "Lyricist/Text writer"

You can add lyrics into the "Lyrics" field, but there is no dedicated field for the author, so most people, if at all, will include the author within this field.

##### Frame TIT3 "Subtitle/Description refinement"

Currently most users write their refinement remark into brackets within the title frame, i.e. "Back home again (live)" or "Cannot stand my mood anymore (Pac Man Mix)". In my opinion, we can also leave without this being implemented.

##### Frame TPE3 "Conductor"

As a workarround I tended to write "Conductor Name - Orchestra Name" into the "Artist" field (iTunes uses TPE1 or TPE2 for this).

##### TMCL "Musician credits list" and TIPL "Involved people list"

I tended to write this into the comment frame in an unstandardised syntax (with various key/value delimiters, and next-record-delimiter), although the ID3 standard would offer a nice standardised way to denote multiple "Instrument / Artist Name" key/value pairs into the TMCL frame and multiple "Function / Person Name" key/value pairs into the TIPL frame.

##### Differentiating Original / Remix / Cover

iTunes does not offer access to the frame "Interpreted, remixed, or otherwise modified by" TPE4. If it would, we would spare us the mess of unstandardised remarks in titles. Many people used the workaround by filling the "Composer" field (mapped to the TCOM frame) and "Artist" field (mapped to either frame TPE1 or TPE2) with the different names to denote the original versus remixer aspect, but some in the one direction, some in the other, hence another chaos.

To Apple: Please start to make TPE4 accessible, and those who are concerned, would create some batch processing to transfer their fields to the correct frames.

iTunes (last edited 2012-10-08 22:15:39 by localhost)

[Copyright](https://id3.org/Copyright) © 1998-2024 by their respective owners

* [MoinMoin Powered](http://moinmo.in/ "This site uses the MoinMoin Wiki software.")
* [Python Powered](http://moinmo.in/Python "MoinMoin is written in Python.")
* [GPL licensed](http://moinmo.in/GPL "MoinMoin is GPL licensed.")
* [Valid HTML 4.01](http://validator.w3.org/check?uri=referer "Click here to validate this page.")
