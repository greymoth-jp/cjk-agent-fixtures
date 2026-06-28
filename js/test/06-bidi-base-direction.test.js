// Failure mode #6: bidi base-direction (RTL).
//
// The base direction of a line is set by its first *strong* directional
// character (Unicode Bidi rules P2/P3) — leading digits, spaces, and
// punctuation are skipped. A field that guesses direction from the first
// character lays Arabic/Hebrew out backwards whenever it starts with a number
// or bracket ("123 مرحبا", "(שלום)").
import { describe, it, expect } from "vitest";
import { baseDirection, naiveDirection } from "../src/bidi.js";

describe("bidi base-direction", () => {
  it("pure RTL text is rtl", () => {
    expect(baseDirection("مرحبا")).toBe("rtl"); // Arabic
    expect(baseDirection("שלום")).toBe("rtl"); // Hebrew
  });

  it("pure LTR text is ltr", () => {
    expect(baseDirection("Hello")).toBe("ltr");
    expect(baseDirection("日本語")).toBe("ltr"); // CJK is LTR
  });

  it("skips leading neutrals to the first strong character", () => {
    expect(baseDirection("123 مرحبا")).toBe("rtl"); // digit is neutral
    expect(baseDirection("(שלום)")).toBe("rtl"); // bracket is neutral
    expect(baseDirection("  مرحبا")).toBe("rtl"); // spaces skipped
  });

  it("uses the first strong char in mixed runs", () => {
    expect(baseDirection("Hello مرحبا")).toBe("ltr");
    expect(baseDirection("مرحبا Hello")).toBe("rtl");
  });

  it("defaults to ltr when there is no strong character", () => {
    expect(baseDirection("123 !?")).toBe("ltr");
    expect(baseDirection("")).toBe("ltr");
  });

  it("catches a detector that reads only the first character", () => {
    expect(naiveDirection("123 مرحبا")).toBe("ltr"); // wrong
    expect(naiveDirection("123 مرحبا")).not.toBe(baseDirection("123 مرحبا"));
    expect(naiveDirection("(שלום)")).not.toBe(baseDirection("(שלום)"));
  });
});
