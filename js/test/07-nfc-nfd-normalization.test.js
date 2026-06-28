// Failure mode #7: NFC/NFD normalization (combining marks).
//
// The same text encodes two ways — precomposed (NFC) or decomposed (NFD, base
// letter + combining marks). macOS filesystems return NFD, keyboards and the
// web produce NFC, an IME can emit either. Code that compares with raw === sees
// two different strings: a login fails, a file "isn't found", a dedup keeps
// both copies. Normalizing before comparing fixes it.
import { describe, it, expect } from "vitest";
import {
  naiveEquals,
  normalizedEquals,
  codePointLength,
} from "../src/normalize.js";

// "café" and "한국" each built in both forms.
const cafeNFC = "café".normalize("NFC"); // é = U+00E9 (4 code points)
const cafeNFD = "café".normalize("NFD"); // e + U+0301 (5 code points)
const hanNFC = "한국".normalize("NFC"); // 2 syllables
const hanNFD = "한국".normalize("NFD"); // 6 conjoining jamo

describe("NFC/NFD normalization", () => {
  it("canonically equal strings differ byte-for-byte", () => {
    expect(naiveEquals(cafeNFC, cafeNFD)).toBe(false); // catches the bug
    expect(cafeNFC).not.toBe(cafeNFD);
    expect(naiveEquals(hanNFC, hanNFD)).toBe(false);
  });

  it("normalized comparison treats the forms as equal", () => {
    expect(normalizedEquals(cafeNFC, cafeNFD)).toBe(true);
    expect(normalizedEquals(hanNFC, hanNFD)).toBe(true);
  });

  it("code-point length disagrees across forms", () => {
    expect(codePointLength(cafeNFC)).toBe(4);
    expect(codePointLength(cafeNFD)).toBe(5); // a maxlength check would lie
    expect(codePointLength(hanNFC)).toBe(2);
    expect(codePointLength(hanNFD)).toBe(6);
  });
});
