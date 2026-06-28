// Failure mode #3: fullwidth width mismatch.
//
// Fixed-width renderers (terminals, TUIs, some code editors) that count
// characters instead of columns misplace the cursor: fullwidth CJK and Hangul
// occupy 2 columns each, while Arabic/Hebrew vowel marks occupy 0. A naive
// character count is wrong in both directions.
import { describe, it, expect } from "vitest";
import { displayWidth, naiveWidth } from "../src/width.js";

describe("fullwidth width mismatch", () => {
  it("fullwidth CJK and Hangul count as two columns each", () => {
    expect(displayWidth("日本語")).toBe(6); // Japanese
    expect(displayWidth("中文")).toBe(4); // Chinese hanzi
    expect(displayWidth("한국어")).toBe(6); // Korean Hangul syllables
    expect(displayWidth("Ａ")).toBe(2); // fullwidth Latin A
  });

  it("ASCII, halfwidth katakana, and RTL letters stay one column each", () => {
    expect(displayWidth("ok")).toBe(2);
    expect(displayWidth("ﾆﾎﾝ")).toBe(3); // halfwidth katakana
    expect(displayWidth("مرحبا")).toBe(5); // Arabic, 5 letters
    expect(displayWidth("שלום")).toBe(4); // Hebrew, 4 letters
  });

  it("combining marks add no width", () => {
    expect(displayWidth("é")).toBe(1); // e + combining acute
    expect(displayWidth("café".normalize("NFD"))).toBe(4);
    // Arabic harakat (fatha) are zero-width: marked text is as wide as bare.
    expect(displayWidth("سَلَام")).toBe(displayWidth("سلام"));
  });

  it("mixed strings add up by column", () => {
    expect(displayWidth("ok日本")).toBe(6); // 1 + 1 + 2 + 2
  });

  it("catches a renderer that assumes one column per character", () => {
    expect(naiveWidth("日本語")).toBe(3); // wrong by half
    expect(naiveWidth("日本語")).not.toBe(displayWidth("日本語"));
    expect(naiveWidth("한국어")).not.toBe(displayWidth("한국어"));
  });
});
