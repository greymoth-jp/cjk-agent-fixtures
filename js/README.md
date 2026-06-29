# @greymoth/cjk-agent-fixtures

A reference regression suite for the ways CJK, Korean, RTL, and combining-mark
text breaks in editors, terminals, and AI agents. Run the cases against your own
input handlers in CI so the bug fails your build instead of shipping.

This is a test suite, not a black-box scanner. It does not inspect your binary
or guess your behaviour. You point it at your own functions; the package holds
the inputs and the expected answers.

There are eleven failure modes, grouped into six case categories. Each case has
an input, the result a correct handler returns, and the result a common broken
handler returns. Every case carries its `mode` (1..11) and `slug`, matching the
`taxonomy.json` shipped in this package and the full writeup in the
[repository](https://github.com/greymoth-jp/cjk-agent-fixtures).

```bash
npm install -D @greymoth/cjk-agent-fixtures
```

```js
import { describe, it, expect } from "vitest"; // or "@jest/globals"
import {
  widthCases, // #3  column width
  equalityCases, // #7, #9  NFC/NFD and NFKC folding
  directionCases, // #6  bidi base direction
  whitespaceCases, // #11 fullwidth-space trim
  sliceCases, // #2, #8, #10 byte / UTF-16 / grapheme cutting
  editorCases, // #1, #4, #5  IME composition lifecycle
  applyEvents,
} from "@greymoth/cjk-agent-fixtures";

import { displayWidth, dedupKey, createInput } from "../src/text.js"; // your code

it.each(widthCases)("width of $input", ({ input, correctWidth }) => {
  expect(displayWidth(input)).toBe(correctWidth);
});

it.each(equalityCases)("$a vs $b", ({ a, b, nfkcEqual }) => {
  expect(dedupKey(a) === dedupKey(b)).toBe(nfkcEqual);
});

// applyEvents drives any object exposing keydown / composition / blur / focus.
// For a real component, swap it for a small adapter onto your own handlers.
it.each(editorCases)("$slug", ({ events, correct }) => {
  const input = applyEvents(createInput(), events);
  expect(input.value).toBe(correct.value);
  expect(input.submitted).toBe(correct.submitted);
});
```

The package also exports the small, dependency-free reference helpers the cases
are checked against, so you can lift any you do not already have: `displayWidth`,
`codePointSlice`, `graphemeSlice`, `isWellFormed`, `nfcEqual`, `nfkcEqual`,
`baseDirection`, `unicodeTrim`, and `createEditor`. Types are bundled.

A Go port lives in the same repository under `go/`:

```bash
go get github.com/greymoth-jp/cjk-agent-fixtures/go
```

## License

MIT. Copy them, vendor them, no attribution required.
