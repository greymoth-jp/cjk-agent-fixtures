// UTF-16 surrogate pairs — code points above the Basic Multilingual Plane.
//
// Failure mode #8 (utf16-surrogate-split): a JavaScript string is a sequence of
// UTF-16 code units, and any code point above U+FFFF is stored as two units (a
// surrogate pair). Rare CJK kanji live up there — 𠮷 (U+20BB7, the official 吉
// in 𠮷野家 / Yoshinoya), 𩸽 (ほっけ), and the CJK Extension B block — as do all
// emoji. So `"𠮷".length` is 2, and `.slice`, `.substring`, `charAt`, and `s[i]`
// all index by code unit. Cut at an odd boundary, or count `length` as a
// character limit, and you split the pair into a lone surrogate: a broken glyph,
// a U+FFFD on round-trip through UTF-8, a database value truncated to garbage.
//
// This is distinct from the byte-boundary crash (#2): that one is about UTF-8
// byte offsets crossing into a multi-byte sequence; this one is about UTF-16
// code-unit offsets crossing into a surrogate pair. Slicing by code point fixes
// both.

/** Buggy reference: slice by UTF-16 code unit, which can split a surrogate pair. */
export function utf16Slice(str, nUnits) {
  return str.slice(0, nUnits);
}

/** Correct: slice by code point so an astral character stays whole. */
export function codePointSlice(str, nChars) {
  return Array.from(str).slice(0, nChars).join("");
}

/** UTF-16 code-unit count — an astral character counts as 2. */
export function utf16Length(str) {
  return str.length;
}

/** Code-point count — what a user would call the number of characters. */
export function codePointLength(str) {
  return Array.from(str).length;
}

/** True if the string contains no unpaired surrogate (well-formed UTF-16). */
export function isWellFormed(str) {
  for (let i = 0; i < str.length; i++) {
    const u = str.charCodeAt(i);
    if (u >= 0xd800 && u <= 0xdbff) {
      // high surrogate: must be followed by a low surrogate
      const next = i + 1 < str.length ? str.charCodeAt(i + 1) : 0;
      if (next < 0xdc00 || next > 0xdfff) return false;
      i++;
    } else if (u >= 0xdc00 && u <= 0xdfff) {
      // low surrogate with no preceding high surrogate
      return false;
    }
  }
  return true;
}
