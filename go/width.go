// Package cjkfixtures holds runnable regression fixtures for the five ways
// CJK / IME input breaks in editors, terminals, and AI agents.
package cjkfixtures

// East Asian Width — column width of a string in a fixed-width grid. CJK
// fullwidth characters take 2 columns (failure mode #3, fullwidth-width).

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

// CharWidth returns the column width of a single rune (0, 1, or 2).
func CharWidth(r rune) int {
	switch {
	case r == 0x200b,
		r >= 0x0300 && r <= 0x036f, // combining marks
		r >= 0xfe00 && r <= 0xfe0f, // variation selectors
		r >= 0x200c && r <= 0x200f: // ZWNJ/ZWJ/marks
		return 0
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
