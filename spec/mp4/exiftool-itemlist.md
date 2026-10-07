# exiftool-itemlist.txt

The original file, unchanged, converted from `exiftool-itemlist.txt`.

```text
name='ItemList'>QuickTime ItemList Tags
This is the preferred location for creating new QuickTime tags.  Tags in
this table support alternate languages which are accessed by adding a
3-character ISO 639-2 language code and an optional ISO 3166-1 alpha 2
country code to the tag name (eg. "ItemList:Title-fra" or
"ItemList::Title-fra-FR").  When creating a new Meta box to contain the
ItemList directory, by default ExifTool adds an 'mdir' (Metadata) Handler
box because Apple software may ignore ItemList tags otherwise, but the API
QuickTimeHandler option may be set to 0 to avoid this.



Tag IDTag Name
WritableValues / Notes

'----'
iTunesInfo
-
--> QuickTime iTunesInfo Tags

'@PST'
ParentShortTitle
string
 

'@ppi'
ParentProductID
string
 

'@pti'
ParentTitle
string
 

'@sti'
ShortTitle
string
 

'AACR'
Unknown_AACR?
string
 

'CDEK'
Unknown_CDEK?
string
 

'CDET'
Unknown_CDET?
string
 

'GUID'
GUID
string
 

'VERS'
ProductVersion
string
 

'aART'
AlbumArtist
string
 

'akID'
AppleStoreAccountType
int8s
0 = iTunes
  1 = AOL

'albm'
Album
string/
 

'apID'
AppleStoreAccount
string
 

'atID'
ArtistID
int32s
 

'auth'
Author
string
 

'catg'
Category
string
 

'cmID'
ComposerID
string
 

'cnID'
AppleStoreCatalogID
int32s
 

'covr'
CoverArt
string
 

'cpil'
Compilation
int8s
0 = No
  1 = Yes

'cprt'
Copyright
<td clas

'----' | iTunesInfo | - | --> QuickTime iTunesInfo Tags
'@PST' | ParentShortTitle | string | 
'@ppi' | ParentProductID | string | 
'@pti' | ParentTitle | string | 
'@sti' | ShortTitle | string | 
'AACR' | Unknown_AACR? | string | 
'CDEK' | Unknown_CDEK? | string | 
'CDET' | Unknown_CDET? | string | 
'GUID' | GUID | string | 
'VERS' | ProductVersion | string | 
'aART' | AlbumArtist | string | 
'akID' | AppleStoreAccountType | int8s | 0 = iTunes 1 = AOL
'albm' | Album | string/ | 
'apID' | AppleStoreAccount | string | 
'atID' | ArtistID | int32s | 
'auth' | Author | string | 
'catg' | Category | string | 
'cmID' | ComposerID | string | 
'cnID' | AppleStoreCatalogID | int32s | 
'covr' | CoverArt | string | 
'cpil' | Compilation | int8s | 0 = No 1 = Yes
'cprt' | Copyright | string | 
'desc' | Description | string/ | 
'disk' | DiskNumber | undef | 
'dscp' | Description | string/ | 
'egid' | EpisodeGlobalUniqueID | string | 
'geID' | GenreID | int32s | --> QuickTime GenreID Values
'gnre' | Genre | undef/ | 
'grup' | Grouping | string/ | 
'gshh' | GoogleHostHeader | string | 
'gspm' | GooglePingMessage | string | 
'gspu' | GooglePingURL | string | 
'gssd' | GoogleSourceData | string | 
'gsst' | GoogleStartTime | string | 
'gstd' | GoogleTrackDuration | string | 
'hdvd' | HDVideo | int8s | 0 = No 1 = Yes
'itnu' | iTunesU | int8s | 0 = No 1 = Yes
'keyw' | Keyword | string | 
'ldes' | LongDescription | string | 
'ownr' | Owner | string | 
'pcst' | Podcast | int8s | 0 = No 1 = Yes
'perf' | Performer | string | 
'pgap' | PlayGap | int8s | 0 = Insert Gap 1 = No Gap
'plID' | AlbumID | int32s[2] | 
'prID' | ProductID | string | 
'purd' | PurchaseDate | string | 
'purl' | PodcastURL | string | 
'rate' | RatingPercent | string | 
'rldt' | ReleaseDate | string | 
'rtng' | Rating | int8s | 0 = none 1 = Explicit 2 = Clean 4 = Explicit (old)
'sdes' | StoreDescription | string | 
'sfID' | AppleStoreCountry | int32s | --> QuickTime AppleStoreCountry Values
'shwm' | ShowMovement | int8s | 0 = No 1 = Yes
'snal' | PreviewImage | string | 
'soaa' | SortAlbumArtist | string | 
'soal' | SortAlbum | string | 
'soar' | SortArtist | string | 
'soco' | SortComposer | string | 
'sonm' | SortName | string | 
'sosn' | SortShow | string | 
'stik' | MediaType | int8s | 0 = Movie (old) 1 = Normal (Music) 2 = Audiobook 5 = Whacked Bookmark 6 = Music Video 9 = Movie |  | 10 = TV Show 11 = Booklet 14 = Ringtone 21 = Podcast 23 = iTunes U
'titl' | Title | string/ | 
'tmpo' | BeatsPerMinute | int16s | 
'tnal' | ThumbnailImage | string | 
'trkn' | TrackNumber | undef | 
'tven' | TVEpisodeID | string | 
'tves' | TVEpisode | int32s | 
'tvnn' | TVNetworkName | string | 
'tvsh' | TVShow | string | 
'tvsn' | TVSeason | int32u | 
'xid ' | ISRC | string | 
'yrrc' | Year | string | 
"©ART" | Artist | string | 
"©alb" | Album | string | 
"©ard" | ArtDirector | string | 
"©arg" | Arranger | string | 
"©aut" | Author | string/ | 
"©cmt" | Comment | string | 
"©com" | Composer | string/ | 
"©con" | Conductor | string | 
"©cpy" | Copyright | string/ | 
"©day" | ContentCreateDate | string | 
"©des" | Description | string | 
"©dir" | Director | string | 
"©enc" | EncodedBy | string | 
"©gen" | Genre | string | 
"©grp" | Grouping | string | 
"©lyr" | Lyrics | string | 
"©mvc" | MovementCount | int16s | 
"©mvi" | MovementNumber | int16s | 
"©mvn" | MovementName | string | 
"©nam" | Title | string | 
"©nrt" | Narrator | string | 
"©ope" | OriginalArtist | string | 
"©prd" | Producer | string | 
"©pub" | Publisher | string | 
"©sne" | SoundEngineer | string | 
"©sol" | Soloist | string | 
"©st3" | Subtitle | string | 
"©too" | Encoder | string | 
"©trk" | Track | string | 
"©wrk" | Work | string | 
"©wrt" | Composer | string | 
"©xpd" | ExecutiveProducer | string | 
"©xyz" | GPSCoordinates | string |
```
