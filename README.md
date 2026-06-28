# cjk-agent-fixtures

A classified, runnable field guide to the ways non-English text quietly breaks
in editors, terminals, and AI agents. Each failure mode is observed from real
behaviour, sorted into a small taxonomy of friction, and pinned to a test that
fails the next time the bug sneaks back in.

If a project has no regression fixture for IME composition, bidi direction, or
Unicode normalization, the same input bugs come back within a release or two.
They are easy to fix once and just as easy to break again, because nobody on the
team is typing `日本語`, `한국어`, or `مرحبا` into the field during review. These
fixtures pin the behaviour down so the bug fails CI instead of shipping.

Browser and computer-use agents that operate non-English UIs hit exactly these
regressions: a confirm-Enter that fires early, a byte slice through a kanji, an
RTL form laid out backwards. So the same fixtures double as a robustness suite
for agents driving real-world, non-English screens.

Each fixture is self-contained, dependency-free (Node and Go standard library
only), and ships in two languages so it drops into whichever side of your stack
touches text:

- `js/` runs under [Vitest](https://vitest.dev)
- `go/` runs under standard `go test`

Every fixture proves two things at once: the correct reference passes, and a
deliberately broken reference is caught. That second half is the point. A green
checkmark that never goes red catches nothing.

## The taxonomy

The seven failure modes are not seven unrelated bugs. They cluster into three
wrong assumptions a system makes about text. The full classification, with the
"if a system assumes X, then failure Y in context Z" model for each group and a
receipt for every case, is in [`TAXONOMY.md`](TAXONOMY.md). The machine-readable
version is [`taxonomy.json`](taxonomy.json).

| Type | The wrong assumption | Fixtures |
|---|---|---|
| 1 Format mismatch | one character is one byte and one display column, in one canonical encoding | byte-boundary (#2), fullwidth width (#3), NFC/NFD (#7) |
| 2 Legal / schema mismatch | one global shape for an address, invoice, tax line, or receipt | none here; a separate compliance layer |
| 3 Cultural / UX mismatch | every keystroke commits now, focus changes are harmless, text flows left to right | compose-confirm Enter (#1), commit drop on blur (#4), re-entry after blur (#5), bidi direction (#6) |

Counts: Type 1 has 3 fixtures, Type 2 has 0, Type 3 has 4. Seven in total, each
present in both the JavaScript and the Go port.

## The failure modes

Scripts covered: Japanese (kana / kanji), Korean (Hangul), Chinese (pinyin),
Arabic and Hebrew (RTL), and combining marks (Latin accents, Arabic harakat).

| # | Failure mode | Type | Scripts | What breaks | The fixture asserts |
|---|---|---|---|---|---|
| 1 | early-Enter compose-confirm | 3 | JP · KO · ZH | An Enter handler that ignores `isComposing` submits (or inserts a newline) on the key that confirms an IME candidate, eating the first attempt at every message. | The confirm Enter does not submit; only the real Enter does. |
| 2 | byte-boundary crash | 1 | JP · KO · AR · HE | Slicing text by raw byte index (crossing into Rust, Go, C++, or old Node `Buffer` code) lands mid-character. CJK and Hangul are 3 UTF-8 bytes, Arabic and Hebrew are 2, and the slice produces `U+FFFD` or garbage. | A byte slice corrupts; a code-point slice keeps characters whole. |
| 3 | fullwidth / zero-width mismatch | 1 | JP · KO · ZH · AR · combining | A renderer that counts characters instead of columns misplaces the cursor: fullwidth CJK and Hangul take 2 columns, while combining marks (accents, Arabic harakat) take 0. | `displayWidth` counts columns; the naive count is flagged wrong. |
| 4 | commit-callback-drop on focus-shift | 3 | JP · KO · ZH | Focus moves away mid-composition and `compositionend` never fires, so the pending text is silently dropped. | A correct editor commits the pending composition on blur; a dropping one loses it. |
| 5 | re-entry after blur | 3 | JP · KO · ZH | On some browsers `isComposing` stays true after focus leaves during composition, so the field rejects every later keystroke and looks frozen. | After blur and refocus, a plain keystroke is accepted again. |
| 6 | bidi base-direction | 3 | AR · HE | A field that hard-codes LTR, or guesses direction from the first character, lays Arabic and Hebrew out backwards when the line starts with a digit or bracket (`123 مرحبا`). | Base direction follows the first strong character (Unicode Bidi P2/P3); leading neutrals are skipped. |
| 7 | NFC/NFD normalization | 1 | Latin accents · KO | The same text encoded precomposed (NFC) vs decomposed (NFD) compares unequal under raw `===`, so a login fails, a file "isn't found", or a dedup keeps both copies. | A normalized compare treats the forms as equal; the raw compare is flagged wrong. |

## Run it

```bash
# JavaScript
cd js && npm install && npm test

# Go
cd go && go test ./...
```

## Wire it into your CI

Two ways to use these, depending on how close you want to get:

1. **Copy the fixture tests** into your suite and point the event calls at your
   own component. The reference editor in `js/src/editor.js` and
   `go/editor.go` models the IME lifecycle (`compositionstart`,
   `compositionupdate`, `compositionend`, plus `keydown`, `blur`, and `focus`)
   for Japanese, Korean, and Chinese alike. Replace it with your real input and
   the assertions carry straight over.
2. **Lift the pure helpers** directly. `displayWidth`, `codePointSlice`,
   `baseDirection`, the normalization compare, and the byte-validity checks are
   production-usable as-is.

A minimal GitHub Actions job (this repo's own `.github/workflows/ci.yml`):

```yaml
name: ci
on: [push, pull_request]
jobs:
  js:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: js } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: npm install
      - run: npm test
  go:
    runs-on: ubuntu-latest
    defaults: { run: { working-directory: go } }
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-go@v5
        with: { go-version: '1.22' }
      - run: go test ./...
```

## Wiring to a real DOM component

The editor model is framework-agnostic so the fixtures run anywhere with zero
setup. When you want to drive a real DOM input instead, dispatch actual
`CompositionEvent`s, the same sequence the model encodes, for any IME (kana,
Hangul, pinyin candidates):

```js
function simulateCompose(target, candidate, final) {
  target.dispatchEvent(new CompositionEvent("compositionstart", { bubbles: true }));
  target.dispatchEvent(new CompositionEvent("compositionupdate", { bubbles: true, data: candidate }));
  target.dispatchEvent(new CompositionEvent("compositionend", { bubbles: true, data: final }));
}

// The confirm Enter carries isComposing: true.
function pressEnter(target, isComposing) {
  target.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", isComposing, bubbles: true }));
}

// Then assert against your component's value / submit handler, e.g.:
simulateCompose(input, "한구", "한국");
pressEnter(input, false);
```

Run that under jsdom or happy-dom (or a real browser via Playwright) and assert
the same outcomes the model tests assert.

## Scope and limits

Seven modes is a seed taxonomy, not a complete one. It covers the input and
text-shaping layer for the scripts above. It does not cover sorting and
collation, locale-aware date and number formatting, font fallback, or the legal
and schema layer (Type 2 in the taxonomy, which lives in a separate compliance
artifact, not in input fixtures).

## License

MIT. Use them, copy them, vendor them into your test suite. No attribution
required.

---

*field notes on the Japan-shaped holes · github.com/greymoth-jp*
