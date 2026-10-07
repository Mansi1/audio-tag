| Multimedia | Programming    | Interface |
| ---------- | -------------- | --------- |
| and Data   | Specifications | 1.0       |
IssuedasajointdesignbyIBMCorporationandMicrosoftCorporation
August1991

Thisdocumentdescribestheprogramminginterfacesanddataspecificationsformultimediathat
arecommontobothOS/2andWindowsenvironments.Thesespecificationsmaybeenhancedto
incorporatenewtechnologiesormodifiedbasedoncustomerfeedbackand,assuch,specifications
incorporatedintoanyfinalproductmayvary.
Microsoftisaregisteredtrademark,andWindowsisatrademarkofMicrosoftCorp.
IBMandOS/2areregisteredtrademarksofInternationalBusinessMachinesCorporation.

Contents
Contents
Chapter1.......................................................................................................Overview ofMulti
ResourceInterchangeFileFormat...........................................................................................1-1
MultimediaFileFormats.........................................................................................................1-1
MediaControlInterface..........................................................................................................1-2
RegisteringMultimediaFormats.............................................................................................1-2
Chapter2.......................................................................................................Resource Intercha
AbouttheRIFFTaggedFileFormat.......................................................................................2-1
NotationConventions......................................................................................................2-1
Chunks............................................................................................................................2-2
RIFFForms.....................................................................................................................2-3
DefiningandRegisteringRIFFForms..............................................................................2-3
RegisteredFormandChunkTypes............................................................................2-4
Unregistered(Form-Specific)ChunkTypes...............................................................2-4
NotationforRepresentingSampleRIFFFiles.........................................................................2-5
BasicNotationforRepresentingRIFFFiles......................................................................2-5
EscapeSequencesforFour-CharacterCodesandStringChunks.......................................2-7
ExtendedNotationforRepresentingRIFFFormDefinitions.............................................2-8
AtomicLabels.................................................................................................................2-10
ASampleRIFFFormDefinitionandRIFFForm.............................................................2-11
StoringStringsinRIFFChunks..............................................................................................2-12
NULL-TerminatedString(ZSTR)Format.................................................................2-12
StringTableFormat..................................................................................................2-13

NULL-Terminated,ByteSizePrefixString(BZSTR)Series......................................2-13
MultilineStringFormat.............................................................................................2-13
ChoosingaStorageMethod......................................................................................2-13
LISTChunk...........................................................................................................................2-14
INFOListChunk.............................................................................................................2-14
CSET(CharacterSet)Chunk..................................................................................................2-16
CountryCodes.................................................................................................................2-16
LanguageandDialectCodes............................................................................................2-17
JUNK(Filler)Chunk..............................................................................................................2-18
CompoundFileStructure........................................................................................................2-18
StructuralOverview.........................................................................................................2-19
CompoundFileTableofContents(CTOC)Chunk...........................................................2-19
StructuralOverview..................................................................................................2-19
HeaderInformation...................................................................................................2-21
ParameterTableDefinition.......................................................................................2-21
HeaderParameterTable............................................................................................2-22
CTOCTableEntries..................................................................................................2-22
UsageCodesforExtraHeaderandExtraEntryFields................................................2-24
CompressionofCompoundFileElements.................................................................2-26
CompoundFileElementGroup(CGRP)Chunk...............................................................2-27
PlacementoftheCTOCandCGRPChunks.....................................................................2-27
Chapter3.......................................................................................................Multimedia File Fo
BundleFileFormat.................................................................................................................3-1
DeviceIndependentBitmapFileFormat.................................................................................3-1
OverviewofDIBStructure..............................................................................................3-2
BitmapFileHeader..........................................................................................................3-2
BitmapInformationHeader..............................................................................................3-3
InformationHeaderStructures...................................................................................3-4

BitmapColorTable.........................................................................................................3-6
ColorTableStructure................................................................................................3-6
OrderofColors.........................................................................................................3-6
FieldDescriptions.....................................................................................................3-6
LocatingtheColorTable...........................................................................................3-7
InterpretingtheColorTable......................................................................................3-7
BitmapData....................................................................................................................3-8
Windows3.0BitmapCompressionFormats.....................................................................3-8
Compressionof8-Bit-Per-PixelDIBs........................................................................3-8
Compressionof4-Bit-Per-PixelDIBs........................................................................3-9
RIFFDevice-IndependentBitmapFileFormat........................................................................3-10
SimpleRDIBFormat.......................................................................................................3-10
ExtendedRDIBFormat...................................................................................................3-10
BitmapHeaderChunk...............................................................................................3-11
TransitionalCompression..........................................................................................3-16
CCCCompression....................................................................................................3-17
PaletteChunk...........................................................................................................3-17
ExternalPaletteChunk..............................................................................................3-17
BitmapDataChunk...................................................................................................3-17
MIDIandRIFFMIDIFileFormats.........................................................................................3-18
PaletteFileFormat.................................................................................................................3-18
SimplePALFormat.........................................................................................................3-18
ExtendedPALFormat.....................................................................................................3-19
RichTextFormat(RTF).........................................................................................................3-22
WaveformAudioFileFormat(WAVE)..................................................................................3-22
WAVEFormatChunk.....................................................................................................3-22
WAVEFormatCategories...............................................................................................3-23
PulseCodeModulation(PCM)Format......................................................................3-24

StorageofWAVEData....................................................................................................3-26
FACTChunk...................................................................................................................3-26
Cue-PointsChunk............................................................................................................3-27
ExamplesofFilePositionValues..............................................................................3-28
PlaylistChunk.................................................................................................................3-29
AssociatedDataChunk....................................................................................................3-29
LabelandNoteInformation......................................................................................3-30
TextwithDataLengthInformation...........................................................................3-30
EmbeddedFileInformation.......................................................................................3-31
Chapter4.......................................................................................................Media ControlInt
MCICommandStrings...........................................................................................................4-1
ExampleofMCICommandUse.......................................................................................4-2
CategoriesofMCICommandStrings...............................................................................4-2
CommandSyntaxConventions........................................................................................4-3
SystemCommands..........................................................................................................4-3
RequiredCommands........................................................................................................4-3
BasicCommands.............................................................................................................4-4
ExtendedCommands.......................................................................................................4-4
ExtendedCommandsReservedforFutureUse..........................................................4-4
CreatingaCommandString.............................................................................................4-5
AboutMCIDeviceTypes................................................................................................4-6
UsingMCICommandStrings.................................................................................................4-6
OpeningaDevice............................................................................................................4-6
OpeningSimpleDevices...........................................................................................4-7
OpeningCompoundDevices.....................................................................................4-7
UsingtheShareableFlag...........................................................................................4-8
UsingtheAliasFlag..................................................................................................4-8
OpeningNewDeviceElements.................................................................................4-8

ClosingaDevice..............................................................................................................4-8
ShortcutsandVariationsforMCICommands...................................................................4-9
UsingAllasaDeviceName......................................................................................4-9
CombiningtheDeviceTypeandDeviceElementName............................................4-9
AutomaticOpen........................................................................................................4-9
AutomaticClose.......................................................................................................4-9
UsingWaitandNotifyFlags............................................................................................4-10
UsingtheNotifyFlag................................................................................................4-10
ObtainingInformationFromMCIDevices.......................................................................4-11
ThePlayCommand.........................................................................................................4-11
Stop,Pause,andResumeCommands...............................................................................4-11
MCISystemCommands.........................................................................................................4-12
RequiredCommandsforAllDevices......................................................................................4-13
BasicCommandsforSpecificDeviceTypes...........................................................................4-14
CDAudio(Redbook)Commands...........................................................................................4-17
MIDISequencerCommands...................................................................................................4-20
VideodiscPlayerCommands..................................................................................................4-25
WaveformAudioCommands..................................................................................................4-29

| C hap ter | 1             |                |
| --------- | ------------- | -------------- |
| Overview  | of Multimedia | Specifications |
Thisdocumentdescribesthefileformatandcontrolinterfacespecificationsformultimedia.These
specificationsallowdeveloperstousecommonfileformatanddevicecontrolinterfaces.
| Resource | Interchange | File Format |
| -------- | ----------- | ----------- |
TheResourceInterchangeFileFormat(RIFF),ataggedfilestructure,isageneralspecification
uponwhichmanyfileformatscanbedefined.ThemainadvantageofRIFFisitsextensibility;file
formatsbasedonRIFFcanbefuture-proofed,asformatchangescanbeignoredbyexisting
applications.
TheRIFFfileformatissuitableforthefollowingmultimediatasks:
| • Playingbackmultimediadata                                     |     |     |
| --------------------------------------------------------------- | --- | --- |
| • Recordingmultimediadata                                       |     |     |
| • Exchangingmultimediadatabetweenapplicationsandacrossplatforms |     |     |
Chapter2,"ResourceInterchangeFileFormat," describestheRIFFformat.
| Multimedia | File Formats |     |
| ---------- | ------------ | --- |
AnumberofRIFF-basedandnon-RIFFfileformatshavebeendefinedforthestorageof
multimediadata.Chapter3,"MultimediaFileFormats," describesthefollowingfileformats:
| • BundleFileFormat                                              |     |     |
| --------------------------------------------------------------- | --- | --- |
| • Device-IndependentBitmap(DIB)andRIFFDIBfileformats            |     |     |
| • MusicalInstrumentDigitalInterface(MIDI)andRIFFMIDIfileformats |     |     |
| • PaletteFileFormat                                             |     |     |
| • RichTextFileFormat                                            |     |     |
| • WaveformAudioFileFormat                                       |     |     |

Media Control Interface
TheMediaControlInterface(MCI)isahigh-levelcontrolmechanismthatprovidesadevice-
independentinterfacetomultimediadevicesandresourcefiles.
TheMediaControlInterface(MCI)providesacommandsetforplayingandrecordingmultimedia
devicesandresourcefiles.Developerscreatingmultimediaapplicationsareencouragedtousethis
high-levelcommandinterfaceratherthanthelow-levelfunctionsspecifictoeachplatform.The
MCIcommandsetactsasaplatform-independentlayerthatsitsbetweenmultimediaapplications
andtheunderlyingsystemsoftware.
TheMCIcommandsetisextensibleintwoways:
- DeveloperscanincorporatenewmultimediadevicesandfileformatsintheMCIcommandset
bycreatingnewMCIdriverstointerpretthecommands.
- Newcommandsandcommandoptionscanbeaddedtosupportspecialfeaturesorfunctions
requiredbynewmultimediadevicesorfileformats.
UsingMCI,anapplicationcancontrolmultimediadevicesusingsimplecommandstringslike
open,play,andclose.TheMCIcommandstringsprovideagenericinterfacetodifferent
multimediadevices,reducingthenumberofcommandsadeveloperneedstolearn.Amultimedia
applicationmightevenacceptMCIcommandsfromanenduserandpassthemunchangedtothe
MCIdriver,whichparsesthecommandandperformstheappropriateaction.
Chapter3,"MediaControlInterface," describesMCIanditscommandsetindetail.
Registering Multimedia Formats
Thisdocumentdiscussesseveralmultimediacodesandformatsthatrequireregistration.These
multimediaelementsincludethefollowing:
- Compressiontechniques
- RIFFformtypes,chunkIDs,andlisttypes
- Compound-fileusagecodes
- Waveformaudioformatcodes
Toregisterthesemultimediaelements,requestaMultimediaDeveloperRegistrationKitfromthe
followinggroup:
MicrosoftCorporation
MultimediaSystemsGroup
ProductMarketing
OneMicrosoftWay
Redmond,WA98052-6399
TheMultimediaDeveloperRegistrationKitalsolistscurrentlydefinedmultimediaelements.

| C hap    | ter 2       |     |             |
| -------- | ----------- | --- | ----------- |
| Resource | Interchange |     | File Format |
TheResourceInterchangeFileFormat(RIFF)isataggedfilestructuredevelopedforuseon
multimediaplatforms.ThischapterdefinesRIFFanddescribesthefilestructuresbasedonRIFF.
Ifyourapplicationrequiresanewfileformat,youshoulddefineitusingtheRIFFtaggedfile
structuredescribedinthischapter.
| About | the RIFF | Tagged | File Format |
| ----- | -------- | ------ | ----------- |
RIFF(ResourceInterchangeFileFormat)isthetaggedfilestructuredevelopedformultimedia
resourcefiles.ThestructureofaRIFFfileissimilartothestructureofanElectronicArtsIFFfile.
RIFFisnotactuallyafileformatitself(sinceitdoesnotrepresentaspecifickindofinformation),
butitsnamecontainsthewords"interchangefileformat" inrecognitionofitsrootsinIFF.Refer
totheEAIFFdefinitiondocument,EAIFF85StandardforInterchangeFormatFiles,foralistof
reasonstouseataggedfileformat.
RIFFhasacounterpart,RIFX,thatisusedtodefineRIFFfileformatsthatusetheMotorola
integerbyte-orderingformatratherthantheIntelformat.ARIFXfileisthesameasaRIFFfile,
exceptthatthefirstfourbytesare'RIFX'insteadof'RIFF',andintegerbyteorderingis
representedinMotorolaformat.
| Notation | Conventions |     |     |
| -------- | ----------- | --- | --- |
Thefollowingtablelistssomeofthenotationconventionsusedinthisdocument.Further
conventionsandthenotationfordocumentingRIFFformsarepresentedlaterinthedocumentin
thesection"NotationforRepresentingSampleRIFFFiles."
|     | Notation            |     | Description                               |
| --- | ------------------- | --- | ----------------------------------------- |
|     | <elementlabel>      |     | RIFFfileelementwiththelabel"elementlabel" |
|     | <elementlabel:TYPE> |     | RIFFfileelementwithdatatype"TYPE"         |
OptionalRIFFfileelement
[<elementlabel>]
|     | <elementlabel>... |     | Oneormorecopiesofthespecifiedelement |
| --- | ----------------- | --- | ------------------------------------ |
Zeroormorecopiesofthespecifiedelement
[<elementlabel>]...

Chunks
ThebasicbuildingblockofaRIFFfileiscalledachunk.UsingCsyntax,achunkcanbedefined
asfollows:
| typedef unsigned | long DWORD;     |                        |                  |            |
| ---------------- | --------------- | ---------------------- | ---------------- | ---------- |
| typedef unsigned | char BYTE;      |                        |                  |            |
| typedef DWORD    | FOURCC;         | // Four-character      | code             |            |
| typedef FOURCC   | CKID;           | // Four-character-code | chunk identifier |            |
| typedef DWORD    | CKSIZE;         | // 32-bit unsigned     | size value       |            |
| typedef struct   | {               | // Chunk structure     |                  |            |
| CKID             | ckID;           | // Chunk               | type identifier  |            |
| CKSIZE           | ckSize;         | // Chunk               | size field (size | of ckData) |
| BYTE             | ckData[ckSize]; | // Chunk               | data             |            |
} CK;
AFOURCCisrepresentedasasequenceofonetofourASCIIalphanumericcharacters,padded
ontherightwithblankcharacters(ASCIIcharactervalue32)asrequired,withnoembedded
blanks.
Forexample,thefour-charactercode'FOO'isstoredasasequenceoffourbytes:'F','O','O',''in
ascendingaddresses.Forquickcomparisons,afour-charactercodemayalsobetreatedasa32-bit
number.
Thethreepartsofthechunkaredescribedinthefollowingtable:
| Part | Description |     |     |     |
| ---- | ----------- | --- | --- | --- |
ckID Afour-charactercodethatidentifiestherepresentationofthechunkdata
data.AprogramreadingaRIFFfilecanskipoveranychunkwhosechunk
IDitdoesn'trecognize;itsimplyskipsthenumberofbytesspecifiedby
ckSizeplusthepadbyte,ifpresent.
ckSize A32-bitunsignedvalueidentifyingthesizeofckData.Thissizevaluedoes
notincludethesizeoftheckIDorckSizefieldsorthepadbyteattheendof
ckData.
ckData Binarydataoffixedorvariablesize.ThestartofckDataisword-aligned
withrespecttothestartoftheRIFFfile.Ifthechunksizeisanoddnumberof
bytes,apadbytewithvaluezeroiswrittenafterckData.Wordaligning
improvesaccessspeed(forchunksresidentinmemory)andmaintains
compatibilitywithEAIFF.TheckSizevaluedoesnotincludethepadbyte.
Wecanrepresentachunkwiththefollowingnotation(inthisexample,theckSizeandpadbyte
areimplicit):
| <ckID> ( <ckData> | )   |     |     |     |
| ----------------- | --- | --- | --- | --- |
Twotypesofchunks,the'LIST'and'RIFF'chunks,maycontainnestedchunks,orsubchunks.
Thesespecialchunktypesarediscussedlaterinthisdocument.Allotherchunktypesstorea
singleelementofbinarydatain<ckData>.

RIFF Forms
ARIFFformisachunkwitha'RIFF'chunkID.Thetermalsoreferstoafileformatthatfollows
theRIFFframework.ThefollowingisthecurrentlistofregisteredRIFFforms.Eachisdescribed
inChapter3,"MultimediaFileFormats."
| FormType |     | Description                       |
| -------- | --- | --------------------------------- |
| PAL      |     | RIFFPaletteFormat                 |
| RDIB     |     | RIFFDeviceIndependentBitmapFormat |
| RMID     |     | RIFFMIDIFormat                    |
| RMMP     |     | RIFFMultimediaMovieFileFormat     |
| WAVE     |     | WaveformAudioFormat               |
Usingthenotationforrepresentingachunk,aRIFFformlookslikethefollowing:
| RIFF | ( <formType> | <ck>... ) |
| ---- | ------------ | --------- |
ThefirstfourbytesofaRIFFformmakeupachunkIDwithvalues'R','I','F','F'.TheckSize
fieldisrequired,butforsimplicityitisomittedfromthenotation.
ThefirstDWORDofchunkdatainthe'RIFF'chunk(shownaboveas<formType>)isafour-
charactercodevalueidentifyingthedatarepresentation,orformtype,ofthefile.Followingthe
form-typecodeisaseriesofsubchunks.Whichsubchunksarepresentdependsontheformtype.
ThedefinitionofaparticularRIFFformtypicallyincludesthefollowing:
| •            | Auniquefour-charactercodeidentifyingtheformtype |            |
| ------------ | ----------------------------------------------- | ---------- |
| •            | Alistofmandatorychunks                          |            |
| •            | Alistofoptionalchunks                           |            |
| •            | Possibly,arequiredorderforthechunks             |            |
| Defining and | Registering                                     | RIFF Forms |
Theform-typecodeforaRIFFformmustbeunique.Toguaranteethisuniqueness,youmust
registeranynewformtypesbeforerelease.See"RegisteringMultimediaFormats" inChapter1,
"OverviewofMultimediaSpecifications," forinformationonregisteringRIFFforms.
LikeRIFFforms,RIFXformsmustalsoberegistered.RegisteringaRIFFformdoesnot
automaticallyregistertheRIFXcounterpart.NoRIFXformtypesarecurrentlydefined.

Registered Form and Chunk Types
Byconvention,theform-typecodeforregisteredformtypescontainsonlydigitsanduppercase
letters.Form-typecodesthatarealluppercasedenotearegistered,uniqueformtype.Use
lowercaselettersfortemporaryorprototypechunktypes.
Certainchunktypesarealsogloballyuniqueandmustalsoberegisteredbeforeuse.These
registeredchunktypesarenotspecifictoacertainformtype;theycanbeusedinanyform.Ifa
registeredchunktypecanbeusedtostoreyourdata,youshouldusetheregisteredchunktype
ratherthandefineyourownchunktypecontainingthesametypeofinformation.
Forexample,achunkwithchunkID'INAM'alwayscontainsthenameortitleofafile.Also,
withinallRIFFfiles,filenamesortitlesarecontainedwithinchunkswithID'INAM'andhavea
standarddataformat.
Unregistered (Form-Specific) Chunk Types
ChunktypesthatareusedonlyinacertainformtypeusealowercasechunkID.Alowercase
chunkIDhasspecificmeaningonlywithinthecontextofaspecificformtype.Afteraform
designerisallocatedaregisteredformtype,thedesignercanchooselowercasechunktypestouse
withinthatform.See"RegisteringMultimediaFormats" inChapter1,"OverviewofMultimedia
Specifications," forinformationonregisteringformtypes.
Forexample,achunkwithID'scln'insideoneformtypemightcontainthe"numberofscan
lines." Insidesomeotherformtype,achunkwithID'scln'mightmean"secondarylambda
number."

| Notation | for Representing |     | Sample | RIFF Files |
| -------- | ---------------- | --- | ------ | ---------- |
RIFFisabinaryformat,butitiseasiertocomprehendanASCIIrepresentationofaRIFFfile.
ThissectiondefinesastandardnotationusedtopresentsamplesofvarioustypesofRIFFfiles.If
youdefineaRIFFform,weurgeyoutousethisnotationinanyfileformatsamplesyouprovidein
yourdocumentation.
| Basic Notation | for Representing | RIFF | Files |     |
| -------------- | ---------------- | ---- | ----- | --- |
ThefollowingtablesummarizestheelementsoftheRIFFnotationrequiredforrepresenting
sampleRIFFfiles:
| Notation |     | Description |     |     |
| -------- | --- | ----------- | --- | --- |
<ckID>(<ckData>)
ThechunkwithID<ckID>anddata<ckData>.Aspreviously
described,<ckID>isafour-charactercodewhichmaybeenclosed
bysinglequotesforemphasis.
Forexample,thefollowingnotationdescribesa'RIFF'chunkwitha
formtypeof'QRST'.Thedataportionofthischunkcontainsa
'FOO'subchunk.
|     |     | RIFF('QRST' | FOO(17 23)) |     |
| --- | --- | ----------- | ----------- | --- |
Thefollowingexampledescribesan'ICOP'chunkcontainingthe
string"CopyrightEncyclopediaInternational.":
|     |     | 'ICOP' ("Copyright | Encyclopedia | International."Z) |
| --- | --- | ------------------ | ------------ | ----------------- |
<number>[<modifier>]
AnumberinIntelformat,where<number>isanoptionalsign
(+or-)followedbyoneormoredigitsandmodifiedbytheoptional
<modifier>.Valid<modifier>valuesfollow:
|     |     | Modifier | Meaning                         |     |
| --- | --- | -------- | ------------------------------- | --- |
|     |     | None     | 16-bitnumberindecimalformat     |     |
|     |     | H        | 16-bitnumberinhexadecimalformat |     |
|     |     | C        | 8-bitnumberindecimalformat      |     |
|     |     | CH       | 8-bitnumberinhexadecimalformat  |     |
|     |     | L        | 32-bitnumberindecimalformat     |     |
|     |     | LH       | 32-bitnumberinhexadecimalformat |     |
Severalexamplesfollow:
0
65535
-1
0L

4a3c89HL
-1C
21HC
Notethat-1and65535representthesamevalue.Theapplication
readingthisfilemustknowwhethertointerpretthenumberas
signedorunsigned.
'<chars>'
Afour-charactercode(32-bitquantity)consistingofasequenceof
zerotofourASCIIcharacters<chars>inthegivenorder.If
<chars>islessthanfourcharacterslong,itisimplicitlypaddedon
therightwithblanks.Twosinglequotesisequivalenttofourblanks.
Examplesfollow.
'RIFF'
'xyz'
''
<chars>canincludeescapesequences,whicharecombinationsof
charactersintroducedbyabackslash(\)andusedtorepresentother
characters.Escapesequencesarelistedinthefollowingsection.
"<string>"[<modifier>] ThesequenceofASCIIcharacterscontainedin<string>and
modifiedbytheoptionalmodifier<modifier>.Thequotedtextcan
includeanyoftheescapesequenceslistedinthefollowingsection.
Valid<modifier>valuesfollow:
Modifier Meaning
none NoNULLterminatororsizeprefix.
Z StringisNULL-terminated
B Stringhasan8-bit(byte)sizeprefix
W Stringhasa16-bit(word)sizeprefix
BZ Stringhasabyte-sizeprefixandisNULL-terminated
WZ Stringhasaword-sizeprefixandisNULL-terminated
NULL-terminatedmeansthatthestringisfollowedbyacharacter
withASCIIvalue0.Asizeprefixisanunsignedinteger,storedasa
byteorawordinIntelformatprecedingthestringcharacters,that
specifiesthelengthofthestring.InthecaseofstringswithBZor
WZmodifiers,thesizeprefixspecifiesthesizeofthestringwithout
theterminatingNULL.
Thevariousstringformatsreferredtoabovearediscussedin
"StoringStringsinRIFFChunks,"followinglaterinthissection.,+
Examplesfollow:
"No prefix, no NULL terminator"
"No prefix, NULL terminator"Z
"Byte prefix, NULL terminator"BZ

| Escape Sequences | for Four-Character | Codes and | String Chunks |
| ---------------- | ------------------ | --------- | ------------- |
Thefollowingescapesequencescanbeusedinfour-charactercodesandstringchunks:
| EscapeSequence | ASCIIValue | Description             |     |
| -------------- | ---------- | ----------------------- | --- |
| \n             | 10         | Newlinecharacter        |     |
| \t             | 9          | Horizontaltabcharacter  |     |
| \b             | 8          | Backspacecharacter      |     |
| \r             | 13         | Carriagereturncharacter |     |
| \f             | 12         | Formfeedcharacter       |     |
| \\             | 92         | Backslash               |     |
| \'             | 39         | Singlequote             |     |
| \"             | 34         | Doublequote             |     |
| \ddd           | Octalddd   | Arbitrarycharacter      |     |

Extended Notation for Representing RIFF Form Definitions
TounambiguouslydefinethestructureofnewRIFFforms,documenttheRIFFformusingthe
basicnotationalongwiththefollowingextendednotation:
Notation Description
<name>
Alabelthatreferstosomeelementofthefile,where<name>isthenameof
thelabel.Examplesfollow:
<NAME-ck>
<GOBL-form>
<bitmap-bits>
<foo>
Conventionally,alabelthatreferstoachunkisnamed<ckID-ck>,where
'ckID'isthechunkID.Similarly,alabelthatreferstoaRIFFformisnamed
<formType-form>,where"formType" isthenameoftheform'stype.
(cid:221)(cid:221)(cid:221)(cid:221)
<name> elements
Theactualdatarepresentedby<name>isdefinedaselements.
Thisstatesthat<name>isanabbreviationforelements,whereelementsisa
sequenceofotherlabelsandliteraldata.Anexamplefollows:
(cid:221)
<GOBL-form> RIFF ( 'GOBL' <form-data> )
Thisexampledefineslabel<GOBL-form>asrepresentingaRIFFformwith
chunkID'GOBL'anddataequalto<form-data>,where<form-data>isa
labelthatwouldbedefinedinanotherrule.Notethatalabelmayrepresent
anydata,notjustaRIFFchunkorform.
Note:Anumberofatomiclabelsaredefinedinthesection"AtomicLabels"
laterinthisdocument.Theselabelsrefertoprimitivedatatypes.
<name:type>
Thisisthesameas<name>,butitalsodefines<name>tobeequivalentto
<type>.Thisnotationobviatesthefollowingrule:
(cid:221)
<name> <type>
Thisallowsyoutogiveasymbolicnametoanelementofafileformatandto
specifytheelementdatatype.Anexamplefollows:
(cid:221)
<xyz-coordinate> <x:INT> <y:INT> <z:INT>
Thisdefines<xyz-coordinate>toconsistofthreepartsconcatenatedtogether:
<x>,<y>,and<z>.Thedefinitionalsospecifiesthat<x>,<y>,and<z>are
integers.Thisnotationisequivalenttothefollowing:
(cid:221)
<xyz-coordinate> <x> <y> <z>
(cid:221)
<x> <INT>
(cid:221)
<y> <INT>
(cid:221)
<z> <INT>
[elements]

Anoptionalsequenceoflabelsandliteraldata.Surroundedbysquare
brackets,itmaybeconsideredanelementitself.Anexamplefollows:
(cid:221)
<FOO-form> RIFF('FOO' [<header-ck>] <data-ck>)
Thisexampledefinesform"FOO" withanoptionalheaderchunkfollowed
byamandatorydatachunk.
el1|el2|...|elN
Exactlyoneofthelistedelementsmustbepresent.Anexamplefollows:
(cid:221)
<hdr-ck> hdr(<hdr-x> | <hdr-y> | <hdr-z>)
Thisexampledefinesthe'hdr'chunk'sdataascontainingoneof<hdr-x>,
<hdr-y>,or<hdr-z>.
element...
Oneormoreoccurrencesofelementmaybepresent.Anellipsishasthis
meaningonlyifitfollowsanelement;incasessuchas"el1|el2|...|elN,"
theellipsishasitsordinaryEnglishmeaning.Ifthereisanypossibilityof
confusion,anellipsisshouldonlybeusedtoindicateoneormore
occurrences.Anexamplefollows:
(cid:221)
<data-ck> data(<count:INT> <item:INT>...)
Thisexampledefinesthedataofthe'data'chunktocontainaninteger
<count>,followedbyoneormoreoccurrencesoftheinteger<item>.
[element]...
Zeroormoreoccurrencesofelementmaybepresent.Anexamplefollows.
(cid:221)
<data-ck> data(<count:INT> [<item:INT>]...)
Thisexampledefinesthedataofthe'data'chunktocontainaninteger
<count>followedbyzeroormoreoccurrencesofaninteger<item>.
{elements}
Thegroupofelementswithinthebracesshouldbeconsideredasingle
element.Anexamplefollows:
(cid:221)
<blorg> <this> | {<that> | <other>}...
Thisexampledefines<blorg>tobeeither<this>oroneormoreoccurrences
of<that>or<other>,intermixedinanyway.Contrastthiswiththefollowing
example:
(cid:221)
<blorg> <this> | <that> | <other>...
Thisexampledefines<blorg>tobeeither<this>or<that>oroneormore
occurrencesof<other>.

struct{...}name
AstructuredefinedusingCsyntax.Thiscanbeusedinsteadofasequenceof
labelsifaCheader(include)fileisavailablethatdefinesthestructure.The
labelusedtorefertothestructureshouldbethesameasthestructure's
typedefname.Anexamplefollows:
(cid:221)
|     | <3D_POINT> | struct { |                 |     |
| --- | ---------- | -------- | --------------- | --- |
|     |            | INT x;   | // x-coordinate |     |
|     |            | INT y;   | // y-coordinate |     |
|     |            | INT z;   | // z-coordinate |     |
} 3D_POINT
Whereverpossible,thetypesusedinthestructureshouldbethetypeslistedin
|     | thefollowingsection,"AtomicLabels," |     | becausethesetypesaremore |     |
| --- | ----------------------------------- | --- | ------------------------ | --- |
portablethanCtypessuchasint.Thestructurefieldsareassumedtobe
presentinthefileintheordergiven,withnopaddingorforcedalignment.
UnlesstheRIFFchunkIDis'RIFX',integerbyteorderingisassumedtobe
inIntelformat.
//comment
Anexplanatorycommenttoarule.Anexamplefollows:
(cid:221)
|     | <weekend> | 'Sat'|'Sun' | // Four-character | code |
| --- | --------- | ----------- | ----------------- | ---- |
// for day
Atomic Labels
Thefollowingareatomiclabels,whicharelabelsthatrefertoprimitivedatatypes.Where
available,theequivalentMicrosoftCdatatypeisalsolisted.
| Label  | Meaning                          |     | MSCType      |     |
| ------ | -------------------------------- | --- | ------------ | --- |
| <CHAR> | 8-bitsignedinteger               |     | signedchar   |     |
| <BYTE> | 8-bitunsignedquantity            |     | unsignedchar |     |
| <INT>  | 16-bitsignedintegerinIntelformat |     | signedint    |     |
| <WORD> | 16-bitunsignedquantityinIntel    |     | unsignedint  |     |
format
| <LONG>  | 32-bitsignedintegerinIntelformat |     | signedlong   |     |
| ------- | -------------------------------- | --- | ------------ | --- |
| <DWORD> | 32-bitunsignedquantityinIntel    |     | unsignedlong |     |
format
| <FLOAT>  | 32-bitIEEEfloatingpointnumber |     | float  |     |
| -------- | ----------------------------- | --- | ------ | --- |
| <DOUBLE> | 64-bitIEEEfloatingpointnumber |     | double |     |
| <STR>    | String(asequenceofcharacters) |     |        |     |
| <ZSTR>   | NULL-terminatedstring         |     |        |     |

|     | <BSTR>  | Stringwithbyte(8-bit)sizeprefix  |     |     |     |     |     |     |     |
| --- | ------- | -------------------------------- | --- | --- | --- | --- | --- | --- | --- |
|     | <WSTR>  | Stringwithword(16-bit)sizeprefix |     |     |     |     |     |     |     |
|     | <BZSTR> | NULL-terminatedstringwithbyte    |     |     |     |     |     |     |     |
sizeprefix
|     | <WZSTR> | NULL-terminatedstringwithword |     |     |     |     |     |     |     |
| --- | ------- | ----------------------------- | --- | --- | --- | --- | --- | --- | --- |
sizeprefix
NULL-terminatedmeansthatthestringisfollowedbyacharacterwithASCIIvalue0.
Asizeprefixisanunsignedinteger,storedasabyteorawordinIntelformat,thatspecifiesthe
lengthofthestring.InthecaseofstringswithBZorWZmodifiers,thesizeprefixspecifiesthe
sizeofthestringwithouttheterminatingNULL.
Note:TheWINDOWS.HheaderfiledefinestheCtypesBYTE,WORD,LONG,andDWORD.Thesetypes
correspondtolabels<BYTE>,<WORD>,<LONG>,and<DWORD>,respectively.
| A Sample | RIFF Form | Definition | and | RIFF | Form |     |     |     |     |
| -------- | --------- | ---------- | --- | ---- | ---- | --- | --- | --- | --- |
Thefollowingexampledefines<GOBL-form>,thehypotheticalRIFFformoftype'GOBL'.To
fullydocumentanewRIFFformdefinition,adeveloperwouldalsoprovidedetaileddescriptions
ofeachfileelement,includingthesemanticsofeachchunkandsamplefilesdocumentedusingthe
standardnotation.
(cid:221)
|     | <GOBL-form> | RIFF( | 'GOBL'      |     |     | // RIFF   | form  | header    |          |
| --- | ----------- | ----- | ----------- | --- | --- | --------- | ----- | --------- | -------- |
|     |             |       | [<org-ck>]  |     |     | // Origin | chunk | (default  | (0,0,0)) |
|     |             |       | <obj-list>) |     |     | // Series | of    | graphical | objects  |
(cid:221)
|     | <org-ck> | org( | <origin:3D_POINT> |     |     | )     | //     | Object-list | origin |
| --- | -------- | ---- | ----------------- | --- | --- | ----- | ------ | ----------- | ------ |
|     |          |      |                   |     |     | // An | object | is a:       |        |
(cid:221)
|     | <obj-list> | LIST( | 'obj' | {   | <sqr-ck>  | |    |     |     | // square,    |
| --- | ---------- | ----- | ----- | --- | --------- | ---- | --- | --- | ------------- |
|     |            |       |       |     | <circ-ck> | |    |     |     | // circle,    |
|     |            |       |       |     | <poly-ck> | }... | )   |     | // or polygon |
(cid:221)
|     | <sqr-ck> | sqr( | <pt1:3D_POINT> |     |     |     | // one     | vertex |     |
| --- | -------- | ---- | -------------- | --- | --- | --- | ---------- | ------ | --- |
|     |          |      | <pt2:3D_POINT> |     |     |     | // another | vertex |     |
|     |          |      | <pt3:3D_POINT> |     | )   |     | // a third | vertex |     |
 (cid:221)
|     | <circ-ck> | circ( | <center:3D_POINT>   |     |     |     | //  | Center | of circle        |
| --- | --------- | ----- | ------------------- | --- | --- | --- | --- | ------ | ---------------- |
|     |           |       | <circumPt:3D_POINT> |     |     | )   | //  | Point  | on circumference |
(cid:221)
<poly-ck> poly( <pt:3D_POINT>... ) // List of points in a polygon
(cid:221)
|     | <3D_POINT> | struct |        |     |     | // Defined |                 | in "gobl.h" |     |
| --- | ---------- | ------ | ------ | --- | --- | ---------- | --------------- | ----------- | --- |
|     |            | {      | INT x; |     |     |            | // x-coordinate |             |     |
|     |            |        | INT y; |     |     |            | // y-coordinate |             |     |
|     |            |        | INT z; |     |     |            | // z-coordinate |             |     |
} 3D_POINT
SampleRIFFForm
ThefollowingsampleRIFFformadherestotheformdefinitionforformtypeGOBL.Thefile
containsthreesubchunks:
|     | • An'INFO'list |     |     |     |     |     |     |     |     |
| --- | -------------- | --- | --- | --- | --- | --- | --- | --- | --- |

|     | • An'org'chunk |     |     |     |     |     |     |     |
| --- | -------------- | --- | --- | --- | --- | --- | --- | --- |
|     | • An'obj'chunk |     |     |     |     |     |     |     |
The'INFO'listand'org'chunkeachhavetwosubchunks.The'INFO'listisaregisteredglobal
chunkthatcanbeusedwithinanyRIFFfile.The'INFO'listisdescribedinthe'INFOList
|     | Chunk," | laterinthischapter. |     |     |     |     |     |     |
| --- | ------- | ------------------- | --- | --- | --- | --- | --- | --- |
SincethedefinitionoftheGOBLformdoesnotrefertotheINFOchunk,softwarethatexpects
only'org'and'obj'chunksinaGOBLformwouldignoretheunknown'INFO'chunk.
RIFF( 'GOBL'
|     |     | LIST('INFO' |           | // INFO   | list         | containing | filename      | and copyright |
| --- | --- | ----------- | --------- | --------- | ------------ | ---------- | ------------- | ------------- |
|     |     |             | INAM("A   | House"Z)  |              |            |               |               |
|     |     |             | ICOP("(C) | Copyright | Encyclopedia |            | International | 1991"Z)       |
)
|     |     | org(2,     | 0, 0)      | // Origin | of     | object     | list         |     |
| --- | --- | ---------- | ---------- | --------- | ------ | ---------- | ------------ | --- |
|     |     | LIST('obj' |            | // Object | list   | containing | two polygons |     |
|     |     |            | poly(0,0,0 | 2,0,0     | 2,2,0, | 1,3,0,     | 0,2,0)       |     |
|     |     |            | poly(0,0,5 | 2,0,5     | 2,2,5, | 1,3,5,     | 0,2,5)       |     |
)
|         | )       |     |         | // End of | form |     |     |     |
| ------- | ------- | --- | ------- | --------- | ---- | --- | --- | --- |
| Storing | Strings |     | in RIFF | Chunks    |      |     |     |     |
ThissectionlistsmethodsforstoringtextstringsinRIFFchunks.Whiletheseguidelinesmaynot
makesenseforallapplications,youshouldfollowtheseconventionsifyoumustmakean
arbitrarydecisionregardingstringstorage.
|     | NULL-Terminated |     | String | (ZSTR) | Format |     |     |     |
| --- | --------------- | --- | ------ | ------ | ------ | --- | --- | --- |
ANULL-terminatedstring(ZSTR)consistsofaseriesofcharactersfollowedbyaterminating
NULLcharacter.TheZSTRisbetterthanasimplecharactersequence(STR)becausemany
programsareeasiertowriteifstringsareNULL-terminated.ZSTRispreferredtoastringwitha
sizeprefix(BSTRorWSTR)becausethesizeofthestringisalreadyavailableasthe<ckSize>
value,minusonefortheterminatingNULLcharacter.

| String | Table Format |     |     |     |     |
| ------ | ------------ | --- | --- | --- | --- |
Inastringtable,allstringsusedinastructurearestoredattheendofthestructureinpacked
format.Thestructureincludesfieldsthatspecifytheoffsetsfromthebeginningofthestringtable
totheindividualstrings.Anexamplefollows:
| typedef | struct |     |     |     |     |
| ------- | ------ | --- | --- | --- | --- |
{
|     | INT iWidgetNumber;    |     | // the widget | number      |                 |
| --- | --------------------- | --- | ------------- | ----------- | --------------- |
|     | WORD offszWidgetName; |     | // an offset  | to a string | in <rgchStrTab> |
|     | WORD offszWidgetDesc; |     | // an offset  | to a string | in <rgchStrTab> |
|     | INT iQuantity;        |     | // how many   | widgets     |                 |
CHAR rgchStrTab[1]; // string table (allocate as large as needed)
} WIDGET;
Ifmultiplechunkswithinthefileneedtoreferencevariable-lengthstrings,youcanstorethe
stringsinasinglechunkthatactsasastringtable.Thechunksthatrefertothestringscontain
offsetsrelativetothebeginningofthedatapartofthestringtablechunk.
| NULL-Terminated, |     | Byte Size | Prefix String | (BZSTR) | Series |
| ---------------- | --- | --------- | ------------- | ------- | ------ |
InaBZSTRseries,aseriesofstringsisstoredinpackedformat.EachstringisaBZSTR,witha
bytesizeprefixandaNULLterminator.Thisformatretainstheease-of-usecharacteristicsofthe
ZSTRwhileprovidingthestringsize,allowingtheapplicationtoquicklyskipunneededstrings.
| Multiline | String Format |     |     |     |     |
| --------- | ------------- | --- | --- | --- | --- |
Whenstoringmultilinestrings,separatelineswithacarriagereturn/linefeedpair(ASCII
13/ASCII10pair).Althoughapplicationsvaryintheirrequirementsfornewlinesymbols
(carriagereturnonly,linefeedonly,orboth),itisgenerallyeasiertostripoutextracharactersthan
toinsertextraones.Insertingcharactersmightrequirereallocatingmemoryblocksorpre-scanning
thechunkbeforeallocatingmemoryforit.
| Choosing | a Storage | Method |     |     |     |
| -------- | --------- | ------ | --- | --- | --- |
Thefollowinglistsguidelinesfordecidingwhichstoragemethodisappropriateforyour
application.
| Usage |     |     |     | RecommendedFormat |     |
| ----- | --- | --- | --- | ----------------- | --- |
Chunkdatacontainsnothingexceptastring ZSTR(NULL-terminatedstring)format.
| Chunkdatacontainsanumberoffields,someof |     |     |     | String-tableformat |     |
| --------------------------------------- | --- | --- | --- | ------------------ | --- |
whicharevariable-lengthstrings
| Multiplechunkswithinthefileneedtoreference |     |     |     | String-tableformat |     |
| ------------------------------------------ | --- | --- | --- | ------------------ | --- |
variable-lengthstrings
Chunkdatastoresasequenceofstrings,someof BZSTR(NULL-terminatedstringwith
| whichtheapplicationmaywanttoskip |     |     |     | bytesizeprefix)series |     |
| -------------------------------- | --- | --- | --- | --------------------- | --- |

Chunkdatacontainsmultilinestrings Amultilinestringformat
LIST Chunk
ALISTchunkcontainsalist,ororderedsequence,ofsubchunks.ALISTchunkisdefinedas
follows:
LIST( <list-type> [<chunk>]... )
The<list-type>isafour-charactercodethatidentifiesthecontentsofthelist.
Ifanapplicationrecognizesthelisttype,itshouldknowhowtointerpretthesequenceof
subchunks.However,sinceaLISTchunkmaycontainonlysubchunks(afterthelisttype),an
applicationthatdoesnotknowaboutaspecificlisttypecanstillwalkthroughthesequenceof
subchunks.
LikechunkIDs,listtypesmustberegistered,andanall-lowercaselisttypehasmeaningrelative
totheformthatcontainsit.See"RegisteringMultimediaFormats" inChapter1,"Overviewof
MultimediaSpecifications," forinformationonregisteringlisttypes.
INFO List Chunk
The'INFO'listisaregisteredglobalformtypethatcanstoreinformationthathelpsidentifythe
contentsofthechunk.Thisinformationisusefulbutdoesnotaffectthewayaprograminterprets
thefile;examplesarecopyrightinformationandcomments.An'INFO'listisa'LIST'chunkwith
listtype'INFO'.Thefollowingshowsasample'INFO'listchunk:
LIST('INFO' INAM("Two Trees"Z)
ICMT("A picture for the opening screen"Z) )
An'INFO'listshouldcontainonlythefollowingchunks.Newchunksmaybedefined,butan
applicationshouldignoreanychunkitdoesn'tunderstand.Thechunkslistedbelowmayonly
appearinan'INFO'list.EachchunkcontainsaZSTR,ornull-terminatedtextstring.
ChunkID Description
IARL ArchivalLocation.Indicateswherethesubjectofthefileisarchived.
IART Artist.Liststheartistoftheoriginalsubjectofthefile.Forexample,
"Michaelangelo."
ICMS Commissioned.Liststhenameofthepersonororganizationthat
commissionedthesubjectofthefile.Forexample,"PopeJulianII."
ICMT Comments.Providesgeneralcommentsaboutthefileorthesubjectofthe
file.Ifthecommentisseveralsentenceslong,endeachsentencewitha
period.Donotincludenewlinecharacters.
ICOP Copyright.Recordsthecopyrightinformationforthefile.Forexample,
"CopyrightEncyclopediaInternational1991." Iftherearemultiple
copyrights,separatethembyasemicolonfollowedbyaspace.
ICRD Creationdate.Specifiesthedatethesubjectofthefilewascreated.Listdates
inyear-month-dayformat,paddingone-digitmonthsanddayswithazeroon

theleft.Forexample,"1553-05-03" forMay3,1553.
ICRP Cropped.Describeswhetheranimagehasbeencroppedand,ifso,howitwas
cropped.Forexample,"lowerrightcorner."
IDIM Dimensions.Specifiesthesizeoftheoriginalsubjectofthefile.Forexample,
"8.5inh,11inw."
IDPI DotsPerInch.Storesdotsperinchsettingofthedigitizerusedtoproducethe
file,suchas"300."
IENG Engineer.Storesthenameoftheengineerwhoworkedonthefile.Ifthereare
multipleengineers,separatethenamesbyasemicolonandablank.For
example,"Smith,John;Adams,Joe."
IGNR Genre.Describestheoriginalwork,suchas,"landscape," "portrait," "still
life," etc.
IKEY Keywords.Providesalistofkeywordsthatrefertothefileorsubjectofthe
file.Separatemultiplekeywordswithasemicolonandablank.Forexample,
"Seattle;aerialview;scenery."
ILGT Lightness.Describesthechangesinlightnesssettingsonthedigitizerrequired
toproducethefile.Notethattheformatofthisinformationdependson
hardwareused.
IMED Medium.Describestheoriginalsubjectofthefile,suchas,"computer
image," "drawing," "lithograph," andsoforth.
INAM Name.Storesthetitleofthesubjectofthefile,suchas,"SeattleFrom
Above."
IPLT PaletteSetting.Specifiesthenumberofcolorsrequestedwhendigitizingan
image,suchas"256."
IPRD Product.Specifiesthenameofthetitlethefilewasoriginallyintendedfor,
suchas"EncyclopediaofPacificNorthwestGeography."
ISBJ Subject.Describestheconbittentsofthefile,suchas"Aerialviewof
Seattle."
ISFT Software.Identifiesthenameofthesoftwarepackageusedtocreatethefile,
suchas"MicrosoftWaveEdit."
ISHP Sharpness.Identifiesthechangesinsharpnessforthedigitizerrequiredto
producethefile(theformatdependsonthehardwareused).
ISRC Source.Identifiesthenameofthepersonororganizationwhosuppliedthe
originalsubjectofthefile.Forexample,"TreyResearch."
ISRF SourceForm.Identifiestheoriginalformofthematerialthatwasdigitized,
suchas"slide," "paper," "map," andsoforth.Thisisnotnecessarilythe
sameasIMED.
ITCH Technician.Identifiesthetechnicianwhodigitizedthesubjectfile.For
example,"Smith,John."

| CSET (Character Set) | Chunk |     |
| -------------------- | ----- | --- |
Todefinecharacter-setandlanguageinformationforaRIFFfile,usetheCSETchunk.TheCSET
chunkdefinesthecodepageandcountry, language,anddialectcodesforthefile.Thesevalues
canbeoverriddenforspecificfileelements;see"UsageCodesforExtraHeaderandExtraEntry
Fields," laterinthischapter,forinformationonspecifyingcharactersetinformationina
compoundfile.
TheCSETchunkisdefinedasfollows:
(cid:221)
<CSET chunk> CSET(<wCodePage:WORD>
<wCountryCode:WORD>
<wLanguageCode:WORD>
<wDialect:WORD> )
Thefieldsareasfollows:
| Field     | Description                                       |     |
| --------- | ------------------------------------------------- | --- |
| wCodePage | Specifiesthecodepageusedforfileelements.IftheCSET |     |
chunkisnotpresent,orifthisfieldhasvaluezero,assume
standardISO8859/1codepage(identicaltocodepage
1004withoutcodepointsdefinedinhexcolumns0,1,8,
and9).
Specifiesthecountrycodeusedforfileelements.See
wCountryCode
"CountryCodes," followingthissection,foralistof
currentlydefinedcountrycodes.
IftheCSETchunkisnotpresent,orifthisfieldhasvalue
zero,assumeUSA(countrycode001).
wLanguage, Specifythelanguageanddialectusedforfileelements.See
| wDialect | "LanguageandDialectCodes," | laterinthischapter,fora |
| -------- | -------------------------- | ----------------------- |
listoflanguageanddialectcodes.
IftheCSETchunkisnotpresent,orifthesefieldshave
valuezero,assumeUSEnglish(languagecode9,dialect
code1).
Country Codes
UseoneofthefollowingcountrycodesinthewCountryCodefield:
| CountryCode Country       |     |     |
| ------------------------- | --- | --- |
| 000 None(ignorethisfield) |     |     |
| 001 USA                   |     |     |
| 002 Canada                |     |     |
| 003 LatinAmerica          |     |     |
| 030 Greece                |     |     |
| 031 Netherlands           |     |     |

| 032      |             | Belgium                 |     |
| -------- | ----------- | ----------------------- | --- |
| 033      |             | France                  |     |
| 034      |             | Spain                   |     |
| 039      |             | Italy                   |     |
| 041      |             | Switzerland             |     |
| 043      |             | Austria                 |     |
| 044      |             | UnitedKingdom           |     |
| 045      |             | Denmark                 |     |
| 046      |             | Sweden                  |     |
| 047      |             | Norway                  |     |
| 049      |             | WestGermany             |     |
| 052      |             | Mexico                  |     |
| 055      |             | Brazil                  |     |
| 061      |             | Australia               |     |
| 064      |             | NewZealand              |     |
| 081      |             | Japan                   |     |
| 082      |             | Korea                   |     |
| 086      |             | People'sRepublicofChina |     |
| 088      |             | Taiwan                  |     |
| 090      |             | Turkey                  |     |
| 351      |             | Portugal                |     |
| 352      |             | Luxembourg              |     |
| 354      |             | Iceland                 |     |
| 358      |             | Finland                 |     |
| Language | and Dialect | Codes                   |     |
Specifyoneofthefollowingpairsoflanguage-codeanddialect-codevaluesinthewLanguage
andwDialectfields:
| LanguageCode |     | DialectCode | Language                |
| ------------ | --- | ----------- | ----------------------- |
| 0            |     | 0           | None(ignorethesefields) |
| 1            |     | 1           | Arabic                  |
| 2            |     | 1           | Bulgarian               |
| 3            |     | 1           | Catalan                 |
| 4            |     | 1           | TraditionalChinese      |
| 4            |     | 2           | SimplifiedChinese       |
| 5            |     | 1           | Czech                   |
| 6            |     | 1           | Danish                  |
| 7            |     | 1           | German                  |
| 7            |     | 2           | SwissGerman             |
| 8            |     | 1           | Greek                   |
| 9            |     | 1           | USEnglish               |
| 9            |     | 2           | UKEnglish               |
| 10           |     | 1           | Spanish                 |
| 10           |     | 2           | SpanishMexican          |
| 11           |     | 1           | Finnish                 |
| 12           |     | 1           | French                  |
| 12           |     | 2           | BelgianFrench           |
| 12           |     | 3           | CanadianFrench          |
| 12           |     | 4           | SwissFrench             |
| 13           |     | 1           | Hebrew                  |

| 14            | 1     |     | Hungarian                |
| ------------- | ----- | --- | ------------------------ |
| 15            | 1     |     | Icelandic                |
| 16            | 1     |     | Italian                  |
| 16            | 2     |     | SwissItalian             |
| 17            | 1     |     | Japanese                 |
| 18            | 1     |     | Korean                   |
| 19            | 1     |     | Dutch                    |
| 19            | 2     |     | BelgianDutch             |
| 20            | 1     |     | Norwegian-Bokmal         |
| 20            | 2     |     | Norwegian-Nynorsk        |
| 21            | 1     |     | Polish                   |
| 22            | 1     |     | BrazilianPortuguese      |
| 22            | 2     |     | Portuguese               |
| 23            | 1     |     | Rhaeto-Romanic           |
| 24            | 1     |     | Romanian                 |
| 25            | 1     |     | Russian                  |
| 26            | 1     |     | Serbo-Croatian(Latin)    |
| 26            | 2     |     | Serbo-Croatian(Cyrillic) |
| 27            | 1     |     | Slovak                   |
| 28            | 1     |     | Albanian                 |
| 29            | 1     |     | Swedish                  |
| 30            | 1     |     | Thai                     |
| 31            | 1     |     | Turkish                  |
| 32            | 1     |     | Urdu                     |
| 33            | 1     |     | Bahasa                   |
| JUNK (Filler) | Chunk |     |                          |
AJUNKchunkrepresentspadding,filleroroutdatedinformation.Itcontainsnorelevantdata;itis
aspacefillerofarbitrarysize.TheJUNKchunkisdefinedasfollows:
(cid:221)
| <JUNK chunk> | JUNK( <filler> | )   |     |
| ------------ | -------------- | --- | --- |
where<filler>containsrandomdata.
| Compound File | Structure |     |     |
| ------------- | --------- | --- | --- |
ThecompoundfilestructureisaRIFF-basedstructureuponwhichmultimediafileformatscanbe
defined.Thecompoundfilestructureisaparameterizedstructurethatprovidesforthefollowing:
- Storageofmultimediadataelements
- Directaccesstomultimediadataelements(asopposedtosequentialsearching)
Thegoalsofthecompoundfilestructurearetomaximizeflexibilityandextensibilitywhile
minimizingimplementationcosts.Usingthecompoundfilestructure,developersofmultimedia
dataformatscandefinebothsimpleandcomplexfileformats.

Thestructureisflexibleenoughtobeusedformanypurposes,butitcanbesimplifiedforusewith
simplefileformats.Designersofnewmultimediafileformatscanrestricttheuseofstandard
headerfields,requiringsomeandremovingothers.
Forexample,adevelopermightdefineacompoundfileformatthatstoresaseriesofbitmapsina
singlefile,thusreducingcompactdiscseektimes.Anotherdevelopermightdefineacompound
fileformatthatcontainsaspecialtypeofaudioresource,usingthecompoundfileheader
informationtoidentifytheattributesoftheaudiodatastoredwithin.
Structural Overview
FilesbaseduponthecompoundfilestructurecontainthefollowingtwoRIFFchunksattheir
topmostlevel:
- CompoundFileTableofContents(CTOC)chunk
- CompoundFileElementGroup(CGRP)chunk
TheCTOCchunkindexestheCGRPchunk,whichcontainstheactualmultimediadataelements.
Definedusingthestandardchunknotation,acompoundfileisrepresentedasfollows:
(cid:221)
<compound file> RIFF('type' <CTOC> <CGRP>)
where'type'isaFOURCCindicatingthefiletype.
ThissectiondescribestheCTOCandCGRPchunksindetail.
Compound File Table of Contents (CTOC) Chunk
TheCTOCchunkfunctionsmainlyasanindex,allowingdirectaccesstoelementswithina
compoundfile.TheCTOCchunkalsocontainsinformationabouttheattributesoftheentirefile
andofeachmediaelementwithinthefile.
Toprovidethemaximumflexibilityfordefiningcompoundfileformats,theCTOCchunkcanbe
customizedatseverallevels.TheCTOCchunkcontainsfieldswhoselengthandusageisdefined
byotherCTOCfields.Thisparameterizationaddscomplexity,butitprovidesflexibilitytofile
formatdesignersandallowsapplicationstocorrectlyreaddatawithoutnecessarilyknowingthe
specificfileformatdefinition.
Structural Overview
TheCTOCchunkdefinesthecontentsoftheCGRPchunk.TheCTOCchunkhasthefollowing
components:
- HeaderinformationdefiningthesizeoftheCTOCchunk,thenumberofentriesintheCGRP
chunk,thesizeoftheCGRPchunk,andgeneralinformationabouttheentireheaderfile
- Aparametertabledefinitiondefiningthesizeandcontentsoftheheaderparametertableand
CTOCtableentries

- Aheaderparametertabledefiningattributesthatapplytotheentirecompoundfile.
- CTOCtableentriesdefiningthelocation,size,name,andattributesofthecompoundfile
elementscontainedintheCGRPchunk.
ThesecomponentsappearsequentiallyintheCTOCchunk.TheindividualfieldsintheCTOC
chunkarethefollowing:
(cid:221)
<CTOC-chunk> CTOC (
<dwHeaderSize:DWORD> // Header information
<dwEntriesTotal:DWORD>
<dwEntriesDeleted:DWORD>
<dwEntriesUnused:DWORD>
<dwBytesTotal:DWORD>
<dwBytesDeleted:DWORD>
<dwHeaderFlags:DWORD>
<wEntrySize:WORD> // Parameter table definition
<wNameSize:WORD>
<wExHdrFields:WORD>
<wExEntFields:WORD>
<awExHdrFldUsage:WORD[wExHdrFields]>
<awExEntFldUsage:WORD[wExEntFields]>
// Header parameter table
<adwExHdrField:DWORD[wExHdrFields]>
[<bHeaderPad:BYTE>]
[<CTOC-table-entry>] // CTOC table entries
)
EachCTOCtableentryisdefinedasfollows:
(cid:221)
<CTOC-table-entry>
<dwOffset:DWORD>
<dwSize:DWORD>
<dwMedType:DWORD>
<dwMedUsage:DWORD>
<dwCompressTech:DWORD>
<dwUncompressBytes:DWORD>
<adwExEntField:DWORD[wExEntFields]>
<bEntryFlags:BYTE>
<achName:CHAR[wNameSize]>
[<bEntryPad:BYTE>]...
Thefollowingsectionsdescribeeachfieldindetail.

Header Information
TheheaderinformationsectiondefinesgeneralinformationabouttheCTOCheaderandaboutthe
entirecompoundfile.Itcontainsthefollowingfields:
FieldName Description
dwHeaderSize Combinedsizeofheaderinformation,parametertabledefinition,and
headerparametertable.Usethisvaluetolocatethestartofthe
CTOCtableentrieswithintheCTOCchunk.
dwEntriesTotal TotalnumberofCTOCtableentries,includingunusedentriesand
entriescorrespondingtodeletedelements.
dwEntriesDeleted NumberofCTOCtableentriesthatcorrespondtodeletedelements.
dwEntriesUnused NumberofCTOCtableentriesthatareunused.
dwBytesTotal CombinedsizeofallCGRPelements,includingdeletedelements.
dwBytesDeleted CombinedsizeofalldeletedCGRPelements.
dwHeaderFlags Flagsthatgiveinformationabouttheentirecompoundfile.The
followingflagsmaybeused:
CTOC_HF_SEQUENTIAL
ValidCTOCtableentriesarearrangedinsequentialorder.If
thisflagisnotset,theCTOCtableentriesmaybeinanarbitrary
order.
CTOC_HF_MEDSUBTYPE
ThedwMedUsagefieldofeachCTOCtableentrycontainsa
FOURCCthatindicateshowtheelementisused.Ifthisflagis
notset,thedwMedUsagefieldcontainsinformationasdefined
bytheformtype.
Parameter Table Definition
Theparametertabledefinitiondefinesthesizeandcontentsoftheheaderparametertableand
CTOCtable.Itcontainsthefollowingfields:
FieldName Description
wEntrySize SizeofeachCTOCtableentry,includinganypadbytes.
wNameSize SizeoftheachNamefieldofeachCTOCtableentry.Each
achNamefieldmustbepaddedwithnullcharacterstothislength.
TheachNamefieldisanull-terminatedstring,soitalwayscontains
atleastonetrailingnullcharacter.
wExHdrFields Numberofextraheaderfields,orentriesintheawExHdrFldUsage
andadwExHdrFieldarrays.

wExEntFields Numberofextraentryfields,orentriesintheawExEntFldUsage
andadwExHdrFieldarrays.
awExHdrFldUsage Arrayofextraheaderfieldusagefields.Eachentryinthisarray
correspondstothesamenumberedentryintheadwExHdrField
arrayanddefineshowthatentryisinterpreted.Validusagecodesfor
eachfieldinthisarrayarelistedin"UsageCodesforExtraHeader
andExtraEntryFields," laterinthischapter.Thenumberof
WORDsinthisarrayisdefinedbythewExHdrFieldsvalue.
awExEntFldUsage Arrayofextraentryfieldusagefields.Eachentryinthisarray
correspondstothesamenumberedentryintheadwExEntField
array,presentineachCTOCtableentry,anddefineshowthatentry
isinterpreted.Validusagecodesforeachfieldinthisarrayarelisted
in"UsageCodesforExtraHeaderandExtraEntryFields," laterin
thischapter.ThenumberofWORDsinthisarrayisdefinedbythe
wExEntFieldsvalue.
Header Parameter Table
Theheaderparametertableisanoptionalcomponentgenerallyusedtodefineattributesofthe
entirecompoundfile.
FieldName Type
adwExHdrField Extraheaderfields.Theusageofeachcellinthearrayisdefinedby
thecorrespondingcellintheawExHdrFldUsagearray.
ThenumberofDWORDsinthisarrayisdefinedbythe
wExHdrFieldsvalue.
bHeaderPad ZeroormoreNULLpadbytes.Theremustbeenoughpaddingin
thisfieldtomaketheCTOCheaderanevennumberofbytesin
length.
CTOC Table Entries
TheCTOCtableentriesdefinethelocation,size,name,andotherinformationabouttheindividual
compoundfileelementscontainedintheCGRPchunk.ThenumberofCTOCtableentriesis
determinedbythedwEntriesTotalfieldintheheaderinformationoftheCTOCchunk.

EachCTOCtableentryisastructurecontainingthefollowingfields:
FieldName Description
dwOffset Byteoffsetofthecompoundfileelementmeasuredfromthe
beginningofthedataportionoftheCGRPchunk.
Forexample,ifdwOffsetis1000andthechunkIDoftheCGRP
chunkisatoffset500,theelementisatoffset1508(1000+500+4
(chunkID)+4(chunksizefield)).
dwSize Sizeoftheelementinbytes.
dwMedType FOURCCvalueidentifyingthemediaelementtypeofthecompound
fileelement.Thisfieldmaybezeroifthecompoundfileelementis
nottobeinterpretedasastandalonefile.Ifthecompoundfile
elementisaRIFFform,thenthemediaelementtypeisthesameas
theRIFFformtype.
dwMedUsage Extrausageinformationforthecompoundfileelement.
IftheCTOC_HF_MEDSUBTYPEflagissetinthedwHeaderFlags
field,thisfieldcontainsaFOURCCthatindicateshowtheelement
isused.Toavoidnameconflicts,thisFOURCCmustberegistered.
See"RegisteringMultimediaFormats" inChapter1,"Overviewof
MultimediaSpecifications," forinformationonusagecodes.
IftheCTOC_HF_MEDSUBTYPEflagisnotsetinthe
dwHeaderFlagsfield,thisfieldcontains32bitsofinformation
interpretedasdefinedbytheformtype.
dwCompressTech Compressiontechniqueusedtocompressthemediaelement.Ifthis
valueiszero,theelementisnotcompressed.See"Compressionof
CompoundFileElements," laterinthischapter,formore
information.
dwUncompressBytes Numberofbytesthecompoundfileelementoccupiesinmemory
afterdecompression.Thisvalueassumesthedecompression
techniqueidentifiedinthedwCompressTechfield.Ifthe
dwCompressTechfieldis0,thenthecompoundfileelementisnot
compressed,andthisfieldshouldequalthedwSizefield.
adwExEntField Arrayofextraentryfieldsdefiningattributesofthiscompoundfile
element.Theusageofeachcellinthearrayisdefinedbythe
correspondingcellintheawExEntFldUsagearray.
ThenumberofDWORDsinthisarrayisdefinedbythe
wExEntFieldsvalue.
bEntryFlags Flagsgivinginformationaboutthecompoundfileelementorthis
CTOCtableentry.Possiblevaluesfollow;thesemaybecombined:
CTOC_EF_DELETED
Compoundfileismarkedasdeletedandshouldnotbeaccessed.
DonotcombinethisflagwiththeCTOC_EF_UNUSEDflag.
CTOC_EF_UNUSED
CTOCtableentryisunusedanddoesnotrefertoanycompound
fileelement.Thisentrycanbeusedtorefertoanewcompound
fileelement.Donotcombinethisflagwiththe
CTOC_EF_DELETEDflag.
achName Arrayofcharacterscontainingthenameofthecompoundfile

element.Thenumberofbytesinthisarrayisdefinedbythe
wNameSizevalue.
ThestringmustbepaddedontherightwithNULLcharactersand
mustbeterminatedbyatleastoneNULLcharacter.Thisfieldmust
beanoddnumberofbytesinlengthandmustbeatleastonebyte
long.
bEntryPad ZeroormoreNULLpadbytesasneededtomakethetableentryan
evennumberofbytesinlength.
Usage Codes for Extra Header and Extra Entry Fields
ThefollowingarevalidusagecodesforelementsintheawExHdrFldUsageand
awExEntFldUsagearrays,bothofwhicharefieldsoftheCTOCheader.Thesearraysdefinethe
meaningofdatastoredintheadwExHdrFieldandadwExEntField"extrafields." Allusage
codesapplytobothheaderfieldsandentryfields,unlessexplicitlystatedotherwise.
ValuesmarkedintheextraheaderfieldarraysgenerallyapplytoallelementsintheCFRGchunk,
whilevaluesmarkedintheextraentryfieldarraysgenerallyapplyonlytotheelementreferenced
bythecorrespondingCTOCtableentry.
Flag Description
CTOC_EFU_UNUSED(0x00) Thefieldisunused.Thisusagecodemaybeusedto
logicallydeleteaheaderfield.
CTOC_EFU_LASTMODTIME Whenusedtodescribeanextraheaderfield,thefield
(0x01) containsthetimethatanyportionoftheCTOCorCGRP
waslastmodified.
Whenusedtodescribeanextraentryfield,thefield
containsthetimethatthecorrespondingCTOCtableentry,
orthecompoundfileelementitrefersto,waslastmodified.
ThefieldisinterpretedasaDWORDcontainingthe
numberofsecondsthathaveelapsedsince00:00:00
GreenwichMeanTime(GMT),January1,1970.
CTOC_EFU_CODEPAGE Thefieldcontainsthecodepageandcountrycodeforthe
achNamefield.Thesevaluesoverrideanyvaluesspecified
inaCSETchunk.
Whenusedtodescribeanextraheaderfield,thefield
containscode-pageandcountry-codeinformationforall
CTOCtableentries.Whenusedtodescribeanextraentry
field,thefieldcontainsinformationforthatspecificCTOC
tableentry.
Thelow-orderwordofthefieldcontainsoneofthe
followingcodepagevalues:
Zero
UsestandardISO8859/1codepage.Thisisidenticalto
codepage1004withoutcodepointsdefinedinhex
columns0,1,8,and9.
CTOC_CHARSET_CODEPAGE(0x0000nnnn)

Usecodepage0xnnnn,where0xnnnnisthe16-bit
codepagenumber.Forexample,0x00000352forOS/2
codepage850,or0x000004E4forWindows3.1code
page1252.
Thehigh-orderwordcontainsoneofthefollowingcountry
codes:
Zero
Ignorethisfield.
Countrycode
See"CountryCodes," earlierinthischapter,foralist
ofcurrentlydefinedcountrycodes.
CTOC_EFU_LANGUAGE Thefieldcontainslanguageanddialectinformationforthe
achNamefield. Thesevaluesoverrideanyvaluesspecified
inaCSETchunk.
Whenusedtodescribeanextraheaderfield,thefield
containslanguageinformationforallCTOCtableentries.
Whenusedtodescribeanextraentryfield,thefield
containsinformationforthatspecificCTOCtableentry.
Thelow-orderwordofthefieldcontainsoneofthe
followinglanguagecodes:
Zero
Ignorethisfield.
Languagecode
See"LanguageandDialectCodes," earlierinthis
chapter,foralistofcurrentlydefinedlanguagecodes.
Thehigh-orderwordofthefieldcontainsoneofthe
followingdialectcodes:
Zero
Ignorethisfield.
Dialectcode
See"LanguageandDialectCodes," earlierinthis
chapter,foralistofcurrentlydefineddialectcodes.
CTOC_EFU_COMPRESSPARAM0 Specifiesacompressionparameter.See"Compressionof
(0x05)through CompoundFileElements," laterinthischapter.
CTOC_EFU_COMPRESSPARAM9
(0x14)
Compression of Compound File Elements
Compoundfileelementscanbecompressed.ThedwCompressTechfieldofaCTOCtableentry
containsaFOURCCcompressiontechniqueidentifierforthecorrespondingcompoundfile
element.Ifthefieldiszero,thecompoundfileelementisnotcompressed.
Thedefinitionofaspecificcompressiontechniquemayspecifythateithertheentirecompound
fileelementiscompressed,orthatsomespecificsubset,forexampleoneormoreRIFFchunks,is
compressed.

ThedwUncompressSizefieldcontainsthenumberofbytesthatthecompoundfileelementwill
occupyinmemoryafterdecompression.Ifthecompoundfileelementisnotcompressed,thisfield
containthesamevalueasthedwSizefield,whichidentifiesthefilesizeofthecompoundfile
element.
Compressiontechniquesmaydemandextraheaderfieldsorextraentryfieldsfordecompression
parameters.Compressiontechniqueidentifiers,andanynewentryfieldscorrespondingto
decompressiontechniqueparameters,mustbeunique.See"RegisteringMultimediaFormats" in
Chapter1,"OverviewofMultimediaSpecifications," forinformationonregisteringcompression
techniques.
Compound File Element Group (CGRP) Chunk
TheactualelementsofdatareferencedbytheCTOCchunkarestoredinacompoundfileElement
Group(CGRP)chunk.TheCGRPchunkcontainsallthecompoundfileelements,concatenated
togetherintoonecontiguousblockofdata.SomeoftheelementsintheCGRPchunkmightbe
unused,iftheelementwasmarkedfordeletionorwasalteredandstoredelsewherewithinthe
CGRPchunk.
ElementswithintheCGRPchunkareofarbitrarysizeandcanappearinaspecificorarbitrary
order,dependinguponthefileformatdefinition.Eachelementisidentifiedbyacorresponding
CTOCtableentry.
UsingthestandardRIFFnotation,theCGRPchunkisdefinedasfollows:
(cid:221)
<CGRP-chunk> CGRP([<compound file element>]...)
Placement of the CTOC and CGRP Chunks
Thespecificfileformatdefinitioncanspecifywhichofthetwochunksappearfirstthedatafile.
Generally,theCTOCchunkisplacedatthefrontofthefiletoreducetheseekandreadtimes
requiredtoaccessit.Duringauthoringtime,anapplicationmightplacetheCTOCchunkatthe
endofthefile,soitcanbeexpandedaselementsareaddedtotheCGRPchunk.

C hap ter 3
Multimedia File Formats
Thischapterdescribesthemultimediafileformats.Mostofthesefileformatsarebasedonthe
ResourceInterchangeFileFormat(RIFF),describedinChapter2.
Thischapterdescribesthefollowingfileformats:
- BundleFileFormat(BND)
- DeviceIndependentBitmapFileFormat(DIB)
- RIFFDIBFileFormat(RDIB)
- MusicalInstrumentDigitalInterfaceFileFormat(MIDI)
- RIFFMIDIFileFormat(RMID)
- PaletteFileFormat(PAL)
- RichTextFormat(RTF)
- WaveformAudioFileFormat(WAVE)
Bundle File Format
TheBundle(BND) formatcontainsaseriesofRIFFchunksorothermultimediafiles.TheBND
fileisdefinedasfollows:
(cid:221)
<BND-file> RIFF('BND' <CTOC-chunk> <CGRP-chunk> )
The<CTOC-chunk>and<CGRP-chunk>formatsaredefinedin"CompoundFileStructure,"
inChapter2,"ResourceInterchangeFileFormat."
Eachcompoundfileelementmustbecapableofstandingaloneasanindependentfile.Anelement
maynotbearandomchunk(excepttheRIFFchunk,indicatingaRIFFfile)orrandombinarydata
(unlessthebinarydataissupposedtobetreatedasafile).

| Device | Independent | Bitmap | File Format |
| ------ | ----------- | ------ | ----------- |
TheDeviceIndependentBitmap(DIB)formatrepresentsbitmapimagesinadevice-independent
manner.Bitmapscanberepresentedat1,4,and8bitsperpixel,withapalettecontainingcolors
representedin24bits.Bitmapscanalsoberepresentedat24bitsperpixelwithoutapaletteandin
arun-lengthencodedformat.
ThisdocumentationdescribesthreetypesofDIBfiles:
| •   | Windowsversion3.0device-independentbitmapfiles                 |     |     |
| --- | -------------------------------------------------------------- | --- | --- |
| •   | OS/2PresentationManagerversion1.2device-independentbitmapfiles |     |     |
| •   | RIFFdevice-independentbitmapfiles                              |     |     |
TheWindows3.0andPresentationManager1.2DIBsaresimilar,sotheyarediscussedtogether.
| Overview | of DIB Structure |     |     |
| -------- | ---------------- | --- | --- |
Windows3.0andPresentationManager1.2DIBfilesconsistofthefollowingsequenceofdata
structures:
| •   | Afileheader                            |     |     |
| --- | -------------------------------------- | --- | --- |
| •   | Abitmapinformationheader               |     |     |
| •   | Acolortable                            |     |     |
| •   | Anarrayofbytesthatdefinesthebitmapbits |     |     |
Thefollowingsectionsdescribeeachofthesestructures.
| Bitmap | File Header |     |     |
| ------ | ----------- | --- | --- |
Thebitmapfileheadercontainsinformationaboutthetype,size,andlayoutofadevice-
independentbitmap(DIB)file.InboththeWindows3.0andPresentationManager1.2DIBs,itis
definedasaBITMAPFILEHEADERdatastructure:
|     | typedef struct | tagBITMAPFILEHEADER | {   |
| --- | -------------- | ------------------- | --- |
|     | WORD           | bfType;             |     |
|     | DWORD          | bfSize;             |     |
|     | WORD           | bfReserved1;        |     |
|     | WORD           | bfReserved2;        |     |
|     | DWORD          | bfOffBits;          |     |
} BITMAPFILEHEADER;
Thefollowingtabledescribesthefields.
| Field |     | Description |     |
| ----- | --- | ----------- | --- |
bfType Specifiesthefiletype.ItmustconsistofthecharactersequenceBM

(WORDvalue0x4D42).
| bfSize      | Specifiesthefilesizeinbytes. |     |     |
| ----------- | ---------------------------- | --- | --- |
| bfReserved1 | Reserved.Mustbesettozero.    |     |     |
| bfReserved2 | Reserved.Mustbesettozero.    |     |     |
bfOffBits SpecifiesthebyteoffsetfromtheBITMAPFILEHEADERstructure
totheactualbitmapdatainthefile.
| Bitmap Information Header |     |     |     |
| ------------------------- | --- | --- | --- |
TheBITMAPINFOandBITMAPCOREINFOdatastructuresdefinethedimensionsandcolor
informationforWindows3.0andPresentationManager1.2DIBs,respectively.Theyaredefined
asfollows:
| Windows3.0DIB |     | PresentationManager1.2DIB |     |
| ------------- | --- | ------------------------- | --- |
typedef struct tagBITMAPINFO { typedef struct _BITMAPCOREINFO {
| BITMAPINFOHEADER      | bmiHeader; | BITMAPCOREHEADER         | bmciHeader; |
| --------------------- | ---------- | ------------------------ | ----------- |
| RGBQUAD bmiColors[1]; |            | RGBTRIPLE bmciColors[1]; |             |
| } BITMAPINFO;         |            | } BITMAPCOREINFO;        |             |
Thesestructuresareessentiallyalike,andthissectiondiscussesthemsimultaneously.Eachfield
namefortheWindowsBITMAPINFOstructureisfollowedbythecorrespondingfieldnamefor
thePresentationManagerBITMAPCOREINFO1.2structure,inparentheses.
Thefollowingtabledescribesthefields.
| Windows(PM)Field | Description                                    |     |     |
| ---------------- | ---------------------------------------------- | --- | --- |
| bmiHeader        | Specifiesinformationaboutthedimensionsandcolor |     |     |
| (bmciHeader)     | formatoftheDIB.TheBITMAPINFOHEADERand          |     |     |
BITMAPCOREHEADERdatastructuresaredescribedin
thenextsection.
| bmiColors    | SpecifiestheDIBcolortable.TheRGBQUADand      |     |     |
| ------------ | -------------------------------------------- | --- | --- |
| (bmciColors) | RGBTRIPLEdatastructuresaredescribedin"Bitmap |     |     |
ColorTable," laterinthischapter.

Information Header Structures
TheBITMAPINFOHEADERandBITMAPCOREHEADERstructurescontaininformationabout
thedimensionsandcolorformatofWindows3.0andPresentationManager1.2DIBs,
respectively.Theyaredefinedasfollows:
Windows3.0DIB PresentationManager1.2DIB
typedef struct tagBITMAPINFOHEADER { typedef struct tagBITMAPCOREHEADER {
DWORD biSize; DWORD bcSize;
DWORD biWidth; WORD bcWidth;
DWORD biHeight; WORD bcHeight;
WORD biPlanes; WORD bcPlanes;
WORD biBitCount; WORD bcBitCount;
DWORD biCompression; } BITMAPCOREHEADER;
DWORD biSizeImage;
DWORD biXPelsPerMeter;
DWORD biYPelsPerMeter;
DWORD biClrUsed;
DWORD biClrImportant;
} BITMAPINFOHEADER;
Becausethesestructuresareessentiallyalike,exceptfortheaddedfieldsintheWindows3.0
structure,thissectiondiscussesthemsimultaneously.EachfieldnamefortheWindowsstructure
isfollowedbythecorrespondingfieldnameforthePresentationManagerstructure,in
parentheses.
CommonFields
ThefollowingfieldsarepresentinboththeWindows3.0andPresentationManager1.2formats:
Windows(PM)Field Description
biSize(bcSize) Specifiesthenumberofbytesrequiredbythe
BITMAPINFOHEADERstructure.Youcanusethisfield
todistinguishbetweenWindows3.0andPresentation
Manager1.2DIBs.
biWidth(bcWidth) SpecifiesthewidthoftheDIBinpixels.
biHeight(bcHeight) SpecifiestheheightoftheDIBinpixels.
biPlanes(bcPlanes) Specifiesthenumberofplanesforthetargetdevice.Must
mustbesetto1.
wBitCount(bcBitCount) Specifiesthenumberofbits-per-pixel.See"Interpreting
theColorTable," laterinthissection,formore
information.

WindowsFields
ThefollowingfieldsarepresentonlyintheWindows3.0BITMAPINFOHEADERstructure:
Field Description
biCompression Specifiesthetypeofcompressionforacompressedbitmap.Itcanbe
oneofthefollowingvalues:
Value Meaning
BI_RGB Specifiesthatthebitmapisnotcompressed.
BI_RLE4 Specifiesarun-lengthencodedformatforbitmapswith
4bits-per-pixel.Thecompressionformatisatwo-byte
formatconsistingofacountbytefollowedbytwo
word-lengthcolorindexes.
BI_RLE8 Specifiesarun-lengthencodedformatforbitmapswith
8bits-per-pixel.Thecompressionformatisatwo-byte
formatconsistingofacountbytefollowedbyacolor-
indexbyte.
See"Windows3.0BitmapCompressionFormats" laterinthis
documentforinformationabouttheencodingschemes.
biSizeImage Specifiesthesizeinbytesoftheimage.
biXPelsPerMeter Specifiesthehorizontalresolutioninpixelspermeterofthetarget
deviceforthebitmap.Anapplicationcanusethisvaluetoselecta
bitmapfromaresourcegroupthatbestmatchesthecharacteristicsof
thecurrentdevice.
biYPelsPerMeter Specifiestheverticalresolutioninpixelspermeterofthetarget
deviceforthebitmap.
biClrUsed Specifiesthenumberofcolorvaluesinthecolortableactuallyused
bythebitmap.Possiblevaluesfollow.
Value Result
0 Bitmapusesthemaximumnumberofcolors
correspondingtothevalueofthewBitCountfield.
Nonzero IfthewBitCountvalueislessthan24,thebiClrUsed
valueindicatestheactualnumberofcolorswhichthe
graphicsengineordevicedriverwillaccess.
IfthewBitCountvalueis24,thebiClrUsedvalue
indicatesthesizeofthereferencecolortableusedto
optimizeperformanceofWindowscolorpalettes.
Ifthebitmapisa"packed" bitmap(thatis,abitmapinwhichthe
bitmaparrayimmediatelyfollowstheBITMAPINFOheaderand
whichisreferencedbyasinglepointer),thebiClrUsedfieldmustbe
setto0ortotheactualsizeofthecolortable.See"Interpretingthe
ColorTable," laterinthissection,formoreinformationonhowthis
fieldaffectstheinterpretationofthecolortable.
biClrImportant Specifiesthenumberofcolorindexesthatareconsideredimportant

fordisplayingthebitmap.Ifthisvalueis0,thenallcolorsare
important.
Bitmap Color Table
Thecolortableisacollectionof24-bitRGBvalues.Thereareasmanyentriesinthecolortableas
therearecolorsinthebitmap.Thecolortableisn'tpresentforbitmapswith24colorbitsbecause
eachpixelisrepresentedby24-bitRGBvaluesintheactualbitmapdataarea.
| Color Table | Structure |     |     |     |     |
| ----------- | --------- | --- | --- | --- | --- |
ThecolortableforWindows3.0andPresentationManager1.2DIBsconsistsofanarrayof
RGBQUADandRGBTRIPLEstructures,respectively.Thesestructuresaredefinedasfollows:
| Windows3.0DIB     |            |     | PresentationManager1.2DIB |              |     |
| ----------------- | ---------- | --- | ------------------------- | ------------ | --- |
| typedef struct    | tagRGBQUAD | {   | typedef struct            | tagRGBTRIPLE | {   |
| BYTE rgbBlue;     |            |     | BYTE rgbtBlue;            |              |     |
| BYTE rgbGreen;    |            |     | BYTE rgbtGreen;           |              |     |
| BYTE rgbRed;      |            |     | BYTE rgbtRed;             |              |     |
| BYTE rgbReserved; |            |     | } RGBTRIPLE;              |              |     |
} RGBQUAD;
Becausethesestructuresareessentiallyalike,thissectiondiscussesthemsimultaneously.Each
fieldnamefortheWindowsRGBQUADstructureisfollowedbythecorrespondingfieldnamefor
thePresentationManagerRGBTRIPLEstructure,inparentheses.
| Order of Colors |     |     |     |     |     |
| --------------- | --- | --- | --- | --- | --- |
Thecolorsinthetableshouldappearinorderofimportance.Thiscanhelpadevicedriverrendera
bitmaponadevicethatcannotdisplayasmanycolorsasthereareinthebitmap.IftheDIBisin
Windows3.0format,thedrivercanusethebiClrImportantfieldoftheBITMAPINFOHEADER
structuretodeterminewhichcolorsareimportant.
Field Descriptions
TheRGBQUAD(RGBTRIPLE)structurecontainsthefollowingfields:
Windows(PM)Field Description
rgbBlue(rgbtBlue) Specifiestheblueintensity.
rgbGreen(rgbtGreen) Specifiesthegreenintensity.
rgbRed(rgbtRed) Specifiestheredintensity.
rgbReserved(noPMequivalent) Notused.Mustbesetto0.

| Locating | the | Color | Table |
| -------- | --- | ----- | ----- |
AnapplicationcanusethebiSize(bcSize)fieldoftheBITMAPINFOHEADER
(BITMAPCOREHEADER)structuretolocatethecolortable.Eachofthefollowingstatements
assignsthepColorvariablethebyteoffsetofthecolortablefromthebeginningofthefile:
| // Windows      | 3.0                      | DIB       |                                 |
| --------------- | ------------------------ | --------- | ------------------------------- |
| pColor          | = (LPSTR)pBitmapInfo     |           | + (WORD)pBitmapInfo->biSize     |
| // Presentation |                          | Manager   | 1.2 DIB                         |
| pColor          | = (LPSTR)pBitmapCoreInfo |           | + (WORD)pBitmapCoreInfo->bcSize |
| Interpreting    |                          | the Color | Table                           |
ThebiSize(bcSize)fieldoftheBITMAPINFOHEADER(BITMAPCOREHEADER)structure
specifieshowmanybitsdefineeachpixelandspecifiesthemaximumnumberofcolorsinthe
bitmap.Itsvalueaffectsyourinterpretationofthecolortable.
ThebiSize(bcSize)fieldcanhaveanyofthefollowingvalues:
| Value |     | Meaning |     |
| ----- | --- | ------- | --- |
1 Thebitmapismonochrome,andthecolortablecontainstwoentries.Eachbit
inthebitmaparrayrepresentsapixel.Ifthebitisclear,thepixelisdisplayed
withthecolorofthefirstentryinthecolortable.Ifthebitisset,thepixelhas
thecolorofthesecondentryinthetable.
| 4   |     | Thebitmaphasamaximumof16colors.Eachpixelinthebitmapis |     |
| --- | --- | ----------------------------------------------------- | --- |
representedbyafour-bitindexintothecolortable.
Forexample,ifthefirstbyteinthebitmapis0x1F,thenthebyterepresents
twopixels.Thefirstpixelcontainsthecolorinthesecondtableentry,andthe
secondpixelcontainsthecolorinthe16thtableentry.
| 8   |     | Thebitmaphasamaximumof256colors.Eachpixelinthebitmapis |     |
| --- | --- | ------------------------------------------------------ | --- |
representedbyabyte-sizedindexintothecolortable.Forexample,ifthefirst
byteinthebitmapis0x1F,thenthefirstpixelhasthecolorofthethirty-
secondtableentry.
24 Thebitmaphasamaximumof224colors.ThebmiColors(bmciColors)field
isNULL,andeachthreebytesinthebitmaparrayrepresenttherelative
intensitiesofred,green,andblue,respectively,ofapixel.
NoteonWindowsDIBs
ForWindows3.0DIBs,thefieldoftheBITMAPINFOHEADERstructurespecifiesthenumberof
colorindexesinthecolortableactuallyusedbythebitmap.IfthebiClrUsedfieldissetto0,the
bitmapusesthemaximumnumberofcolorscorrespondingtothevalueofthefield.

| Bitmap | Data |     |     |     |     |     |     |     |     |
| ------ | ---- | --- | --- | --- | --- | --- | --- | --- | --- |
Thebitsinthearrayarepackedtogether,buteachlineofpixels,orscanline,mustbezero-padded
toendonaLONGboundary.Whenthebitmapisinmemory,segmentboundariescanappear
anywhereinthebitmap.Theoriginofthebitmapisthelower-leftcorner.Thefollowingsection
discussescompressionformatsfortheWindows3.0bitmapdata.
| Windows |     | 3.0 Bitmap | Compression |     |     | Formats |     |     |     |
| ------- | --- | ---------- | ----------- | --- | --- | ------- | --- | --- | --- |
Windowssupportsrun-lengthencodedformatsforcompressing4-and8-bitbitmaps.
Compressionreducesthediskandmemorystoragerequiredforthebitmap.Thefollowingsections
describethecompressionformats.
|     | Compression |     | of 8-Bit-Per-Pixel |     |     | DIBs |     |     |     |
| --- | ----------- | --- | ------------------ | --- | --- | ---- | --- | --- | --- |
WhenthebiCompressionfieldissettoBI_RLE8,thebitmapiscompressedusingarun-length
encodingformatforan8-bitbitmap.Thisformatusestwomodes:
RDIB' formis defined as follows, using the standard RIFF formdefinition notation:
(cid:221)
|     | <RDIB-form> |     |     | RIFF | ( 'RDIB' |     | data( <DIB-data> | ))  |     |
| --- | ----------- | --- | --- | ---- | -------- | --- | ---------------- | --- | --- |
The<DIB-data>formatisdefinedin"DeviceIndependentBitmapFileFormat," earlierinthis
chapter.
| Extended |     | RDIB Format |     |     |     |     |     |     |     |
| -------- | --- | ----------- | --- | --- | --- | --- | --- | --- | --- |
TheextendedRDIBformat,designedtoincorporateenhancementssuchascompression,is
definedasfollows:
(cid:221)
<RDIB-form>

RIFF('RDIB'
|     |     |     |     |     | <bmhd-ck>     |     |     | // Bitmap   | header chunk  |
| --- | --- | --- | --- | --- | ------------- | --- | --- | ----------- | ------------- |
|     |     |     |     |     | [ <pal-file>  |     | |   | // Internal | palette chunk |
|     |     |     |     |     | <XPAL-ck>     |     | ]   | // External | palette chunk |
|     |     |     |     |     | <bitmap-data> |     | )   | // Bitmap   | data          |
The<pal-file>chunkcanbeanyofthepalette-fileformatsdiscussedin"PaletteFileFormat,"
laterinthischapter.The<bmhd-ck>,<XPAL-chunk>,and<bitmap-data>aredescribedinthe
followingsections.
|     | Bitmap | Header | Chunk |     |     |     |     |     |     |
| --- | ------ | ------ | ----- | --- | --- | --- | --- | --- | --- |
The<bmhd-ck>bitmapheaderchunkisdefinedasfollows:
(cid:221)
|     | <bmhd-chunk> |       | bmhd(        | struct | {   |     |                   |              |            |
| --- | ------------ | ----- | ------------ | ------ | --- | --- | ----------------- | ------------ | ---------- |
|     |              | DWORD | dwMemSize;   |        |     |     | // If dwPelFormat | is 'data',   | only these |
|     |              | DWORD | dwPelFormat; |        |     |     | // four fields    | are present. |            |
|     |              | WORD  | wTransType;  |        |     |     |                   |              |            |

DWORD dwTransVal;
DWORD dwHdrSize; // Fields from dwHdrSize forward match
DWORD dwWidth; // the Windows BITMAPINFOHEADER
DWORD dwHeight; // structure, though some fields can
WORD dwPlanes; // contain new values.
WORD dwBitCount;
DWORD dwCompression;
DWORD dwSizeImage;
DWORD dwXPelsPerMeter;
DWORD dwYPelsPerMeter;
DWORD dwClrUsed;
DWORD dwClrImportant;
} )
IfthedwCompressionfieldequalsBI_RGBorBI_RLE8orBI_RLE4,thentheextendedRDIB
hasthesamebitmapformatasasimpleRDIB.
Eachpixelformatdefinestheorientation,orpositionofthebitmaporigin.Windowsbitmaps
(identifiedbyavalueof'data'inthedwPelFormatfield)havetheoriginatthebottomleft.By
default,theotherformatshavetheoriginatthetopleft.
Field Description
dwMemSize Equaltothesizeofthebitmapbitsifthebitsareuncompressed.For
RDIBswithdwPelFormatequalto'data,'dwMemSizehasoneofthe
followingvalues:
ImageType FieldValue
Non-RLE SameasdwSizeImagevalue
8-bitRLE Sizeasanuncompressed,8-bitimage
4-bitRLE Sizeasanuncompressed,4-bitimage
dwPelFormat SpecifiesaFOURCCcodedefiningthepixelformatofthebitmapdata.
Thebitmapdataisstoredinachunk(orchunks)thathasthesame
chunkIDasiscontainedindwPelFormat.Thecompressionscheme
andpixeldepthofthebitmapdataarerecordedinthedwCompression
anddwBitCountfields.Thecurrentbitmapdatavaluesareasfollows:
Value BitmapDataLocationandFormat
'data' Bitmapdataisstoredina'data'chunkusingtheformat
definedforWindows3.0deviceindependentbitmaps
(DIBs).Anapplicationcandisplaythebitmapproperly
evenifthefieldsafter(andincluding)dwMemSizeare
ignored.
'palb' Bitmapdataisstoredina'palb'chunk.Thepixelformat
isoneoftheWindows3.0RGBpalettizedformats(1to8
bpp,dependingonthevalueofthedwBitCountfield).
'rgbb' Bitmapdataisstoredina'rgbb'chunk.Pixelformatis
packed,unpalettizedRGBrepresentedat16,24,or32
bitsperpixel.Thefollowingshowstheorderingofthe
RGBbitsforeachpixel-depthvalue.Thefirstextrabit(if
present)isthehigh-orderbit.
dwBitCount Extra Red Green Blue

15 1 5 5 5
16 0 5 6 5
24 0 8 8 8
32 8 8 8 8
'yuvb' Bitmapdataisstoredina'yuvb'chunk.Pixelformatis
packed,unpalettizedYUV.Theexactpixelformatis
currentlyundefined.Bythetimethisdraftisfinal,the
pixelformatwillbedefinedsimilarlytothe'rgbb'
definition.
wTransType Specifiesthetypeoftransparencyrepresentation,ifany,usedforthis
image.Thisisnormallyusedforeitherimageoverlayapplications,
whereoneimagemaybevisuallyontopofanother,andallpelsofthe
transparencycolorshouldnotbedrawn.Examplesincludesprites,clip
artandmotionvideooverlay.Whereverthetransparencycoloroccurs
inthepicture,thebackgroundshouldbevisible.
Thisinformationisstoredwiththeimage,sothatmultipleimagesthat
usethesamecolormapmayallhavedifferenttransparencycolor.
Thereare5differentvaluesforthetransparencyvariable.Theseare:
Value Result
BITT_NONE Nopelsareconsideredtransparentinthis
(0x0000) image.
BITT_MAPINDEX Oneofthecolormap/paletteentriesshouldbe
(0x0001) consideredthetransparencycolor.All
instancesofthispelshouldNOTbedrawn,
andtheexistingbackgroundshouldbe
allowedtoshowthrough.
BITT_SINGLECOLOR AsingleRGBorYUVvalueisconsidered
(0x0002) transparentandshouldnotbedrawn.
BITT_BITPLANE Anindividualbitplaneisconsidered
(0x0003) transparent,andallpelsthathavethatbitor
bits"on" shouldnotbedrawn.
BITT_MULTILEVEL Asetofbitsindicatemultiplelevelsof
(0x0004) transparencyoropacity.Thisisusuallyused
with32-bitRGB,wherethehigh8bits
indicatetransparency.
dwTransVal Thesebytesallowtheimagedefinitiontoindicatetheexactinformation
aboutthetransparentcolor.Theinformationisdependentonthevalue
ofthewTransTypeasfollows:
wTransType dwTransValContents
BITT_NONE Notused.
BITT_MAPINDEX Specifiesapaletteindex,either0through16
or0through255,dependingonthenumberof
paletteentries.
BITT_SINGLECOLOR SpecifiesanRGBorYUVvalue(2to4bytes
insize,dependingonthepixelformat

specifiedbydwPelFormat).Allpelsthat
matchdwTransValshouldbeconsidered
transparent.
BITT_BITPLANE Specifiesabitmaskidentifyingthebitsused
toindicateatransparentpel.Anypelthathas
thissetofbitssetistotallytransparent.This
allowsmultiplecolorstobeconsidered
transparent.Thismethodworksforpalettized
images;inthiscase,thevaluereferstoamap
entrythatisconsideredtransparent.
BITT_MULTILEVEL Specifiesbitstousefortransparencylevels.
Thesebitsactasamaskoneverypel,and
eachpelcanbematchedtothemaskto
determinethetransparencylevelforthepel.
Forexample,ifdwTransValhasvalue
0xFF000000,thenthereare256levelsof
transparency.Eachpelcanbeevaluated
againstthemask.Ifthepelhasavalue
FFxxxxxx,thenitisfullytransparent.Ifthe
pelhasavalue00xxxxxx,thenitisfully
visible.Ifthepelhasavalue7Fxxxxxx,then
thepelishalfvisible.
dwHdrSize Specifiesthesizeofthedataportionofthe<bmhdr>chunk.Thisis
always40,thesizeoftheBITMAPINFOHEADERstructure.
dwWidth SpecifiesthewidthoftheDIBinpixels.
dwHeight SpecifiestheheightoftheDIBinpixels.
wPlanes Specifiesthenumberofplanes.Thisvalueisnormally1,butitcanbe3
or4for24-bitRGBand32-bitRGBimages,respectively.Ina
multiplaneDIB,eachcolorcomponent(forexample,red,green,and
blue)isstoredasaseparateplane,andeachplanisstoredinaseparate
bitmapdatachunk.Forexample,ina3-plane,24-bit'rgbb'bitmap,the
redcolorsarestoredinone'rgbb'chunk,thegreencolorsinasecond
'rgbb'chunk,andthebluecolorsinathird'rgbb'chunk.
AllowingtheseparateRGBplanestobecompressedindependentlycan
dramaticallyimprovethecompressionratio.ThewPlanesvaluemust
be1ifdwPelFormatequals'data'.
wBitCount Specifiesthenumberofbitsperpixel.IfthedwPelFormatfieldequals
'data',thisfieldmustcontainvaluescompatiblewiththeWindows3.0
DIBdefinition.
dwCompression Specifiesthetypeofcompressionforacompressedbitmap.Itcanbe
oneofthefollowingvalues:
Value Meaning
BI_NONE Specifiesthatthebitmapisnotcompressed.Pixel
(0xFFFF0000) valuesarenotpaddedtofour-byteboundaries.
BI_RGB Specifiesthatthebitmapisanuncompressed,1-,
(0x00000000) 4-,8-,ora24-bitimage.For24-bitimages,the
paletteisoptional.Bitmapbitsarerepresentedas
definedbyWindows3.0forBI_RGBDIBs.The

dwPelFormatfieldmustbesetto'data'.
BI_RLE8 Specifiesarun-lengthencoded,compressed
(0x00000001) bitmap(asdefinedbyWindows3.0BI_RLE8
DIBs).Thepaletteisrequired.ThedwPelFormat
fieldmustbesetto'data'.
BI_RLE4 Specifiesarun-lengthencoded,compressed
(0x00000002) bitmap(asdefinedbyWindows3.0BI_RLE4
DIBs).Thepaletteisrequired.ThedwPelFormat
fieldmustbesetto'data'.
BI_PACK SpecifiesasimplePACKBITSbytecompression
(0xFFF0001) schemeconsistingofone-bytecountsfollowedby
bytedata,intheform:
<countbyten><databyte1><databyte2>...<databyten>
<countbyten><databytetorepeat>
Thehigh-orderbitofthecountbytenisadecision
bit:
nValue DataRepresentation
n<0x80 Arunofn+1non-repeatingbytes
follows.
n>0x80 Databyteisrepeated(n-0x80+1)
times.
n=0x80 Reserved.
BI_TRANS Specifiestransitionalcompression,usingatableof
(0xFFFF0002) bytetransitionsorsequences.See"Transitional
Compression," followingthistable.
BI_CCC SpecifiesCCCcompression,amethodinvolving
(0xFFFF0003) encodingeach4-by-4blockoftheimageusing
twocolors.See"CCCCompression," following
thistable.
BI_JPEGN Tobedefinedlater,whentheISOcompletesthe
(0xFFFF0004) officialspecification.
dwSizeImage Specifiesthesizeinbytesofthecompressedimage.
dwXPelsPerMeter Specifiesthehorizontalresolutioninpixelspermeterofthetarget
deviceforthebitmap.Anapplicationcanusethisvaluetoselecta
bitmapfromaresourcegroupthatbestmatchesthecharacteristicsof
thecurrentdevice.Thisfieldissettozeroifunused.
dwYPelsPerMeter Specifiestheverticalresolutioninpixelspermeterofthetargetdevice
forthebitmap.Thisfieldissettozeroifunused.
dwClrUsed Specifiesthenumberofpaletteentriesactuallyusedbythebitmap.
Possiblevaluesfollow.
Value Result
0 Bitmapusesthemaximumnumberofcolors
correspondingtothevalueofthewBitCountfield.

Nonzero IfthewBitCountislessthan24,dwClrUsed
specifiestheactualnumberofcolorswhichthe
graphicsengineordevicedriverwillaccess.
IfthewBitCountfieldissetto24,dwClrUsed
specifiesthesizeofthereferencecolortableused
tooptimizeperformanceofWindowscolor
palettes.
dwClrImportant Specifiesthenumberofcolorindexesthatareconsideredimportantfor
displayingthebitmap.Ifthisvalueis0,thenallcolorsareimportant.
Transitional Compression
IfthedwCompressionfieldissettoBI_TRANS,thedataistransitionallycompressedusinga
tableofbytetransitionsorsequences.Valuesinthedataindicateatablepositiontostartat,and
thetableprovidescontinuingreferencestoothertablepositions.Transitionalcompressionapplies
onlytoeight-bitdata,eitherfromaneight-bitpalettizedimageorfromamulti-planeimagein
whicheachcolorcomponentisrepresentedineightbits.
Thetableconsistsofupto25616-byterowsatthebeginningofthedatasectionoftheobject.
Nibbles(half-bytes)inthedatasectionindicateanoffsetintoatablerow,atwhichlocationis
storedtheactualbytevalue.Theactualvaluethenbecomestherowapplicabletothenextdata
nibble.ThetransitionalencodingschemeisdescribedmorefullyinaseparateIBMdocument.
Intransitionalcompression,thedatasectionisatwo-partcompoundobjecthavingthefollowing
items:
- Atransitiontable
- Thecompressedimagedata
Thetransitiontableconsistsofanintegerindicatingthetablesizeinbytesandatableof16-byte
rows.Thefirstbyteineachrowisarownumberandthenext15aretransitionvalues.Rowsarein
descendingsequence.Theimageiscompressedaccordingtothefollowingrules:
- Dataisinnibbles(half-bytes)orinnibble-pairs(successivehalf-byteswhichmaycrossabyte
boundary).
- Thefirstbyteisanibble-pair.Itisthefirstbyteoftheimageandalsothefirstrownumber.
- Followinganibble-pairisaseriesoftransitionnibbles(1-15)endedbyaterminator(0).Each
transitionnibbleindicatesanoffsetinthecurrentrowatwhichthenextbyteintheimageis
found;thisvalueisalsothenextrownumber.
- Theterminatorindicatesthatthenextimagebyteisnotinthetable,butinsteadinthe
followingnibble-pair.Thisvalueisalsothenextrownumber.
- Ifthepicturehasanoddnumberofnibbles(i.e.,itendsinthefirsthalfofthelastbyte),an
extrazeronibbleisincluded.

CCC Compression
`TBD`.
Palette Chunk
APLTchunkrepresentsacolortableandconsistsofavalidPALfile.ThePALfileformatis
definedin"PaletteFileFormat," laterinthischapter.
External Palette Chunk
InsteadofaPLTchunk,anRDIBmaycontainanXPLTchunk,whichindicatesthatthebitmap's
paletteisstoredoutsidethebitmap.Thepalettemightbestoredinaseparatefileorasaseparate
compoundfileelement.TheXPLTchunkindicatesthenameandlocationoftheexternalpalette
chunkandisdefinedasfollows:
(cid:221)
<XPLT-chunk> XPLT(<fccLocation:FOURCC> <szPaletteName::ZSTR>)
ThefccLocationcontainsoneofthefollowingFOURCCvaluesspecifyingthelocationofthe
externalchunk:
fccLocationValue ChunkLocation
'full' Paletteislocatedinanexternalfile,andtheszPaletteNamevalue
specifiesacompletefilenamewithpath.
'file' Paletteislocatedinanexternalfile,andtheszPaletteNamevalue
specifiesafilenamewithoutpath.
'elem' PaletteislocatedinthesamecompoundfilecontainingtheDIB.The
szPaletteNamevaluespecifiesthenameofthecompoundfile
element.
TheszPaletteNameconsistsofanull-terminatedstring(ZSTR)containingthenameofthe
externalchunkcontainingthepalette.
Bitmap Data Chunk
The<bitmap-data>containsbitmapdataintheformatspecifiedbythebiPelFormatfieldofthe
<bmhd-chunk>.

| MIDI | and RIFF | MIDI | File | Formats |     |
| ---- | -------- | ---- | ---- | ------- | --- |
TheMusicalInstrumentDigitalInterface(MIDI)fileformatrepresentsaStandardMIDIFile,as
definedbytheMIDIManufacturersAssociation.AMIDIfilecontainscommandsinstructing
instrumentstoplayspecificnotesandperformotheroperations.
ThespecificationsforMIDIandMIDIfilescanbeobtainedfromthefollowingorganization:
InternationalMIDIAssociation(IMA)
5316W.57thStreet
LosAngeles,CA90056
(213)649-6434.
The'RMID'formatconsistsofastandardMIDIfileenclosedinaRIFFchunk.Enclosingthe
MIDIfileina'RIFF'chunkallowsthefiletobeconsistentlyidentified;forexample,an'INFO'
listcanbeincludedinthefile.
The'RMID'formisdefinedasfollows,usingthestandardRIFFformdefinition:
(cid:221)
|     | <RMID-form> | RIFF | ('RMID' | data( <MIDI-data> | ))  |
| --- | ----------- | ---- | ------- | ----------------- | --- |
The<MIDI-data>isequivalenttoaStandardMIDIFile.
| Palette | File | Format |     |     |     |
| ------- | ---- | ------ | --- | --- | --- |
ThePalette(PAL)FileFormatrepresentsalogicalpalette,whichisacollectionofcolors
representedasRGBvalues.TherearetwotypesofPALformats:
|        | • AsimplePALformat    |     |     |     |     |
| ------ | --------------------- | --- | --- | --- | --- |
|        | • AnextendedPALformat |     |     |     |     |
| Simple | PAL Format            |     |     |     |     |
ThesimplePALformatisdefinedasfollows:
|     | RIFF('PAL' | data( <palette:LOGPALETTE> |     | ))  |     |
| --- | ---------- | -------------------------- | --- | --- | --- |
LOGPALETTEistheWindows3.0logicalpalettestructure,definedasfollows:
|     | typedef      | struct tagLOGPALETTE |                | {   |     |
| --- | ------------ | -------------------- | -------------- | --- | --- |
|     | WORD         | palVersion;          |                |     |     |
|     | WORD         | palNumEntries;       |                |     |     |
|     | PALETTEENTRY |                      | palPalEntry[]; |     |     |
} LOGPALETTE;
TheLOGPALETTEstructurefieldsareasfollows:
|     | Field |     | Description |     |     |
| --- | ----- | --- | ----------- | --- | --- |

| palVersion | SpecifiestheWindowsversionnumberforthestructure. |     |     |
| ---------- | ------------------------------------------------ | --- | --- |
Specifiesthenumberofpalettecolorentries.
palNumEntries
palPalEntry[] SpecifiesanarrayofPALETTEENTRYdatastructuresthatdefine
thecolorandusageofeachentryinthelogicalpalette.
Thecolorsinthepaletteentrytableshouldappearinorderofimportance.Thisisbecauseentries
earlierinthelogicalpalettearemostlikelytobeplacedinthesystempalette.
ThePALETTEENTRYdatastructurespecifiesthecolorandusageofanentryinalogicalcolor
palette.Thestructureisdefinedasfollows:
| typedef struct | tagPALETTEENTRY | {   |     |
| -------------- | --------------- | --- | --- |
| BYTE peRed;    |                 |     |     |
| BYTE peGreen;  |                 |     |     |
| BYTE peBlue;   |                 |     |     |
| BYTE peFlags;  |                 |     |     |
} PALETTEENTRY;
ThePALETTEENTRYstructurefieldsareasfollows:
thebitmap'spaletteisstoredoutsidethebitmap.Thepalettemightbestoredinaseparatefileoras
aseparatecompoundfileelement.TheXPLTchunkindicatesthenameandlocationofthe
externalpalettechunkandisdefinedasfollows:
(cid:221)
| <XPLT-chunk> | XPLT(<fccLocation:FOURCC> |     | <szPaletteName::ZSTR>) |
| ------------ | ------------------------- | --- | ---------------------- |
ThefccLocationcontainsoneofthefollowingFOURCCvaluesspecifyingthelocationofthe
externalchunk:
| fccLocationValue | ChunkLocation |     |     |
| ---------------- | ------------- | --- | --- |
'full' Paletteislocatedinanexternalfile,andtheszPaletteNamevalue
specifiesacompletefilenamewithpath.
'file' Paletteislocatedinanexternalfile,andtheszPaletteNamevalue
specifiesafilenamewithoutpath.
'elem' PaletteislocatedinthesamecompoundfilecontainingtheDIB.The
szPaletteNamevaluespecifiesthenameofthecompoundfile
element.
TheszPaletteNameconsistsofanull-terminatedstring(ZSTR)containingthenameofthe
externalchunkcontainingthepalette.
| Bitmap Data | Chunk |     |     |
| ----------- | ----- | --- | --- |
The<bitmap-data>containsbitmapdataintheformatspecifiedbythebiPelFormatfieldofthe
<bmhd-chunk>.

| MIDI | and RIFF | MIDI | File | Formats |     |
| ---- | -------- | ---- | ---- | ------- | --- |
TheMusicalInstrumentDigitalInterface(MIDI)fileformatrepresentsaStandardMIDIFile,as
definedbytheMIDIManufacturersAssociation.AMIDIfilecontainscommandsinstructing
instrumentstoplayspecificnotesandperformotheroperations.
ThespecificationsforMIDIandMIDIfilescanbeobtainedfromthefollowingorganization:
InternationalMIDIAssociation(IMA)
5316W.57thStreet
LosAngeles,CA90056
(213)649-6434.
The'RMID'formatconsistsofastandardMIDIfileenclosedinaRIFFchunk.Enclosingthe
MIDIfileina'RIFF'chunkallowsthefiletobeconsistentlyidentified;forexample,an'INFO'
listcanbeincludedinthefile.
The'RMID'formisdefinedasfollows,usingthestandardRIFFformdefinition:
(cid:221)
|     | <RMID-form> | RIFF | ('RMID' | data( <MIDI-data> | ))  |
| --- | ----------- | ---- | ------- | ----------------- | --- |
The<MIDI-data>isequivalenttoaStandardMIDIFile.
| Palette | File | Format |     |     |     |
| ------- | ---- | ------ | --- | --- | --- |
ThePalette(PAL)FileFormatrepresentsalogicalpalette,whichisacollectionofcolors
representedasRGBvalues.TherearetwotypesofPALformats:
|        | • AsimplePALformat    |     |     |     |     |
| ------ | --------------------- | --- | --- | --- | --- |
|        | • AnextendedPALformat |     |     |     |     |
| Simple | PAL Format            |     |     |     |     |
ThesimplePALformatisdefinedasfollows:
|     | RIFF('PAL' | data( <palette:LOGPALETTE> |     | ))  |     |
| --- | ---------- | -------------------------- | --- | --- | --- |
LOGPALETTEistheWindows3.0logicalpalettestructure,definedasfollows:
|     | typedef      | struct tagLOGPALETTE |                | {   |     |
| --- | ------------ | -------------------- | -------------- | --- | --- |
|     | WORD         | palVersion;          |                |     |     |
|     | WORD         | palNumEntries;       |                |     |     |
|     | PALETTEENTRY |                      | palPalEntry[]; |     |     |
} LOGPALETTE;
TheLOGPALETTEstructurefieldsareasfollows:
|     | Field |     | Description |     |     |
| --- | ----- | --- | ----------- | --- | --- |

palVersion SpecifiestheWindowsversionnumberforthestructure.
palNumEntries Specifiesthenumberofpalettecolorentries.
palPalEntry[] SpecifiesanarrayofPALETTEENTRYdatastructuresthatdefine
thecolorandusageofeachentryinthelogicalpalette.
Thecolorsinthepaletteentrytableshouldappearinorderofimportance.Thisisbecauseentries
earlierinthelogicalpalettearemostlikelytobeplacedinthesystempalette.
ThePALETTEENTRYdatastructurespecifiesthecolorandusageofanentryinalogicalcolor
palette.Thestructureisdefinedasfollows:
typedef struct tagPALETTEENTRY {
BYTE peRed;
BYTE peGreen;
BYTE peBlue;
BYTE peFlags;
} PALETTEENTRY;
ThePALETTEENTRYstructurefieldsareasfollows:
Field Description
peRed Specifiestheintensityofredforthepaletteentrycolor.
peGreen Specifiestheintensityofgreenforthepaletteentrycolor.
peBlue Specifiestheintensityofblueforthepaletteentrycolor.
peFlags Specifieshowthepaletteentryistobeused.
Extended PAL Format
TheextendedPALformatincludesthefollowing:
- Apalette-headerchunk
- AdatachunkcontaininganRGBpalette(consistingofaLOGPALETTEstructure)orsome
otherpalettetype,includingYUVandXYZpalettes.
ForanRGBpalette,theextendedPALformatisrepresentedasfollows:
RIFF('PAL' plth( <palette-header> ) data( <LOGPALETTE-data> ))
ForaYUVpalette,theextendedPALformatisrepresentedasfollows:
RIFF('PAL' plth( <palette-header> ) yuvp( <YUV-LOGPALETTE-data> ))
Boththe<LOGPALETTE-data>and<YUV-LOGPALETTE-data>usetheWindows3.0
LOGPALETTEstructure,describedin"SimplePALFormat," earlierinthissection.The<YUV-
LOGPALETTE-data>containsYUVvaluesinsteadofRGBvalues.
The'plth'chunkisdefinedasfollows:

(cid:221)
<plth-ck> PLT( struct {
DWORD dwMapType;
WORD wWhite; // Fields from this point on are
WORD wBlack; // optional. If they are included
WORD wBorder; // but not used, set them to 0xFFFF.
WORD wRegisteredMap;
WORD wCustomBase; // If an application encounters a
WORD wCustomCnt; // 'PLT' chunk smaller than shown
WORD wRsvBase; // here, it should treat the missing
WORD wRsvCount; // fields as unused.
WORD wArtBase;
WORD wArtCnt;
WORD wNumIntense;
} )
Thestructurefieldsaredescribedinthefollowing:
Field Description
dwMapType FOURCCcodespecifyingthetypeofpalette.Currently,thefollowing
palettetypesareidentified:
Code Description
'data' SpecifiesanRGBpalette.Datachunkcontainsa
LOGPALETTEstructure.
'yuvp' SpecifiesaYUVpalette.DatachunkcontainsaYUV
palette.
'xyzp' SpecifiesanXYZpalette.DatachunkcontainsaXYZ
palette.
wWhite Specifypalette-mapindicescorrespondingtotheclosestvalueofwhite
wBlack andblack.Theseidentifythepairofcolorswiththebestcontrastfor
useincursors,calibration,etc.Thesevaluesareusuallychangedifthe
palettechanges.Ignorethesefieldsiftheycontain0xFFFF.
wBorder Specifiestheindexofthepaletteentrytobeusedforanydisplay-
borderregions,ifsupportedbythedisplaydevice.Ignorethisfieldifit
contains0xFFFF.
wRegisteredMap Specifieshowmanypaletteentriescorrespondtoaregisteredcolor
map.Registeredentriesarestoredatthefrontofthepalette.Ignorethis
fieldifitcontains0xFFFF.
Registeredmapentriesarealwaysstoredatthebeginningofthepalette,
sowRegisteredMapalsoindicatestheindexofthefirstcustomcolor
inthepalette.Registeredcolormapsincludepredefinedpalettesfor
generaluse,forest/nature,orseasides.Currentlydefinedvaluesarethe
following:
Value Description
PAL_UNREGISTERED(0xFFFF)
Colormapdoesnotcontaincolorsfromaregisteredcolor
map.
PAL_VGA(0x0000)
Colormapcontainsthestandard16VGAcolors.
PAL_AVC198(0x0001)

StandardAVC198-entrypalette.
wCustomBase Specifiestheindexofthefirstcustomcolorofthepalette.The
beginningofthepalettecontainstheentriesoftheregisteredmap,so
wCustomBasealsoindicatesthenumberofentriesintheregistered
palette.MapentriesstartingwithwCustomBasecompriseadditional
customcolorsusedinthebitmap.Ignorethisvalueif
wRegisteredPaletteisPAL_UNREGISTERED,orifwCustomBase
contains0xFFFF.
wCustomCnt Specifiesthenumberofcustomcolorsinthepalette. Ignorethisvalue
ifwRegisteredPaletteisPAL_UNREGISTERED,orifthisfield
contains0xFFFF.
wRsvBase Specifiestheindexofthefirstreservedcolorofthepalette.Reserved
colorsarethosereservedformenus,text,andotherscreenelements.
Reservedcolorsmustbestoredcontiguously.Ignorethisfieldifit
contains0xFFFF.
wRsvCnt Specifiesthenumberofreservedentries.Ignorethisfieldifitcontains
0xFFFF.
wArtBase Specifiestheindexofthefirstartcolorofthepalette.Artcolorsare
colorsusedfortextanddrawing.Artcolorsconsistofanumberof
hues,eachofwhichhasmultipleintensities.Thevariousintensitiesare
usedforanti-aliasing,amethodofusingdifferentshadesofacolorto
improvethequalityofimagesdisplayedonlow-resolutiondevices.
Forexample,ifthefirstartcolorisredanti-aliasedtoblackwiththree
intensities,thefirstthreeentriesinthepalettewouldbedarkred,
mediumred,andbrightred.Theartcolorsconstituteanarray,andall
hueshavethesamenumberofintensities.Theusercansetboththe
numberofhuesandthenumberofintensities.Ignorethesefieldsif
theycontain0xFFFF.
wArtCnt Specifiesthenumberofartcolors.Ignorethisfieldifitcontains
0xFFFF.
wNumIntense Specifiesthenumberofpaletteentriesreservedfortheanti-aliased
levelsofagivenartcolor.ThisfieldmustbepresentifwArtBaseis
present.Ignorethisfieldifitcontains0xFFFF.
Rich Text Format (RTF)
TheRichTextFormat(RTF)isastandardmethodofencodingformattedtextandgraphicsusing
only7-bitASCIIcharacters.Formattingincludesdifferentfontsizes,faces,andstyles,aswellas
paragraphalignment,justification,andtabcontrol.
RTFisdescribedintheMicrosoftWordTechnicalReference:ForWindowsandOS/2,published
byMicrosoftPress.

| Waveform | Audio | File Format | (WAVE) |     |     |
| -------- | ----- | ----------- | ------ | --- | --- |
ThissectiondescribestheWaveformformat,whichisusedtorepresentdigitizedsound.
TheWAVEformisdefinedasfollows.Programsmustexpect(andignore)anyunknownchunks
encountered,aswithallRIFFforms.However,<fmt-ck>mustalwaysoccurbefore
<wave-data>,andbothofthesechunksaremandatoryinaWAVEfile.
(cid:221)
<WAVE-form>
RIFF( 'WAVE'
|     |     | <fmt-ck>            |     | // Format     |           |
| --- | --- | ------------------- | --- | ------------- | --------- |
|     |     | [<fact-ck>]         |     | // Fact       | chunk     |
|     |     | [<cue-ck>]          |     | // Cue points |           |
|     |     | [<playlist-ck>]     |     | // Playlist   |           |
|     |     | [<assoc-data-list>] |     | // Associated | data list |
|     |     | <wave-data>         | )   | // Wave       | data      |
TheWAVEchunksaredescribedinthefollowingsections.
| WAVE Format | Chunk |     |     |     |     |
| ----------- | ----- | --- | --- | --- | --- |
TheWAVEformatchunk<fmt-ck>specifiestheformatofthe<wave-data>.The<fmt-ck>is
definedasfollows:
(cid:221)
<fmt-ck> fmt( <common-fields>
|     |     | <format-specific-fields> |     | )   |     |
| --- | --- | ------------------------ | --- | --- | --- |
(cid:221)
<common-fields>
struct
{
|     | WORD  | wFormatTag;       |     | // Format     | category    |
| --- | ----- | ----------------- | --- | ------------- | ----------- |
|     | WORD  | wChannels;        |     | // Number     | of channels |
|     | DWORD | dwSamplesPerSec;  |     | // Sampling   | rate        |
|     | DWORD | dwAvgBytesPerSec; |     | // For buffer | estimation  |
|     | WORD  | wBlockAlign;      |     | // Data       | block size  |
}
Thefieldsinthe<common-fields>chunkareasfollows:
| Field |     | Description |     |     |     |
| ----- | --- | ----------- | --- | --- | --- |
wFormatTag AnumberindicatingtheWAVEformatcategoryofthefile.The
contentofthe<format-specific-fields>portionofthe'fmt'chunk,
andtheinterpretationofthewaveformdata,dependonthisvalue.
YoumustregisteranynewWAVEformatcategories.See
|     |     | "RegisteringMultimediaFormats" |     |                                 | inChapter1,"Overviewof |
| --- | --- | ------------------------------ | --- | ------------------------------- | ---------------------- |
|     |     | MultimediaSpecifications,"     |     | forinformationonregisteringWAVE |                        |
formatcategories.
|     |     | "WaveFormatCategories," |     | followingthissection,liststhe |     |
| --- | --- | ----------------------- | --- | ----------------------------- | --- |
currentlydefinedWAVEformatcategories.
wChannels Thenumberofchannelsrepresentedinthewaveformdata,suchas1
formonoor2forstereo.
dwSamplesPerSec Thesamplingrate(insamplespersecond)atwhicheachchannel
shouldbeplayed.

dwAvgBytesPerSec Theaveragenumberofbytespersecondatwhichthewaveformdata
shouldbetransferred.Playbacksoftwarecanestimatethebuffersize
usingthisvalue.
wBlockAlign Theblockalignment(inbytes)ofthewaveformdata.Playback
softwareneedstoprocessamultipleofwBlockAlignbytesofdataat
atime,sothevalueofwBlockAligncanbeusedforbuffer
alignment.
The<format-specific-fields>consistsofzeroormorebytesofparameters.Whichparameters
occurdependsontheWAVEformatcategory–seethefollowingsectionfordetails.Playback
softwareshouldbewrittentoallowfor(andignore)anyunknown<format-specific-fields>
parametersthatoccurattheendofthisfield.
WAVE Format Categories
TheformatcategoryofaWAVEfileisspecifiedbythevalueofthewFormatTagfieldofthe
'fmt'chunk.Therepresentationofdatain<wave-data>,andthecontentofthe
<format-specific-fields>ofthe'fmt'chunk,dependontheformatcategory.
Thecurrentlydefinedopennon-proprietaryWAVEformatcategoriesareasfollows:
wFormatTagValue FormatCategory
WAVE_FORMAT_PCM(0x0001) MicrosoftPulseCodeModulation(PCM)format

ThefollowingaretheregisteredproprietaryWAVEformatcategories:
wFormatTagValue FormatCategory
IBM_FORMAT_MULAW(0x0101) IBMmu-lawformat
IBM_FORMAT_ALAW(0x0102) IBMa-lawformat
IBM_FORMAT_ADPCM(0x0103) IBMAVCAdaptiveDifferentialPulseCode
Modulationformat
ThefollowingsectionsdescribetheMicrosoftWAVE_FORMAT_PCMformat.
Pulse Code Modulation (PCM) Format
IfthewFormatTagfieldofthe<fmt-ck>issettoWAVE_FORMAT_PCM,thenthewaveform
dataconsistsofsamplesrepresentedinpulsecodemodulation(PCM)format.ForPCMwaveform
data,the<format-specific-fields>isdefinedasfollows:
(cid:221)
<PCM-format-specific>
struct
{
WORD wBitsPerSample; // Sample size
}
ThewBitsPerSamplefieldspecifiesthenumberofbitsofdatausedtorepresenteachsampleof
eachchannel.Iftherearemultiplechannels,thesamplesizeisthesameforeachchannel.
ForPCMdata,thewAvgBytesPerSecfieldofthe'fmt'chunkshouldbeequaltothefollowing
formularoundeduptothenextwholenumber:
wBitsPerSample
wChannelsxwBitsPerSecondx
8
ThewBlockAlignfieldshouldbeequaltothefollowingformula,roundedtothenextwhole
number:
wBitsPerSample
wChannelsx
8
DataPackingforPCMWAVEFiles
Inasingle-channelWAVEfile,samplesarestoredconsecutively.ForstereoWAVEfiles,channel
0representstheleftchannel,andchannel1representstherightchannel.Thespeakerposition
mappingformorethantwochannelsiscurrentlyundefined.Inmultiple-channelWAVEfiles,
samplesareinterleaved.
Thefollowingdiagramsshowthedatapackingfora8-bitmonoandstereoWAVEfiles:
Sample1 Sample2 Sample3 Sample4

|     | Channel0 |     | Channel0 |     | Channel0 | Channel0 |
| --- | -------- | --- | -------- | --- | -------- | -------- |
DataPackingfor8-BitMonoPCM
|     | Sample1  |     |          |     | Sample2  |          |
| --- | -------- | --- | -------- | --- | -------- | -------- |
|     | Channel0 |     | Channel1 |     | Channel0 | Channel0 |
|     | (left)   |     | (right)  |     | (left)   | (right)  |
DataPackingfor8-BitStereoPCM
Thefollowingdiagramsshowthedatapackingfor16-bitmonoandstereoWAVEfiles:
|     | Sample1       |     |                |     | Sample2       |                |
| --- | ------------- | --- | -------------- | --- | ------------- | -------------- |
|     | Channel0      |     | Channel0       |     | Channel0      | Channel0       |
|     | low-orderbyte |     | high-orderbyte |     | low-orderbyte | high-orderbyte |
DataPackingfor16-BitMonoPCM
Sample1
|     | Channel0      |     | Channel0       |     | Channel1      | Channel1       |
| --- | ------------- | --- | -------------- | --- | ------------- | -------------- |
|     | (left)        |     | (left)         |     | (right)       | (right)        |
|     | low-orderbyte |     | high-orderbyte |     | low-orderbyte | high-orderbyte |
DataPackingfor16-BitStereoPCM
DataFormatoftheSamples
Eachsampleiscontainedinanintegeri.Thesizeofiisthesmallestnumberofbytesrequiredto
containthespecifiedsamplesize.Theleastsignificantbyteisstoredfirst.Thebitsthatrepresent
thesampleamplitudearestoredinthemostsignificantbitsofi,andtheremainingbitsaresetto
zero.
Forexample,ifthesamplesize(recordedinnBitsPerSample)is12bits,theneachsampleis
storedinatwo-byteinteger.Theleastsignificantfourbitsofthefirst(leastsignificant)byteisset
tozero.
ThedataformatandmaximumandminimumsvaluesforPCMwaveformsamplesofvarioussizes
areasfollows:
| SampleSize     |     | DataFormat      |     | MaximumValue |     | MinimumValue |
| -------------- | --- | --------------- | --- | ------------ | --- | ------------ |
| Onetoeightbits |     | Unsignedinteger |     | 255(0xFF)    |     | 0            |
Nineormorebits Signedintegeri Largestpositivevalue Mostnegativevalueof
|     |     |     |     | ofi |     | i   |
| --- | --- | --- | --- | --- | --- | --- |

Forexample,themaximum,minimum,andmidpointvaluesfor8-bitand16-bitPCMwaveform
dataareasfollows:
| Format    | MaximumValue  |     | MinimumValue    |     |     | MidpointValue |     |
| --------- | ------------- | --- | --------------- | --- | --- | ------------- | --- |
| 8-bitPCM  | 255(0xFF)     |     | 0               |     |     | 128(0x80)     |     |
| 16-bitPCM | 32767(0x7FFF) |     | -32768(-0x8000) |     |     | 0             |     |
ExamplesofPCMWAVEFiles
ExampleofaPCMWAVEfilewith11.025kHzsamplingrate,mono,8bitspersample:
| RIFF( 'WAVE' | fmt(1, 1, | 11025,      | 11025, | 1, 8) |     |     |     |
| ------------ | --------- | ----------- | ------ | ----- | --- | --- | --- |
|              | data(     | <wave-data> | )      | )     |     |     |     |
ExampleofaPCMWAVEfilewith22.05kHzsamplingrate,stereo,8bitspersample:
| RIFF( 'WAVE' | fmt(1, 2, | 22050,      | 44100, | 2, 8) |     |     |     |
| ------------ | --------- | ----------- | ------ | ----- | --- | --- | --- |
|              | data(     | <wave-data> | )      | )     |     |     |     |
ExampleofaPCMWAVEfilewith44.1kHzsamplingrate,mono,20bitspersample:
| RIFF( 'WAVE'         | INFO(INAM("O | Canada"Z))  |         |     |     |     |     |
| -------------------- | ------------ | ----------- | ------- | --- | --- | --- | --- |
|                      | fmt(1,       | 1, 44100,   | 132300, | 3,  | 20) |     |     |
|                      | data(        | <wave-data> | )       | )   |     |     |     |
| Storage of WAVE Data |              |             |         |     |     |     |     |
The<wave-data>containsthewaveformdata.Itisdefinedasfollows:
(cid:221)
| <wave-data> | { <data-ck> |     | | <data-list> |     | }   |     |     |
| ----------- | ----------- | --- | ------------- | --- | --- | --- | --- |
(cid:221)
| <data-ck> | data( <wave-data> |     | )   |     |     |     |     |
| --------- | ----------------- | --- | --- | --- | --- | --- | --- |
(cid:221)
| <wave-list> | LIST( | 'wavl' | { <data-ck> |     | |   |     | // Wave |
| ----------- | ----- | ------ | ----------- | --- | --- | --- | ------- |
samples
|     |     |     | <silence-ck> |     | }... | )   | // Silence |
| --- | --- | --- | ------------ | --- | ---- | --- | ---------- |
(cid:221)
| <silence-ck> | slnt( | <dwSamples:DWORD> |     | )   |     | // Count  | of      |
| ------------ | ----- | ----------------- | --- | --- | --- | --------- | ------- |
|              |       |                   |     |     |     | // silent | samples |
Note: The'slnt'chunkrepresentssilence,notnecessarilyarepeatedzerovolumeorbaseline
sample.In16-bitPCMdata,ifthelastsamplevalueplayedbeforethesilencesectionisa10000,
thenifdataisstilloutputtotheDtoAconverter,itmustmaintainthe10000value.Ifazerovalue
isused,aclickmaybeheardatthestartandendofthesilencesection.Ifplaybeginsatasilence
section,thenazerovaluemightbeusedsincenootherinformationisavailable.Aclickmightbe
createdifthedatafollowingthesilentsectionstartswithanonzerovalue.
FACT Chunk
The<fact-ck>factchunkstoresimportantinformationaboutthecontentsoftheWAVEfile.This
chunkisdefinedasfollows:

(cid:221)
<fact-ck> fact( <dwFileSize:DWORD> ) // Number of samples
The"fact" chunkisrequiredifthewaveformdataiscontainedina"wavl" LISTchunkandfor
allcompressedaudioformats.ThechunkisnotrequiredforPCMfilesusingthe"data" chunk
format.
The"fact"chunkwillbeexpandedtoincludeanyotherinformationrequiredbyfutureWAVE
formats.Addedfieldswillappearfollowingthe<dwFileSize>field.Applicationscanusethe
chunksizefieldtodeterminewhichfieldsarepresent.
Cue-Points Chunk
The<cue-ck>cue-pointschunkidentifiesaseriesofpositionsinthewaveformdatastream.The
<cue-ck>isdefinedasfollows:
(cid:221)
<cue-ck> cue( <dwCuePoints:DWORD> // Count of cue points
<cue-point>... ) // Cue-point table
(cid:221)
<cue-point> struct {
DWORD dwName;
DWORD dwPosition;
FOURCC fccChunk;
DWORD dwChunkStart;
DWORD dwBlockStart;
DWORD dwSampleOffset;
}
The<cue-point>fieldsareasfollows:
Field Description
dwName Specifiesthecuepointname.Each<cue-point>recordmusthavea
uniquedwNamefield.
dwPosition Specifiesthesamplepositionofthecuepoint.Thisisthesequential
samplenumberwithintheplayorder.See"PlaylistChunk," laterin
thisdocument,foradiscussionoftheplayorder.
fccChunk SpecifiesthenameorchunkIDofthechunkcontainingthecue
point.
dwChunkStart Specifiesthefilepositionofthestartofthechunkcontainingthecue
point.Thisisabyteoffsetrelativetothestartofthedatasectionof
the'wavl'LISTchunk.
dwBlockStart Specifiesthefilepositionofthestartoftheblockcontainingthe
position.Thisisabyteoffsetrelativetothestartofthedatasection
ofthe'wavl'LISTchunk.
dwSampleOffset Specifiesthesampleoffsetofthecuepointrelativetothestartofthe
block.

| Examples | of File Position | Values |     |
| -------- | ---------------- | ------ | --- |
Thefollowingtabledescribesthe<cue-point>fieldvaluesforaWAVEfilecontainingmultiple
'data'and'slnt'chunksenclosedina'wavl'LISTchunk:
| CuePointLocation | Field    |     | Value              |
| ---------------- | -------- | --- | ------------------ |
| Ina'slnt'chunk   | fccChunk |     | FOURCCvalue'slnt'. |
Filepositionofthe'slnt'chunkrelativetothe
dwChunkStart
startofthedatasectioninthe'wavl'LIST
chunk.
|     | dwBlockStart |     | Filepositionofthedatasectionofthe'slnt' |
| --- | ------------ | --- | --------------------------------------- |
chunkrelativetothestartofthedatasection
ofthe'wavl'LISTchunk.
|     | dwSampleOffset |     | Samplepositionofthecuepointrelativeto |
| --- | -------------- | --- | ------------------------------------- |
thestartofthe'slnt'chunk.
| InaPCM'data'chunk | fccChunk |     | FOURCCvalue'data'. |
| ----------------- | -------- | --- | ------------------ |
Filepositionofthe'data'chunkrelativetothe
dwChunkStart
startofthedatasectioninthe'wavl'LIST
chunk.
|     | dwBlockStart |     | Filepositionofthecuepointrelativetothe |
| --- | ------------ | --- | -------------------------------------- |
startofthedatasectionofthe'wavl'LIST
chunk.
|                     | dwSampleOffset |     | Zerovalue.         |
| ------------------- | -------------- | --- | ------------------ |
| Inacompressed'data' | fccChunk       |     | FOURCCvalue'data'. |
chunk
|     | dwChunkStart |     | Filepositionofthestartofthe'data'chunk |
| --- | ------------ | --- | -------------------------------------- |
relativetothestartofthedatasectionofthe
'wavl'LISTchunk.
|     | dwBlockStart |     | Filepositionoftheenclosingblockrelativeto |
| --- | ------------ | --- | ----------------------------------------- |
thestartofthedatasectionofthe'wavl'LIST
chunk.Thesoftwarecanbeginthe
decompressionatthispoint.
|     | dwSampleOffset |     | Samplepositionofthecuepointrelativeto |
| --- | -------------- | --- | ------------------------------------- |
thestartoftheblock.
Thefollowingtabledescribesthe<cue-point>fieldvaluesforaWAVEfilecontainingasingle
'data'chunk:
| CuePointLocation | Field    |     | Value              |
| ---------------- | -------- | --- | ------------------ |
| WithinPCMdata    | fccChunk |     | FOURCCvalue'data'. |
Zerovalue.
dwChunkStart
|     | dwBlockStart   |     | Zerovalue.                            |
| --- | -------------- | --- | ------------------------------------- |
|     | dwSampleOffset |     | Samplepositionofthecuepointrelativeto |

thestartofthe'data'chunk.
| Inacompressed'data' | fccChunk | FOURCCvalue'data'. |     |
| ------------------- | -------- | ------------------ | --- |
chunk
|     | dwChunkStart | Zerovalue.                                |     |
| --- | ------------ | ----------------------------------------- | --- |
|     | dwBlockStart | Filepositionoftheenclosingblockrelativeto |     |
thestartofthe'data'chunk.Thesoftwarecan
beginthedecompressionatthispoint.
|     | dwSampleOffset | Samplepositionofthecuepointrelativeto |     |
| --- | -------------- | ------------------------------------- | --- |
thestartoftheblock.
Playlist Chunk
The<playlist-ck>playlistchunkspecifiesaplayorderforaseriesofcuepoints.The<playlist-
ck>isdefinedasfollows:
(cid:221)
| <playlist-ck> | plst(              |                   |                  |
| ------------- | ------------------ | ----------------- | ---------------- |
|               | <dwSegments:DWORD> | // Count          | of play segments |
|               | <play-segment>...  | ) // Play-segment | table            |
(cid:221)
| <play-segment> | struct { |     |     |
| -------------- | -------- | --- | --- |
DWORD dwName;
DWORD dwLength;
DWORD dwLoops;
}
The<play-segment>fieldsareasfollows:
| Field  | Description                                         |     |     |
| ------ | --------------------------------------------------- | --- | --- |
| dwName | Specifiesthecuepointname.Thisvaluemustmatchoneofthe |     |     |
nameslistedinthe<cue-ck>cue-pointtable.
| dwLength | Specifiesthelengthofthesectioninsamples.   |     |     |
| -------- | ------------------------------------------ | --- | --- |
| dwLoops  | Specifiesthenumberoftimestoplaythesection. |     |     |
Associated Data Chunk
The<assoc-data-list>associateddatalistprovidestheabilitytoattachinformationlikelabelsto
sectionsofthewaveformdatastream.The<assoc-data-list>isdefinedasfollows:
(cid:221)
| <assoc-data-list> | LIST( 'adtl' |           |              |
| ----------------- | ------------ | --------- | ------------ |
|                   |              | <labl-ck> | // Label     |
|                   |              | <note-ck> | // Note      |
|                   |              | <ltxt-ck> | // Text with |
data length
|     |     | <file-ck> ) | // Media file |
| --- | --- | ----------- | ------------- |
(cid:221)
| <labl-ck> | labl( <dwName:DWORD> |     |     |
| --------- | -------------------- | --- | --- |
<data:ZSTR> )
(cid:221)
| <note-ck> | note( <dwName:DWORD> |     |     |
| --------- | -------------------- | --- | --- |
<data:ZSTR> )

(cid:221)
| <ltxt-ck> |     | ltxt( <dwName:DWORD> |     |
| --------- | --- | -------------------- | --- |
<dwSampleLength:DWORD>
<dwPurpose:DWORD>
<wCountry:WORD>
<wLanguage:WORD>
<wDialect:WORD>
<wCodePage:WORD>
<data:BYTE>... )
(cid:221)
| <file-ck> |     | file( <dwName:DWORD> |     |
| --------- | --- | -------------------- | --- |
<dwMedType:DWORD>
<fileData:BYTE>...)
| Label | and Note Information |     |     |
| ----- | -------------------- | --- | --- |
The'labl'and'note'chunkshavesimilarfields.The'labl'chunkcontainsalabel,ortitle,to
associatewithacuepoint.The'note'chunkcontainscommenttextforacuepoint.Thefieldsare
asfollows:
| Field  |     | Description               |                            |
| ------ | --- | ------------------------- | -------------------------- |
| dwName |     | Specifiesthecuepointname. | Thisvaluemustmatchoneofthe |
nameslistedinthe<cue-ck>cue-pointtable.
data SpecifiesaNULL-terminatedstringcontainingatextlabel(forthe
'labl'chunk)orcommenttext(forthe'note'chunk).
| Text with | Data Length | Information |     |
| --------- | ----------- | ----------- | --- |
The"ltxt" chunkcontainstextthatisassociatedwithadatasegmentofspecificlength.Thechunk
fieldsareasfollows:
| Field  |     | Description               |                            |
| ------ | --- | ------------------------- | -------------------------- |
| dwName |     | Specifiesthecuepointname. | Thisvaluemustmatchoneofthe |
nameslistedinthe<cue-ck>cue-pointtable.
dwSampleLength Specifiesthenumberofsamplesinthesegmentofwaveformdata.
dwPurpose Specifiesthetypeorpurposeofthetext.Forexample,dwPurpose
canspecifyaFOURCCcodelike'scrp'forscripttextor'capt'for
close-captiontext.
wCountry Specifiesthecountrycodeforthetext.See"CountryCodes" in
Chapter2,"ResourceInterchangeFileFormat," foracurrentlistof
countrycodes.
wLanguage, Specifythelanguageanddialectcodesforthetext.See"Language
wDialect andDialectCodes" inChapter2,"ResourceInterchangeFile
Format," foracurrentlistoflanguageanddialectcodes.
| wCodePage |     | Specifiesthecodepageforthetext. |     |
| --------- | --- | ------------------------------- | --- |

Embedded File Information
The'file'chunkcontainsinformationdescribedinotherfileformats(forexample,an'RDIB'file
oranASCIItextfile).Thechunkfieldsareasfollows:
Field Description
dwName Specifiesthecuepointname. Thisvaluemustmatchoneofthe
nameslistedinthe<cue-ck>cue-pointtable.
dwMedType SpecifiesthefiletypecontainedinthefileDatafield.IfthefileData
sectioncontainsaRIFFform,thedwMedTypefieldisthesameas
theRIFFformtypeforthefile.
Thisfieldcancontainazerovalue.
fileData Containsthemediafile.

C hap ter 4
Media Control Interface
TheMediaControlInterface(MCI)isahigh-levelcommandcontrolinterfacetomultimedia
devicesandresourcefiles.MCIprovidesapplicationswithdevice-independentcapabilitiesfor
controllingaudioandvisualperipherals.YourapplicationcanuseMCItocontrolanymultimedia
device,includingaudioplaybackandrecording,aswellasvideodiscandvideotapeplayers.
MCIprovidesastandardcommandsetforplayingandrecordingmultimediadevicesandresource
files.Developerscreatingmultimediaapplicationsareencouragedtousethishigh-levelcommand
interfaceratherthanthelow-levelfunctionsspecifictoeachplatform.TheMCIcommandsetacts
asaplatform-independentlayerthatsitsbetweenmultimediaapplicationsandtheunderlying
systemsoftware.
Thecommandsetisextensibleintwoways:
- DeveloperscanincorporatenewmultimediadevicesandfileformatsintheMCIcommandset
bycreatingnewMCIdriverstointerpretthecommands.
- Newcommandsandcommandoptionscanbeaddedtosupportspecialfeaturesorfunctions
requiredbynewmultimediadevicesorfileformats.
MCI Command Strings
UsingMCI,anapplicationcancontrolmultimediadevicesusingsimplecommandstringslike
open,play,andclose.TheMCIcommandsprovideagenericinterfacetodifferentmultimedia
devices,reducingthenumberofcommandsadeveloperneedstolearn.Amultimediaapplication
mightevenacceptMCIcommandsfromanenduserandpassthemunchangedtotheMCIdriver,
whichparsesthecommandandperformstheappropriateaction.
AsetofbasiccommandsissupportedbyallMCIdevices.DeveloperscanalsodefineMCI
commandsandcommandoptionsspecifictoaparticularmultimediadeviceorfileformat.These
device-specificcommandsandcommandoptionsareneededonlywhenthebasiccommandset
doesnotsupportafeaturespecifictothedeviceorfileformat.

| Example | of MCI | Command | Use |     |
| ------- | ------ | ------- | --- | --- |
ThefollowingexampleshowsaseriesofMCIcommandsthatplaytrack6ofanaudiocompact
disc:
open cdaudio
|     | set cdaudio  | time format | tmsf   |     |
| --- | ------------ | ----------- | ------ | --- |
|     | play cdaudio | from        | 6 to 7 |     |
close cdaudio
ThenextexampleshowsasimilarseriesofMCIcommandsthatplaythefirst10,000samplesofa
waveformaudiofile:
|     | open c:\mmdata\purplefi.wav |             | type waveaudio | alias finch |
| --- | --------------------------- | ----------- | -------------- | ----------- |
|     | set finch                   | time format | samples        |             |
|     | play finch                  | from 1      | to 10000 wait  |             |
close finch
Noticethefollowing:
|     | • Thesamebasiccommands(open,play,andclose)areusedwithbothdevices. |     |     |     |
| --- | ----------------------------------------------------------------- | --- | --- | --- |
- Theopencommandforthe"waveaudio" deviceincludesafilenamespecification.The
"waveaudio" deviceisacompounddevice(oneassociatedwithamediaelement),whilethe
|     | "cdaudio" | deviceisasimpledevice(onewithoutanassociatedmediaelement). |     |     |
| --- | --------- | ---------------------------------------------------------- | --- | --- |
- Thesetcommandsbothspecifytimeformats,butthetimeformatoptionsforthe"cdaudio"
devicearedifferentfromthoseusedwiththe"waveaudio" device.
- Theparametersusedwiththefromandtoflagsareappropriatetotherespectivedevice.For
the"cdaudio" device,theparametersspecifyarangeoftracks;forthe"waveaudio" device,
theparametersspecifyarangeofsamples.
| Categories | of  | MCI Command | Strings |     |
| ---------- | --- | ----------- | ------- | --- |
MCIcommandstringsdivideintothefollowingcategories:
- SystemcommandsareinterpreteddirectlybyMCIratherthanbeingrelayedtoadevice.
- RequiredcommandsarerecognizedbyallMCIdevices.Ifadevicedoesnotsupporta
requiredcommand,itcanreturn"unsupportedfunction" inresponsetothemessage.
- Basiccommandsareoptionalcommands.Ifadeviceusesabasiccommand,itmustrespond
toalloptionsforthatcommand.Ifadevicedoesnotuseabasiccommand,itcanreturn
|     | "unrecognizedcommand" |     | inresponsetothemessage. |     |
| --- | --------------------- | --- | ----------------------- | --- |
- Extendedcommandsarespecifictoadevicetypeordeviceclass;forexample,videodisc
players.Thesecommandscontainbothuniquecommandsandextensionstotherequiredand
basiccommands.

Command Syntax Conventions
Thischapterusesthefollowingdocumentationconventions:
Convention Description
bold MCIcommandorflagkeyword.
italics Commandparametertobereplacedwithavalidstring,number,orrectangle
specification.
"quotes" Parametertexttobetypedexactlyasshown.
[brackets] Optionalflagsorparameters
System Commands
Thefollowinglistsummarizesthesystemcommands.MCIsupportsthesecommandsdirectly
ratherthanpassingthemtoMCIdevices.
Message Description
sound Playsystemsoundsdefinedinasystemsetupfile.
sysinfo ReturnsinformationaboutMCIdevices.
Required Commands
Thefollowinglistsummarizestherequiredcommands.Alldevicesrecognizethesemessages.Ifa
devicedoesnotsupportarequiredcommand,itcanreturn"unsupportedfunction" inresponseto
themessage.
Message Description
capability Obtainsthecapabilitiesofadevice.
close Closesthedevice.
info Obtainstextualinformationfromadevice.
open Initializesthedevice.
status Returnsvariousstatusinformationfromthedevice.

Basic Commands
Thefollowinglistsummarizesthebasiccommands.MCIdevicesarenotrequiredtorecognize
thesecommands. Ifthedevicedoesnotrecognizeabasiccommand,itcanreturn"unrecognized
| command" | inresponsetothemessage.                    |     |     |     |
| -------- | ------------------------------------------ | --- | --- | --- |
| Message  | Description                                |     |     |     |
| load     | Recallsdatafromadiskfile.                  |     |     |     |
| pause    | Stopsplaying.                              |     |     |     |
| play     | Startstransmittingoutputdata.              |     |     |     |
| record   | Startsrecordinginputdata.                  |     |     |     |
| resume   | Resumesplayingorrecordingfromapausedstate. |     |     |     |
| save     | Savesdatatoadiskfile.                      |     |     |     |
| seek     | Seeksforwardorbackward.                    |     |     |     |
| set      | Setstheoperatingstateofthedevice.          |     |     |     |
status Obtainsstatusinformationaboutthedevice.(Theflagsforthiscommand
supplementtheflagsforthecommandintherequiredcommandgroup.)
| stop | Stopsplaying. |     |     |     |
| ---- | ------------- | --- | --- | --- |
Extended Commands
MCIdevicescanhaveadditionalcommandsorextendthedefinitionoftherequiredandbasic
commands.Whilesomeextendedcommandsonlyapplytoaspecificdevicedrivermostofthem
applytoalldevicesofaparticulartype.Forexample,theMIDIsequencercommandsetextends
thesetcommandtoaddtimeformatsneededbyMIDIsequencers.Youcanfinddescriptionsof
extendedcommandsinthecommandtablesinthischapter.
| Extended | Commands | Reserved | for Future | Use |
| -------- | -------- | -------- | ---------- | --- |
Thefollowingcommandscanbedefinedasextendedcommands.Withtheexceptionofthedelete
command,theyarenotcurrentlydefinedforanyMCIdevices.
| Message | Description |     |     |     |
| ------- | ----------- | --- | --- | --- |
copy CopiesdatatotheClipboard.Parametersandflagsforthismessagevary
|     | accordingtothe | selecteddevice. |     |     |
| --- | -------------- | --------------- | --- | --- |
cut MovesdatafromtheMCIelementtotheClipboard.Parametersandflagsfor
thismessagevaryaccordingtotheselecteddevice.
delete RemovesdatafromtheMCIelement.Parametersandflagsforthismessage
varyaccordingtotheselecteddevice.

Creating a Command String
Therearethreecomponentsassociatedwitheachcommandstring:thecommand,thenameorID
ofthedevicereceivingthecommand,andthecommandarguments.Acommandstringhasthe
followingform:
command device_name arguments
Thesecomponentscontainthefollowinginformation:
- Thecommandincludesacommandfromthesystem,required,basic,orextendedcommand
set.Examplesofcommandsincludeopen,close,andplay.
- Thedevice_namedesignatesthetargetofthecommand.MCIacceptsthenamesofMCI
devicetypesandnamesofmediaelementsforthedevice_name.Anexampleofadevice
nameis"cdAudio".
- Theargumentsspecifytheflagsandparametersusedbythecommand.Flagsarekeywords
recognizedbytheMCIcommand,andparametersarevariables associatedwiththeMCI
commandorflag.Parametersspecifyvariabledatavaluessuchasfilenames,trackorframe
numbers,orspeedvalues.Youcanusethefollowingdatatypesfortheparametersinastring
command:
- Strings–Stringdatatypescanbedelimitedbyleadingandtrailingwhitespaceorby
matchingquotationmarks.IfMCIencountersasingle(unmatched)quotationmark,it
ignoresthequotationmark.Toembedaquoteinstring,usetwoquotes("").Tospecify
anemptystring,youcanusedoublequotes("")forthestring.
- Signedlongintegers–Signedlongintegerdatatypesaredelimitedbyleadingandtrailing
whitespace.Unlessotherwisespecified,integerscanbepositiveornegative.Ifusing
negativeintegers,donotembedwhitespacebetweenthenegativesignandthefirstdigit.
- Rectangle–Rectangledatatypesareanorderedlistoffoursignedintegervalues.White
spacedelimitsthisdatatypeaswellasseparateseachintegerinthelist.
Forexample,theplaycommandusesthearguments"frompositiontoposition" tospecify
startingandendingpointsfortheplayback.Thefromandtoargumentsareflags,andthetwo
positionvaluesareparameters.
Forexample,thefollowingcommandstringinstructstheCDaudioplayer"cdaudio" toplayfrom
thestartofthewaveformtoposition500:
play cdaudio from 0 to 500
Unspecifiedcommandargumentsassumeadefaultvalue.Forexample,iftheflagfromwas
unspecifiedinthepreviousexample,theaudioplayerwouldstartplayingatthecurrentposition.

| About | MCI Device Types |     |
| ----- | ---------------- | --- |
YourapplicationidentifiesanMCIdevicebyspecifyinganMCIdevicetype.Adevicetype
indicatesthephysicaltypeofdevice.ThefollowingtableliststhecurrentlydefinedMCIdevice
types:
|     | DeviceType Description                                |     |
| --- | ----------------------------------------------------- | --- |
|     | cdaudio1 CDaudioplayer                                |     |
|     | dat Digitalaudiotapeplayer                            |     |
|     | digitalvideo Digitalvideoinawindow(notGDIbased)       |     |
|     | other UndefinedMCIdevice                              |     |
|     | scanner Imagescanner                                  |     |
|     | sequencer1 MIDIsequencer                              |     |
|     | vcr Videotaperecorderorplayer                         |     |
|     | videodisc1 Videodiscplayer                            |     |
|     | waveaudio1 Audiodevicethatplaysdigitizedwaveformfiles |     |
1Anextendedcommandsetisprovidedforthesedevices.
Ifyouhaveaparticulardevicetypeinstalledmorethanonce,thedevicetypenamesinthesystem
setupfilehaveintegersappendedtothem.ThiscreatesuniquenamesforeachMCIdevicetype
entry.Forexample,ifthe"cdaudio" devicetypeisinstalledtwice,thenames"cdaudio1" and
"cdaudio2" areusedtocreateuniquenamesforeachoccurrenceofthedevicetype.Eachname
usuallyreferstoadifferentCDaudioplayerinthesystem.
| Using | MCI Command | Strings |
| ----- | ----------- | ------- |
ThetablesattheendofthischapterdescribecommandstringsfortheMCIdevices.Thefollowing
sectionsdescribecommonlyusedcommandstrings.
| Opening | a Device |     |
| ------- | -------- | --- |
Beforeusingadevice,youmustinitializeitwiththeopencommand.Thenumberofdevicesyou
canhaveopendependsontheamountofavailablememory.Theopencommandhasthefollowing
syntax:
opendevice_name[shareable][typedevice_type][aliasalias]
Theparametersfortheopencommandare:
|     | Parameters Description |     |
| --- | ---------------------- | --- |

device_name SpecifiesthedestinationdeviceorMCIelementname(filename).
shareable Allowsapplicationstoshareacommondeviceordeviceelement.
typedevice_type Specifiesthedevicewhenthedevice_namereferstoanMCI
element.
aliasalias Specifiesanalternatenameforthedevice.
MCIclassifiesdevicedriversascompoundandsimple.Compounddevicedriversuseadevice
element–amediaelementassociatedwithadevice–duringoperation.Formostcompounddevice
drivers,thedeviceelementisthesourceordestinationdatafile.Forfileelements,theelement
namereferencesafileanditspath.
Simpledevicedriversdonotrequireadeviceelementforplayback.Forexample,compactdisc
audiodevicedriversaresimpledevicedrivers.
Opening Simple Devices
Simpledevicesrequireonlythedevice_nameforoperation.Youdon'tneedtoprovideany
additionalinformation(suchasanameofadatafile)toopenthesedevices.Forthesedevices,
substitutethenameofadevicetypeobtainedfromthesystemsetupfile.Forexample,youcan
openavideodiscdevicewiththefollowingcommand:
open videodisc1
Opening Compound Devices
Therearethreewaystoopenacompounddevice:
- Byspecifyingjustthedevicetype
- Byspecifyingboththeelementnameandthedevicetype
- Byspecifyingjusttheelementname
Todeterminethecapabilitiesofadevice,youcanopenadevicebyspecifyingonlythedevice
type.Whenopenedthisway,mostcompounddeviceswillletyoudeterminetheircapabilitiesand
closethem.Forexample,youcanopenthesequencerwiththefollowingcommand:
open sequencer
Toassociateadeviceelementwithaparticulardevice,youmustspecifytheelementnameand
devicetype.Intheopencommand,substitutetheelementnameforthedevice_name,addthetype
flag,andsubstitutethenameofthedeviceyouwanttousefordevice_type.Thiscombinationlets
yourapplicationspecifytheMCIdeviceitneedstouse.Forexample,youcanopenadevice
elementofthewaveaudiodevicewiththefollowingcommand:
open right.wav type waveaudio
ToassociateadefaultMCIdevicewithadeviceelement,youcanspecifyjustanelementname.In
thiscase,MCIusesthefilenameextensionoftheelementnametoselectthedevicetype.

Using the Shareable Flag
Theshareableflagletsmultipleapplicationsortasksconcurrentlyaccessthesamedevice(or
element)anddeviceinstance.
Ifyourapplicationopensadeviceordeviceelementwithouttheshareableflag,noother
applicationcanaccessitsimultaneously.Ifyourapplicationopensadeviceordeviceelementas
shareable,otherapplicationscanalsoaccessitbyalsoopeningitasshareable.Theshareddevice
ordeviceelementgiveseachapplicationtheabilitytochangetheparametersgoverningthe
operatingstateofthedeviceordeviceelement.Eachtimethatadeviceordeviceelementis
openedasshareable,auniquedeviceIDisreturned(eventhoughthedeviceIDsrefertothesame
instance)
Ifyoumakeadeviceordeviceelementshareable,yourapplicationshouldnotmakeany
assumptionsaboutthestateofadevice.Whenworkingwithshareddevices,yourapplication
mightneedtocompensateforchangesmadebyotherapplicationsusingthesameservices.
Ifadevicecanserviceonlyoneapplicationortaskitwillfailanopenwiththeshareableflag.
Whilemostcompounddeviceelementsarenotshareable,youcanopenmultipleelements(where
eachelementisunique),oryoucanopenasingleelementmultipletimes.Ifyouopenasinglefile
elementmultipletimes,MCIcreatesanindependentinstanceforeachopendevice.Eachfile
elementopenedwithinataskmusthaveauniquename.Thealiasflagdescribedinthenext
sectionletsyouuseauniquenameforeachelement.
Using the Alias Flag
Thealiasflagspecifiesanalternatenameforthegivendevice.Thealiasprovidesashorthand
notationforcompounddeviceswithlengthypathnames.Ifyourapplicationcreatesadevicealias,
itmustusethealiasratherthanthedevicenameforallsubsequentreferences.
Opening New Device Elements
Tocreateanewdeviceelementforatasksuchascapturingasoundusingwaveformrecording,
specifynewasadevice_name.MCIdoesnotsaveanewfileelementuntilyousaveitwiththe
savecommand.Whencreatinganewfile,youmustincludeadevicealiaswiththeopen
command.Thefollowingcommandsopenanewwaveaudiodeviceelement,startandstop
recording,savethefileelement,andclosethedeviceelement:
open new type waveaudio alias capture
record capture
stop capture
save capture orca.wav
close capture
Closing a Device
Theclosecommandreleasesaccesstoadeviceordeviceelement.TohelpMCImanagethe
devices,yourapplicationmustexplicitlycloseeachdeviceordeviceelementwhenitisfinished
withit.

Shortcuts and Variations for MCI Commands
TheMCIstringinterfaceletsyouuseseveralshortcutswhenworkingwithMCIdevices.
Using All as a Device Name
Youcanspecifyallasadevice_nameforanycommandthatdoesnotreturninformation.When
youspecifyall,thecommandissenttoalldevicesopenedbyyourapplication.Forexample,
"closeall" closesallopendevicesand"playall" startsplayingalldevicesopenedbythetask.
BecauseMCIsendsthecommandstoeachdevice,thereisadelaybetweenwhenthefirstdevice
receivesthecommandandwhenthelastdevicereceivesthecommand.
Combining the Device Type and Device Element Name
Youcaneliminatethetypeflagintheopencommandifyoucombinethedevicetypewiththe
deviceelementname.MCIrecognizesthiscombinationwhenyouusethefollowingsyntax:
device_type!element_name
Theexclamationmarkseparatesthedevicetypefromtheelementname.Thefollowingexample
openstheright.wavelementwiththewaveaudiodevice:
open waveaudio!right.wav
Automatic Open
IfMCIcannotidentifythedevice_nameasanalreadyopendevice,MCItriestoautomatically
openthespecifieddevice.Automaticopendoesnotletyourapplicationspecifythetypeflag.If
thedevicetypeisnotsupplied,MCIdeterminesthedevicetypefromtheelement(filename)
extensionslistedinthesystemsetupfile.Ifyouwanttouseaspecificdevice,youcancombinethe
devicetypenamewiththedeviceelementnameusingtheexclamationmark.
Onlythecommand-stringinterfacesupportsautomaticopen.Automaticopenwillfailfordevice-
specificcommands.Forexample,acommandtounlockthefrontpanelofavideodiscplayerwill
failanautomaticopenbecausethiscapabilityisspecifictotheparticularvideodiscplayer.
Adevicethatwasopenedusingtheautomaticopenfeaturewillnotrespondtoacommandthat
usesallasadevicename.
Automatic Close
MCIautomaticallyclosesanydeviceautomaticallyopenedusingthecommand-stringinterface.
MCIclosesadevicewhenthecommandcompletes,whenyouabortthecommand,whenyou
requestnotificationwithasubsequentcommand,orwhenMCIdetectsafailure.

| Using Wait | and Notify | Flags |
| ---------- | ---------- | ----- |
Normally,MCIcommandsreturntotheuserimmediately,evenifittakesseveralminutesto
completetheactioninitiatedbythecommand.Forexample,afteraVCRdevicereceivesarewind
command,itreturnsbeforethetapehasfinishedrewinding.Youcanuseeitherofthefollowing
requiredMCIflagstomodifythisdefaultbehavior:
| Flag   |     | Description                                    |
| ------ | --- | ---------------------------------------------- |
| notify |     | DirectsthedevicetosendanMM_MCINOTIFYmessagetoa |
windowwhentherequestedactioniscomplete.
| wait |     | Directsthedevicetowaituntiltherequestedactioniscomplete |
| ---- | --- | ------------------------------------------------------- |
beforereturningtotheapplication.
| Using | the Notify | Flag |
| ----- | ---------- | ---- |
ThenotifyflagdirectsthedevicetopostanMM_MCINOTIFYmessagewhenthedevice
completesanaction.Yourapplicationmusthaveawindowproceduretoprocessthe
MM_MCINOTIFYmessagefornotificationtohaveanyeffect.Whiletheresultsofanotification
areapplication-dependent,theapplication'swindowprocedurecanactuponfourpossible
conditionsassociatedwiththenotifymessage:
| •   | Notificationwilloccurwhenthenotificationconditionsaresatisfied. |     |
| --- | --------------------------------------------------------------- | --- |
| •   | Notificationcanbesuperseded.                                    |     |
| •   | Notificationcanbeaborted.                                       |     |
| •   | Notificationcanfail.                                            |     |
Asuccessfulnotificationoccurswhentheconditionsrequiredforinitiatingthecallbackare
satisfiedandthecommandcompletedwithoutinterruption.
Anotificationissupersededwhenthedevicehasanotificationpendingandyousenditanother
notifyrequest.Whenanotificationissuperseded,MCIresetsthecallbackconditionsto
correspondtothenotifyrequestofthenewcommand.
Anotificationisabortedwhenyousendanewcommandthatpreventsthecallbackconditionsset
byapreviouscommandfrombeingsatisfied.Forexample,sendingthestopcommandcancelsa
notificationpendingforthe"playto500" command.Ifyourcommandinterruptsacommandthat
hasanotificationpending,andyourcommandalsorequestsnotification,MCIwillabortthefirst
notificationimmediatelyandrespondtothesecondnotificationnormally.
AnotificationfailsifadeviceerroroccurswhileadeviceisexecutingtheMCIcommand.For
example,MCIpoststhismessagewhenahardwareerroroccursduringaplaycommand.

Obtaining Information From MCI Devices
Everydevicerespondstothecapability,status,andinfocommands.Thesecommandsobtain
informationaboutthedevice.Forexample,yourapplicationcandetermineifavideodiscrequires
adeviceelementusingthefollowingcommand:
capability videodisc compound file
Formostvideodiscdevices,thisexamplewouldreturnfalse.Theflagslistedfortherequiredand
basiccommandsprovideaminimumamountofinformationaboutadevice.Manydevices
supplementtherequiredandbasicflagswithextendedflagstoprovideadditionalinformation
aboutthedevice.
Whenyourequestinformationwiththecapability,status,orinfocommand,theargumentlistcan
containonlyoneflagrequestinginformation.Thestringinterfacecanonlyreturnonestringor
valueinresponsetoacapability,status,orinfocommand.
The Play Command
Theplaycommandstartsplayingadevice.Withoutanyflags,theplaycommandstartsplaying
fromthecurrentpositionandplaysuntilthecommandishaltedoruntiltheendofthemediaor
fileisreached.Forexample,"playcdaudio" startsplayinganaudiodiscfromthepositionwhere
itwasstopped.
Mostdevicessupporttheplaycommandalsosupportthefromandtoflags.Theseflagsindicate
thepositionatwhichthedeviceshouldstartandstopplaying.Forexample,"playcdaudiofrom
0" playstheaudiodiscfromthebeginningofthefirsttrack.Theunitsassignedtotheposition
valuedependonthedevice.Forexample,thepositionisnormallyspecifiedinframesforCAV
videodiscs,andmillisecondsfordigitalaudio.
Asanextendedcommand,devicesaddflagstousethecapabilitiesofaparticulardevice.For
example,theplaycommandforvideodiscplayersaddstheflagsfast,slow,reverse,andscan.
Stop, Pause, and Resume Commands
Thestopcommandsuspendstheplayingorrecordingofadevice.Manydevicesincludethebasic
commandpause,whichalsosuspendsthesesessions.Thedifferencebetweenstopandpause
dependsonthedevice.Usuallypausesuspendsoperationbutleavesthedevicereadytoresume
playingorrecordingimmediately.
Usingplayorrecordtorestartadevicewillresetthetoandfrompositionsspecifiedbeforethe
devicewaspausedorstopped.Withoutthefromflag,thesecommandsresetthestartpositionto
thecurrentposition.Withoutthetoflag,theyresettheendpositiontotheendofthemedia.Ifyou
wanttocontinueplayingorrecordingbutwanttostopatapositionpreviouslyspecified,usethe
toflagwiththesecommandsandrepeatthepositionvalue.
Somedevicesincludetheresumecommandtorestartapauseddevice.Thiscommanddoesnot
changethetoandfrompositionsspecifiedwiththeplayorrecordcommand,whichprecededthe
pausecommand.

MCI System Commands
ThefollowingcommandsareinterpreteddirectlybyMCI.Theremainingcommandtableslist
commandsinterpretedbythedevices.
Command Description
sound Thedevicenameofthiscommandspecifiesasounddefinedinasystem
setupfile..Ifitisnotfound,MCIusesasystemdefaultsound.
sysinfoitem ObtainsMCIsysteminformation.Oneofthefollowingitemsmodifies
sysinfo:
installname Returnsthenameusedtoinstallthedevice.
quantity ReturnsthenumberofMCIdevicesofthetype
specifiedbythedevice-namefield.Thedevice-
namefieldmustcontainastandardMCIdevice
type.Anydigitsafterthenameareignored.The
specialdevicenameallreturnsthetotalnumberof
MCIdevicesinthesystem.
quantityopen ReturnsthenumberofopenMCIdevicesofthe
typespecifiedbythedevicename.Thedevice
namemustbeastandardMCIdevicetype.Any
digitsafterthenameareignored.Thespecial
devicenameallreturnsthetotalnumberofMCI
devicesinthesystemthatareopen.
nameindex ReturnsthenameofanMCIdevice.Theindex
rangesfrom1tothenumberofdevicesofthat
type.Ifallisspecifiedforthedevicename,index
rangesfrom1tothetotalnumberofdevicesinthe
system.
nameindexopen ReturnsthenameofanopenMCIdevice.The
indexrangesfrom1tothenumberofdevicesof
thattype.Ifallisspecifiedforthedevicename,
indexrangesfrom1tothetotalnumberofdevices
inthesystem.

| Required | Commands | for All | Devices |
| -------- | -------- | ------- | ------- |
Thefollowingcommandsarerecognizedbyalldevices.Extendedcommandscanaddother
optionstothesecommands.Alistoftheerrorscommontoallthecommandsfollowstherequired
commandtable.
| Command | Description |     |     |
| ------- | ----------- | --- | --- |
capabilityitem Requestsinformationaboutaparticularcapabilityofadevice.Whileother
capabilitiesaredefinedforspecificdevicesanddevicetypes,thefollowing
itemsarealwaysavailable:
Returnstrueifthedevicecanejectthemedia.
caneject
|     | canplay |     | Returnstrueifthedevicecanplay. |
| --- | ------- | --- | ------------------------------ |
Returnstrueifthedevicesupportsrecording.
canrecord
|     | cansave |     | Returnstrueifthedevicecansavedata. |
| --- | ------- | --- | ---------------------------------- |
Returnstrueifthedevicerequiresanelement
compounddevice
name.
|     | devicetype |     | Returnsoneofthefollowing: |
| --- | ---------- | --- | ------------------------- |
audiotape
cdaudio
digitalaudiotape
scanner
sequencer
videodisc
videotape
waveaudio
|     | hasaudio |     | Returnstrueifthedevicesupportsaudio |
| --- | -------- | --- | ----------------------------------- |
playback.
|     | hasvideo  |     | Returnstrueifthedevicesupportsvideo.     |
| --- | --------- | --- | ---------------------------------------- |
|     | usesfiles |     | Returnstrueiftheelementofacompounddevice |
isafilepathname.
close Whensenttoasimpledevice,closesthedevice.Whensenttoacompound
deviceelement,closestheelementandanyresourcesassociatedwithit.
MCIunloadsadevicewhenitisnolongerbeingused.
infoitem Fillsauser-suppliedbufferwithaNULL-terminatedstringcontaining
textualinformation.Oneofthefollowingitemmodifiesinfo:
|     | product |     | Returnsadescriptionofthehardwareassociated |
| --- | ------- | --- | ------------------------------------------ |
withadevice.Thisusuallyincludesthe
manufacturerandmodelinformation.
openitems Initializesthedevice.Thefollowingoptionalitemsmodifyopen:
|     | aliasdevicealias |     | Specifiesanalternatenameforthegivendevice.If |
| --- | ---------------- | --- | -------------------------------------------- |
specified,itmustbeusedforsubsequent
references.
|     | shareable |     | Initializesthedeviceorelementasshareable. |
| --- | --------- | --- | ----------------------------------------- |
Subsequentattemptstoopenitfailunlessyou

specifyshareableinboththeoriginaland
subsequentopencommands.MCIreturnsanerror
ifitisalreadyopenandnotshareable.
|     | typedevicetype | Specifiesthecompounddevicethatcontrolsa |     |
| --- | -------------- | --------------------------------------- | --- |
deviceelement.Asanalternativetotype,MCIcan
usethefilenameextensionentriestoselectthe
devicebasedontheextensionusedbythedevice
element.
statusitem Obtainsstatusinformationforthedevice.Oneofthefollowingitems
modifiesstatus:
|     | mode | Returnsthecurrentmodeofthedevice. |     |
| --- | ---- | --------------------------------- | --- |
Commonlysupportedstandardmodesare:not
ready,paused,playing,stopped,open,
recording,andseeking
|                | ready        | Returnstrueifthedeviceisready. |       |
| -------------- | ------------ | ------------------------------ | ----- |
| Basic Commands | for Specific | Device                         | Types |
Inadditiontothecommandsdescribedpreviously,eachdevicesupportsasetofcommands
specifictoitsdevicetype.Wherepossible,thesetype-specificcommandsareidenticalbetween
types.Whentype-specificcommandsarecommontomultipledevices,theyareconsideredbasic
commands.Forexample,thebasicplaycommandisidenticalforvideodiscandvideotapeplayers.
Otherbasiccommandsarelistedinthefollowingtable.Althoughthesecommandsareoptionalfor
adevice,ifacommandisuseditmustrecognizealloptionslistedinthistable.Theoptions
generallyprovideforaminimumsetofcapabilities,butsomedevicesmayreturn"unsupported
function" ifanoptionisusedwhichclearlydoesn'tapply.
| Command | Description |     |     |
| ------- | ----------- | --- | --- |
loaditem Loadadeviceelementfromdisk.Thefollowingoptionalitemmodifies
load:
|       | filename                  | Specifiesthesourcepathandfile. |     |
| ----- | ------------------------- | ------------------------------ | --- |
| pause | Pausesplayingorrecording. |                                |     |
playitems Startplayingthedevice.Thefollowingoptionalitemsmodifyplay:
|     | fromposition | Specifiesthepositiontostartandstop    |     |
| --- | ------------ | ------------------------------------- | --- |
|     | toposition   | playing.Iffromisomitted,theplaystarts |     |
fromthecurrentposition;iftoisomitted,the
playstopsattheendofthemedia.

recorditems Startrecordingdata.Alldatarecordedafterafileisopenedisdiscarded
ifthefileisclosedwithoutsavingit.Thefollowingoptionalitems
modifyrecord:
insert Specifiesthatnewdataisaddedtothedevice
elementatthecurrentposition.
fromposition Specifiesthepositionstostartandstop
toposition recording.Iffromisomitted,thedevicestarts
recordingatthecurrentposition;iftois
omitted,thedevicerecordsuntilastopor
pausecommandisreceived.
overwrite Specifiesthatnewdatawillreplacedatainthe
deviceelement.
Thedefaultrecordingmode(insertoroverwrite)dependsonthe
specificdevice.Eachdeviceshoulddefineadefaultrecordingmode.
resume Resumesplayingorrecordingfollowingapause.
saveitem SavestheMCIelement.Thefollowingoptionalitemmodifiessave:
filename Specifiesthedestinationpathandfile.
seekitem Movestothespecifiedpositionandstops.Oneofthefollowingis
requiredforitem:
toposition Specifiesthepositiontostoptheseek.
tostart Seekstothestartofthemediaordevice
element.
toend Seekstotheendofthemediaordevice
element.
setitems Setsthevariouscontrolitems:
audioalloff Enablesordisablesaudiooutput
audioallon
audioleftoff Enablesordisablesoutputtotheleftaudio
audiolefton channel.
audiorightoff Enablesordisablesoutputtotherightaudio
audiorighton channel.
doorclosed Loadsthemediaandclosesthedoorif
possible.
dooropen Opensthedoorandejectsthetrayifpossible.
timeformat Setstimeformattomilliseconds.Allposition
milliseconds informationisthisformatafterthiscommand.
Youcanabbreviatemillisecondsasms.
videooff Enablesordisablesvideooutput.
videoon
statusitem Obtainsstatusinformationforthedevice.Oneofthefollowingitems
modifiesstatus:
currenttrack Returnsthecurrenttrack.

length Returnsthetotallengthofthesegment.
lengthtrack Returnsthelengthoftheserialtrackspecified
track_number bytrack_number.
numberoftracks Returnsthenumberoftracksonthemedia.
position Returnsthecurrentposition.
positiontrack Returnsthepositionofthestartofthetrack
track_number specifiedbytrack_number.
startposition Returnsthestartingpositionofthemediaor
deviceelement.
timeformat Returnsthetimeformat.
stop Stopsthedevice.

CD Audio (Redbook) Commands
TheCDaudiocommandsetprovidesacommonmethodforplayingCDaudiosequencesCDaudio
devicessupportthefollowingcoresetofcommands:
Command Description
capabilityitem RequestsinformationaboutthecapabilitiesoftheCDaudiodevice.
Oneofthefollowingitemsisrequired:
caneject ReturnstrueiftheCDaudiodevicecaneject
themedia.
canplay ReturnstrueiftheCDaudiodevicecanplay
themedia.
canrecord Returnsfalse.
cansave Returnsfalse.
compounddevice Returnsfalse.
devicetype ReturnsCDaudio.
hasaudio Returnstrue.
hasvideo Returnsfalse.
usesfiles Returnsfalse..
close Closesthedevice.
infoitem Fillsauser-suppliedbufferwithaNULL-terminatedstringcontaining
textualinformation.Oneofthefollowingoptionalitemmodifiesinfo:
product Returnstheproductnameandmodelofthe
currentaudiodevice.
openitems Initializesthedevice.MCIreservescdaudioforthecompactdiscaudio
devicetype.Thefollowingoptionalitemsmodifyopen:
aliasdevice_alias Specifiesanalternatenameforthegiven
device.Ifspecified,itmustalsobeusedfor
subsequentreferences.
shareable Initializesthedeviceasshareable.Subsequent
attemptstoopenitfailunlessyouspecify
shareableinboththeoriginalandsubsequent
opencommands.MCIreturnsanerrorifitis
alreadyopenandnotshareable.
pause Pausesplaying.
playitems Startsplayingaudio.Thefollowingoptionalitemsmodifyplay:
frompositionto Specifiesthepositiontostartandstop
position playing.
resume Resumesplayingfromapausedstate.
seekitem Movestothespecifiedlocationonthedisc.Ifalreadyplayingor
recording,thedeviceisstopped.Oneofthefollowingitemsmodifies
seek:

toposition Specifiesthedestinationpositionfortheseek.
Ifitisgreaterthanthelengthofthedisc,an
out-of-rangeerrorisreturned.
tostart Specifiestoseektothestartoftheaudiodata
ontheCD.
toend Specifiestoseektotheendoftheaudiodata
ontheCD.
setitems Setsthevariouscontrolitems:
audioalloff Enablesordisablesaudiooutput..
audioallon
audioleftoff Enablesordisablesoutputtotheleftaudio
audiolefton channel.
audiorightoff Enablesordisablesoutputtotherightaudio
audiorighton channel.
doorclosed Retractsthetrayandclosesthedoorif
possible.
dooropen Opensthedoorandejectsthetrayifpossible.
timeformat Setsthetimeformattomilliseconds.All
milliseconds positioninformationisthisformatafterthis
command.Youcanabbreviatemillisecondsas
ms.
timeformatmsf Setsthetimeformattomm:ss:ff,wheremmis
minutes,ssisseconds,andffisframes.All
positioninformationisinthisformatafterthis
command.Oninput,ffcanbeomittedif0,
andsscanbeomittedifbothitandffare0.
Thesefieldshavethefollowingmaximum
values:
Minutes 99
Seconds59
Frames 74
timeformattmsf Setsthetimeformattott:mm:ss:ffwhere"tt"
istracks,"mm" isminutes,"ss" isseconds,
and"ff" isframes.Allpositioninformationis
inthisformatafterthiscommand.Oninput
"ff" canbeomittedif0,"ss" canbeomitted
ifbothitand"ff" are0,and"mm" canbe
omittedifit,"ss" and"ff" are0.Thesefields
havethefollowingmaximumvalues:
Tracks 99
Minutes 99
Seconds59
Frames 74
statusitem Obtainsstatusinformationforthedevice.Oneofthefollowingitems
modifiesstatus:
currenttrack Returnsthecurrenttrack.
length Returnsthetotallengthofthedisc.

lengthtrack Returnsthelengthofthetrackspecifiedby
track_number track_number.
mediapresent ReturnstrueiftheCDisinsertedinthedrive;
otherwise,itreturnsfalse.
mode Returnsnotready,open,paused,playing,
seeking,orstoppedforthecurrentmodeof
thedrive.
numberoftracks ReturnsthenumberoftracksontheCD.
position Returnsthecurrentposition.
positiontrack Returnsthestartingpositionofthetrack
track_no specifiedbytrack_no.
ready Returnstrueifthedriveisready.
startposition ReturnsthestartingpositionoftheCD.
timeformat Returnsthecurrenttimeformat.
stop Stopsplaying.

MIDI Sequencer Commands
TheMIDIsequencersupportsthefollowingsetofcommands:
Command Description
capabilityitem RequestsadditionalinformationaboutthecapabilitiesoftheMIDI
sequencer.Oneofthefollowingitemsisrequired:
caneject Returnsfalse..
canplay Returnstrueifthesequencercanplay.
canrecord ReturnstrueifthesequencercanrecordMIDI
data.
cansave ReturnstrueifthesequencercansaveMIDI
data.
compounddevice Generallyreturnstrue;mostsequencersare
compounddevices..
devicetype Returnssequencer.
hasaudio Returnstrue.
hasvideo Returnsfalse.
usesfiles Returnstrue.
close Closesthesequencerelementandtheportandfileassociatedwithit.
infoitem Fillsauser-suppliedbufferwithaNULL-terminatedstringcontaining
textualinformation.Oneofthefollowingoptionalitemmodifiesinfo:
product ReturnstheproductnameofthecurrentMIDI
sequencer.
openitems Initializesthesequencer.Thefollowingoptionalitemsmodifyopen:
aliasdevice_alias Specifiesanalternatenameforthesequencer
element.Ifspecified,itmustalsobeusedfor
subsequentreferences.
shareable Initializesthesequencerelementasshareable.
Subsequentattemptstoopenitfailunlessyou
specifyshareableinboththeoriginaland
subsequentopencommands.MCIreturnsan
invaliddeviceerrorifitisalreadyopenand
notshareable.
typedevice_type MCIreservessequencerfortheMIDI
sequencerdevicetype.Asanalternativeto
type,MCIcanusetheelementfilename
extensionentriestoselectthesequencer.
pause Pausesplaying.
playitems Startsplayingthesequencer.Thefollowingoptionalitemsmodify
play:
fromposition Specifiesthepositionstostartandstop
toposition playing.Iffromisomitted,playstartsatthe

currentposition;iftoisomitted,playstopsat
theendofthefile.
recorditems StartsrecordingMIDIdata.Alldatarecordedafterafileisopenedis
discardedifthefileisclosedwithoutsavingit.Thefollowingoptional
itemsmodifyrecord:
insert Specifiesthatnewdataisaddedtothedevice
element.
fromposition Specifiesthepositionstostartandstop
toposition recording.Iffromisomitted,thedevicestarts
recordingatthecurrentposition;iftois
omitted,thedevicerecordsuntilastopor
pausecommandisreceived.
overwrite Specifiesthatnewdatawillreplacedatainthe
deviceelement.
resume Resumesplayingorrecordingfollowingapause.
saveitem SavestheMCIelement.Thefollowingitemmodifiessave:
filename Thefilenamespecifiesthedestinationpath
andfile.
seekitem Movestothespecifiedpositioninthefile.Oneofthefollowingitemsis
required:
toposition Specifiesthefinalpositionfortheseek.
tostart Specifiestoseektothestartofthesequence.
toend Specifiestoseektotheendofthesequence.
setitems Setsthevariouscontrolitems:
audioalloff Enablesordisablesaudiooutput..
audioallon
audioleftoff Enablesordisablesoutputtotheleftaudio
audiolefton channel.
audiorightoff Enablesordisablesoutputtotherightaudio
audiorighton channel.
masterMIDI SetstheMIDIsequencerasthe
synchronizationsource.Synchronizationdata
issentinMIDIformat.
masternone Inhibitsthesequencerfromsending
synchronizationdata.
masterSMPTE SetstheMIDIsequencerasthe
synchronizationsource.Synchronizationdata
issentinSMPTEformat.
offsettime SetstheSMPTEoffsettimeincolonform
(hours:minutes:seconds:frames).Theoffsetis
thebeginningtimeofaSMPTEbased
sequence.
portport_number SetstheMIDIportreceivingtheMIDI
messages.Thiscommandwillfailiftheport
youaretryingtoopenisbeingusedby
anotherapplication.

portmapper SetstheMIDImapperastheportreceiving
theMIDImessages.Thiscommandwillfailif
theMIDImapperoraportitneedsisbeing
usedbyanotherapplication.
portnone DisablesthesendingofMIDImessages..
slavefile SetstheMIDIsequencertousefiledataasthe
synchronizationsource.Thisisthedefault.
slaveMIDI SetstheMIDIsequencertouseincomingdata
MIDIforthesynchronizationsource.The
sequencerrecognizessynchronizationdata
withtheMIDIformat.
slavenone SetstheMIDIsequencertoignore
synchronizationdata.
slaveSMPTE SetstheMIDIsequencertouseincoming
MIDIdataforthesynchronizationsource.The
sequencerrecognizessynchronizationdata
withtheSMPTEformat.
tempo Setsthetempoofthesequenceaccordingto
tempo_value thecurrenttimeformat.Forappqn-basedfile,
theintegerisinterpretedasbeatsperminute.
ForaSMPTE-basedfile,theintegeris
interpretedasframespersecond.
timeformat Setstimeformattomilliseconds.Allposition
milliseconds informationisspecifiedasmilliseconds
followingthiscommand.Thesequencefile
setsthedefaultformattoppqnorSMPTE.
Youcanabbreviatemillisecondsasms.
timeformatsong Setstimeformattosongpointer(sixteenth
pointer notes).Thiscanonlybeperformedfora
sequenceofdivisiontypeppqn.
timeformat SetstimeformattoSMPTE24framerate.All
SMPTE24 positioninformationisspecifiedinSMPTE
formatfollowingthiscommand.Thesequence
filesetsthedefaultformattoppqnorSMPTE.
timeformat SetstimeformattoSMPTE25framerate.All
SMPTE25 positioninformationisspecifiedinSMPTE
formatfollowingthiscommand.Thesequence
filesetsthedefaultformattoppqnorSMPTE.
timeformat SetstimeformattoSMPTE30framerate.All
SMPTE30 positioninformationisspecifiedinSMPTE
formatfollowingthiscommand.Thesequence
filesetsthedefaultformattoppqnorSMPTE.
timeformat SetstimeformattoSMPTE30dropframe
SMPTE30drop rate.Allpositioninformationisspecifiedin
SMPTEformatfollowingthiscommand.The
sequencefilesetsthedefaultformattoppqn
orSMPTE.
statusitem ObtainsstatusinformationfortheMIDIsequencer.Oneofthe
followingitemsmodifiesstatus:

currenttrack Returnsthecurrenttracknumber.
divisiontype Returnsoneofthefollowingfiledivision
type:PPQN,SMPTE24frame,SMPTE25
frame,SMPTE30dropframe,orSMPTE30
frame.Usethisinformationtodeterminethe
formatoftheMIDIfile,andthemeaningof
tempoandpositioninformation.
length Returnsthelengthofasequenceinthecurrent
timeformat.Forppqnfiles,thiswillbesong
pointerunits.ForSMPTEfiles,thiswillbein
colonform(hours:minutes:seconds:frames).
lengthtrack Returnsthelengthofasequenceusingthe
track_number currenttimeformat.Forppqnfiles,thiswill
besongpointerunits.ForSMPTEfiles,this
willbeincolonform
(hours:minutes:seconds:frames).
master Returnsmidi,none,orsmptedependingon
thetypeofsynchronizationset.
mediapresent Thesequencerreturnstrue.
mode Returnsnotready,paused,playing,seeking,
orstopped.
numberoftracks Returnsthenumberoftracks.
offset ReturnstheoffsetofaSMPTE-basedfile.The
timeisreturnedincolonform
(hours:minutes:seconds:frames).Theoffsetis
thestartingtimeofaSMPTEbasedsequence.
port ReturnstheMIDIportnumberassignedtothe
sequence.
position Returnsthecurrentpositionofasequencein
thecurrenttimeformat.Forppqnfiles,this
willbesongpointerunits.ForSMPTEfiles,
thiswillbeincolonform
(hours:minutes:seconds:frames).
positiontrack Returnsthecurrentpositionofthetrack
track_number specifiedbytrack_numberinthecurrenttime
format.Forppqnfiles,thiswillbesong
pointerunits.ForSMPTEfiles,thiswillbein
colonform(hours:minutes:seconds:frames).
ready Returnstrueifthedeviceisready.
slave Returnsfile,midi,none,orsmptedepending
onthetypeofsynchronizationset.
startposition Returnsthestartingpositionofthemediaor
deviceelement.
tempo Returnsthecurrenttempoofasequenceinthe
currenttimeformat.Forfileswithppqn
format,thetempoisinbeatsperminute.For
fileswithSMPTEformat,thetempoisin
framespersecond.

timeformat Returnsthetimeformat.
stop Stopsplaying.

Videodisc Player Commands
Videodiscplayerssupportthefollowingcoresetofcommands:
Command Description
capabilityitem Reportsthecapabilitiesofthedevice.Thedeviceshouldreport
capabilitiesaccordingtothetypeofdisc(CAVorCLV)insertedinthe
drive.Ifnodiscisinserted,thedeviceshouldassumeCAV.Oneofthe
followingoptionalitemsmodifiescapability:
caneject Returnstrueifthedevicecanejectthemedia.
canplay Returnstrueifthedevicesupportsplaying.
canrecord Returnstrueifthevideodevicecanrecord.
canreverse Returnstrueifthedevicecanplayinreverse,
falseotherwise.ThisisalwaysfalseifaCLV
discisinserted.
cansave Returnsfalse.
compounddevice Returnsfalse.
devicetype Returnsvideodisc.
fastplayrate Returnsthestandardfastplayrateofthe
playerinframespersecond.Returns0ifthe
devicecannotplayfast.
hasaudio Returnstrueifthevideodiscplayerhasaudio.
hasvideo Returnstrue.
mediatype ReturnsCAV,CLV,orother,dependingon
thetypeofvideodisc.
normalplayrate Returnsthenormalplayrateinframesper
second.Returns0forCLVdiscs.
slowplayrate Returnsthestandardslowplayrateinframes
persecond.Returns0ifthedevicecannot
playslow.
usesfiles Returnsfalse.
close Closesthedevice.
escapeitem Sendscustominformationtoadevice.Thefollowingitemmodifies
escape:
string Specifiesthecustominfomationsenttothe
device.
infoitem Fillsauser-suppliedbufferwithaNULL-terminatedstringcontaining
textualinformation.Thefollowingoptionalitemmodifiesinfo:
product Returnstheproductnameofthedevicethat
theperipheraliscontrolling..
openitems Initializesthedevice.MCIreservesvideodiscforthevideodiscdevice
type.Thefollowingoptionalitemsmodifyopen:

aliasdevice_alias Specifiesanalternatenameforthegiven
device.Ifspecified,itmustalsobeusedfor
subsequentreferences.
shareable Initializesthedeviceasshareable.Subsequent
attemptstoopenitfailunlessyouspecify
shareableinboththeoriginalandsubsequent
opencommands.MCIreturnsaninvalid
deviceerrorifitisalreadyopenandnot
shareable.
pause Stopsplaying.IfaCAVdiscisplaying,italsofreezesthevideoframe.
IfaCLVdiscisplaying,theplayerisstopped.
playitems Startsplaying.Thefollowingoptionalitemsmodifyplay:
fast Indicatesthatthedeviceshouldplayfasteror
slow slowerthannormal.Todeterminetheexact
speedonaparticularplayer,usethestatus
speedcommand.Tospecifythespeedmore
precisely,usethefpsflag.Slowappliesonly
toCAVdiscs.
fromposition Specifiesthepositionstostartandstop
toposition playing.PositionsareinframesforCAVdiscs
andinsecondsforCLVdiscs,unlesschapter
isalsoused(inwhichcase,thepositionis
giveninchapters).Iffromisomitted,play
startsatthecurrentposition;iftoisomitted,
theplaystopsattheendofthedisc.
reverse Setstheplaydirectiontobackwards.This
appliesonlytoCAVdiscs.
scan Indicatestheplayspeedisasfastaspossible,
possiblywithaudiodisabled.Thisapplies
onlytoCAVdiscs.
speedinteger Specifiestherateofplay.Currentlysupported
speedvaluesaremeasuredinframesper
second,whichisthedefault.Thisappliesonly
toCAVdiscs.
resume Resumesplaying.
seekitem Searchesusingfastforwardorfastreversewithvideoandaudiooff.
Thefollowingoptionalitemsmodifyseek:
reverse IndicatestheseekdirectiononCAVdiscsis
backwards.Thismodifierisinvalidiftois
specified.
toposition Specifiestheendpositiontostoptheseek.If
toisnotspecified,theseekcontinuesuntilthe
endofthemediaisreached.
tostart Specifiestoseektothestartofthedisc.
toend Specifiestoseektotheendofthedisc.
setitems Setsthevariouscontrolitems:
audioalloff Enablesordisablesaudiooutput.
audioallon

audioleftoff Enablesordisablesoutputtotheleftaudio
audiolefton channel.
audiorightoff Enablesordisablesoutputtotherightaudio
audiorighton channel.
dooropen Opensthedoorandejectsthetray,ifpossible.
doorclosed Retractsthetrayandclosesthedoor,if
possible.
timeformat SetsthepositionformattoframesonCAV
frames discs.Allpositioninformationisspecifiedin
thisformatfollowingthiscommand.Thisis
thedefaultforCAVdiscs.
timeformathms Setspositionformattoh:mm:sswherehis
hours,mmisminutes,andssisseconds.All
positioninformationisspecifiedinthisformat
followingthiscommand.Oninput,hmaybe
omittedif0,andmmmaybeomittedifbothit
andhare0.ThisisthedefaultforCLVdiscs.
timeformat Setsthepositionformattomilliseconds.All
milliseconds positioninformationisspecifiedinthisformat
followingthiscommand.Youcanabbreviate
millisecondsasms.
timeformattrack Setsthepositionformattotracks(chapters).
Allpositioninformationisspecifiedinthis
formatfollowingthiscommand.
videoon Turnsthevideoonoroff.
videooff
spinitem Startsthediscspinningorstopsthediscfromspinning.Oneofthe
followingitemsmodifiesstatus:
down Stopsthediscfromspinning.
up Startsthediscspinning.
statusitem Obtainsstatusinformationforthedevice.Oneofthefollowingitems
modifiesstatus:
currenttrack Returnsthecurrenttrack(chapter)number.
discsize Returnseither8or12toindicatethesizeof
theloadeddiscininches.
forward Returnstrueiftheplaydirectionisforwardor
ifthedeviceisnotplaying;falseiftheplay
directionisbackward.
length Returnsthetotallengthofthesegment.
lengthtrack Returnsthelengthofthetrack(chapter)
track_number specifiedbytrack_number.
mediapresent Returnstrueifadiscisinsertedinthedevice,
falseotherwise.
mediatype ReturnseitherCAV,CLV,orother
dependingonthetypeofvideodisc.
mode Returnsnotready,opened,paused,parked,

playing,scanning,seeking,orstopped.
numberoftracks Returnsthenumberoftracks(chapters)onthe
media.
position Returnsthecurrentposition.
positiontrack Returnsthepositionofthestartofthetrack
track_number (chapter)specifiedbytrack_number.
ready Returnstrueifthedeviceisready.
side Returns1or2toindicatewhichsideofthe
discisloaded.
speed Returnsthespeedinframespersecond.
startposition Returnsthestartingpositionofthedisc.
timeformat Returnsthetimeformat.
stepitems Steptheplayoneormoreframesforwardorbackward.Thedefault
actionistosteponeframeforward.Thestepcommandappliesonlyto
CAVdiscs.Thefollowingitemsmodifiesstep:
byframes Specifiesthenumberofframestostep.Ifa
negativevalueisused,thereverseflagis
ignored.
reverse Stepbackward.
stop Stopplaying.

Waveform Audio Commands
Waveformaudiodriversmustsupportthefollowingcoresetofcommands:
Command Description
capabilityitem Requestsadditionalinformationaboutthecapabilitiesofthewaveform
audiodriver.Oneofthefollowingitemsmodifycapability:
caneject Returnsfalse.
canplay Returnstrueifthedevicecanplay.Thewave
audiodevicereturnstrueifanoutputdeviceis
available.
canrecord Returnstrueifthewaveformdrivercan
record.Thewaveformaudiodevicereturns
trueifaninputdeviceisavailable.
cansave Returnstrueifthewaveaudiodevicecan
savedata.
compounddevice Generallyreturnstrue;mostwaveformaudio
devicesarecompounddevices.
devicetype Returnswaveaudio.
hasaudio Returnstrue
hasvideo Returnsfalse.
inputs Returnsthetotalnumberofinputdevices.
outputs Returnsthetotalnumberofoutputdevices.
usesfiles Returnstrue.
close Closesthedeviceelementandanyresourcesassociatedwithit.
cueitem Preparesforplayingorrecording.Thecuecommanddoesnothaveto
beissuedpriortoplayingorrecording.However,dependingonthe
device,itmightreducethedelayassociatedwiththeplayorrecord
command.Thiscommandfailsifplayingorrecordingisinprogress.
Theitemisoneofthefollowing:
input Preparesforrecording.
output Preparesforplaying.Thisisthedefault.
deleteitems DeletesadatasegmentfromtheMCIelement.Thefollowingoptional
itemsmodifydelete:
fromposition Specifiesthepositionstostartandstop
toposition deletingdata.Iffromisomitted,thedeletion
startsatthecurrentposition;iftoisomitted,
thedeletionstopsattheendofthefileor
waveform.
infoitem Fillsauser-suppliedbufferwithaNULL-terminatedstringcontaining
textualinformation.Oneofthefollowingitemsmodifiesinfo:
file Returnsthecurrentfilename.

product Returnstheproductnameofthecurrentaudio
outputdevice.
input Returnstheproductnameofthecurrent
waveforminputdeviceornoneifnodeviceis
set.
output Returnstheproductnameofthecurrent
waveformoutputdeviceornoneifnodevice
isset.
openitems Initializesthedevice.Thefollowingitemsareoptional:
aliasdevice_alias Specifiesanalternatenameforthegiven
device.Ifspecified,itmustalsobeusedthe
aliasforreferences.
bufferbuffer_size Setsthesizeinsecondsofthebufferusedby
thewaveaudiodevice.Thedefaultsizeofthe
bufferissetwhenthewaveaudiodeviceis
installedorconfigured.Typically,thebuffer
sizeissetto4seconds.
shareable Initializesthedeviceelementasshareable.
Subsequentattemptstoopenitfailunlessyou
specifyshareableinboththeoriginaland
subsequentopencommands.MCIreturnsan
errorifitisalreadyopenandnotshareable.
typedevice_type Specifiesthecompounddeviceusedtocontrol
adeviceelement.MCIreserveswaveaudiofor
thewaveformaudiodevicetype.Asan
alternativetotype,MCIcanusetheelement
filenameextensionentriestoselectthe
controllingdevice
pause Pausesplayingorrecording.
playitems Startsplayingaudio.Thefollowingoptionalitemsmodifyplay:
fromposition Specifiesthepositionstostartandstop
toposition playing.Iffromisomitted,playstartsatthe
currentposition;iftoisomitted,playstopsat
theendofthefileorwaveform.
recorditems Startsrecordingaudio.Alldatarecordedafterafileisopenedis
discardedifthefileisclosedwithoutsavingit.Thefollowingoptional
itemsmodifyrecord:
insert Specifiesthatnewdataisaddedtothedevice
element.
fromposition Specifiesthepositionstostartandstop
toposition recording.Iffromisomitted,thedevicestarts
recordingatthecurrentposition;iftois
omitted,thedevicerecordsuntilastopor
pausecommandisreceived.
overwrite Specifiesthatnewdatawillreplacedatainthe
deviceelement.
resume Resumesplayingorrecordingfollowingapause.
saveitem SavestheMCIelementinitscurrentformat.Thefollowingitem

modifiessave:
filename Specifiesthefileandpathnameusedtosave
data.
seekitem Movestothespecifiedlocationinthefile.Playbackorrecordingis
stoppedaftertheseek.Oneofthefollowingitemsmodifyseek:
toposition Specifiesthestopposition.
tostart Specifiestoseektothefirstsample.
toend Specifiestoseektothelastsample.
setitems Setsthefollowingcontrolitems:
alignmentinteger Setsthealignmentofdatablocks.Thefileis
savedinthenewformat.
anyinput Useanyinputthatsupportsthecurrentformat
whenrecording.Thisisthedefault.
anyoutput Useanyoutputthatsupportsthecurrent
formatwhenplaying.Thisisthedefault.
audioalloff Enablesordisablesaudiooutput.
audioallon
audioleftoff Enablesordisablesoutputtotheleftaudio
audiolefton channel.
audiorightoff Enablesordisablesoutputtotherightaudio
audiorighton channel.
bitspersample Setsthenumberofbitspersampleplayedor
bit_count recorded.Thefileissavedinthisformat.
bytespersec Setstheaveragenumberofbytespersecond
byte_rate playedorrecorded.Thefileissavedinthis
format.
channels Setsthechannelcountforplayingand
channel_count recording.Thefileissavedinthisformat.
formattagtag Setstheformattypeforplayingandrecording.
Thefileissavedinthisformat.
formattagpcm SetstheformattypetoPCMforplayingand
recording.Thefileissavedinthisformat.
inputinteger Setstheaudiochannelusedastheinput.
outputinteger Setstheaudiochannelusedastheoutput.
samplespersec Setsthesamplerateforplayingandrecording.
integer Thefileissavedinthisformat.
timeformatbytes Setsthetimeformattobytes.Allposition
informationisspecifiedasbytesfollowing
thiscommand.
timeformat Setsthetimeformattomilliseconds.All
milliseconds positioninformationisspecifiedas
millisecondsfollowingthiscommand.You
canabbreviatemillisecondsasms.
timeformat Setsthetimeformattosamples.Allposition
samples informationisspecifiedassamplesfollowing

thiscommand.
statusitem Obtainsstatusinformationforthedevice.Oneofthefollowingitems
modifiesstatus:
alignment Returnstheblockalignmentofdatainbytes.
bitspersample Returnsthebitspersample.
bytespersec Returnstheaveragenumberofbytesper
secondplayedorrecorded.
channels Returnsthenumberofchannelsset(1for
mono,2forstereo).
currenttrack Returnstheindexofthecurrenttrack.
formattag Returnstheformattag.
input Returnsthecurrentlysetinput.Ifnoinputis
set,theerrorreturnedindicatesthatanydevice
canbeused.
length Returnsthetotallengthofthewaveform.
lengthtrack Returnsthelengthofthewaveformtrack.
track_number
level Returnsthecurrentaudiosamplevalue.
mediapresent Returnstrue.
mode Returnsnotready,paused,playing,stopped,
recording,orseeking.
numberoftracks Returnsthenumberoftracks(chapters).
output Returnsthecurrentlysetoutput.Ifnooutput
isset,theerrorreturnedindicatesthatany
devicecanbeused.
position Returnsthecurrentposition.
positiontrack Returnsthepositionofthetrackspecifiedby
track_number track_number.
ready Returnstrueifthedeviceisready.
samplespersec Returnsthenumberofsamplespersecond
playedorrecorded.
startposition Returnsthestartingpositionofthewaveform
data.
timeformat Returnsthecurrenttimeformat.
stop Stopsplayingorrecording.
