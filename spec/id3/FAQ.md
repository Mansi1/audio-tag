welcome: [please sign in](https://id3.org/FAQ?action=login)

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
* [page history](https://id3.org/FAQ?action=info)
* [upload & manage files](https://id3.org/FAQ?action=AttachFile)
* [ more options ]

  + [Raw Text](https://id3.org/FAQ?action=raw)
  + [Print View](https://id3.org/FAQ?action=print)
  + [Render as Docbook](https://id3.org/FAQ?action=RenderAsDocbook)
  + [Delete Cache](https://id3.org/FAQ?action=refresh)
  + [Check Spelling](https://id3.org/FAQ?action=SpellCheck)
  + [Like Pages](https://id3.org/FAQ?action=LikePages)
  + [Local Site Map](https://id3.org/FAQ?action=LocalSiteMap)
  + Rename Page
  + Delete Page
  + Subscribe User
  + Remove Spam
  + revert to this revision
  + Package Pages
  + [Sync Pages](https://id3.org/FAQ?action=SyncPages)
  + [Load](https://id3.org/FAQ?action=Load)
  + [Save](https://id3.org/FAQ?action=Save)
  + [SlideShow](https://id3.org/FAQ?action=SlideShow)

location: [FAQ](https://id3.org/FAQ)

## Frequently Asked Questions

This is a "true" frequently asked questions list (as opposed to list-of-things-I-think-you-should-know named as FAQ).

* **Q: Where is an ID3v2 tag located in an MP3 file?**
  It is most likely located at the beginning of the file. Look for the marker "ID3" in the first 3 bytes of the file. If it's not there, it could be at the end of the file (if the tag is ID3v2.4). Look for the marker "3DI" 10 bytes from the end of the file, or 10 bytes before the beginning of an ID3v1 tag. Finally it is possible to embed ID3v2 tags in the actual MPEG stream, on an MPEG frame boundry. Almost nobody does this.
* **Q: Where is an ID3v1 tag located in an MP3 file?**
  An ID3v1 tag is in the last 128 bytes of an MP3 file. Look for the marker "TAG" 128 bytes from the end of the file.
* **Q: Are ID3 tags only available in MP3 audio format?**
  Yes. ID3 tags were designed with the MP3 file format in mind. ID3v2 tags will break formats which are container-based such as Ogg Vorbis and WMA. Here is some information on specific formats:
  + ID3 tags work in MP3 and MP3pro files
  + WAV has no tags and WMA has its own tagging format, which is specified in the WMA spec, available in the MSDN (which unfortunately, basically does not allow Open Source implementations)
  + Ogg Vorbis uses "Xiph Comments" (same as later versions of FLAC and Speex), which are embedded into the Ogg container. You can find information on these in the comment and container specs on [www.xiph.org](http://www.xiph.org)
  + AAC uses yet another tagging format, which does not at present have a published spec as of 3/1/2006.
* **Q: Why does ID3v2 not make use of XML?**
  The first reason is that many types of information in ID3v2 are by nature binary data, a data type that does not mix easily with XML. The second reason is parsing speed. The structure of ID3v2 makes it possible to skip over portions of the tag that are not interesting for an application. An XML-based structure would make that substantially more difficult. The third reson is that if ID3v2 should be remade in XML it would be incompatible with all existing versions of ID3v2. We think that we have had enough of incompatible changes. Finally, if one wishes to include XML-based information within in ID3v2 tag, it is perfectly possible. ID3v2 puts no limitations on the data types that can be embedded within its structure, so a frame that contains XML information is entirely feasible.
* **Q: Could you add the genre X to the genre list?**
  No. The ID3v1 genre list is obsolete and inconsistent and was no good to begin with. All genres above 79 were added by Nullsoft and are not really part of the "ID3v1 standard", if such thing existed.
* **Q: How do I implement support for ID3v2 in C/Java/VB/my-favourite-language?**
  Take a look at the [implementations page](https://id3.org/Implementations) and see if there is any library available that your language can use.

FAQ (last edited 2013-12-02 20:28:53 by [DanONeill](https://id3.org/DanONeill "DanONeill @ 127.0.0.1[127.0.0.1]"))

[Copyright](https://id3.org/Copyright) © 1998-2024 by their respective owners

* [MoinMoin Powered](http://moinmo.in/ "This site uses the MoinMoin Wiki software.")
* [Python Powered](http://moinmo.in/Python "MoinMoin is written in Python.")
* [GPL licensed](http://moinmo.in/GPL "MoinMoin is GPL licensed.")
* [Valid HTML 4.01](http://validator.w3.org/check?uri=referer "Click here to validate this page.")
