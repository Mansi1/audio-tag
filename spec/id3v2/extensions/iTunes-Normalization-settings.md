welcome: [please sign in](https://id3.org/iTunes%20Normalization%20settings?action=login)

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
* [page history](https://id3.org/iTunes%20Normalization%20settings?action=info)
* [upload & manage files](https://id3.org/iTunes%20Normalization%20settings?action=AttachFile)
* [ more options ]

  + [Raw Text](https://id3.org/iTunes%20Normalization%20settings?action=raw)
  + [Print View](https://id3.org/iTunes%20Normalization%20settings?action=print)
  + [Render as Docbook](https://id3.org/iTunes%20Normalization%20settings?action=RenderAsDocbook)
  + [Delete Cache](https://id3.org/iTunes%20Normalization%20settings?action=refresh)
  + [Check Spelling](https://id3.org/iTunes%20Normalization%20settings?action=SpellCheck)
  + [Like Pages](https://id3.org/iTunes%20Normalization%20settings?action=LikePages)
  + [Local Site Map](https://id3.org/iTunes%20Normalization%20settings?action=LocalSiteMap)
  + Rename Page
  + Delete Page
  + Subscribe User
  + Remove Spam
  + revert to this revision
  + Package Pages
  + [Sync Pages](https://id3.org/iTunes%20Normalization%20settings?action=SyncPages)
  + [Load](https://id3.org/iTunes%20Normalization%20settings?action=Load)
  + [Save](https://id3.org/iTunes%20Normalization%20settings?action=Save)
  + [SlideShow](https://id3.org/iTunes%20Normalization%20settings?action=SlideShow)

location: [iTunes Normalization settings](https://id3.org/iTunes%20Normalization%20settings)

### COMM - iTunes Normalization Settings (class 3)

iTunes writes a standard comment with a description of iTunNORM. This contains the normalization information it uses. A sample is:

* 00001E86 00001E86 0000A2A3 0000A2A3 000006A6 000006A6 000078FA 000078FA 00000211 00000211

Discussions on the values:

* <http://robinbowes.com/projects/flac2mp3/ticket/30>
* <http://www.hydrogenaudio.org/forums/index.php?showtopic=24620>
* <http://svn.slimdevices.com/trunk/server/Slim/Utils/SoundCheck.pm?rev=10330&view=markup> which says:

  ```
  The iTunNORM tag consists of 5 value pairs. These 10 values are encoded as
  ASCII Hex values of 8 characters each inside the tag (plus a space as prefix).

  The tag can be found in MP3, AIFF, AAC and Apple Lossless files.

  The relevant information is what is encoded in these 5 value pairs. The first
  value of each pair is for the left audio channel, the second value of each
  pair is for the right channel.

  0/1: Volume adjustment in milliWatt/dBm
  2/3: Same as 0/1, but not based on 1/1000 Watt but 1/2500 Watt
  4/5: Not sure, but always the same values for songs that only differs in volume - so maybe some statistical values.
  6/7: The peak value (maximum sample) as absolute (positive) value; therefore up to 32768 (for songs using 16-Bit samples).
  8/9: Not sure, same as for 4/5: same values for songs that only differs in volume.
  iTunes is choosing the maximum value of the both first pairs (of the first 4 values) to adjust the whole song.
  ```

iTunes Normalization settings (last edited 2013-11-25 01:22:45 by [DanONeill](https://id3.org/DanONeill "DanONeill @ localhost[127.0.0.1]"))

[Copyright](https://id3.org/Copyright) © 1998-2024 by their respective owners

* [MoinMoin Powered](http://moinmo.in/ "This site uses the MoinMoin Wiki software.")
* [Python Powered](http://moinmo.in/Python "MoinMoin is written in Python.")
* [GPL licensed](http://moinmo.in/GPL "MoinMoin is GPL licensed.")
* [Valid HTML 4.01](http://validator.w3.org/check?uri=referer "Click here to validate this page.")
