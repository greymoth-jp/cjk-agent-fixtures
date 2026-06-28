// Unicode normalization — combining marks and canonical equivalence.
//
// Failure mode #7 (NFC/NFD normalization): the same accented or Hangul text can
// be encoded two ways — precomposed (NFC: "é" = U+00E9, "한" = U+D55C) or
// decomposed (NFD: "e" + U+0301, "ㅎ" + "ㅏ" + "ㄴ"). macOS filesystems hand
// back NFD, most keyboards and the web produce NFC, and an IME can emit either.
// Code that compares, dedups, or searches with raw `===` treats the two forms
// as different strings: a login fails, a file "isn't found", a dedup keeps both
// copies. The fix is to normalize before comparing.

/** Precomposed form (single code point per accented letter / syllable). */
export function nfc(s) {
  return s.normalize("NFC");
}

/** Decomposed form (base letter + separate combining marks). */
export function nfd(s) {
  return s.normalize("NFD");
}

/** Buggy reference: compare raw code units, so NFC and NFD look different. */
export function naiveEquals(a, b) {
  return a === b;
}

/** Correct: compare canonical (NFC) forms so equivalent text matches. */
export function normalizedEquals(a, b) {
  return nfc(a) === nfc(b);
}

/** Code-point count — differs between NFC and NFD of the same text. */
export function codePointLength(s) {
  return Array.from(s).length;
}
