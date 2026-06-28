package cjkfixtures

import "unicode/utf8"

// Byte-boundary safety (failure mode #2, byte-boundary crash). Slicing a Go
// string by raw byte index lands inside a multi-byte rune. Every Japanese
// kanji is 3 UTF-8 bytes, so s[:4] on "ok日本語test" cuts 日 in half.

// ByteSlice is the buggy reference: slice by raw byte index.
func ByteSlice(s string, nBytes int) string {
	if nBytes > len(s) {
		nBytes = len(s)
	}
	return s[:nBytes]
}

// CodePointSlice is correct: slice by rune so characters stay intact.
func CodePointSlice(s string, nRunes int) string {
	runes := []rune(s)
	if nRunes > len(runes) {
		nRunes = len(runes)
	}
	return string(runes[:nRunes])
}

// IsCleanUTF8 reports whether a string is valid, un-truncated UTF-8.
func IsCleanUTF8(s string) bool {
	return utf8.ValidString(s)
}
