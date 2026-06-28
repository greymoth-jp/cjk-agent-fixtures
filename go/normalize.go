package cjkfixtures

import "unicode/utf8"

// Unicode normalization — combining marks and canonical equivalence (failure
// mode #7, NFC/NFD normalization). The same text can be encoded precomposed
// (NFC: "é" = U+00E9, "한" = U+D55C) or decomposed (NFD: "e" + U+0301,
// "ㅎ"+"ㅏ"+"ㄴ"). macOS filesystems return NFD, keyboards and the web produce
// NFC, an IME can emit either — so code that compares with a raw == treats the
// two forms as different strings and a login fails / a file "isn't found" / a
// dedup keeps both copies. The fix is to normalize before comparing.
//
// The Go standard library has no normalizer (that lives in golang.org/x/text,
// an external module). To stay dependency-free, canonicalKey below applies a
// minimal canonical decomposition: the Hangul algorithm (U+AC00..U+D7A3 -> L/V/T
// jamo) plus a small table of precomposed Latin letters. It covers the marks
// and syllables these fixtures use; full Unicode NFC/NFD is out of scope.

// Algorithmic Hangul decomposition constants (Unicode 3.12).
const (
	hangulSBase  = 0xac00
	hangulLBase  = 0x1100
	hangulVBase  = 0x1161
	hangulTBase  = 0x11a7
	hangulTCount = 28
	hangulNCount = 588 // VCount * TCount
	hangulSCount = 11172
)

// Small table of precomposed Latin letters -> canonical decomposition. Covers
// the accented characters these fixtures use; not the full UCD.
var latinDecomp = map[rune][]rune{
	0x00e9: {0x0065, 0x0301}, // é -> e + combining acute
	0x00e8: {0x0065, 0x0300}, // è -> e + combining grave
	0x00f1: {0x006e, 0x0303}, // ñ -> n + combining tilde
	0x00fc: {0x0075, 0x0308}, // ü -> u + combining diaeresis
	0x00e1: {0x0061, 0x0301}, // á -> a + combining acute
	0x00f6: {0x006f, 0x0308}, // ö -> o + combining diaeresis
}

// decomposeRune returns the canonical decomposition of a single rune, or the
// rune unchanged when no decomposition is known.
func decomposeRune(r rune) []rune {
	if r >= hangulSBase && r < hangulSBase+hangulSCount {
		si := int(r) - hangulSBase
		l := rune(hangulLBase + si/hangulNCount)
		v := rune(hangulVBase + (si%hangulNCount)/hangulTCount)
		t := hangulTBase + si%hangulTCount
		if t != hangulTBase {
			return []rune{l, v, rune(t)}
		}
		return []rune{l, v}
	}
	if d, ok := latinDecomp[r]; ok {
		return d
	}
	return []rune{r}
}

// canonicalKey is the canonical decomposition of a string. Two canonically
// equivalent strings (NFC vs NFD) produce the same key.
func canonicalKey(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		out = append(out, decomposeRune(r)...)
	}
	return string(out)
}

// NaiveEquals is the buggy reference: compare raw bytes, so NFC != NFD.
func NaiveEquals(a, b string) bool {
	return a == b
}

// CanonicalEquals is correct: compare canonical decompositions so equivalent
// text matches across normalization forms.
func CanonicalEquals(a, b string) bool {
	return canonicalKey(a) == canonicalKey(b)
}

// CodePointLength counts runes — it differs between NFC and NFD of the same text.
func CodePointLength(s string) int {
	return utf8.RuneCountInString(s)
}
