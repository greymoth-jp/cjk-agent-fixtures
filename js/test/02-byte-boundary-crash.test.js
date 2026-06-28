// Failure mode #2: byte-boundary crash.
//
// "ok日本語test" — the ASCII parts are 1 byte each, every kanji is 3 UTF-8
// bytes. Slicing by raw byte index to get "the first 4 bytes" lands inside 日
// and corrupts the string. Slicing by code point keeps characters intact.
import { describe, it, expect } from "vitest";
import {
  byteSlice,
  codePointSlice,
  hasReplacementChar,
} from "../src/bytes.js";

const SAMPLE = "ok日本語test";

describe("byte-boundary crash", () => {
  it("catches a raw byte slice that cuts a multi-byte character", () => {
    const broken = byteSlice(SAMPLE, 4); // bytes: o, k, then half of 日
    expect(hasReplacementChar(broken)).toBe(true);
  });

  it("a code-point slice keeps characters whole", () => {
    const safe = codePointSlice(SAMPLE, 4); // first 4 characters
    expect(safe).toBe("ok日本");
    expect(hasReplacementChar(safe)).toBe(false);
  });

  it("the fixture distinguishes the two", () => {
    expect(byteSlice(SAMPLE, 4)).not.toBe(codePointSlice(SAMPLE, 4));
  });
});
