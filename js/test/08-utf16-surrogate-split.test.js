// Failure mode #8: UTF-16 surrogate split.
//
// JavaScript strings index by UTF-16 code unit, and any code point above U+FFFF
// is stored as a surrogate pair (two units). Rare kanji (𠮷 U+20BB7, the kanji
// in 𠮷野家) and emoji live above U+FFFF, so `.length` over-counts and a slice at
// an odd unit boundary splits the pair into a lone surrogate. Slicing by code
// point keeps the character whole.
import { describe, it, expect } from "vitest";
import {
  utf16Slice,
  codePointSlice,
  utf16Length,
  codePointLength,
  isWellFormed,
} from "../src/surrogate.js";

const CASES = [
  { name: "rare kanji 𠮷野家", s: "𠮷野家", head: "𠮷" }, // U+20BB7 + 野 + 家
  { name: "emoji 😀ok", s: "😀ok", head: "😀" }, // U+1F600 + ok
];

for (const { name, s, head } of CASES) {
  describe(`utf16 surrogate split (${name})`, () => {
    it("length counts the astral character as two UTF-16 units", () => {
      expect(utf16Length(s)).toBe(codePointLength(s) + 1);
    });

    it("a UTF-16 unit slice splits the surrogate pair", () => {
      const broken = utf16Slice(s, 1); // one code unit = a lone high surrogate
      expect(isWellFormed(broken)).toBe(false);
    });

    it("a code-point slice keeps the astral character whole", () => {
      const safe = codePointSlice(s, 1);
      expect(safe).toBe(head);
      expect(isWellFormed(safe)).toBe(true);
    });

    it("the fixture distinguishes the two slices", () => {
      expect(utf16Slice(s, 1)).not.toBe(codePointSlice(s, 1));
    });
  });
}

describe("utf16 surrogate split (well-formedness)", () => {
  it("a whole astral string is well-formed", () => {
    expect(isWellFormed("𠮷野家")).toBe(true);
    expect("𠮷野家".isWellFormed()).toBe(true); // agrees with the native check
  });

  it("a lone surrogate is flagged either side of the boundary", () => {
    expect(isWellFormed("\uD842")).toBe(false); // lone high surrogate
    expect(isWellFormed("\uDFB7")).toBe(false); // lone low surrogate
  });
});
