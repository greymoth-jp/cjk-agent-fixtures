# A taxonomy of localization friction

The eleven failure modes in this repository are not eleven unrelated bugs. They
cluster into a small number of wrong assumptions a system makes about text. When
a date picker, a terminal, an editor, or an AI agent is written by a team that
never types `日本語`, `한국어`, or `مرحبا` into the field, the same assumptions
get baked in, and the same inputs break in the same few ways.

This file names those assumptions and groups the fixtures under them. It is a
field guide to the Japan-shaped (and more broadly CJK / RTL / combining-mark)
holes in global software: what is observed, not what is fixed. Every row points
at a runnable test that proves the case, so the classification stays anchored to
receipts rather than to claims.

The model for each group is the same shape:

> If a system assumes **X**, then failure **Y** occurs in context **Z**.

Three friction types account for all eleven fixtures.

| Type | Name | Fixtures here |
|---|---|---|
| 1 | Format mismatch | 6 |
| 2 | Legal / schema mismatch | 0 |
| 3 | Cultural / UX mismatch | 5 |

Type 2 has zero fixtures in this repository on purpose. It is part of the model
and recorded below, but it is a compliance surface, not an input-handling one, so
this fixture set does not exercise it.

---

## Type 1: Format mismatch

The system represents or measures a value with the wrong unit.

> If a system assumes one character is one byte, one UTF-16 unit, one display
> column, and one code point, in a single canonical encoding, then text is cut
> mid-character, cursors land in the wrong column, an astral character or a
> joined cluster is split, and two equal strings compare unequal, whenever the
> input is CJK, Hangul, RTL, carries combining marks, lives above U+FFFF, wears a
> width variant, or is a multi-code-point grapheme.

| # | Fixture | What breaks | Receipt |
|---|---|---|---|
| 2 | byte-boundary crash | Slicing by raw byte index lands inside a 3-byte kanji or 2-byte Arabic letter and yields `U+FFFD`. A code-point slice keeps characters whole. | [`js/test/02-byte-boundary-crash.test.js`](js/test/02-byte-boundary-crash.test.js), [`go/bytes_test.go`](go/bytes_test.go) |
| 3 | fullwidth / zero-width width | A renderer that counts characters reads `日本語` as width 3 instead of 6; fullwidth CJK and Hangul are 2 columns, Arabic harakat are 0. | [`js/test/03-fullwidth-width.test.js`](js/test/03-fullwidth-width.test.js), [`go/width_test.go`](go/width_test.go) |
| 7 | NFC / NFD normalization | `café` encoded precomposed (NFC) and decomposed (NFD) compares unequal under raw `===`, so a login fails or a file "isn't found". A normalized compare treats them as equal. | [`js/test/07-nfc-nfd-normalization.test.js`](js/test/07-nfc-nfd-normalization.test.js), [`go/normalize_test.go`](go/normalize_test.go) |
| 8 | UTF-16 surrogate split | A code point above U+FFFF (`𠮷`, every emoji) is two UTF-16 units, so `str.length` over-counts and a unit-boundary slice leaves a lone surrogate that decodes to `U+FFFD`. A code-point slice keeps it whole. This crosses a UTF-16 unit boundary, where #2 crosses a UTF-8 byte one. | [`js/test/08-utf16-surrogate-split.test.js`](js/test/08-utf16-surrogate-split.test.js), [`go/surrogate_test.go`](go/surrogate_test.go) |
| 9 | NFKC compatibility fold | Halfwidth katakana (`ﾊﾝｶｸ`) and fullwidth ASCII (`Ａ１`) compare unequal to `ハンカク` and `A1` under raw `===` and even under the canonical (NFC) compare from #7; only a compatibility (NFKC) fold matches them, so search and dedup stop missing the pair. | [`js/test/09-nfkc-compatibility-fold.test.js`](js/test/09-nfkc-compatibility-fold.test.js), [`go/compat_test.go`](go/compat_test.go) |
| 10 | grapheme-cluster split | A ZWJ emoji family, a skin-tone emoji, a flag, or a Japanese ideographic variation sequence (a name kanji + a glyph selector) is one grapheme over several code points; even the correct code-point slice from #2 and #8 splits it. A grapheme slice keeps it whole. | [`js/test/10-grapheme-cluster-split.test.js`](js/test/10-grapheme-cluster-split.test.js), [`go/graphemes_test.go`](go/graphemes_test.go) |

## Type 2: Legal / schema mismatch

The system assumes one global schema for things a jurisdiction defines its own
way.

> If a system assumes one global shape for an address, an invoice, a tax line, or
> a receipt, then a required field has nowhere to go or a value is rejected by a
> validator that does not know the local rule, in context Z being Japanese
> invoice retention (インボイス / 適格請求書), the 特商法 disclosure block, postal
> and name-order shape, or a tax-identifier format the global schema never
> modeled.

Fixtures here: **0**. These are compliance bugs, not input-handling bugs, so they
live in a separate validator layer rather than in these input fixtures. The type
is listed for completeness because the taxonomy spans all three layers.

## Type 3: Cultural / UX mismatch

The system assumes an interaction flow that does not hold for IME composition or
right-to-left text.

> If a system assumes every keystroke commits immediately, focus changes are
> harmless, the space key produces an ASCII space, and text flows left to right,
> then the key that confirms an IME candidate is read as submit, pending
> composition is dropped on focus change, the field freezes after refocus, a
> fullwidth space survives a blank check, or a line lays out backwards, in
> context Z being a user typing through an IME (kana, Hangul, pinyin) or entering
> a right-to-left script (Arabic, Hebrew).

| # | Fixture | What breaks | Receipt |
|---|---|---|---|
| 1 | early-Enter compose-confirm | The confirm Enter carries `isComposing: true`; a handler that submits on Enter eats the first message at every send. | [`js/test/01-early-enter-compose-confirm.test.js`](js/test/01-early-enter-compose-confirm.test.js), [`go/editor_test.go`](go/editor_test.go) |
| 4 | commit-callback-drop on focus-shift | Focus moves away mid-composition, `compositionend` never fires, and the pending text is silently dropped instead of committed. | [`js/test/04-commit-callback-drop.test.js`](js/test/04-commit-callback-drop.test.js), [`go/editor_test.go`](go/editor_test.go) |
| 5 | re-entry after blur | `isComposing` stays true after focus leaves, so after refocus every keystroke is swallowed and the field looks frozen. | [`js/test/05-re-entry-after-blur.test.js`](js/test/05-re-entry-after-blur.test.js), [`go/editor_test.go`](go/editor_test.go) |
| 6 | bidi base-direction | Direction guessed from the first character lays `123 مرحبا` out backwards; the correct rule follows the first strong character (Unicode Bidi P2/P3). | [`js/test/06-bidi-base-direction.test.js`](js/test/06-bidi-base-direction.test.js), [`go/bidi_test.go`](go/bidi_test.go) |
| 11 | fullwidth-space trim | The Japanese IME types U+3000 (`　`) on the space bar; an ASCII-only trim or blank check leaves it, so a field of only `　　` reads as non-empty and `田中　` never matches `田中`. A Unicode-aware trim (native `trim()`, `strings.TrimSpace`) removes it. | [`js/test/11-fullwidth-space-trim.test.js`](js/test/11-fullwidth-space-trim.test.js), [`go/whitespace_test.go`](go/whitespace_test.go) |

---

## Counts

| Type | Fixtures |
|---|---|
| 1: Format mismatch | 6 (#2, #3, #7, #8, #9, #10) |
| 2: Legal / schema mismatch | 0 |
| 3: Cultural / UX mismatch | 5 (#1, #4, #5, #6, #11) |
| **Total** | **11** |

Scripts touched across the set: Japanese (kana / kanji, rare CJK Extension B
kanji, halfwidth katakana, fullwidth and ideographic forms), Korean (Hangul),
Chinese (pinyin), Arabic and Hebrew (RTL), Latin and Arabic combining marks, and
emoji (ZWJ sequences, skin tones, flags). Both language ports (Vitest and
`go test`) carry the same eleven cases.

## What the classification buys

Grouping by the broken assumption, rather than by the symptom, tells you the
order to fix things and where the next bug will appear. A team that ships Type 1
without a column-width and a normalization check will reintroduce both within a
release. A team that handles Type 3 composition but never the focus-shift drop
loses text in exactly the spots no English-only review will catch.

The machine-readable version of this table is [`taxonomy.json`](taxonomy.json),
keyed by fixture id, with the assumption / failure / context fields and the
receipt paths for each case.

## Limits

Eleven modes is a seed taxonomy, not a complete one. It covers the input and
text-shaping layer for the scripts listed above; it does not cover sorting and
collation, locale-aware date and number formatting, font fallback, or the legal
layer (Type 2). Treat it as a starting map of the friction, not the whole
territory.

---

*field notes on the Japan-shaped holes · github.com/greymoth-jp · MIT*
