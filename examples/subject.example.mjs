// Example subject for cjk-fixtures-check.
//
// A subject is a plain object of handler functions. The gate feeds each corpus
// case to the matching function and compares the result to the value a correct
// handler returns. Implement only the handlers you have; missing ones skip that
// category, so you can adopt the gate one failure mode at a time.
//
// Wire each handler to YOUR code. Below it is wired to the package's own
// reference helpers so the file runs as-is and passes; swap the right-hand sides
// for your width / normalize / direction / trim / slice / IME functions.
//
//   npx cjk-fixtures-check --subject examples/subject.example.mjs
//
import {
  displayWidth,
  nfcEqual,
  nfkcEqual,
  baseDirection,
  unicodeTrim,
  codePointSlice,
  graphemeSlice,
  createEditor,
} from "@greymoth/cjk-agent-fixtures";

export default {
  name: "example",

  // #3 — return the display column width of the string.
  width: (s) => displayWidth(s),

  // #7 / #9 — does your equality / dedup key treat these as equal?
  equalNFC: (a, b) => nfcEqual(a, b),
  equalNFKC: (a, b) => nfkcEqual(a, b),

  // #6 — base writing direction of the line.
  direction: (s) => baseDirection(s),

  // #11 — trim, Unicode-aware (U+3000 counts as whitespace).
  trim: (s) => unicodeTrim(s),

  // #2 / #8 / #10 — truncate without tearing a character or cluster.
  slice: (s, limit, unit) => (unit === "grapheme" ? graphemeSlice(s, limit) : codePointSlice(s, limit)),

  // #1 / #4 / #5 — return a fresh IME-aware input. Replace createEditor() with a
  // five-line adapter onto your real component's keydown / composition / blur /
  // focus handlers (see the package README).
  editor: () => createEditor(),
};
