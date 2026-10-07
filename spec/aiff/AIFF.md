# Audio File Format Specifications

**File Description**: AIFF, AIFF-C sound file
**File Extension**: Commonly .aif, sometimes .aiff or
.aifc
**File Byte Order**: Big-endian, although some (little used) formats contain
little-endian sound data

[Prof. Peter Kabal](http://www.mcgill.ca/directory/staff/?LastName=kabal&FirstName=peter), MMSP Lab, ECE, McGill University: Last update:
2017-09-20

## AIFF / AIFF-C Specifications

The AIFF and the later AIFF-C specifications came from Apple Computer. This
format is used on SGI machines. The latest data formats from Apple Computer are
supported by the *QuickTime* player from Apple.

The AIFF and AIFF-C file formats use IFF chunks, each chunk consisting of a
chunk identifier, chunk length and chunk data.

* AIFF
  + Original AIFF-1.3 specification, 1989-01-04 from
    [Audio IFF Specification 1.3](http://hcl.harvard.edu/loebmusic/audioresources.html)
    (broken link).
    Local copy: ![](https://www.mmsp.ece.mcgill.ca/Documents/images/F-pdf-S.gif)
    [AIFF-1.3.pdf](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-1.3.pdf)
* AIFF-C
  + AIFF-C specifications, 1991-08-26 (from
    ftp://ftp.sgi.com-sgi-aiff-c.9.26.91.ps.Z).
    Local copy: ![](https://www.mmsp.ece.mcgill.ca/Documents/images/F-pdf-S.gif)
    [AIFF-C.9.26.91.pdf](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/AIFF-C.9.26.91.pdf)
  + Apple Computer documentation:
    - General information on AIFF/AIFF-C sound files in the Sound
      Manager documentation, 1998-04 (from
      [MacOS\_Sound.pdf](http://developer.apple.com/techpubs/quicktime/qtdevdocs/PDF/MacOS_Sound.pdf), see pages 663-670, broken link).
      Local copy: ![](https://www.mmsp.ece.mcgill.ca/Documents/images/F-pdf-S.gif)
      [MacOS\_Sound-extract.pdf](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/MacOS_Sound-extract.pdf) (extract)
    - Incidental information on the new compression types, 1999-07 (from
      [QT4Reference.pdf](http://developer.apple.com/techpubs/quicktime/qtdevdocs/PDF/QT4Reference.pdf), see pages 136-144, broken link)
      Local copy: ![](https://www.mmsp.ece.mcgill.ca/Documents/images/F-pdf-S.gif)
      [QT4Reference-extract.pdf](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Docs/QT4Reference-extract.pdf) (extract)
* An implementation for reading and writing AIFF and AIFF-C files is
  available as part of the [Audio File Library Project](http://www.68k.org/~michael/audiofile/).
* A variant of the AIFF-C file format (dubbed AIFF-C/sowt) was introduced
  by Apple after the company started to use Intel processors in its personal
  computers. The file header and its numerical fields still use big-endian
  byte order, but the PCM data for AIFF-C/sowt uses little-endian byte order.
  The sowt compression type is an alternative to the NONE compression type for
  PCM data.
* The Apple specification cited above suggests using the COMT chunk for
  comments rather than the ANNO chunk. The comments within a COMT chunk have a
  timestamp and a marker ID. The timestamp is problematic. Unless one is using
  the marker facility, there would seem to be no need to deprecate the ANNO
  chunk (which can appear more than once) for general comments.
* The section on the COMT timestamp refers one to Inside Macintosh, Vol.
  II. The discussion on time there shows that Apple computers of that era did
  not have a notion of time zone. The timestamp was the number of seconds
  since the beginning of year 1904 in local time. A 32-bit signed timestamp
  value has long since overflowed, though an unsigned 32-bit timestamp is
  valued for a few more decades. One supposes that more modern software would
  use a timestamp from the same 1904 epoch, but with the epoch being expressed
  as UTC, not local time.
* The Version chunk for AIFF-C files has a timestamp of 0xA2805140
  (2726318400 decimal). Using 1904-01-01 00:00:00 UTC as the epoch, the
  timestamp encodes 1990-05-23 14:40:00 UTC. This date agrees with the date
  quoted in the Mac OS Sound reference above. That document indicates that the
  time stamp is of type long (4 bytes), but the timestamp itself must be
  interpreted as unsigned long to give the correct number of seconds since the
  epoch.  The indication is that as of at least 1990, the date stamp is
  relative to 1904-01-01 00:00:00 UTC.

### Data Types

AIFF files support only PCM data. They can specify any bit depth within a
container which has a size which is rounded up to a multiple of 8 bits. Thus
they can specify, for instance, 18 bits in a 24-bit container. The data in the
container is left justified and zero padded. Data can be read as if it were the
full precision of the container. The chunk information and the data (in most
cases) is in big-endian byte order.

AIFF-C files can specify a compression type in the `COMM` chunk.
The compression type is `NONE` for PCM data. The compression type is
accompanied by a printable name. The following is a table of common compression
types.

| Compression Type | Compression Name | Data | Source |
| `NONE` | "`not compressed`" | PCM | Apple Computer |
| `sowt` |  | PCM (byte swapped) | Apple Computer |
| `fl32` | "`32-bit floating point`" | IEEE 32-bit float | Apple Computer |
| `fl64` | "`64-bit floating point`" | IEEE 64-bit float | Apple Computer |
| `alaw` | "`ALaw 2:1`" | 8-bit ITU-T G.711 A-law | Apple Computer |
| `ulaw` | "`µLaw 2:1`" | 8-bit ITU-T G.711 µ-law | Apple Computer |
| `ULAW` | "`CCITT G.711 u-law`" | 8-bit ITU-T G.711 µ-law (64 kb/s) | SGI |
| `ALAW` | "`CCITT G.711 A-law`" | 8-bit ITU-T G.711 A-law (64 kb/s) | SGI |
| `FL32` | "`Float 32`" | IEEE 32-bit float | SoundHack & Csound |

#### Differences Between AIFF and AIFF-C Files

* The identifier changes from `AIFF` to `AIFC`.
* The `FVER` chunk appears only in AIFF-C files.
* AIFF-C files adds the compression type fields to the `COMM`
  chunk.

#### Notes

* More information on compression codes recognized by Apple Computer are in
  the header files AIFF.h and
  Sound.h in the *QuickTime* developer kit:
  QuickTime Windows SDK (broken link).
* Information on SGI's compression codes is found in the header files
  dmedia/audiofile.h, dmedia/dm\_audio.h, and
  dmedia/dm\_audioutil.h.
* Many of the compression schemes listed in the above sources are now
  considered obsolete. Of the codes for sample-by-sample coding, the following
  are still relevant:
  `NONE`, `ulaw`, `alaw`,
  `fl32`, and `fl64`. Some systems also recognize the
  uppercase versions of these names.
* Float values in the Apple Computer schemes are normalized by default to a
  full-scale value of one.
* Apple maps Microsoft ACM formats into a compression code of the form
  `ms??` where the last two characters are the Microsoft
  *Audio Compression Manager* (ACM) code. For instance, Microsoft
  ADPCM, with ACM value of 1, is mapped to the code `ms\x00\x01`.
* Apple Computer's *QuickTime* player recognizes only the Apple
  compression types. Although `ALAW` and `ULAW`
  contain identical sound samples to the `alaw` and `ulaw`
  formats and were in use long before Apple introduced the new codes,
   *QuickTime* does not recognize them.
* The AIFF/AIFF-C specifications allow for the local chunks to occur in any
  order. However, most commonly the sound data itself (`SSND` chunk)
  occurs at the end of the file.
* The sampling frequency in the `COMM` chunk is stored as an
  80-bit IEEE float value.

---

#### [Sample AIFF/AIFF-C Files](https://www.mmsp.ece.mcgill.ca/Documents/AudioFormats/AIFF/Samples.html)
