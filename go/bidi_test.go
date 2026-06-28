package cjkfixtures

import "testing"

// Failure mode #6: bidi base-direction. Direction is set by the first strong
// directional character (Unicode Bidi P2/P3); leading neutrals are skipped.
func TestBaseDirection_Correct(t *testing.T) {
	cases := []struct {
		in   string
		want string
	}{
		{"مرحبا", "rtl"},     // Arabic
		{"שלום", "rtl"},      // Hebrew
		{"Hello", "ltr"},     // Latin
		{"日本語", "ltr"},       // CJK is LTR
		{"123 مرحبا", "rtl"}, // leading digit is neutral
		{"(שלום)", "rtl"},    // leading bracket is neutral
		{"  مرحبا", "rtl"},   // leading spaces skipped
		{"Hello مرحبا", "ltr"},
		{"مرحبا Hello", "rtl"},
		{"123 !?", "ltr"}, // no strong char -> default
		{"", "ltr"},
	}
	for _, c := range cases {
		if got := BaseDirection(c.in); got != c.want {
			t.Fatalf("BaseDirection(%q) = %q, want %q", c.in, got, c.want)
		}
	}
}

func TestBaseDirection_CatchesBug(t *testing.T) {
	// A detector that reads only the first rune calls these LTR; they are RTL.
	for _, in := range []string{"123 مرحبا", "(שלום)"} {
		if NaiveDirection(in) == BaseDirection(in) {
			t.Fatalf("naive direction should disagree with correct on %q", in)
		}
		if NaiveDirection(in) != "ltr" {
			t.Fatalf("NaiveDirection(%q) = %q, want ltr (the bug)", in, NaiveDirection(in))
		}
	}
}
