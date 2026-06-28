// Package cjkfixtures holds runnable regression fixtures for the ways
// multilingual text input — CJK, Korean, Chinese, RTL (Arabic/Hebrew), and
// combining marks — breaks in editors, terminals, and AI agents.
package cjkfixtures

// East Asian Width — column width of a string in a fixed-width grid. CJK and
// Hangul fullwidth characters take 2 columns; combining marks (Latin accents,
// Arabic harakat, Hebrew points) take 0 (failure mode #3, fullwidth-width).

type runeRange struct{ lo, hi rune }

// Ranges that render two columns wide (East Asian Width "W" and "F"). A small,
// dependency-free table covering the characters that show up in CJK text; not
// the full Unicode EAW database.
var wideRanges = []runeRange{
	{0x1100, 0x115f},   // Hangul Jamo
	{0x2e80, 0x303e},   // CJK radicals, Kangxi, CJK symbols & punctuation
	{0x3041, 0x33ff},   // Hiragana, Katakana, CJK symbols, enclosed letters
	{0x3400, 0x4dbf},   // CJK Unified Ideographs Extension A
	{0x4e00, 0x9fff},   // CJK Unified Ideographs
	{0xa000, 0xa4cf},   // Yi
	{0xac00, 0xd7a3},   // Hangul Syllables
	{0xf900, 0xfaff},   // CJK Compatibility Ideographs
	{0xfe10, 0xfe19},   // Vertical forms
	{0xfe30, 0xfe6f},   // CJK Compatibility / small forms
	{0xff00, 0xff60},   // Fullwidth ASCII variants (NOT halfwidth kana at 0xff61+)
	{0xffe0, 0xffe6},   // Fullwidth signs
	{0x1f300, 0x1faff}, // Emoji & pictographs
	{0x20000, 0x3fffd}, // CJK Unified Ideographs Extension B and beyond
}

// Zero-width: nonspacing combining marks across scripts, zero-width
// space/joiner/marks, and variation selectors. Small, dependency-free table.
var zeroRanges = []runeRange{
	{0x0300, 0x036f}, // combining diacritical marks (Latin)
	{0x0483, 0x0489}, // Cyrillic combining
	{0x0591, 0x05bd}, // Hebrew points
	{0x05bf, 0x05bf},
	{0x05c1, 0x05c2},
	{0x05c4, 0x05c5},
	{0x05c7, 0x05c7},
	{0x0610, 0x061a}, // Arabic marks
	{0x064b, 0x065f}, // Arabic harakat (fatha, damma, kasra, ...)
	{0x0670, 0x0670}, // Arabic superscript alef
	{0x06d6, 0x06dc},
	{0x06df, 0x06e4},
	{0x06e7, 0x06e8},
	{0x06ea, 0x06ed},
	{0x200b, 0x200f}, // ZWSP, ZWNJ, ZWJ, LRM, RLM
	{0xfe00, 0xfe0f}, // variation selectors
}

// CharWidth returns the column width of a single rune (0, 1, or 2).
func CharWidth(r rune) int {
	for _, rng := range zeroRanges {
		if r >= rng.lo && r <= rng.hi {
			return 0
		}
	}
	for _, rng := range wideRanges {
		if r >= rng.lo && r <= rng.hi {
			return 2
		}
	}
	return 1
}

// DisplayWidth is the correct column width, counting fullwidth CJK as 2.
func DisplayWidth(s string) int {
	w := 0
	for _, r := range s {
		w += CharWidth(r)
	}
	return w
}

// NaiveWidth is the buggy reference: one column per rune.
func NaiveWidth(s string) int {
	count := 0
	for range s {
		count++
	}
	return count
}
