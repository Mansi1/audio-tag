// Suggestions for the language of comments: ISO 639-2 codes (ID3v2.4 structure §4) and XXX for unknown.
// The fields take any three letters, so a code missing here can still be typed. VERIFIED: make e2e picks deu and fra
// from this list and saves gsw, which it lacks.
export const LANGUAGES: [string, string][] = [
  ["eng", "English"], ["deu", "German"], ["fra", "French"], ["spa", "Spanish"], ["ita", "Italian"], ["por", "Portuguese"],
  ["nld", "Dutch"], ["swe", "Swedish"], ["nor", "Norwegian"], ["dan", "Danish"], ["fin", "Finnish"], ["pol", "Polish"],
  ["ces", "Czech"], ["hun", "Hungarian"], ["ell", "Greek"], ["tur", "Turkish"], ["rus", "Russian"], ["ukr", "Ukrainian"],
  ["ara", "Arabic"], ["heb", "Hebrew"], ["hin", "Hindi"], ["jpn", "Japanese"], ["kor", "Korean"], ["zho", "Chinese"],
  ["XXX", "Unknown"],
];

/** The language column of a comment or lyrics row (components/input/RowList.tsx). */
export const LANGUAGE_COLUMN = {
  key: "language", label: "Language", options: LANGUAGES, width: "6rem",
  placeholder: "eng", maxlength: 3, pattern: "[A-Za-z]{3}", title: "Three-letter ISO 639-2 code, like eng",
};
