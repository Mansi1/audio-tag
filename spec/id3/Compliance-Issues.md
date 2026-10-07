welcome: [please sign in](https://id3.org/Compliance%20Issues?action=login)

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
* [page history](https://id3.org/Compliance%20Issues?action=info)
* [upload & manage files](https://id3.org/Compliance%20Issues?action=AttachFile)
* [ more options ]

  + [Raw Text](https://id3.org/Compliance%20Issues?action=raw)
  + [Print View](https://id3.org/Compliance%20Issues?action=print)
  + [Render as Docbook](https://id3.org/Compliance%20Issues?action=RenderAsDocbook)
  + [Delete Cache](https://id3.org/Compliance%20Issues?action=refresh)
  + [Check Spelling](https://id3.org/Compliance%20Issues?action=SpellCheck)
  + [Like Pages](https://id3.org/Compliance%20Issues?action=LikePages)
  + [Local Site Map](https://id3.org/Compliance%20Issues?action=LocalSiteMap)
  + Rename Page
  + Delete Page
  + Subscribe User
  + Remove Spam
  + revert to this revision
  + Package Pages
  + [Sync Pages](https://id3.org/Compliance%20Issues?action=SyncPages)
  + [Load](https://id3.org/Compliance%20Issues?action=Load)
  + [Save](https://id3.org/Compliance%20Issues?action=Save)
  + [SlideShow](https://id3.org/Compliance%20Issues?action=SlideShow)

location: [Compliance Issues](https://id3.org/Compliance%20Issues)

## Compliance issues

Not all players and tag editors are compliant to the ID3v2 standard. This page contains a list of applications and the symptoms you might experience. If you have corrections, please join the Mailing List and tell us what should be changed. This list was compiled by Mitch Honnert from comments and descriptions on the ID3v2 developers list.

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **ID3 Version** | **App/Lib/Encoder** | **Symptom** | **Description** | **Submitter** |
| v2.3 | Winamp | RX & CV genres not recognized | Winamp (5.35) doesn't recognise the RX or CV genres. | [PaulTaylor](https://id3.org/PaulTaylor) |
| v2.3 | Winamp | Bad Language field in COMM frame | Winamp will record apparently gibberish bytes in the Language field of the Comments (COMM) frame. I don't see any pattern to the bytes, so I'm guessing that it's just some uninitialized variable that's getting written to the Language bytes. (Fixed as of Winamp 5.2) | Mitch H. |
| v2.3 | Winamp | Description field in the COMM frame is ignored | Winamp does not take into account the Description field of the Comments (COMM) frame when reading a tag with more than one COMM frame. Instead of using the COMM frame where the Description field is blank to set the "Comment" field on the "MPEG file info + ID3 tag editor", Winamp displays whichever COMM frame happens to be read \*last\*. So, if another app writes two COMM frames to a tag, one without a Description value followed by one with a Description, Winamp will ignore the first generic COMM frame and use the second. This was can happen when using MusicMatch Jukebox to edit a tag (which properly uses COMM frames with Description values to store its Preference, Mood, Situation, and Tempo fields) and using Winamp to read tag. (Fixed as of Winamp 5.2) | Mitch H. |
| v2.3 | [iTunes](https://id3.org/iTunes) | Genres greater than 125 ignored | iTunes (7.4.3.1) only recognizes genres in ID3v23 in the form (n) if n is 125 (Dance Hall) or less, nor does it understand the (RX) or (CV) genres. | [PaulTaylor](https://id3.org/PaulTaylor) |
| v2.4 | [iTunes](https://id3.org/iTunes) | Numeric Genres in ID3v24 format not understood | iTunes (7.6.1) does not understand numeric genres at all unless they are in the ID3v23 Format | [PaulTaylor](https://id3.org/PaulTaylor) |
| v2.3 | [iTunes](https://id3.org/iTunes) | Extra nullchar in COMM frame | iTunes adds an extra nullchar to the end of the Comments frame. | Mitch H. |
| v2.3 | [iTunes](https://id3.org/iTunes) | Non-standard TCMP frame | When you check the "Part of a compilation" checkbox on the Info tab of the tag editor form, iTunes will add a non-standard TCMP frame to the tag. | Mitch H. |
| v2.4 | [iTunes](https://id3.org/iTunes) | Bad frame length handling | iTunes does not treat framelength as a sync safe integer... see [iTunes](https://id3.org/iTunes) for details. | [BenBennett](https://id3.org/BenBennett) |
| v2.3 | [MusicMatch](https://id3.org/MusicMatch) | Non-standard NCON frame | [MusicMatch](https://id3.org/MusicMatch) adds stuff in an unknown format in the NCON frame. These can get quite large. | Mitch H., [BenBennett](https://id3.org/BenBennett) |
| v2.3 | MP3ext Windows Exporer | Corrupt padding area | The MP3ext Windows explorer extension corrupts all of its ID3 v2 tags by repeatedly writing an advertisement for itself (ie. "MP3ext V3.3.18(unicode)") in the tag padding, which violates the spec. | Paul Grebenc |
| v2.3 | Winamp | Last frame ignored | Winamp ignores the last frame in a v2.3.0 tag if there is no padding in the tag. (This issue is fixed as of Winamp 5.2) | Paul Grebenc |
| v2.3 | Mixmeister BPM analyzer | Invalid values in TBPM frame | Mixmeister BPM analyzer (among others it seems) writes floating point values to the TBPM (Beats Per Minute) frame. | Paul Grebenc |
| v2.3 | Windows XP/Windows Media Player | Windows Media Player displays "The input media format is invalid." and will not play file | Windows XP does not read UTF16-BE encoded text frames | Robert Manson |
| v2.3 | Windows Media Player | Does not seem to support extended headers. |  | Birkir A. Barkarson |
| v2.3 | Windows Media Player | Does not seem to support unsynchronization. |  | Birkir A. Barkarson |
| v2.3 | Quicktime Player | Doesn't correctly display unicode characters. |  | Birkir A. Barkarson |
| v2.3 | VLC Media Player | Crashes when reading bad tag | Sensitive to ill formatted tags and will crash with a memory read error. | Birkir A. Barkarson |
| v2.3 | Winamp 5 Lite | Will not display unicode characters in default mode. | (This issue is fixed as of Winamp 5.2) | Birkir A. Barkarson |
| v2.3 | Windows Media Player | Won't play an MP3 if certain ill formatted frames are detected |  | Birkir A. Barkarson |
| v2.3, v2.4 | Windows Media Player | v2.4 tag overwritten by v2.3 tag | I've seen Windows Media Player write a v2.3 tag to a file that already had a v2.4 tag, resulting in two tags in the same file and thus "disappearance" of the 2.4 tag (as the 2.3 tag is written first, and there is no mechanism in 2.3 for chaining tags). | Pyt |
| v2.3 | Audiograbber | Invalid language code | The Audiograbber sets the Language Code field ID3v2.3 frames to "XXX", which is not one of the standard values. If a language is unknown or undefined, the Language Code should be left blank. |  |
| v2.4 | [iTunes](https://id3.org/iTunes) | Ignore frames after PRIV frames | iTunes does not like PRIV frames and will just ignore them and any frames that follow so if they are at the start of the Tag it reads no data, this is unrelated to whether or not the frames are unsynchronised. | [PaulTaylor](https://id3.org/PaulTaylor) |
| v2.4 | Windows Media Player | Reads/Write MOOD as PRIV frame | Created as PRIV frame with key WM/Mood instead of using the TMOO frame | [PaulTaylor](https://id3.org/PaulTaylor) |
| v2.3 | Windows 7 | Doesnt like Unsynchronized UTF16 fields | Displays them as if they were encoded as ASCII (ok on WIndows Vista) | [PaulTaylor](https://id3.org/PaulTaylor) |

Compliance Issues (last edited 2013-12-05 21:50:04 by [DanONeill](https://id3.org/DanONeill "DanONeill @ 127.0.0.1[127.0.0.1]"))

[Copyright](https://id3.org/Copyright) © 1998-2024 by their respective owners

* [MoinMoin Powered](http://moinmo.in/ "This site uses the MoinMoin Wiki software.")
* [Python Powered](http://moinmo.in/Python "MoinMoin is written in Python.")
* [GPL licensed](http://moinmo.in/GPL "MoinMoin is GPL licensed.")
* [Valid HTML 4.01](http://validator.w3.org/check?uri=referer "Click here to validate this page.")
