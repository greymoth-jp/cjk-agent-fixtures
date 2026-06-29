// @greymoth/cjk-agent-fixtures
//
// A reference CJK / multilingual input regression suite. Not a black-box
// scanner: it is a set of known-correct cases and small, dependency-free
// reference helpers. Run the cases against your own width / normalize / Enter /
// trim / slice handlers in CI so the input bugs fail the build instead of
// shipping.
//
// import { cases, displayWidth, nfkcEqual } from "@greymoth/cjk-agent-fixtures";

// Machine-readable cases and the IME event runner.
export {
  cases,
  allCases,
  widthCases,
  equalityCases,
  directionCases,
  whitespaceCases,
  sliceCases,
  editorCases,
  applyEvents,
} from "./src/cases.js";

// #3 column width.
export { charWidth, displayWidth, naiveWidth } from "./src/width.js";

// #2 byte-boundary and #8 UTF-16 surrogate slicing.
export { byteSlice, codePointSlice, hasReplacementChar, isCleanUtf8 } from "./src/bytes.js";
export { utf16Slice, utf16Length, codePointLength, isWellFormed } from "./src/surrogate.js";

// #10 grapheme clusters.
export { graphemes, graphemeLength, graphemeSlice } from "./src/graphemes.js";

// #7 NFC/NFD and #9 NFKC comparison. The compare helpers are aliased to names
// that say which level of equivalence they settle.
export { nfc, nfd } from "./src/normalize.js";
export { nfkc } from "./src/compat.js";
export { naiveEquals as rawEqual, normalizedEquals as nfcEqual } from "./src/normalize.js";
export { compatEquals as nfkcEqual } from "./src/compat.js";

// #6 bidi base direction.
export { baseDirection, naiveDirection } from "./src/bidi.js";

// #11 fullwidth-space trim.
export { asciiTrim, unicodeTrim, isBlankAscii, isBlankUnicode } from "./src/whitespace.js";

// #1, #4, #5 IME-aware input model.
export { createEditor } from "./src/editor.js";
