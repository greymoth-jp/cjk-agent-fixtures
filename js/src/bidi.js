// Base direction detection for bidirectional (RTL) text.
//
// Failure mode #6 (bidi base-direction): a field that hard-codes `dir="ltr"`,
// or that guesses direction from the *first character only*, lays out Arabic /
// Hebrew content backwards — caret on the wrong side, punctuation drifting,
// mixed runs reordered wrong. The Unicode Bidirectional Algorithm (rules P2/P3)
// says the base direction of a paragraph is set by its first *strong*
// directional character; neutrals — digits, spaces, punctuation, combining
// marks — are skipped. "123 مرحبا" is an RTL paragraph even though it starts
// with a digit.

// Strong RTL scripts (bidi classes R and AL). A small, dependency-free table
// covering the scripts these fixtures exercise; not the full Unicode bidi DB.
const STRONG_RTL = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic
  [0x0700, 0x074f], // Syriac
  [0x0750, 0x077f], // Arabic Supplement
  [0x08a0, 0x08ff], // Arabic Extended-A
  [0xfb1d, 0xfb4f], // Hebrew presentation forms
  [0xfb50, 0xfdff], // Arabic presentation forms-A
  [0xfe70, 0xfeff], // Arabic presentation forms-B
];

// Strong LTR scripts (bidi class L) that show up across these fixtures.
const STRONG_LTR = [
  [0x0041, 0x005a], // ASCII A-Z
  [0x0061, 0x007a], // ASCII a-z
  [0x00c0, 0x024f], // Latin-1 + Latin Extended-A/B letters
  [0x0370, 0x03ff], // Greek
  [0x0400, 0x04ff], // Cyrillic
  [0x1100, 0x11ff], // Hangul Jamo
  [0x3040, 0x30ff], // Hiragana, Katakana
  [0x3400, 0x9fff], // CJK ideographs
  [0xac00, 0xd7a3], // Hangul syllables
];

function inRanges(cp, ranges) {
  for (const [lo, hi] of ranges) if (cp >= lo && cp <= hi) return true;
  return false;
}

const isStrongRTL = (cp) => inRanges(cp, STRONG_RTL);
const isStrongLTR = (cp) => inRanges(cp, STRONG_LTR);

/**
 * Correct: base direction per Unicode Bidi rules P2/P3 — the first *strong*
 * directional character decides; neutrals are skipped; default LTR if none.
 */
export function baseDirection(str) {
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (isStrongRTL(cp)) return "rtl";
    if (isStrongLTR(cp)) return "ltr";
  }
  return "ltr";
}

/**
 * Buggy reference: guess direction from the first code point only. Any leading
 * digit, space, or punctuation forces LTR even when the text is Arabic/Hebrew.
 */
export function naiveDirection(str) {
  const first = str.codePointAt(0);
  return first !== undefined && isStrongRTL(first) ? "rtl" : "ltr";
}
