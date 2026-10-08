// JavaScript syntax colors for the code examples, at build time: keywords, strings and comments are
// enough for these short examples. VERIFIED: no highlighter is installed (defuss-ssg brings none), and one
// would ship a grammar and a theme for three colors.

export type TokenKind = "keyword" | "string" | "comment";
export interface Token {
  text: string;
  kind?: TokenKind;
}

const KEYWORDS = new Set(["import", "from", "export", "const", "let", "var", "await", "async", "function", "return", "if", "else", "new", "typeof", "true", "false", "null", "undefined"]);
// a line comment, a quoted string (with escapes), or a word
const TOKEN = /\/\/[^\n]*|'(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`|[A-Za-z_$][\w$]*/g;

/** Splits code into plain and colored runs; joined, they give back the code unchanged. */
export function highlight(code: string): Token[] {
  const out: Token[] = [];
  const plain = (text: string) => {
    if (!text) return;
    const last = out.at(-1);
    if (last && !last.kind) last.text += text;
    else out.push({ text });
  };
  let at = 0;
  for (const m of code.matchAll(TOKEN)) {
    const [text] = m;
    const kind: TokenKind | undefined = text.startsWith("//") ? "comment" : /^['"`]/.test(text) ? "string" : KEYWORDS.has(text) ? "keyword" : undefined;
    plain(code.slice(at, m.index));
    if (kind) out.push({ text, kind });
    else plain(text);
    at = m.index + text.length;
  }
  plain(code.slice(at));
  return out;
}
