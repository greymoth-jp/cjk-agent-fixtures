package cjkfixtures

import "testing"

// Failure mode #3: fullwidth width mismatch.
func TestFullwidthWidth_Correct(t *testing.T) {
	cases := []struct {
		in   string
		want int
	}{
		{"日本語", 6}, // fullwidth CJK, 2 columns each
		{"Ａ", 2},     // fullwidth Latin A
		{"ok", 2},     // ASCII, 1 column each
		{"ﾆﾎﾝ", 3},    // halfwidth katakana, 1 column each
		{"ok日本", 6}, // 1 + 1 + 2 + 2
	}
	for _, c := range cases {
		if got := DisplayWidth(c.in); got != c.want {
			t.Fatalf("DisplayWidth(%q) = %d, want %d", c.in, got, c.want)
		}
	}
}

func TestFullwidthWidth_CatchesBug(t *testing.T) {
	if NaiveWidth("日本語") != 3 {
		t.Fatalf("NaiveWidth(日本語) = %d, want 3", NaiveWidth("日本語"))
	}
	if NaiveWidth("日本語") == DisplayWidth("日本語") {
		t.Fatal("naive width should disagree with display width on fullwidth CJK")
	}
}
