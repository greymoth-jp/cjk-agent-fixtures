# cjk-agent-fixtures

Runnable CI regression fixtures for the five ways CJK / IME input quietly
breaks in editors, terminals, and AI agents.

If a project has no regression fixture for IME composition, the same Japanese
input bugs come back within a release or two. They are easy to fix once and
just as easy to break again, because nobody on the team is typing 日本語 into
the field during review. These fixtures pin the behaviour down so the bug fails
CI the next time it sneaks in.

Each fixture is self-contained, dependency-free (Node + Go standard library
only), and ships in two languages so it drops into whichever side of your stack
touches text:

- `js/` — [Vitest](https://vitest.dev) tests
- `go/` — standard `go test`

Every fixture proves two things at once: the correct reference passes, and a
deliberately broken reference is **caught**. That second half is the point — a
green checkmark that never goes red catches nothing.

## The five failure modes

| # | Failure mode | What breaks | Example string | The fixture asserts |
|---|---|---|---|---|
| 1 | early-Enter compose-confirm | An Enter handler that ignores `isComposing` submits (or inserts a newline) on the key that confirms an IME candidate, eating the first attempt at every message. | `にほん` → `日本` | The confirm Enter does not submit; only the real Enter does. |
| 2 | byte-boundary crash | Slicing text by raw byte index (crossing into Rust/Go/C++, or old Node `Buffer` code) lands in the middle of a 3-byte kanji and produces `U+FFFD` / garbage. | `ok日本語test` | A byte slice corrupts; a code-point slice keeps characters whole. |
| 3 | fullwidth width mismatch | A fixed-width renderer that counts characters instead of columns misplaces the cursor, since fullwidth CJK takes two columns. | `日本語` (6 columns, not 3) | `displayWidth` counts columns; the naive count is flagged as wrong. |
| 4 | commit-callback-drop on focus-shift | Focus moves away mid-composition and `compositionend` never fires, so the pending text is silently dropped. | `にほんご` | A correct editor commits the pending composition on blur; a dropping one loses it. |
| 5 | re-entry after blur | On some browsers `isComposing` stays true after focus leaves during composition, so the field rejects every later keystroke and looks frozen. | `にほん`, then type `a` | After blur + refocus, a plain keystroke is accepted again. |

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
   own component. The reference editor in `js/src/editor.js` /
   `go/editor.go` models the IME lifecycle (`compositionstart` →
   `compositionupdate` → `compositionend`, plus `keydown` / `blur` / `focus`).
   Replace it with your real input and the assertions carry straight over.
2. **Lift the pure helpers** directly — `displayWidth`, `codePointSlice`, and
   the byte-validity checks are production-usable as-is.

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
`CompositionEvent`s — the same sequence the model encodes:

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
simulateCompose(input, "にほん", "日本");
pressEnter(input, false);
```

Run that under jsdom or happy-dom (or a real browser via Playwright) and assert
the same outcomes the model tests assert.

## License

MIT. Use them, copy them, vendor them into your test suite — no attribution
required.

---

*field notes on the Japan-shaped holes · github.com/greymoth-jp*
