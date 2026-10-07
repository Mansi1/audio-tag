// SPEC: genre list. 0-79 come from ID3v1 (v2.4 frames Appendix A). 80-125 are the Winamp
// extensions listed in v2.3 Appendix A and v2.2 Appendix A.3. 126-147 are only named in the
// official ID3v1 test suite (test/fixtures/id3v1/generation.log).
// Names follow v2.4 Appendix A; v2.3 spells 67 "Psychadelic", which genreId() also accepts.

export type GenreSource = 'id3v1' | 'winamp-v2.3-appendix' | 'winamp-test-suite'

export interface Genre {
  id: number
  name: string
  source: GenreSource
}

const ID3V1 = [
  'Blues', 'Classic Rock', 'Country', 'Dance', 'Disco', 'Funk', 'Grunge', 'Hip-Hop', 'Jazz', 'Metal',
  'New Age', 'Oldies', 'Other', 'Pop', 'R&B', 'Rap', 'Reggae', 'Rock', 'Techno', 'Industrial',
  'Alternative', 'Ska', 'Death Metal', 'Pranks', 'Soundtrack', 'Euro-Techno', 'Ambient', 'Trip-Hop',
  'Vocal', 'Jazz+Funk', 'Fusion', 'Trance', 'Classical', 'Instrumental', 'Acid', 'House', 'Game',
  'Sound Clip', 'Gospel', 'Noise', 'AlternRock', 'Bass', 'Soul', 'Punk', 'Space', 'Meditative',
  'Instrumental Pop', 'Instrumental Rock', 'Ethnic', 'Gothic', 'Darkwave', 'Techno-Industrial',
  'Electronic', 'Pop-Folk', 'Eurodance', 'Dream', 'Southern Rock', 'Comedy', 'Cult', 'Gangsta',
  'Top 40', 'Christian Rap', 'Pop/Funk', 'Jungle', 'Native American', 'Cabaret', 'New Wave',
  'Psychedelic', 'Rave', 'Showtunes', 'Trailer', 'Lo-Fi', 'Tribal', 'Acid Punk', 'Acid Jazz', 'Polka',
  'Retro', 'Musical', 'Rock & Roll', 'Hard Rock',
]

const WINAMP_APPENDIX = [
  'Folk', 'Folk-Rock', 'National Folk', 'Swing', 'Fast Fusion', 'Bebob', 'Latin', 'Revival', 'Celtic',
  'Bluegrass', 'Avantgarde', 'Gothic Rock', 'Progressive Rock', 'Psychedelic Rock', 'Symphonic Rock',
  'Slow Rock', 'Big Band', 'Chorus', 'Easy Listening', 'Acoustic', 'Humour', 'Speech', 'Chanson',
  'Opera', 'Chamber Music', 'Sonata', 'Symphony', 'Booty Bass', 'Primus', 'Porn Groove', 'Satire',
  'Slow Jam', 'Club', 'Tango', 'Samba', 'Folklore', 'Ballad', 'Power Ballad', 'Rhythmic Soul',
  'Freestyle', 'Duet', 'Punk Rock', 'Drum Solo', 'Acapella', 'Euro-House', 'Dance Hall',
]

const WINAMP_TEST_SUITE = [
  'Goa', 'Drum & Bass', 'Club-House', 'Hardcore', 'Terror', 'Indie', 'BritPop', 'Negerpunk',
  'Polsk Punk', 'Beat', 'Christian', 'Heavy Metal', 'Black Metal', 'Crossover', 'Contemporary',
  'Christian Rock', 'Merengue', 'Salsa', 'Thrash Metal', 'Anime', 'JPop', 'Synthpop',
]

export const GENRES: readonly Genre[] = [
  ...ID3V1.map((name, i) => ({ id: i, name, source: 'id3v1' as const })),
  ...WINAMP_APPENDIX.map((name, i) => ({ id: 80 + i, name, source: 'winamp-v2.3-appendix' as const })),
  ...WINAMP_TEST_SUITE.map((name, i) => ({ id: 126 + i, name, source: 'winamp-test-suite' as const })),
]

/** 255 is conventionally "no genre" in ID3v1 tags. */
export const GENRE_NONE = 255

export function genreName(id: number): string | undefined {
  return GENRES[id]?.name
}

const byName = new Map(GENRES.map((g) => [g.name.toLowerCase(), g.id]))
// v2.3 Appendix A spells 67 "Psychadelic"; accept it when looking up by name.
byName.set('psychadelic', 67)

export function genreId(name: string): number | undefined {
  return byName.get(name.trim().toLowerCase())
}
