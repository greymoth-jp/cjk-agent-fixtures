// Machine-readable regression cases for the eleven CJK / multilingual input
// failure modes.
//
// The point of this file is adoption. The other modules in src/ verify this
// repo's own reference helpers. These cases let you run YOUR handler instead:
// loop a category, feed each `input` to your function, and assert the `correct`
// value. Every case also carries the wrong value a common broken handler
// produces, so you can prove your test actually bites.
//
// Each case carries `mode` (1..11) and `slug`, matching taxonomy.json, so a
// failure points straight back to the documented failure mode.
//
// Categories map to the taxonomy:
//   widthCases       -> #3  (fullwidth / zero-width column width)
//   equalityCases    -> #7, #9  (NFC/NFD and NFKC folding)
//   directionCases   -> #6  (bidi base direction)
//   whitespaceCases  -> #11 (fullwidth-space trim)
//   sliceCases       -> #2, #8, #10 (byte / UTF-16 / grapheme cutting)
//   editorCases      -> #1, #4, #5  (IME composition lifecycle)

// --- #3 column width -------------------------------------------------------
// Feed `input` to your width function. It should return `correctWidth`.
// `naiveWidth` is what a one-column-per-character counter returns.
export const widthCases = [
  { mode: 3, slug: "fullwidth-width", script: "JP", input: "日本語", correctWidth: 6, naiveWidth: 3 },
  { mode: 3, slug: "fullwidth-width", script: "ZH", input: "中文", correctWidth: 4, naiveWidth: 2 },
  { mode: 3, slug: "fullwidth-width", script: "KO", input: "한국어", correctWidth: 6, naiveWidth: 3 },
  { mode: 3, slug: "fullwidth-width", script: "JP", input: "Ａ", correctWidth: 2, naiveWidth: 1 },
  { mode: 3, slug: "fullwidth-width", script: "JP", input: "ＡＢ１２", correctWidth: 8, naiveWidth: 4 },
  { mode: 3, slug: "fullwidth-width", script: "JP", input: "ﾆﾎﾝ", correctWidth: 3, naiveWidth: 3 },
  { mode: 3, slug: "fullwidth-width", script: "AR", input: "مرحبا", correctWidth: 5, naiveWidth: 5 },
  { mode: 3, slug: "fullwidth-width", script: "combining", input: "é", correctWidth: 1, naiveWidth: 2 },
  { mode: 3, slug: "fullwidth-width", script: "JP", input: "ok日本", correctWidth: 6, naiveWidth: 4 },
];

// --- #7, #9 equality -------------------------------------------------------
// Feed (`a`, `b`) to your compare. `rawEqual` is `a === b`. `nfcEqual` is true
// once you normalize canonically (settles NFC vs NFD, #7). `nfkcEqual` is true
// once you fold compatibility forms (settles width variants, #9). NFC alone is
// not enough for #9: those rows are `nfcEqual: false, nfkcEqual: true`.
export const equalityCases = [
  { mode: 7, slug: "nfc-nfd-normalization", script: "Latin", a: "é", b: "é", rawEqual: false, nfcEqual: true, nfkcEqual: true },
  { mode: 7, slug: "nfc-nfd-normalization", script: "KO", a: "한", b: "한", rawEqual: false, nfcEqual: true, nfkcEqual: true },
  { mode: 9, slug: "nfkc-compatibility-fold", script: "JP", a: "ﾊﾝｶｸ", b: "ハンカク", rawEqual: false, nfcEqual: false, nfkcEqual: true },
  { mode: 9, slug: "nfkc-compatibility-fold", script: "JP", a: "Ａ１", b: "A1", rawEqual: false, nfcEqual: false, nfkcEqual: true },
];

// --- #6 base direction -----------------------------------------------------
// Feed `input` to your direction function. It should return `correctDir`.
// `naiveFirstCharDir` is what guessing from the first code point returns; the
// gap shows up when a strong RTL line starts with a neutral (digit, bracket).
export const directionCases = [
  { mode: 6, slug: "bidi-base-direction", script: "AR", input: "مرحبا", correctDir: "rtl", naiveFirstCharDir: "rtl" },
  { mode: 6, slug: "bidi-base-direction", script: "AR", input: "123 مرحبا", correctDir: "rtl", naiveFirstCharDir: "ltr" },
  { mode: 6, slug: "bidi-base-direction", script: "HE", input: "(שלום)", correctDir: "rtl", naiveFirstCharDir: "ltr" },
  { mode: 6, slug: "bidi-base-direction", script: "EN", input: "hello", correctDir: "ltr", naiveFirstCharDir: "ltr" },
];

// --- #11 fullwidth-space trim ----------------------------------------------
// Feed `input` to your trim / blank check. A Unicode-aware trim yields
// `correctTrimmed` and a blank verdict of `correctBlank`. An ASCII-only trim
// leaves U+3000 in place, yielding `asciiTrimmed` / `asciiBlank`.
export const whitespaceCases = [
  { mode: 11, slug: "fullwidth-space-trim", script: "JP", input: "　　", correctTrimmed: "", correctBlank: true, asciiTrimmed: "　　", asciiBlank: false },
  { mode: 11, slug: "fullwidth-space-trim", script: "JP", input: "田中　", correctTrimmed: "田中", correctBlank: false, asciiTrimmed: "田中　", asciiBlank: false },
  { mode: 11, slug: "fullwidth-space-trim", script: "JP", input: "　田中　", correctTrimmed: "田中", correctBlank: false, asciiTrimmed: "　田中　", asciiBlank: false },
];

// --- #2, #8, #10 slicing ---------------------------------------------------
// Cutting `input` at `limit` in the granularity named by `unit` tears it into
// `torn`. Cutting at the next coarser granularity keeps it whole as `whole`.
//   unit "byte"     -> #2  (UTF-8 byte offset lands mid-character)
//   unit "utf16"    -> #8  (UTF-16 unit offset splits a surrogate pair)
//   unit "grapheme" -> #10 (code-point offset splits a joined cluster)
// For #2 and #8, `torn` carries a replacement char or a lone surrogate; assert
// your safe slicer never emits one (hasReplacementChar / isWellFormed). For
// #10 the torn output is well-formed but loses a skin tone, breaks a flag, or
// changes a name kanji, so assert against `whole` directly.
export const sliceCases = [
  { mode: 2, slug: "byte-boundary-crash", script: "JP", input: "日本語", unit: "byte", limit: 4, torn: "日�", whole: "日" },
  { mode: 2, slug: "byte-boundary-crash", script: "KO", input: "한국어", unit: "byte", limit: 4, torn: "한�", whole: "한" },
  { mode: 2, slug: "byte-boundary-crash", script: "AR", input: "مرحبا", unit: "byte", limit: 3, torn: "م�", whole: "م" },
  { mode: 8, slug: "utf16-surrogate-split", script: "JP", input: "𠮷野家", unit: "utf16", limit: 1, torn: "\uD842", whole: "𠮷" },
  { mode: 8, slug: "utf16-surrogate-split", script: "emoji", input: "👍ok", unit: "utf16", limit: 1, torn: "\uD83D", whole: "👍" },
  { mode: 10, slug: "grapheme-cluster-split", script: "emoji", input: "👍🏽ok", unit: "grapheme", limit: 1, torn: "👍", whole: "👍🏽" },
  { mode: 10, slug: "grapheme-cluster-split", script: "emoji", input: "🇯🇵 JP", unit: "grapheme", limit: 1, torn: "🇯", whole: "🇯🇵" },
  { mode: 10, slug: "grapheme-cluster-split", script: "emoji", input: "👨‍👩‍👧!", unit: "grapheme", limit: 1, torn: "👨", whole: "👨‍👩‍👧" },
];

// --- #1, #4, #5 IME composition lifecycle ----------------------------------
// Replay `events` against an IME-aware input, then assert its final state.
// A correct input ends at `correct` ({ value, submitted }); an input carrying
// `brokenBug` ends at `broken`. Use applyEvents(createEditor(), events) for the
// reference model, or write a five-line adapter that maps each event onto your
// real component's keydown / composition / blur / focus handlers (see README).
//
// Event shape:
//   { type: "compositionStart" }
//   { type: "compositionUpdate", data: "にほん" }
//   { type: "compositionEnd", data: "日本" }
//   { type: "keydown", key: "Enter", composing: true }
//   { type: "blur" } | { type: "focus" }
export const editorCases = [
  {
    mode: 1,
    slug: "early-enter-compose-confirm",
    script: "JP",
    events: [
      { type: "compositionStart" },
      { type: "compositionUpdate", data: "にほん" },
      { type: "keydown", key: "Enter", composing: true },
      { type: "compositionEnd", data: "日本" },
      { type: "keydown", key: "Enter", composing: false },
    ],
    correct: { value: "日本", submitted: 1 },
    brokenBug: "enterDuringCompose",
    broken: { value: "日本", submitted: 2 },
  },
  {
    mode: 4,
    slug: "commit-callback-drop",
    script: "KO",
    events: [
      { type: "compositionStart" },
      { type: "compositionUpdate", data: "한국" },
      { type: "blur" },
    ],
    correct: { value: "한국", submitted: 0 },
    brokenBug: "dropOnBlur",
    broken: { value: "", submitted: 0 },
  },
  {
    mode: 5,
    slug: "re-entry-after-blur",
    script: "JP",
    events: [
      { type: "compositionStart" },
      { type: "compositionUpdate", data: "ご" },
      { type: "blur" },
      { type: "focus" },
      { type: "keydown", key: "a", composing: false },
    ],
    correct: { value: "ごa", submitted: 0 },
    brokenBug: "stuckComposing",
    broken: { value: "", submitted: 0 },
  },
];

// Replay an event list against the reference editor (or any object exposing the
// same keydown / composition / blur / focus methods). Returns the editor.
export function applyEvents(editor, events) {
  for (const e of events) {
    switch (e.type) {
      case "keydown":
        editor.keydown(e.key, e.composing ?? false);
        break;
      case "compositionStart":
        editor.compositionStart();
        break;
      case "compositionUpdate":
        editor.compositionUpdate(e.data ?? "");
        break;
      case "compositionEnd":
        editor.compositionEnd(e.data ?? "");
        break;
      case "blur":
        editor.blur();
        break;
      case "focus":
        editor.focus();
        break;
      default:
        throw new Error("unknown editor event type: " + e.type);
    }
  }
  return editor;
}

// Every category in one object, plus a flat list for callers that want to walk
// all cases regardless of shape (each entry keeps its `mode` and `slug`).
export const cases = {
  width: widthCases,
  equality: equalityCases,
  direction: directionCases,
  whitespace: whitespaceCases,
  slice: sliceCases,
  editor: editorCases,
};

export const allCases = [
  ...widthCases,
  ...equalityCases,
  ...directionCases,
  ...whitespaceCases,
  ...sliceCases,
  ...editorCases,
];
