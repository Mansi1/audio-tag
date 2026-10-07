welcome: [please sign in](https://id3.org/Introduction?action=login)

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
* [page history](https://id3.org/Introduction?action=info)
* [upload & manage files](https://id3.org/Introduction?action=AttachFile)
* [ more options ]

  + [Raw Text](https://id3.org/Introduction?action=raw)
  + [Print View](https://id3.org/Introduction?action=print)
  + [Render as Docbook](https://id3.org/Introduction?action=RenderAsDocbook)
  + [Delete Cache](https://id3.org/Introduction?action=refresh)
  + [Check Spelling](https://id3.org/Introduction?action=SpellCheck)
  + [Like Pages](https://id3.org/Introduction?action=LikePages)
  + [Local Site Map](https://id3.org/Introduction?action=LocalSiteMap)
  + Rename Page
  + Delete Page
  + Subscribe User
  + Remove Spam
  + revert to this revision
  + Package Pages
  + [Sync Pages](https://id3.org/Introduction?action=SyncPages)
  + [Load](https://id3.org/Introduction?action=Load)
  + [Save](https://id3.org/Introduction?action=Save)
  + [SlideShow](https://id3.org/Introduction?action=SlideShow)

location: [Introduction](https://id3.org/Introduction)

## Consumer description

Digital audio files can contain, in addition to the audio track, related text and/or graphical information. The information you're probably familiar with take the form of Song title, Artist name, Album name, Year and Genre. This is the information displayed when you playback a digital audio file on your computer or portable device.

The process of including information other than sound into these digital audio files is commonly referred to as "tagging" in which you "tag" the audio file with additional information that describes the audio file. The original standard for tagging digital files was developed in 1996 by Eric Kemp and he coined the term ID3. At that time ID3 simply meant "IDentify an MP3".

ID3.org receives one frequent question in various forms:

* What is the tagging format in my Windows Media File?
* What is the tagging format in my iTunes file?
* What is the tagging format in my ogg vorbis file?

Answer? ID3 tags were designed with the MP3 file format in mind. ID3v2 tags will break formats which are container-based such as Ogg Vorbis and WMA. Here is some information on specific formats:

* ID3 tags work in MP3 and MP3pro files
* WAV has no tags
* WMA has its own tagging format, which is specified in the wma spec, available in the MSDN (which unfortunately, basically does not allow Open Source implementations)
* Ogg Vorbis uses "Xiph Comments" (same as later versions of FLAC and Speex), which are embedded into the Ogg container. You can find information on these in the comment and container specs on www.xiph.org
* AAC uses yet another tagging format, which does not at present have a published spec as of 3/1/2006.

The [TagLib Audio Meta-Data Library](http://taglib.github.io/) supports MP3s (with ID3v1, ID3v2 or APE tags), Ogg Vorbis, FLAC (with Xiph Comments or ID3 tags), and MPC files (with APE tags).

Read the [Low Tech history](https://id3.org/History) for the full story.

### Low Tech

[The short history of tagging](https://id3.org/History) - A quick background to what MP3 and ID3 are.
[ID3v2 made easy](https://id3.org/ID3v2Easy) - A non-technical introduction to ID3v2.

### Mid tech

[ID3 made easy](https://id3.org/ID3v1) - A short description of ID3 (v1 and v1.1).
[Lyrics3 made easy](https://id3.org/Lyrics3) - A quick look at a tagging format for lyrics.
[Lyrics3 v2.00](https://id3.org/Lyrics3v2) - A closer look to the latest Lyrics3 standard.
[The private life of MP3 frames](https://id3.org/mp3Frame) - How does the internal of an MP3 file look like.

Introduction (last edited 2013-12-17 03:20:04 by [DanONeill](https://id3.org/DanONeill "DanONeill @ 127.0.0.1[127.0.0.1]"))

[Copyright](https://id3.org/Copyright) © 1998-2024 by their respective owners

* [MoinMoin Powered](http://moinmo.in/ "This site uses the MoinMoin Wiki software.")
* [Python Powered](http://moinmo.in/Python "MoinMoin is written in Python.")
* [GPL licensed](http://moinmo.in/GPL "MoinMoin is GPL licensed.")
* [Valid HTML 4.01](http://validator.w3.org/check?uri=referer "Click here to validate this page.")
