// Self-verification for the exported cases.
//
// Every case states a correct result and the wrong result a broken handler
// produces. This file proves both halves against this repo's own reference
// helpers, so the data shipped to adopters is real, not hand-typed guesses. If
// a literal in cases.js is wrong, this fails.
import { describe, it, expect } from "vitest";
import {
  widthCases,
  equalityCases,
  directionCases,
  whitespaceCases,
  sliceCases,
  editorCases,
  applyEvents,
  cases,
  allCases,
} from "../src/cases.js";
import { displayWidth, naiveWidth } from "../src/width.js";
import { byteSlice, codePointSlice, hasReplacementChar } from "../src/bytes.js";
import { utf16Slice, isWellFormed } from "../src/surrogate.js";
import { graphemeSlice, codePointSlice as cpSlice } from "../src/graphemes.js";
import { naiveEquals, normalizedEquals } from "../src/normalize.js";
import { compatEquals } from "../src/compat.js";
import { baseDirection, naiveDirection } from "../src/bidi.js";
import { asciiTrim, unicodeTrim, isBlankAscii, isBlankUnicode } from "../src/whitespace.js";
import { createEditor } from "../src/editor.js";

describe("width cases", () => {
  it.each(widthCases)("$input -> $correctWidth", (c) => {
    expect(displayWidth(c.input)).toBe(c.correctWidth);
    expect(naiveWidth(c.input)).toBe(c.naiveWidth);
  });
});

describe("equality cases", () => {
  it.each(equalityCases)("$a vs $b", (c) => {
    expect(naiveEquals(c.a, c.b)).toBe(c.rawEqual);
    expect(normalizedEquals(c.a, c.b)).toBe(c.nfcEqual);
    expect(compatEquals(c.a, c.b)).toBe(c.nfkcEqual);
    // NFKC must subsume NFC: anything NFC-equal is NFKC-equal.
    if (c.nfcEqual) expect(c.nfkcEqual).toBe(true);
  });
});

describe("direction cases", () => {
  it.each(directionCases)("$input", (c) => {
    expect(baseDirection(c.input)).toBe(c.correctDir);
    expect(naiveDirection(c.input)).toBe(c.naiveFirstCharDir);
  });
});

describe("whitespace cases", () => {
  it.each(whitespaceCases)("$input", (c) => {
    expect(unicodeTrim(c.input)).toBe(c.correctTrimmed);
    expect(isBlankUnicode(c.input)).toBe(c.correctBlank);
    expect(asciiTrim(c.input)).toBe(c.asciiTrimmed);
    expect(isBlankAscii(c.input)).toBe(c.asciiBlank);
  });
});

describe("slice cases", () => {
  it.each(sliceCases)("$slug $input", (c) => {
    if (c.unit === "byte") {
      expect(byteSlice(c.input, c.limit)).toBe(c.torn);
      expect(hasReplacementChar(c.torn)).toBe(true);
      expect(hasReplacementChar(c.whole)).toBe(false);
    } else if (c.unit === "utf16") {
      expect(utf16Slice(c.input, c.limit)).toBe(c.torn);
      expect(isWellFormed(c.torn)).toBe(false);
      expect(isWellFormed(c.whole)).toBe(true);
    } else {
      // grapheme: the code-point slice tears the cluster, the grapheme slice keeps it.
      expect(cpSlice(c.input, c.limit)).toBe(c.torn);
      expect(graphemeSlice(c.input, c.limit)).toBe(c.whole);
      expect(c.torn).not.toBe(c.whole);
    }
  });
});

describe("editor cases", () => {
  it.each(editorCases)("$slug", (c) => {
    const good = applyEvents(createEditor(), c.events);
    expect(good.value).toBe(c.correct.value);
    expect(good.submitted).toBe(c.correct.submitted);

    const bad = applyEvents(createEditor({ bugs: [c.brokenBug] }), c.events);
    expect(bad.value).toBe(c.broken.value);
    expect(bad.submitted).toBe(c.broken.submitted);

    // The bug must actually change the outcome.
    expect([c.broken.value, c.broken.submitted]).not.toEqual([
      c.correct.value,
      c.correct.submitted,
    ]);
  });
});

describe("coverage", () => {
  it("every fixture mode 1..11 has at least one case", () => {
    const modes = new Set(allCases.map((c) => c.mode));
    for (const m of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]) {
      expect(modes.has(m), `mode ${m} missing`).toBe(true);
    }
  });

  it("the grouped object and the flat list hold the same cases", () => {
    const grouped =
      cases.width.length +
      cases.equality.length +
      cases.direction.length +
      cases.whitespace.length +
      cases.slice.length +
      cases.editor.length;
    expect(grouped).toBe(allCases.length);
  });
});
