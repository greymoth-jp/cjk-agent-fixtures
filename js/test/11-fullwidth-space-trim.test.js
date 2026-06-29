// Failure mode #11: fullwidth-space trim.
//
// A Japanese IME in fullwidth mode types U+3000 (　) on the space bar, not an
// ASCII space. A blank-field check or a trim that only strips ASCII whitespace
// leaves it: a required field of only 　　 passes the not-empty check, and a
// value padded with 　 never matches its trimmed twin. Native trim (and Go's
// strings.TrimSpace) remove U+3000; a hand-rolled ASCII trim does not.
import { describe, it, expect } from "vitest";
import {
  asciiTrim,
  unicodeTrim,
  isBlankAscii,
  isBlankUnicode,
} from "../src/whitespace.js";

const IDE = "　"; // ideographic space, what the JP IME space bar produces

describe("fullwidth-space trim", () => {
  it("the IME space is U+3000, not an ASCII space", () => {
    expect(IDE).not.toBe(" ");
    expect(IDE.codePointAt(0)).toBe(0x3000);
  });

  it("an ASCII-only trim leaves a fullwidth space behind", () => {
    expect(asciiTrim(IDE + "田中" + IDE)).toBe(IDE + "田中" + IDE); // unchanged: the bug
  });

  it("native trim removes the fullwidth space", () => {
    expect(unicodeTrim(IDE + "田中" + IDE)).toBe("田中");
  });

  it("a field of only fullwidth spaces fools the ASCII blank check", () => {
    expect(isBlankAscii(IDE + IDE)).toBe(false); // looks non-empty: the bug
    expect(isBlankUnicode(IDE + IDE)).toBe(true); // correctly blank
  });

  it("the two trims disagree on fullwidth-padded input", () => {
    expect(asciiTrim(IDE + "x")).not.toBe(unicodeTrim(IDE + "x"));
  });

  it("both trims still agree on plain ASCII whitespace", () => {
    expect(asciiTrim("  hi  ")).toBe("hi");
    expect(unicodeTrim("  hi  ")).toBe("hi");
  });
});
