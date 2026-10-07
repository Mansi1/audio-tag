## RIFF Tags

The RIFF container format is used various types of fines including AVI, WAV,
WEBP, LA, OFR, PAC and WV. According to the EXIF specification, Meta
information is embedded in two types of RIFF `LIST` chunks: `INFO` and
`exif`, and information about the audio content is stored in the `fmt`
chunk. As well as this information, some video information and proprietary
manufacturer-specific information is also extracted.

Large AVI videos may be a concatenation of two or more RIFF chunks. For
these files, information is extracted from subsequent RIFF chunks as
sub-documents, but the Duration is calculated for the full video.

ExifTool currently has the ability to write EXIF, XMP and ICC\_Profile
metadata to WEBP images, but can't yet write to other RIFF-based formats.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'ALPH' | ALPH | - | --> [RIFF ALPH Tags](https://exiftool.org/TagNames/RIFF.html#ALPH) | | 'ANIM' | ANIM | - | --> [RIFF ANIM Tags](https://exiftool.org/TagNames/RIFF.html#ANIM) | | 'ANMF' | ANMF | - | --> [RIFF ANMF Tags](https://exiftool.org/TagNames/RIFF.html#ANMF) | | 'C2PA' | JUMBF | - | --> [Jpeg2000 Tags](https://exiftool.org/TagNames/Jpeg2000.html) | | 'CSET' | CharacterSet | - | --> [RIFF CSET Tags](https://exiftool.org/TagNames/RIFF.html#CSET) | | 'EXIF' | EXIF  UnknownEXIF | - no | (WebP files)  --> [EXIF Tags](https://exiftool.org/TagNames/EXIF.html)  --> [EXIF Tags](https://exiftool.org/TagNames/EXIF.html) | | 'ICCP' | ICC\_Profile | - | --> [ICC\_Profile Tags](https://exiftool.org/TagNames/ICC_Profile.html)  (WebP files) | | 'ID3 ' | ID3-2 | - | --> [ID3 Tags](https://exiftool.org/TagNames/ID3.html) | | 'IDIT' | DateTimeOriginal | no |  | | 'JUNK' | OlympusJunk  CasioJunk  RicohJunk  PentaxJunk  PentaxJunk2  LucasJunk  TextJunk | - - - - - - no | --> [Olympus AVI Tags](https://exiftool.org/TagNames/Olympus.html#AVI)  --> [EXIF Tags](https://exiftool.org/TagNames/EXIF.html)  --> [Ricoh AVI Tags](https://exiftool.org/TagNames/Ricoh.html#AVI)  --> [Pentax Junk Tags](https://exiftool.org/TagNames/Pentax.html#Junk)  --> [Pentax Junk2 Tags](https://exiftool.org/TagNames/Pentax.html#Junk2)  --> [QuickTime Stream Tags](https://exiftool.org/TagNames/QuickTime.html#Stream) | | 'JUNQ' | OldXMP | no |  | | 'LIST\_INF0' | Info | - | --> [RIFF Info Tags](https://exiftool.org/TagNames/RIFF.html#Info) | | 'LIST\_INFO' | Info | - | --> [RIFF Info Tags](https://exiftool.org/TagNames/RIFF.html#Info) | | 'LIST\_Tdat' | Tdat | - | --> [RIFF Tdat Tags](https://exiftool.org/TagNames/RIFF.html#Tdat) | | 'LIST\_adtl' | AssociatedDataList | - | --> [RIFF Tags](https://exiftool.org/TagNames/RIFF.html) | | 'LIST\_exif' | Exif | - | --> [RIFF Exif Tags](https://exiftool.org/TagNames/RIFF.html#Exif) | | 'LIST\_hdrl' | Hdrl | - | --> [RIFF Hdrl Tags](https://exiftool.org/TagNames/RIFF.html#Hdrl) | | 'LIST\_hydt' | PentaxData | - | --> [Pentax AVI Tags](https://exiftool.org/TagNames/Pentax.html#AVI) | | 'LIST\_ncdt' | NikonData | - | --> [Nikon AVI Tags](https://exiftool.org/TagNames/Nikon.html#AVI) | | 'LIST\_pntx' | PentaxData2 | - | --> [Pentax AVI Tags](https://exiftool.org/TagNames/Pentax.html#AVI) | | 'SEAL' | SEAL | - | --> [XMP SEAL Tags](https://exiftool.org/TagNames/XMP.html#SEAL) | | 'SGLT' | BikeBroAccel | - | --> [QuickTime Stream Tags](https://exiftool.org/TagNames/QuickTime.html#Stream) | | 'SLLT' | BikeBroGPS | - | --> [QuickTime Stream Tags](https://exiftool.org/TagNames/QuickTime.html#Stream) | | 'VP8 ' | VP8Bitstream | - | --> [RIFF VP8 Tags](https://exiftool.org/TagNames/RIFF.html#VP8) | | 'VP8L' | VP8L | - | --> [RIFF VP8L Tags](https://exiftool.org/TagNames/RIFF.html#VP8L) | | 'VP8X' | VP8X | - | --> [RIFF VP8X Tags](https://exiftool.org/TagNames/RIFF.html#VP8X) | | "XMP\0" | XMP | - | --> [XMP Tags](https://exiftool.org/TagNames/XMP.html)  (incorrectly written WebP files) | | 'XMP ' | XMP | - | --> [XMP Tags](https://exiftool.org/TagNames/XMP.html)  (WebP files) | | '\_PMX' | XMP | - | --> [XMP Tags](https://exiftool.org/TagNames/XMP.html)  (AVI and WAV files) | | 'aXML' | AXML | - | --> [XMP XML Tags](https://exiftool.org/TagNames/XMP.html#XML) | | 'acid' | Acidizer | - | --> [RIFF Acidizer Tags](https://exiftool.org/TagNames/RIFF.html#Acidizer) | | 'afsp' | Afsp | no |  | | 'bext' | BroadcastExtension | - | --> [RIFF BroadcastExt Tags](https://exiftool.org/TagNames/RIFF.html#BroadcastExt) | | 'cue ' | CuePoints | no | (config\_files/cutepointlist.config from full distribution will decode this and generate a list of cue points with labels) | | 'ds64' | DataSize64 | - | --> [RIFF DS64 Tags](https://exiftool.org/TagNames/RIFF.html#DS64) | | 'fact' | NumberOfSamples | no |  | | 'fmt ' | AudioFormat | - | --> [RIFF AudioFormat Tags](https://exiftool.org/TagNames/RIFF.html#AudioFormat) | | 'gps0' | GPSTrack | - | --> [QuickTime Stream Tags](https://exiftool.org/TagNames/QuickTime.html#Stream) | | 'gsen' | GSensor | - | --> [QuickTime Stream Tags](https://exiftool.org/TagNames/QuickTime.html#Stream) | | 'guan' | Guano | no |  | | 'iXML' | IXML | - | --> [XMP XML Tags](https://exiftool.org/TagNames/XMP.html#XML) | | 'id3 ' | ID3 | - | --> [ID3 Tags](https://exiftool.org/TagNames/ID3.html) | | 'inst' | Instrument | - | --> [RIFF Instrument Tags](https://exiftool.org/TagNames/RIFF.html#Instrument) | | 'labl' | CuePointLabel | no |  | | 'list' | ListType | no |  | | 'ltxt' | LabeledText | no | (CuePointID Length Purpose Country Language Dialect Codepage Text) | | 'note' | CuePointNote | no |  | | 'olym' | Olym | - | --> [Olympus WAV Tags](https://exiftool.org/TagNames/Olympus.html#WAV) | | 'plst' | Playlist | no |  | | 'smpl' | Sampler | - | --> [RIFF Sampler Tags](https://exiftool.org/TagNames/RIFF.html#Sampler) | | 'tx\_USER' | UserText | - | --> [RIFF UserText Tags](https://exiftool.org/TagNames/RIFF.html#UserText) | | 'tx\_Unknown' | Text | no | (streamed text, extracted when the ExtractEmbedded option is used) | |

## RIFF ALPH Tags

WebP alpha chunk.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | AlphaPreprocessing | no | [val & 0x3]  0 = none  1 = Level Reduction | | 0.1 | AlphaFiltering | no | [val & 0x3]  0 = none  1 = Horizontal  2 = Vertical  3 = Gradient | | 0.2 | AlphaCompression | no | [val & 0x3]  0 = none  1 = Lossless | |

## RIFF ANIM Tags

WebP animation chunk.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | BackgroundColor | no |  | | 4 | AnimationLoopCount | no |  | |

## RIFF ANMF Tags

WebP animation frame chunk.

> |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 12 | Duration | no | (extracted as the sum of durations of all animation frames) | |

## RIFF CSET Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index2 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | CodePage | no |  | | 1 | CountryCode | no |  | | 2 | LanguageCode | no |  | | 3 | Dialect | no |  | |

## RIFF Info Tags

RIFF INFO tags found in AVI video and WAV audio files. Tags which are part
of the EXIF 2.3 specification have an underlined Tag Name in the HTML
version of this documentation. Other tags are found in AVI files generated
by some software.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'AGES' | Rated | no |  | | 'CMNT' | Comment | no |  | | 'CODE' | EncodedBy | no |  | | 'COMM' | Comments | no |  | | 'DIRC' | Directory | no |  | | 'DISP' | SoundSchemeTitle | no |  | | 'DTIM' | DateTimeOriginal | no |  | | 'GENR' | Genre | no |  | | 'IARL' | <u>ArchivalLocation</u> | no |  | | 'IART' | <u>Artist</u> | no |  | | 'IAS1' | FirstLanguage | no |  | | 'IAS2' | SecondLanguage | no |  | | 'IAS3' | ThirdLanguage | no |  | | 'IAS4' | FourthLanguage | no |  | | 'IAS5' | FifthLanguage | no |  | | 'IAS6' | SixthLanguage | no |  | | 'IAS7' | SeventhLanguage | no |  | | 'IAS8' | EighthLanguage | no |  | | 'IAS9' | NinthLanguage | no |  | | 'IBSU' | BaseURL | no |  | | 'ICAS' | DefaultAudioStream | no |  | | 'ICDS' | CostumeDesigner | no |  | | 'ICMS' | <u>Commissioned</u> | no |  | | 'ICMT' | <u>Comment</u> | no |  | | 'ICNM' | Cinematographer | no |  | | 'ICNT' | Country | no |  | | 'ICOP' | <u>Copyright</u> | no |  | | 'ICRD' | <u>DateCreated</u> | no |  | | 'ICRP' | <u>Cropped</u> | no |  | | 'IDIM' | <u>Dimensions</u> | no |  | | 'IDIT' | DateTimeOriginal | no |  | | 'IDPI' | <u>DotsPerInch</u> | no |  | | 'IDST' | DistributedBy | no |  | | 'IEDT' | EditedBy | no |  | | 'IENC' | EncodedBy | no |  | | 'IENG' | <u>Engineer</u> | no |  | | 'IGNR' | <u>Genre</u> | no |  | | 'IKEY' | <u>Keywords</u> | no |  | | 'ILGT' | <u>Lightness</u> | no |  | | 'ILGU' | LogoURL | no |  | | 'ILIU' | LogoIconURL | no |  | | 'ILNG' | Language | no |  | | 'IMBI' | MoreInfoBannerImage | no |  | | 'IMBU' | MoreInfoBannerURL | no |  | | 'IMED' | <u>Medium</u> | no |  | | 'IMIT' | MoreInfoText | no |  | | 'IMIU' | MoreInfoURL | no |  | | 'IMUS' | MusicBy | no |  | | 'INAM' | <u>Title</u> | no |  | | 'IPDS' | ProductionDesigner | no |  | | 'IPLT' | <u>NumColors</u> | no |  | | 'IPRD' | <u>Product</u> | no |  | | 'IPRO' | ProducedBy | no |  | | 'IRIP' | RippedBy | no |  | | 'IRTD' | Rating | no |  | | 'ISBJ' | <u>Subject</u> | no |  | | 'ISFT' | <u>Software</u> | no |  | | 'ISGN' | SecondaryGenre | no |  | | 'ISHP' | <u>Sharpness</u> | no |  | | 'ISMP' | TimeCode | no |  | | 'ISRC' | <u>Source</u> | no |  | | 'ISRF' | <u>SourceForm</u> | no |  | | 'ISTD' | ProductionStudio | no |  | | 'ISTR' | Starring | no |  | | 'ITCH' | <u>Technician</u> | no |  | | 'ITRK' | TrackNumber | no |  | | 'IWMU' | WatermarkURL | no |  | | 'IWRI' | WrittenBy | no |  | | 'LANG' | Language | no |  | | 'LOCA' | Location | no |  | | 'PRT1' | Part | no |  | | 'PRT2' | NumberOfParts | no |  | | 'RATE' | Rate | no |  | | 'STAR' | Starring | no |  | | 'STAT' | Statistics | no | [Value 3]  0 = Bad  1 = OK | | 'TAPE' | TapeName | no |  | | 'TCDO' | EndTimecode | no |  | | 'TCOD' | StartTimecode | no |  | | 'TITL' | Title | no |  | | 'TLEN' | Length | no |  | | 'TORG' | Organization | no |  | | 'TRCK' | TrackNumber | no |  | | 'TURL' | URL | no |  | | 'TVER' | Version | no |  | | 'VMAJ' | VegasVersionMajor | no |  | | 'VMIN' | VegasVersionMinor | no |  | | 'YEAR' | Year | no |  | |

## RIFF Tdat Tags

> |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | *[no tags known]* | | | | |

## RIFF Exif Tags

These tags are part of the EXIF 2.3 specification for WAV audio files.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'ecor' | Make | no |  | | 'emdl' | Model | no |  | | 'emnt' | MakerNotes | no |  | | 'erel' | RelatedImageFile | no |  | | 'etim' | TimeCreated | no |  | | 'eucm' | UserComment | no |  | | 'ever' | ExifVersion | no |  | |

## RIFF Hdrl Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'IDIT' | DateTimeOriginal | no |  | | 'ISMP' | TimeCode | no |  | | 'LIST\_odml' | OpenDML | - | --> [RIFF OpenDML Tags](https://exiftool.org/TagNames/RIFF.html#OpenDML) | | 'LIST\_strl' | Stream | - | --> [RIFF Stream Tags](https://exiftool.org/TagNames/RIFF.html#Stream) | | 'avih' | AVIHeader | - | --> [RIFF AVIHeader Tags](https://exiftool.org/TagNames/RIFF.html#AVIHeader) | |

## RIFF OpenDML Tags

> |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'dmlh' | ExtendedAVIHeader | - | --> [RIFF ExtAVIHdr Tags](https://exiftool.org/TagNames/RIFF.html#ExtAVIHdr) | |

## RIFF ExtAVIHdr Tags

> |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index4 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | TotalFrameCount | no |  | |

## RIFF Stream Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'strd' | StreamData | - | --> [RIFF StreamData Tags](https://exiftool.org/TagNames/RIFF.html#StreamData) | | 'strf' | AudioFormat  VideoFormat | - - | --> [RIFF AudioFormat Tags](https://exiftool.org/TagNames/RIFF.html#AudioFormat)  --> [BMP Tags](https://exiftool.org/TagNames/BMP.html) | | 'strh' | StreamHeader | - | --> [RIFF StreamHeader Tags](https://exiftool.org/TagNames/RIFF.html#StreamHeader) | | 'strn' | StreamName | no |  | |

## RIFF StreamData Tags

This chunk is used to store proprietary information in AVI videos from some
cameras. The first 4 characters of the data are used as the Tag ID below.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Tag ID | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 'AVIF' | AVIF | - | --> [EXIF Tags](https://exiftool.org/TagNames/EXIF.html) | | 'CASI' | CasioData | - | --> [Casio AVI Tags](https://exiftool.org/TagNames/Casio.html#AVI) | | 'Zora' | VendorName | no |  | | 'unknown' | UnknownData | no |  | |

## RIFF AudioFormat Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index2 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | Encoding | no | --> [RIFF AudioEncoding Values](https://exiftool.org/TagNames/RIFF.html#AudioEncoding) | | 1 | NumChannels | no |  | | 2 | SampleRate | no |  | | 4 | AvgBytesPerSec | no |  | | 7 | BitsPerSample | no |  | |

## RIFF AudioEncoding Values

These "TwoCC" audio encoding codes are used in RIFF and ASF files.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Value | AudioEncoding | | --- | --- | | 0x1 | = Microsoft PCM | | 0x2 | = Microsoft ADPCM | | 0x3 | = Microsoft IEEE float | | 0x4 | = Compaq VSELP | | 0x5 | = IBM CVSD | | 0x6 | = Microsoft a-Law | | 0x7 | = Microsoft u-Law | | 0x8 | = Microsoft DTS | | 0x9 | = DRM | | 0xa | = WMA 9 Speech | | 0xb | = Microsoft Windows Media RT Voice | | 0x10 | = OKI-ADPCM | | 0x11 | = Intel IMA/DVI-ADPCM | | 0x12 | = Videologic Mediaspace ADPCM | | 0x13 | = Sierra ADPCM | | 0x14 | = Antex G.723 ADPCM | | 0x15 | = DSP Solutions DIGISTD | | 0x16 | = DSP Solutions DIGIFIX | | 0x17 | = Dialoic OKI ADPCM | | 0x18 | = Media Vision ADPCM | | 0x19 | = HP CU | | 0x1a | = HP Dynamic Voice | | 0x20 | = Yamaha ADPCM | | 0x21 | = SONARC Speech Compression | | 0x22 | = DSP Group True Speech | | 0x23 | = Echo Speech Corp. | | 0x24 | = Virtual Music Audiofile AF36 | | 0x25 | = Audio Processing Tech. | | 0x26 | = Virtual Music Audiofile AF10 | | 0x27 | = Aculab Prosody 1612 | | 0x28 | = Merging Tech. LRC | | 0x30 | = Dolby AC2 | | 0x31 | = Microsoft GSM610 | | 0x32 | = MSN Audio | | 0x33 | = Antex ADPCME | | 0x34 | = Control Resources VQLPC | | 0x35 | = DSP Solutions DIGIREAL | | 0x36 | = DSP Solutions DIGIADPCM | | 0x37 | = Control Resources CR10 | | 0x38 | = Natural MicroSystems VBX ADPCM | | 0x39 | = Crystal Semiconductor IMA ADPCM | | 0x3a | = Echo Speech ECHOSC3 | | 0x3b | = Rockwell ADPCM | | 0x3c | = Rockwell DIGITALK | | 0x3d | = Xebec Multimedia | | 0x40 | = Antex G.721 ADPCM | | 0x41 | = Antex G.728 CELP | | 0x42 | = Microsoft MSG723 | | 0x43 | = IBM AVC ADPCM | | 0x45 | = ITU-T G.726 | | 0x50 | = Microsoft MPEG | | 0x51 | = RT23 or PAC | | 0x52 | = InSoft RT24 | | 0x53 | = InSoft PAC | | 0x55 | = MP3 | | 0x59 | = Cirrus | | 0x60 | = Cirrus Logic | | 0x61 | = ESS Tech. PCM | | 0x62 | = Voxware Inc. | | 0x63 | = Canopus ATRAC | | 0x64 | = APICOM G.726 ADPCM | | 0x65 | = APICOM G.722 ADPCM | | 0x66 | = Microsoft DSAT | | 0x67 | = Microsoft DSAT DISPLAY | | 0x69 | = Voxware Byte Aligned | | 0x70 | = Voxware AC8 | | 0x71 | = Voxware AC10 | | 0x72 | = Voxware AC16 | | 0x73 | = Voxware AC20 | | 0x74 | = Voxware MetaVoice | | 0x75 | = Voxware MetaSound | | 0x76 | = Voxware RT29HW | | 0x77 | = Voxware VR12 | | 0x78 | = Voxware VR18 | | 0x79 | = Voxware TQ40 | | 0x7a | = Voxware SC3 | | 0x7b | = Voxware SC3 | | 0x80 | = Soundsoft | | 0x81 | = Voxware TQ60 | | 0x82 | = Microsoft MSRT24 | | 0x83 | = AT&T G.729A | | 0x84 | = Motion Pixels MVI MV12 | | 0x85 | = DataFusion G.726 | | 0x86 | = DataFusion GSM610 | | 0x88 | = Iterated Systems Audio | | 0x89 | = Onlive | | 0x8a | = Multitude, Inc. FT SX20 | | 0x8b | = Infocom ITS A/S G.721 ADPCM | | 0x8c | = Convedia G729 | | 0x8d | = Not specified congruency, Inc. | | 0x91 | = Siemens SBC24 | | 0x92 | = Sonic Foundry Dolby AC3 APDIF | | 0x93 | = MediaSonic G.723 | | 0x94 | = Aculab Prosody 8kbps | | 0x97 | = ZyXEL ADPCM | | 0x98 | = Philips LPCBB | | 0x99 | = Studer Professional Audio Packed | | 0xa0 | = Malden PhonyTalk | | 0xa1 | = Racal Recorder GSM | | 0xa2 | = Racal Recorder G720.a | | 0xa3 | = Racal G723.1 | | 0xa4 | = Racal Tetra ACELP | | 0xb0 | = NEC AAC NEC Corporation | | 0xff | = AAC | | 0x100 | = Rhetorex ADPCM | | 0x101 | = IBM u-Law | | 0x102 | = IBM a-Law | | 0x103 | = IBM ADPCM | | 0x111 | = Vivo G.723 | | 0x112 | = Vivo Siren | | 0x120 | = Philips Speech Processing CELP | | 0x121 | = Philips Speech Processing GRUNDIG | | 0x123 | = Digital G.723 | | 0x125 | = Sanyo LD ADPCM | | 0x130 | = Sipro Lab ACEPLNET | | 0x131 | = Sipro Lab ACELP4800 | | 0x132 | = Sipro Lab ACELP8V3 | | 0x133 | = Sipro Lab G.729 | | 0x134 | = Sipro Lab G.729A | | 0x135 | = Sipro Lab Kelvin | | 0x136 | = VoiceAge AMR | | 0x140 | = Dictaphone G.726 ADPCM | | 0x150 | = Qualcomm PureVoice | | 0x151 | = Qualcomm HalfRate | | 0x155 | = Ring Zero Systems TUBGSM | | 0x160 | = Microsoft Audio1 | | 0x161 | = Windows Media Audio V2 V7 V8 V9 / DivX audio (WMA) / Alex AC3 Audio | | 0x162 | = Windows Media Audio Professional V9 | | 0x163 | = Windows Media Audio Lossless V9 | | 0x164 | = WMA Pro over S/PDIF | | 0x170 | = UNISYS NAP ADPCM | | 0x171 | = UNISYS NAP ULAW | | 0x172 | = UNISYS NAP ALAW | | 0x173 | = UNISYS NAP 16K | | 0x174 | = MM SYCOM ACM SYC008 SyCom Technologies | | 0x175 | = MM SYCOM ACM SYC701 G726L SyCom Technologies | | 0x176 | = MM SYCOM ACM SYC701 CELP54 SyCom Technologies | | 0x177 | = MM SYCOM ACM SYC701 CELP68 SyCom Technologies | | 0x178 | = Knowledge Adventure ADPCM | | 0x180 | = Fraunhofer IIS MPEG2AAC | | 0x190 | = Digital Theater Systems DTS DS | | 0x200 | = Creative Labs ADPCM | | 0x202 | = Creative Labs FASTSPEECH8 | | 0x203 | = Creative Labs FASTSPEECH10 | | 0x210 | = UHER ADPCM | | 0x215 | = Ulead DV ACM | | 0x216 | = Ulead DV ACM | | 0x220 | = Quarterdeck Corp. | | 0x230 | = I-Link VC | | 0x240 | = Aureal Semiconductor Raw Sport | | 0x241 | = ESST AC3 | | 0x250 | = Interactive Products HSX | | 0x251 | = Interactive Products RPELP | | 0x260 | = Consistent CS2 | | 0x270 | = Sony SCX | | 0x271 | = Sony SCY | | 0x272 | = Sony ATRAC3 | | 0x273 | = Sony SPC | | 0x280 | = TELUM Telum Inc. | | 0x281 | = TELUMIA Telum Inc. | | 0x285 | = Norcom Voice Systems ADPCM | | 0x300 | = Fujitsu FM TOWNS SND | | 0x301 | = Fujitsu (not specified) | | 0x302 | = Fujitsu (not specified) | | 0x303 | = Fujitsu (not specified) | | 0x304 | = Fujitsu (not specified) | | 0x305 | = Fujitsu (not specified) | | 0x306 | = Fujitsu (not specified) | | 0x307 | = Fujitsu (not specified) | | 0x308 | = Fujitsu (not specified) | | 0x350 | = Micronas Semiconductors, Inc. Development | | 0x351 | = Micronas Semiconductors, Inc. CELP833 | | 0x400 | = Brooktree Digital | | 0x401 | = Intel Music Coder (IMC) | | 0x402 | = Ligos Indeo Audio | | 0x450 | = QDesign Music | | 0x500 | = On2 VP7 On2 Technologies | | 0x501 | = On2 VP6 On2 Technologies | | 0x680 | = AT&T VME VMPCM | | 0x681 | = AT&T TCP | | 0x700 | = YMPEG Alpha (dummy for MPEG-2 compressor) | | 0x8ae | = ClearJump LiteWave (lossless) | | 0x1000 | = Olivetti GSM | | 0x1001 | = Olivetti ADPCM | | 0x1002 | = Olivetti CELP | | 0x1003 | = Olivetti SBC | | 0x1004 | = Olivetti OPR | | 0x1100 | = Lernout & Hauspie | | 0x1101 | = Lernout & Hauspie CELP codec | | 0x1102 | = Lernout & Hauspie SBC codec | | 0x1103 | = Lernout & Hauspie SBC codec | | 0x1104 | = Lernout & Hauspie SBC codec | | 0x1400 | = Norris Comm. Inc. | | 0x1401 | = ISIAudio | | 0x1500 | = AT&T Soundspace Music Compression | | 0x181c | = VoxWare RT24 speech codec | | 0x181e | = Lucent elemedia AX24000P Music codec | | 0x1971 | = Sonic Foundry LOSSLESS | | 0x1979 | = Innings Telecom Inc. ADPCM | | 0x1c07 | = Lucent SX8300P speech codec | | 0x1c0c | = Lucent SX5363S G.723 compliant codec | | 0x1f03 | = CUseeMe DigiTalk (ex-Rocwell) | | 0x1fc4 | = NCT Soft ALF2CD ACM | | 0x2000 | = FAST Multimedia DVM | | 0x2001 | = Dolby DTS (Digital Theater System) | | 0x2002 | = RealAudio 1 / 2 14.4 | | 0x2003 | = RealAudio 1 / 2 28.8 | | 0x2004 | = RealAudio G2 / 8 Cook (low bitrate) | | 0x2005 | = RealAudio 3 / 4 / 5 Music (DNET) | | 0x2006 | = RealAudio 10 AAC (RAAC) | | 0x2007 | = RealAudio 10 AAC+ (RACP) | | 0x2500 | = Reserved range to 0x2600 Microsoft | | 0x3313 | = makeAVIS (ffvfw fake AVI sound from AviSynth scripts) | | 0x4143 | = Divio MPEG-4 AAC audio | | 0x4201 | = Nokia adaptive multirate | | 0x4243 | = Divio G726 Divio, Inc. | | 0x434c | = LEAD Speech | | 0x564c | = LEAD Vorbis | | 0x5756 | = WavPack Audio | | 0x674f | = Ogg Vorbis (mode 1) | | 0x6750 | = Ogg Vorbis (mode 2) | | 0x6751 | = Ogg Vorbis (mode 3) | | 0x676f | = Ogg Vorbis (mode 1+) | | 0x6770 | = Ogg Vorbis (mode 2+) | | 0x6771 | = Ogg Vorbis (mode 3+) | | 0x7000 | = 3COM NBX 3Com Corporation | | 0x706d | = FAAD AAC | | 0x7a21 | = GSM-AMR (CBR, no SID) | | 0x7a22 | = GSM-AMR (VBR, including SID) | | 0xa100 | = Comverse Infosys Ltd. G723 1 | | 0xa101 | = Comverse Infosys Ltd. AVQSBC | | 0xa102 | = Comverse Infosys Ltd. OLDSBC | | 0xa103 | = Symbol Technologies G729A | | 0xa104 | = VoiceAge AMR WB VoiceAge Corporation | | 0xa105 | = Ingenient Technologies Inc. G726 | | 0xa106 | = ISO/MPEG-4 advanced audio Coding | | 0xa107 | = Encore Software Ltd G726 | | 0xa109 | = Speex ACM Codec xiph.org | | 0xdfac | = DebugMode SonicFoundry Vegas FrameServer ACM Codec | | 0xe708 | = Unknown - | | 0xf1ac | = Free Lossless Audio Codec FLAC | | 0xfffe | = Extensible | | 0xffff | = Development | |

## RIFF StreamHeader Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index4 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | StreamType | no | 'auds' = Audio  'iavs' = Interleaved Audio+Video  'mids' = MIDI  'txts' = Text  'vids' = Video | | 1 | AudioCodec  VideoCodec  Codec | no no no |  | | 5 | AudioSampleRate  VideoFrameRate  StreamSampleRate | no no no |  | | 8 | AudioSampleCount  VideoFrameCount  StreamSampleCount | no no no |  | | 10 | Quality | no |  | | 11 | SampleSize | no |  | |

## RIFF AVIHeader Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index4 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | FrameRate | no |  | | 1 | MaxDataRate | no | (converted using SI byte prefixes unles the API ByteUnit option is set to "Binary") | | 4 | FrameCount | no |  | | 6 | StreamCount | no |  | | 8 | ImageWidth | no |  | | 9 | ImageHeight | no |  | |

## RIFF VP8 Tags

This chunk is found in simple-format (lossy) WebP files. See
<https://developers.google.com/speed/webp/docs/riff_container> for the WebP
container specification.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | VP8Version | no | [val >> 1 & 0x7]  0 = 0 (bicubic reconstruction, normal loop)  1 = 1 (bilinear reconstruction, simple loop)  2 = 2 (bilinear reconstruction, no loop)  3 = 3 (no reconstruction, no loop) | | 6 | ImageWidth | no | [val & 0x3fff] | | 6.1 | HorizontalScale | no | [val >> 14 & 0x3] | | 8 | ImageHeight | no | [val & 0x3fff] | | 8.1 | VerticalScale | no | [val >> 14 & 0x3] | |

## RIFF VP8L Tags

This chunk is found in lossless WebP files.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 1 | ImageWidth | no |  | | 2 | ImageHeight | no |  | | 4 | AlphaIsUsed | no | [val >> 4 & 0x1]  0 = No  1 = Yes | |

## RIFF VP8X Tags

This chunk is found in extended WebP files.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | WebP\_Flags | no | (flags used in Extended WebP images)  Bit 1 = Animation  Bit 2 = XMP  Bit 3 = EXIF  Bit 4 = Alpha  Bit 5 = ICC Profile | | 4 | ImageWidth | no |  | | 6 | ImageHeight | no |  | |

## RIFF Acidizer Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | AcidizerFlags | no | Bit 0 = One shot  Bit 1 = Root note set  Bit 2 = Stretch  Bit 3 = Disk-based  Bit 4 = High octave | | 4 | RootNote | no | |  |  |  |  |  | | --- | --- | --- | --- | --- | | 48 = C  49 = C#  50 = D  51 = D#  52 = E  53 = F  54 = F#  55 = G |  | 56 = G#  57 = A  58 = A#  59 = B  60 = High C  61 = High C#  62 = High D  63 = High D# |  | 64 = High E  65 = High F  66 = High F#  67 = High G  68 = High G#  69 = High A  70 = High A#  71 = High B | | | 12 | Beats | no |  | | 16 | Meter | no |  | | 20 | Tempo | no |  | |

## RIFF BroadcastExt Tags

Information found in the Broadcast Audio Extension chunk (see
<http://tech.ebu.ch/docs/tech/tech3285.pdf>).

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | Description | no |  | | 256 | Originator | no |  | | 288 | OriginatorReference | no |  | | 320 | DateTimeOriginal | no |  | | 338 | TimeReference | no | (first sample count since midnight) | | 346 | BWFVersion | no |  | | 348 | BWF\_UMID | no |  | | 602 | CodingHistory | no |  | |

## RIFF DS64 Tags

64-bit data sizes for MBWF/RF64 files. See
<https://tech.ebu.ch/docs/tech/tech3306-2009.pdf> for the specification.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index8 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | RIFFSize64 | no |  | | 1 | DataSize64 | no |  | | 2 | NumberOfSamples64 | no |  | |

## RIFF Instrument Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | UnshiftedNote | no |  | | 1 | FineTune | no |  | | 2 | Gain | no |  | | 3 | LowNote | no |  | | 4 | HighNote | no |  | | 5 | LowVelocity | no |  | | 6 | HighVelocity | no |  | |

## RIFF Sampler Tags

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index4 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 0 | Manufacturer | no |  | | 1 | Product | no |  | | 2 | SamplePeriod | no |  | | 3 | MIDIUnityNote | no |  | | 4 | MIDIPitchFraction | no |  | | 5 | SMPTEFormat | no | 0 = none  24 = 24 fps  25 = 25 fps  29 = 29 fps  30 = 30 fps | | 6 | SMPTEOffset | no | (HH:MM:SS:FF) | | 7 | NumSampleLoops | no |  | | 8 | SamplerDataLen | no |  | | 9 | SamplerData | no |  | |

## RIFF UserText Tags

Tags decoded from the USER-format txts stream written by Momento M6 dashcam.
Extracted only if the ExtractEmbedded option is used.

> |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |  |
> | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
> | | Index1 | Tag Name | Writable | Values / Notes | | --- | --- | --- | --- | | 28 | GPSAltitude | no |  | | 40 | Accelerometer | no |  | | 56 | GPSSpeed | no |  | | 60 | GPSLatitude | no |  | | 64 | GPSLongitude | no |  | | 68 | GPSDateTime | no |  | |

---

(This document generated automatically by Image::ExifTool::BuildTagLookup)

*Last revised Jun 27, 2025*

[<-- ExifTool Tag Names](https://exiftool.org/TagNames/index.html)
