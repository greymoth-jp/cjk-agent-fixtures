// Failure mode #2: byte-boundary crash.
//
// Slicing text by raw byte index to grab "the first N bytes" lands inside a
// multi-byte sequence and corrupts the string. Japanese/Korean characters are 3
// UTF-8 bytes; Arabic/Hebrew are 2. Slicing by code point keeps characters
// whole. This bites whenever text crosses into Rust/Go/C++ or old Node Buffer
// code.
import { describe, it, expect } from "vitest";
import {
  byteSlice,
  codePointSlice,
  hasReplacementChar,
} from "../src/bytes.js";

// Each case slices at a byte offset that lands mid-character, and at the
// equivalent code-point count that stays whole.
const CASES = [
  { lang: "Japanese", s: "ok日本語test", byteCut: 4, runeCut: 4, head: "ok日本" },
  { lang: "Korean", s: "ok한국test", byteCut: 3, runeCut: 3, head: "ok한" },
  { lang: "Arabic", s: "okمرحباtest", byteCut: 3, runeCut: 3, head: "okم" },
  { lang: "Hebrew", s: "okשלוםtest", byteCut: 3, runeCut: 3, head: "okש" },
];

for (const { lang, s, byteCut, runeCut, head } of CASES) {
  describe(`byte-boundary crash (${lang})`, () => {
    it("catches a raw byte slice that cuts a multi-byte character", () => {
      const broken = byteSlice(s, byteCut);
      expect(hasReplacementChar(broken)).toBe(true);
    });

    it("a code-point slice keeps characters whole", () => {
      const safe = codePointSlice(s, runeCut);
      expect(safe).toBe(head);
      expect(hasReplacementChar(safe)).toBe(false);
    });

    it("the fixture distinguishes the two", () => {
      expect(byteSlice(s, byteCut)).not.toBe(codePointSlice(s, runeCut));
    });
  });
}
