// Failure mode #3: fullwidth width mismatch.
//
// Fixed-width renderers (terminals, TUIs, some code editors) that count
// characters instead of columns misplace the cursor the moment a fullwidth CJK
// string appears: 日本語 occupies 6 columns, not 3.
import { describe, it, expect } from "vitest";
import { displayWidth, naiveWidth } from "../src/width.js";

describe("fullwidth width mismatch", () => {
  it("fullwidth CJK counts as two columns each", () => {
    expect(displayWidth("日本語")).toBe(6);
    expect(displayWidth("Ａ")).toBe(2); // fullwidth Latin A
  });

  it("ASCII and halfwidth katakana stay one column each", () => {
    expect(displayWidth("ok")).toBe(2);
    expect(displayWidth("ﾆﾎﾝ")).toBe(3); // halfwidth katakana
  });

  it("mixed strings add up by column", () => {
    expect(displayWidth("ok日本")).toBe(6); // 1 + 1 + 2 + 2
  });

  it("catches a renderer that assumes one column per character", () => {
    expect(naiveWidth("日本語")).toBe(3); // wrong by half
    expect(naiveWidth("日本語")).not.toBe(displayWidth("日本語"));
  });
});
