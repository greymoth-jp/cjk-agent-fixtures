package cjkfixtures

// Compatibility folding (failure mode #9, nfkc-compatibility-fold). Halfwidth
// katakana (ﾊﾝｶｸ) and fullwidth ASCII (Ａ１) are different code points from their
// normal-width twins (ハンカク, A1) but mean the same thing. A raw comparison, and
// even a canonical (NFC, failure mode #7) comparison, reports them unequal; only
// compatibility normalization (NFKC) folds them.
//
// The Go standard library has no normalizer (NFKC lives in golang.org/x/text,
// an external module). To stay dependency-free, compatFold below applies a
// minimal compatibility fold: fullwidth ASCII by arithmetic (U+FF01..U+FF5E ->
// U+0021..U+007E) plus a small table of the halfwidth katakana these fixtures
// use. It covers the width variants in the tests, not the full NFKC mapping.

// Halfwidth katakana -> fullwidth katakana, for the characters the fixtures use.
var halfwidthKatakana = map[rune]rune{
	0xff76: 0x30ab, // ｶ -> カ
	0xff78: 0x30af, // ｸ -> ク
	0xff8a: 0x30cf, // ﾊ -> ハ
	0xff9d: 0x30f3, // ﾝ -> ン
}

// compatFold returns a compatibility-folded key. Two width variants of the same
// text produce the same key.
func compatFold(s string) string {
	out := make([]rune, 0, len(s))
	for _, r := range s {
		switch {
		case r >= 0xff01 && r <= 0xff5e: // fullwidth ASCII -> ASCII
			out = append(out, r-0xfee0)
		default:
			if fw, ok := halfwidthKatakana[r]; ok {
				out = append(out, fw)
			} else {
				out = append(out, r)
			}
		}
	}
	return string(out)
}

// CompatFold returns the compatibility-folded (NFKC-style) form of a string.
func CompatFold(s string) string {
	return compatFold(s)
}

// CompatEquals is correct: compare compatibility folds so width variants match.
func CompatEquals(a, b string) bool {
	return compatFold(a) == compatFold(b)
}
