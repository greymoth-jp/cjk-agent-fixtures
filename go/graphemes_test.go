package cjkfixtures

import "testing"

// Failure mode #10: grapheme-cluster split. Each input below is one grapheme
// made of several code points. A code-point (rune) slice — the fix for #2 and
// #8 — still cuts them apart; a grapheme slice keeps them whole.
const (
	family = "\U0001F468‍\U0001F469‍\U0001F467" // 👨‍👩‍👧 man ZWJ woman ZWJ girl
	skin   = "\U0001F44D\U0001F3FD"             // 👍 + medium skin tone
	flag   = "\U0001F1EF\U0001F1F5"             // 🇯🇵 regional indicators J + P
	heart  = "❤️"                               // ❤️ heart + VS16
	ivs    = "葛\U000E0100"                      // 葛 + ideographic variation selector
)

func TestGraphemes_OneClusterManyRunes(t *testing.T) {
	cases := []struct {
		name  string
		s     string
		runes int
	}{
		{"ZWJ family", family, 5},
		{"skin tone", skin, 2},
		{"flag", flag, 2},
		{"variation-selector heart", heart, 2},
		{"ideographic variation sequence", ivs, 2},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := GraphemeLength(c.s); got != 1 {
				t.Fatalf("GraphemeLength(%q) = %d, want 1", c.s, got)
			}
			if got := len([]rune(c.s)); got != c.runes {
				t.Fatalf("rune count of %q = %d, want %d", c.s, got, c.runes)
			}
			if got := GraphemeSlice(c.s, 1); got != c.s {
				t.Fatalf("GraphemeSlice(%q,1) = %q, want the whole cluster", c.s, got)
			}
			if CodePointSlice(c.s, 1) == c.s {
				t.Fatalf("a code-point slice should split %q", c.s)
			}
		})
	}
}

func TestGraphemes_WhatGetsLost(t *testing.T) {
	if got := CodePointSlice(skin, 1); got != "\U0001F44D" {
		t.Fatalf("code-point slice should strip the skin tone, got %q", got)
	}
	if got := CodePointSlice(ivs, 1); got != "葛" {
		t.Fatalf("code-point slice should drop the variation selector, got %q", got)
	}
	msg := "a" + family + "b"
	if got := GraphemeSlice(msg, 2); got != "a"+family {
		t.Fatalf("grapheme slice should keep the family, got %q", got)
	}
	if CodePointSlice(msg, 2) == "a"+family {
		t.Fatal("a code-point slice should tear the family open")
	}
}
