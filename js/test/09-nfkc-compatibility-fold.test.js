// Failure mode #9: NFKC compatibility fold.
//
// Halfwidth katakana (ﾊﾝｶｸ) and fullwidth ASCII (Ａ１) are different code points
// from their normal-width twins (ハンカク, A1) but mean the same thing. A raw
// comparison, and even a canonical (NFC) comparison, reports them unequal —
// only compatibility normalization (NFKC) folds them. This is the failure that
// NFC/NFD (#7) does not cover.
import { describe, it, expect } from "vitest";
import {
  naiveEquals,
  canonicalEquals,
  compatEquals,
  nfkc,
} from "../src/compat.js";

const PAIRS = [
  { name: "halfwidth katakana", a: "ﾊﾝｶｸ", b: "ハンカク" },
  { name: "fullwidth ASCII", a: "Ａ１", b: "A1" },
  { name: "fullwidth digits", a: "２０２４", b: "2024" },
];

for (const { name, a, b } of PAIRS) {
  describe(`nfkc compatibility fold (${name})`, () => {
    it("the two width forms are different strings", () => {
      expect(a).not.toBe(b);
      expect(naiveEquals(a, b)).toBe(false); // catches the raw-compare bug
    });

    it("canonical (NFC) comparison still reports them unequal", () => {
      // NFC settles é vs e+◌́ but leaves width variants apart — #7's fix is not enough.
      expect(canonicalEquals(a, b)).toBe(false);
    });

    it("compatibility (NFKC) comparison folds them equal", () => {
      expect(compatEquals(a, b)).toBe(true);
      expect(nfkc(a)).toBe(b.normalize("NFKC"));
    });
  });
}

describe("nfkc compatibility fold (folds to the normal-width form)", () => {
  it("halfwidth katakana folds to fullwidth katakana", () => {
    expect(nfkc("ﾊﾝｶｸ")).toBe("ハンカク");
  });
  it("fullwidth ASCII folds to plain ASCII", () => {
    expect(nfkc("Ａ１")).toBe("A1");
  });
});
