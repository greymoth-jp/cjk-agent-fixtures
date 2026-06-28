// East Asian Width — column width of a string when rendered in a fixed-width
// grid (terminal, code editor, TUI). CJK fullwidth characters take 2 columns.
//
// Failure mode #3 (fullwidth-width): renderers that assume 1 character == 1
// column tear cursors and box-drawing the moment a 日本語 string shows up.

// Ranges that render two columns wide (East Asian Width "W" and "F").
// Intentionally a small, dependency-free table covering the characters that
// actually show up in CJK text. It is not the full Unicode EAW database.
const WIDE_RANGES = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0x303e], // CJK radicals, Kangxi, CJK symbols & punctuation
  [0x3041, 0x33ff], // Hiragana, Katakana, CJK symbols, enclosed letters
  [0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xa000, 0xa4cf], // Yi
  [0xac00, 0xd7a3], // Hangul Syllables
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xfe10, 0xfe19], // Vertical forms
  [0xfe30, 0xfe6f], // CJK Compatibility / small forms
  [0xff00, 0xff60], // Fullwidth ASCII variants (NOT halfwidth kana at 0xff61+)
  [0xffe0, 0xffe6], // Fullwidth signs
  [0x1f300, 0x1faff], // Emoji & pictographs (rendered wide by most terminals)
  [0x20000, 0x3fffd], // CJK Unified Ideographs Extension B and beyond
];

/** Column width of a single code point (0, 1, or 2). */
export function charWidth(cp) {
  // Zero-width: combining marks, zero-width space/joiner, variation selectors.
  if (
    cp === 0x200b ||
    (cp >= 0x0300 && cp <= 0x036f) ||
    (cp >= 0xfe00 && cp <= 0xfe0f) ||
    (cp >= 0x200c && cp <= 0x200f)
  ) {
    return 0;
  }
  for (const [lo, hi] of WIDE_RANGES) {
    if (cp >= lo && cp <= hi) return 2;
  }
  return 1;
}

/** Correct: column width counting fullwidth CJK as 2 columns. */
export function displayWidth(str) {
  let w = 0;
  for (const ch of str) w += charWidth(ch.codePointAt(0));
  return w;
}

/** Buggy reference: assumes every character is exactly one column. */
export function naiveWidth(str) {
  return Array.from(str).length;
}
