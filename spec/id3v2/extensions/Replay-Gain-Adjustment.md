welcome: [please sign in](https://id3.org/Replay%20Gain%20Adjustment?action=login)

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
* [page history](https://id3.org/Replay%20Gain%20Adjustment?action=info)
* [upload & manage files](https://id3.org/Replay%20Gain%20Adjustment?action=AttachFile)
* [ more options ]

  + [Raw Text](https://id3.org/Replay%20Gain%20Adjustment?action=raw)
  + [Print View](https://id3.org/Replay%20Gain%20Adjustment?action=print)
  + [Render as Docbook](https://id3.org/Replay%20Gain%20Adjustment?action=RenderAsDocbook)
  + [Delete Cache](https://id3.org/Replay%20Gain%20Adjustment?action=refresh)
  + [Check Spelling](https://id3.org/Replay%20Gain%20Adjustment?action=SpellCheck)
  + [Like Pages](https://id3.org/Replay%20Gain%20Adjustment?action=LikePages)
  + [Local Site Map](https://id3.org/Replay%20Gain%20Adjustment?action=LocalSiteMap)
  + Rename Page
  + Delete Page
  + Subscribe User
  + Remove Spam
  + revert to this revision
  + Package Pages
  + [Sync Pages](https://id3.org/Replay%20Gain%20Adjustment?action=SyncPages)
  + [Load](https://id3.org/Replay%20Gain%20Adjustment?action=Load)
  + [Save](https://id3.org/Replay%20Gain%20Adjustment?action=Save)
  + [SlideShow](https://id3.org/Replay%20Gain%20Adjustment?action=SlideShow)

location: [Replay Gain Adjustment](https://id3.org/Replay%20Gain%20Adjustment)

### RGAD - Replay Gain Adjustment (class 3)

Specified at [Hydrogen Audio](http://wiki.hydrogenaudio.org/index.php?title=ReplayGain_specification#ID3v2)

```
        <Header for 'Replay Gain Adjustment', ID: "RGAD">
        Peak Amplitude                          $xx $xx $xx $xx
        Radio Replay Gain Adjustment            $xx $xx
        Audiophile Replay Gain Adjustment       $xx $xx

        Header consists of:
        Frame ID                $52 $47 $41 $44 = "RGAD"
        Size                    $00 $00 $00 $08
        Flags                   $40 $00         (%01000000 %00000000)

        In the RGAD frame, the flags state that the frame should be preserved if the ID3v2
        tag is altered, but discarded if the audio data is altered.
```

This is not widely supported and I think it has been superseded by RVA2 in ID3v2.4 (and the XRVA tag for 2.3 compatibility).

Replay Gain Adjustment (last edited 2013-11-25 01:20:08 by [DanONeill](https://id3.org/DanONeill "DanONeill @ localhost[127.0.0.1]"))

[Copyright](https://id3.org/Copyright) © 1998-2024 by their respective owners

* [MoinMoin Powered](http://moinmo.in/ "This site uses the MoinMoin Wiki software.")
* [Python Powered](http://moinmo.in/Python "MoinMoin is written in Python.")
* [GPL licensed](http://moinmo.in/GPL "MoinMoin is GPL licensed.")
* [Valid HTML 4.01](http://validator.w3.org/check?uri=referer "Click here to validate this page.")
