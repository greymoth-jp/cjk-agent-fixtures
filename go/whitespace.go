package cjkfixtures

import "strings"

// Whitespace (failure mode #11, fullwidth-space-trim). A Japanese IME in
// fullwidth mode types U+3000 (　, ideographic space) on the space bar, not an
// ASCII space. A trim or blank check that only strips ASCII whitespace leaves it,
// so a required field holding only 　　 looks non-empty and a name stored as
// "田中　" never matches "田中". strings.TrimSpace removes U+3000 (unicode.IsSpace
// covers it); a hand-rolled ASCII trim does not.

const asciiSpaces = " \t\r\n\f\v"

// AsciiTrim is the buggy reference: strip only ASCII whitespace, leaving U+3000.
func AsciiTrim(s string) string {
	return strings.Trim(s, asciiSpaces)
}

// UnicodeTrim is correct: strings.TrimSpace removes Unicode whitespace, U+3000
// included.
func UnicodeTrim(s string) string {
	return strings.TrimSpace(s)
}

// IsBlankAscii is the buggy blank check: it misses a field of fullwidth spaces.
func IsBlankAscii(s string) bool {
	return AsciiTrim(s) == ""
}

// IsBlankUnicode is correct: it treats fullwidth-space-only input as blank.
func IsBlankUnicode(s string) bool {
	return strings.TrimSpace(s) == ""
}
