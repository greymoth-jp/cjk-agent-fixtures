// Failure mode #10: grapheme-cluster split.
//
// One thing a reader sees as a single character is often several code points:
// a ZWJ emoji family, a skin-tone emoji, a two-letter flag, or a Japanese
// ideographic variation sequence (a name kanji plus a glyph selector). Even the
// correct code-point slice that fixes #2 and #8 cuts these apart. Segmenting by
// grapheme cluster keeps them whole.
import { describe, it, expect } from "vitest";
import {
  graphemes,
  graphemeLength,
  graphemeSlice,
  codePointSlice,
} from "../src/graphemes.js";

const cp = (s) => Array.from(s).length;

const CASES = [
  { name: "ZWJ family", s: "👨‍👩‍👧", codePoints: 5 },
  { name: "skin-tone emoji", s: "👍🏽", codePoints: 2 },
  { name: "flag (regional indicators)", s: "🇯🇵", codePoints: 2 },
  { name: "variation-selector heart", s: "❤️", codePoints: 2 },
  { name: "ideographic variation sequence", s: "葛󠄀", codePoints: 2 }, // 葛 + U+E0100
];

for (const { name, s, codePoints } of CASES) {
  describe(`grapheme-cluster split (${name})`, () => {
    it("is one grapheme made of several code points", () => {
      expect(graphemeLength(s)).toBe(1);
      expect(cp(s)).toBe(codePoints);
    });

    it("a code-point slice splits the cluster", () => {
      const broken = codePointSlice(s, 1);
      expect(broken).not.toBe(s); // the first code point is not the whole cluster
      expect(cp(broken)).toBeLessThan(codePoints);
    });

    it("a grapheme slice keeps the cluster whole", () => {
      expect(graphemeSlice(s, 1)).toBe(s);
    });
  });
}

describe("grapheme-cluster split (what gets lost)", () => {
  it("a skin tone is stripped by a code-point slice", () => {
    expect(codePointSlice("👍🏽", 1)).toBe("👍"); // the modifier is dropped
  });

  it("an ideographic variation selector is dropped, changing the kanji glyph", () => {
    expect(codePointSlice("葛󠄀", 1)).toBe("葛"); // the E0100 selector is gone
  });

  it("a grapheme-aware truncation keeps an emoji family intact", () => {
    const msg = "a👨‍👩‍👧b";
    expect(graphemeSlice(msg, 2)).toBe("a👨‍👩‍👧");
    expect(codePointSlice(msg, 2)).not.toBe("a👨‍👩‍👧"); // the family is torn open
  });

  it("the minimal segmenter agrees with Intl.Segmenter on these inputs", () => {
    const seg = new Intl.Segmenter("en", { granularity: "grapheme" });
    for (const { s } of CASES) {
      const ref = [...seg.segment(s)].map((x) => x.segment);
      expect(graphemes(s)).toEqual(ref);
    }
  });
});
