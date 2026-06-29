package cjkfixtures

import "testing"

// Failure mode #11: fullwidth-space trim. The JP IME space bar produces U+3000,
// not an ASCII space. An ASCII-only trim or blank check leaves it; strings'
// TrimSpace removes it.
const ideographicSpace = "　" // 　, what the JP IME space bar produces

func TestWhitespace_IMESpaceIsNotAscii(t *testing.T) {
	if ideographicSpace == " " {
		t.Fatal("U+3000 should differ from an ASCII space")
	}
}

func TestWhitespace_AsciiTrimLeavesFullwidth(t *testing.T) {
	in := ideographicSpace + "田中" + ideographicSpace
	if got := AsciiTrim(in); got != in {
		t.Fatalf("ASCII trim should leave U+3000 in place, got %q", got)
	}
	if got := UnicodeTrim(in); got != "田中" {
		t.Fatalf("Unicode trim should strip U+3000, got %q", got)
	}
}

func TestWhitespace_BlankCheck(t *testing.T) {
	blank := ideographicSpace + ideographicSpace
	if IsBlankAscii(blank) {
		t.Fatal("ASCII blank check should miss a fullwidth-space field (the bug)")
	}
	if !IsBlankUnicode(blank) {
		t.Fatal("Unicode blank check should treat fullwidth spaces as blank")
	}
}

func TestWhitespace_AgreeOnAscii(t *testing.T) {
	if AsciiTrim("  hi  ") != "hi" || UnicodeTrim("  hi  ") != "hi" {
		t.Fatalf("both trims should strip ASCII spaces: %q / %q",
			AsciiTrim("  hi  "), UnicodeTrim("  hi  "))
	}
}
