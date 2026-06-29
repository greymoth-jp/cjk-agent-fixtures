// Whitespace — the space key does not always produce U+0020.
//
// Failure mode #11 (fullwidth-space-trim): with a Japanese IME in fullwidth
// mode, the space bar inserts an ideographic space, U+3000 (　), not an ASCII
// space. Users do this constantly, so values arrive padded with, or made
// entirely of, fullwidth spaces. A blank-field check or a trim that only strips
// ASCII whitespace — `" \t\r\n"`, a hand-rolled loop, a `/[ \t]+/` regex —
// leaves the U+3000 in place. A required field holding only 　　 passes the
// not-empty check; a name stored as "田中　" never matches "田中" on lookup or
// dedup. The fix is to trim Unicode whitespace: native String.prototype.trim()
// already removes U+3000, as does Go's strings.TrimSpace.

const ASCII_EDGE = /^[ \t\r\n\f\v]+|[ \t\r\n\f\v]+$/g;

/** Buggy reference: strip only ASCII whitespace, leaving U+3000 behind. */
export function asciiTrim(s) {
  return s.replace(ASCII_EDGE, "");
}

/** Correct: native trim removes Unicode whitespace including U+3000. */
export function unicodeTrim(s) {
  return s.trim();
}

/** Buggy reference: blank check that misses a field of fullwidth spaces. */
export function isBlankAscii(s) {
  return asciiTrim(s) === "";
}

/** Correct: blank check that treats fullwidth-space-only input as blank. */
export function isBlankUnicode(s) {
  return s.trim() === "";
}
