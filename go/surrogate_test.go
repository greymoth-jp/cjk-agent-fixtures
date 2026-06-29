package cjkfixtures

import "testing"

// Failure mode #8: UTF-16 surrogate split. 𠮷 (U+20BB7) and 😀 (U+1F600) are
// above U+FFFF, so each is two UTF-16 code units. Slicing by unit splits the
// pair into a lone surrogate that decodes to U+FFFD; slicing by rune is clean.
const (
	yoshi = "\U00020BB7野家" // 𠮷 + 野 + 家: 3 runes, 4 UTF-16 units
	grin  = "\U0001F600ok" // 😀 + ok
)

func TestSurrogate_UnitLength(t *testing.T) {
	if Utf16UnitLength(yoshi) != RuneLength(yoshi)+1 {
		t.Fatalf("utf16 units = %d, runes = %d; the astral rune should add one unit",
			Utf16UnitLength(yoshi), RuneLength(yoshi))
	}
}

func TestSurrogate_UnitSliceSplits(t *testing.T) {
	broken := Utf16UnitSlice(yoshi, 1) // one UTF-16 unit = a lone high surrogate
	if !HasReplacement(broken) {
		t.Fatalf("utf16-unit slice %q should contain U+FFFD from a split pair", broken)
	}
}

func TestSurrogate_RuneSliceWhole(t *testing.T) {
	safe := RuneSlice(yoshi, 1)
	if safe != "\U00020BB7" {
		t.Fatalf("rune slice = %q, want 𠮷", safe)
	}
	if HasReplacement(safe) {
		t.Fatalf("rune slice %q should not contain U+FFFD", safe)
	}
}

func TestSurrogate_Differ(t *testing.T) {
	for _, s := range []string{yoshi, grin} {
		if Utf16UnitSlice(s, 1) == RuneSlice(s, 1) {
			t.Fatalf("utf16 slice and rune slice should differ on %q", s)
		}
	}
}
