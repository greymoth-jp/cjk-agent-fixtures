package cjkfixtures

import (
	"strings"
	"unicode/utf16"
)

// UTF-16 surrogate pairs (failure mode #8, utf16-surrogate-split). A Go string
// is UTF-8, so this hazard appears when the string crosses into a UTF-16 host: a
// Windows API (syscall.UTF16FromString), a JavaScript or Java bridge, a SQL
// Server NVARCHAR column, or a JSON \uXXXX escape. There, every code point above
// U+FFFF — rare kanji like 𠮷 (U+20BB7, the kanji in 𠮷野家) and all emoji — is
// two UTF-16 code units (a surrogate pair). Counting or slicing by code unit
// splits the pair into a lone surrogate, which decodes back to U+FFFD. Slicing
// by rune keeps the character whole. This mirrors JavaScript, where .length and
// .slice index by UTF-16 unit natively.
//
// It is distinct from the byte-boundary crash (#2): that one crosses a UTF-8
// byte boundary; this one crosses a UTF-16 code-unit boundary.

// Utf16UnitLength is the number of UTF-16 code units; an astral rune counts as 2.
func Utf16UnitLength(s string) int {
	return len(utf16.Encode([]rune(s)))
}

// RuneLength is the number of code points.
func RuneLength(s string) int {
	return len([]rune(s))
}

// Utf16UnitSlice is the buggy reference: slice by UTF-16 code unit, which can
// split a surrogate pair. A lone surrogate decodes to U+FFFD.
func Utf16UnitSlice(s string, nUnits int) string {
	u := utf16.Encode([]rune(s))
	if nUnits > len(u) {
		nUnits = len(u)
	}
	return string(utf16.Decode(u[:nUnits]))
}

// RuneSlice is correct: slice by rune so an astral character stays whole.
func RuneSlice(s string, nRunes int) string {
	r := []rune(s)
	if nRunes > len(r) {
		nRunes = len(r)
	}
	return string(r[:nRunes])
}

// HasReplacement reports whether the string contains U+FFFD, a sign a surrogate
// pair (or a byte sequence) was split.
func HasReplacement(s string) bool {
	return strings.ContainsRune(s, 0xFFFD)
}
