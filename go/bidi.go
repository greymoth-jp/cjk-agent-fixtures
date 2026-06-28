package cjkfixtures

// Base direction detection for bidirectional (RTL) text (failure mode #6,
// bidi base-direction). A field that hard-codes LTR, or guesses direction from
// the first character only, lays out Arabic / Hebrew backwards. The Unicode
// Bidirectional Algorithm (rules P2/P3) sets paragraph direction from the first
// *strong* directional character; neutrals (digits, spaces, punctuation,
// combining marks) are skipped. "123 مرحبا" is RTL despite the leading digit.

// Strong RTL scripts (bidi classes R and AL). Small, dependency-free table
// covering the scripts these fixtures exercise; not the full Unicode bidi DB.
var strongRTL = []runeRange{
	{0x0590, 0x05ff}, // Hebrew
	{0x0600, 0x06ff}, // Arabic
	{0x0700, 0x074f}, // Syriac
	{0x0750, 0x077f}, // Arabic Supplement
	{0x08a0, 0x08ff}, // Arabic Extended-A
	{0xfb1d, 0xfb4f}, // Hebrew presentation forms
	{0xfb50, 0xfdff}, // Arabic presentation forms-A
	{0xfe70, 0xfeff}, // Arabic presentation forms-B
}

// Strong LTR scripts (bidi class L) that show up across these fixtures.
var strongLTR = []runeRange{
	{0x0041, 0x005a}, // ASCII A-Z
	{0x0061, 0x007a}, // ASCII a-z
	{0x00c0, 0x024f}, // Latin-1 + Latin Extended-A/B letters
	{0x0370, 0x03ff}, // Greek
	{0x0400, 0x04ff}, // Cyrillic
	{0x1100, 0x11ff}, // Hangul Jamo
	{0x3040, 0x30ff}, // Hiragana, Katakana
	{0x3400, 0x9fff}, // CJK ideographs
	{0xac00, 0xd7a3}, // Hangul syllables
}

func inRanges(r rune, ranges []runeRange) bool {
	for _, rng := range ranges {
		if r >= rng.lo && r <= rng.hi {
			return true
		}
	}
	return false
}

// BaseDirection is correct: direction per Unicode Bidi rules P2/P3 — the first
// strong directional character decides; neutrals are skipped; LTR if none.
func BaseDirection(s string) string {
	for _, r := range s {
		if inRanges(r, strongRTL) {
			return "rtl"
		}
		if inRanges(r, strongLTR) {
			return "ltr"
		}
	}
	return "ltr"
}

// NaiveDirection is the buggy reference: guess from the first rune only, so a
// leading digit, space, or punctuation forces LTR on Arabic/Hebrew text.
func NaiveDirection(s string) string {
	for _, r := range s { // first rune only
		if inRanges(r, strongRTL) {
			return "rtl"
		}
		return "ltr"
	}
	return "ltr"
}
