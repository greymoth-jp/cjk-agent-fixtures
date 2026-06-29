package cjkfixtures

import "testing"

// Failure mode #9: NFKC compatibility fold. Halfwidth katakana and fullwidth
// ASCII are different code points from their normal-width twins. Raw and even
// canonical (NFC, failure mode #7) comparison reports them unequal; only
// compatibility (NFKC) folding matches them.
func TestCompat_WidthVariantsDiffer(t *testing.T) {
	pairs := []struct{ a, b string }{
		{"ﾊﾝｶｸ", "ハンカク"}, // halfwidth vs fullwidth katakana
		{"Ａ１", "A1"},     // fullwidth vs ASCII
		{"２０２４", "2024"}, // fullwidth vs ASCII digits
	}
	for _, p := range pairs {
		if NaiveEquals(p.a, p.b) {
			t.Fatalf("raw compare: %q and %q should be unequal", p.a, p.b)
		}
		// Canonical (NFC) comparison settles é vs e+◌́ but leaves width variants
		// apart, so failure mode #7's fix is not enough here.
		if CanonicalEquals(p.a, p.b) {
			t.Fatalf("canonical compare should still separate %q and %q", p.a, p.b)
		}
		if !CompatEquals(p.a, p.b) {
			t.Fatalf("compatibility compare should fold %q and %q equal", p.a, p.b)
		}
	}
}

func TestCompat_FoldsToNormalWidth(t *testing.T) {
	if got := CompatFold("ﾊﾝｶｸ"); got != "ハンカク" {
		t.Fatalf("CompatFold(ﾊﾝｶｸ) = %q, want ハンカク", got)
	}
	if got := CompatFold("Ａ１"); got != "A1" {
		t.Fatalf("CompatFold(Ａ１) = %q, want A1", got)
	}
}
