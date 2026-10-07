# picard-id3-mp4-mapping.txt

The original file, unchanged, converted from `picard-id3-mp4-mapping.txt`.

```text
AcoustID | TXXX:Acoustid Id | ----:com.apple.iTunes:Acoustid Id
AcoustID Fingerprint | TXXX:Acoustid Fingerprint | ----:com.apple.iTunes:Acoustid Fingerprint
Album | TALB | ©alb
Album Artist | TPE2 | aART
Album Artist Sort Order | TSO2 (Picard>=1.2) TXXX:ALBUMARTISTSORT (Picard<=1.1) | soaa
Album Sort Order :sup:`[4]` | TSOA | soal
Arranger | TIPL:arranger (ID3v2.4) IPLS:arranger (ID3v2.3) | n/a
Artist | TPE1 | ©ART
Artist Sort Order | TSOP | soar
Artists | TXXX:ARTISTS | ----:com.apple.iTunes:ARTISTS
ASIN | TXXX:ASIN | ----:com.apple.iTunes:ASIN
Barcode | TXXX:BARCODE | ----:com.apple.iTunes:BARCODE
BPM :sup:`[4]` | TBPM | tmpo
Catalog Number | TXXX:CATALOGNUMBER | ----:com.apple.iTunes:CATALOGNUMBER
Comment :sup:`[4]` | COMM:description | ©cmt
Compilation (iTunes) :sup:`[5]` | TCMP | cpil
Composer | TCOM | ©wrt
Composer Sort Order | TSOC (Picard>=1.3) TXXX:COMPOSERSORT (Picard<=1.2) | soco
Conductor | TPE3 | ----:com.apple.iTunes:CONDUCTOR
Copyright :sup:`[4]` | TCOP | cprt
Date :sup:`[10]` | TDRC (ID3v2.4) TYER + TDAT (ID3v2.3) | ©day
Director | TXXX:DIRECTOR | ©dir :sup:`[9]` 
Disc Number | TPOS | disk
Disc Subtitle | TSST (ID3v2.4 only) | ----:com.apple.iTunes:DISCSUBTITLE
Encoded By :sup:`[4]` | TENC | ©too
Encoder Settings :sup:`[4]` | TSSE | n/a
Engineer | TIPL:engineer (ID3v2.4) IPLS:engineer (ID3v2.3) | ----:com.apple.iTunes:ENGINEER
Gapless Playback :sup:`[4]` | n/a | pgap
Genre | TCON | ©gen
Grouping :sup:`[3]` | TIT1 GRP1 :sup:`[8]`  | ©grp
Initial Key | TKEY | ----:com.apple.iTunes:initialkey
ISRC | TSRC | ----:com.apple.iTunes:ISRC
Language | TLAN | ----:com.apple.iTunes:LANGUAGE
License :sup:`[6, 7]` | WCOP (single URL) TXXX:LICENSE (multiple or non-URL) | ----:com.apple.iTunes:LICENSE
Lyricist | TEXT | ----:com.apple.iTunes:LYRICIST
Lyrics :sup:`[4]` | USLT:description | ©lyr
Media | TMED | ----:com.apple.iTunes:MEDIA
Mix-DJ | TIPL:DJ-mix (ID3v2.4) IPLS:DJ-mix (ID3v2.3) | ----:com.apple.iTunes:DJMIXER
Mixer | TIPL:mix (ID3v2.4) IPLS:mix (ID3v2.3) | ----:com.apple.iTunes:MIXER
Mood :sup:`[3]` | TMOO (ID3v2.4 only) | ----:com.apple.iTunes:MOOD
Movement :sup:`[4]` | MVNM | ©mvn
Movement Count :sup:`[4]` | MVIN | mvc
Movement Number :sup:`[4]` | MVIN | mvi
MusicBrainz Artist ID | TXXX:MusicBrainz Artist Id | ----:com.apple.iTunes:MusicBrainz Artist Id
MusicBrainz Disc ID | TXXX:MusicBrainz Disc Id | ----:com.apple.iTunes:MusicBrainz Disc Id
MusicBrainz Original Artist ID | TXXX:MusicBrainz Original Artist Id | ----:com.apple.iTunes:MusicBrainz Original Artist Id (Picard>=2.1)
MusicBrainz Original Release ID | TXXX:MusicBrainz Original Album Id | ----:com.apple.iTunes:MusicBrainz Original Album Id (Picard>=2.1)
MusicBrainz Recording ID | UFID:http://musicbrainz.org | ----:com.apple.iTunes:MusicBrainz Track Id
MusicBrainz Release Artist ID | TXXX:MusicBrainz Album Artist Id | ----:com.apple.iTunes:MusicBrainz Album Artist Id
MusicBrainz Release Group ID | TXXX:MusicBrainz Release Group Id | ----:com.apple.iTunes:MusicBrainz Release Group Id
MusicBrainz Release ID | TXXX:MusicBrainz Album Id | ----:com.apple.iTunes:MusicBrainz Album Id
MusicBrainz Track ID | TXXX:MusicBrainz Release Track Id | ----:com.apple.iTunes:MusicBrainz Release Track Id
MusicBrainz TRM ID | TXXX:MusicBrainz TRM Id | ----:com.apple.iTunes:MusicBrainz TRM Id
MusicBrainz Work ID | TXXX:MusicBrainz Work Id | ----:com.apple.iTunes:MusicBrainz Work Id
MusicIP Fingerprint | TXXX:MusicMagic Fingerprint | ----:com.apple.iTunes:fingerprint
MusicIP PUID | TXXX:MusicIP PUID | ----:com.apple.iTunes:MusicIP PUID
Original Album | TOAL | n/a
Original Artist | TOPE | n/a
Original Filename | TOFN | n/a
Original Release Date :sup:`[1]` | TDOR (ID3v2.4) TORY (ID3v2.3) | n/a
Original Release Year :sup:`[1]` | n/a | n/a
Performer | TMCL:instrument (ID3v2.4) IPLS:instrument (ID3v2.3) | n/a
Podcast :sup:`[4]` | n/a | pcst
Podcast URL :sup:`[4]` | n/a | purl
Producer | TIPL:producer (ID3v2.4) IPLS:producer (ID3v2.3) | ----:com.apple.iTunes:PRODUCER
Rating | POPM | n/a
Record Label | TPUB | ----:com.apple.iTunes:LABEL
Release Country | TXXX:MusicBrainz Album Release Country | ----:com.apple.iTunes:MusicBrainz Album Release Country
Release Date :sup:`[10]` | TDRL (ID3v2.4) TXXX:RELEASEDATE (ID3v2.3) | ----:com.apple.iTunes:RELEASEDATE
Release Status | TXXX:MusicBrainz Album Status | ----:com.apple.iTunes:MusicBrainz Album Status
Release Type | TXXX:MusicBrainz Album Type | ----:com.apple.iTunes:MusicBrainz Album Type
Remixer | TPE4 | ----:com.apple.iTunes:REMIXER
ReplayGain Album Gain | TXXX:REPLAYGAIN_ALBUM_GAIN | ----:com.apple.iTunes:REPLAYGAIN_ALBUM_GAIN
ReplayGain Album Peak | TXXX:REPLAYGAIN_ALBUM_PEAK | ----:com.apple.iTunes:REPLAYGAIN_ALBUM_PEAK
ReplayGain Album Range | TXXX:REPLAYGAIN_ALBUM_RANGE | ----:com.apple.iTunes:REPLAYGAIN_ALBUM_RANGE
ReplayGain Reference Loudness | TXXX:REPLAYGAIN_REFERENCE_LOUDNESS | ----:com.apple.iTunes:REPLAYGAIN_REFERENCE_LOUDNESS
ReplayGain Track Gain | TXXX:REPLAYGAIN_TRACK_GAIN | ----:com.apple.iTunes:REPLAYGAIN_TRACK_GAIN
ReplayGain Track Peak | TXXX:REPLAYGAIN_TRACK_PEAK | ----:com.apple.iTunes:REPLAYGAIN_TRACK_PEAK
ReplayGain Track Range | TXXX:REPLAYGAIN_TRACK_RANGE | ----:com.apple.iTunes:REPLAYGAIN_TRACK_RANGE
Script | TXXX:SCRIPT | ----:com.apple.iTunes:SCRIPT
Show Name :sup:`[4]` | n/a | tvsh
Show Name Sort Order :sup:`[4]` | n/a | sosn
Show Work & Movement :sup:`[4]` | TXXX:SHOWMOVEMENT | shwm
Subtitle :sup:`[4]` | TIT3 | ----:com.apple.iTunes:SUBTITLE
Total Discs | TPOS | disk
Total Tracks | TRCK | trkn
Track Number | TRCK | trkn
Track Title | TIT2 | ©nam
Track Title Sort Order :sup:`[4]` | TSOT | sonm
Website (official artist website) | WOAR | n/a
Work Title | TXXX:WORK TIT1 :sup:`[8]`  | ©wrk (Picard>=2.1)
Writer :sup:`[2]` | TXXX:Writer (Picard>=1.3) | n/a
```
