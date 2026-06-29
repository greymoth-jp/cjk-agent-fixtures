// Grapheme clusters — user-perceived characters that span several code points.
//
// Failure mode #10 (grapheme-cluster-split): a single thing a reader sees as
// "one character" is often several code points glued together. A ZWJ emoji
// family (👨‍👩‍👧 is man + ZWJ + woman + ZWJ + girl), a skin-tone emoji (👍🏽 is
// thumb + a U+1F3FB..U+1F3FF modifier), a flag (🇯🇵 is two regional indicators),
// or a Japanese ideographic variation sequence (葛 + U+E0100 selects a specific
// official-register glyph for a name kanji) are each one grapheme.
//
// Truncating, reversing, or measuring such text by code point — even with the
// correct code-point slice that fixes the byte (#2) and surrogate (#8) bugs —
// still cuts these apart: a family loses members, a skin tone is stripped (which
// reads as changing the person), a flag becomes two letters, and a name kanji
// silently changes glyph. The fix is to segment by grapheme cluster. In a
// browser or Node, Intl.Segmenter({ granularity: "grapheme" }) does this; the
// minimal segmenter below covers the joiners these fixtures exercise without a
// dependency.

const ZWJ = 0x200d;

// Code points that attach to the previous one (Grapheme_Cluster_Break = Extend
// or SpacingMark, narrowed to what these fixtures use): combining marks across
// scripts, variation selectors (incl. the supplementary IVS block), and emoji
// skin-tone modifiers. A small, dependency-free table, not the full UCD.
function isExtend(cp) {
  return (
    (cp >= 0x0300 && cp <= 0x036f) || // combining diacritical marks (Latin)
    (cp >= 0x0591 && cp <= 0x05bd) || // Hebrew points
    (cp >= 0x064b && cp <= 0x065f) || // Arabic harakat
    (cp >= 0xfe00 && cp <= 0xfe0f) || // variation selectors
    (cp >= 0x1f3fb && cp <= 0x1f3ff) || // emoji skin-tone modifiers
    (cp >= 0xe0100 && cp <= 0xe01ef) // variation selectors supplement (IVS)
  );
}

const isRegionalIndicator = (cp) => cp >= 0x1f1e6 && cp <= 0x1f1ff;

/**
 * Correct: split a string into grapheme clusters. Code points are kept together
 * when joined by ZWJ, when one is an Extend mark / variation selector / skin
 * tone, or when two regional indicators pair into a flag.
 */
export function graphemes(str) {
  const out = [];
  let cur = "";
  let prevZWJ = false;
  let ri = 0; // regional indicators in the current cluster
  for (const ch of str) {
    const cp = ch.codePointAt(0);
    if (cur === "") {
      cur = ch;
      prevZWJ = cp === ZWJ;
      ri = isRegionalIndicator(cp) ? 1 : 0;
      continue;
    }
    if (cp === ZWJ) {
      cur += ch;
      prevZWJ = true;
      continue;
    }
    if (prevZWJ) {
      cur += ch;
      prevZWJ = false;
      ri = isRegionalIndicator(cp) ? 1 : 0;
      continue;
    }
    if (isExtend(cp)) {
      cur += ch;
      continue;
    }
    if (isRegionalIndicator(cp) && ri === 1) {
      cur += ch;
      ri = 2;
      continue;
    }
    out.push(cur);
    cur = ch;
    prevZWJ = cp === ZWJ;
    ri = isRegionalIndicator(cp) ? 1 : 0;
  }
  if (cur !== "") out.push(cur);
  return out;
}

/** Count of grapheme clusters (what a reader would call "characters"). */
export function graphemeLength(str) {
  return graphemes(str).length;
}

/** Correct: take the first n grapheme clusters, never splitting one. */
export function graphemeSlice(str, n) {
  return graphemes(str).slice(0, n).join("");
}

/** Buggy reference: take the first n code points, splitting joined clusters. */
export function codePointSlice(str, n) {
  return Array.from(str).slice(0, n).join("");
}
