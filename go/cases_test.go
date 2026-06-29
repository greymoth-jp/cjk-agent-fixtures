package cjkfixtures

import "testing"

// Self-verification for the exported cases. Every case states a correct result
// and the wrong result a broken handler produces; this proves both halves
// against this package's own reference helpers, so the data shipped to adopters
// is real. If a literal in cases.go is wrong, this fails.

func TestWidthCases(t *testing.T) {
	for _, c := range WidthCases {
		if got := DisplayWidth(c.Input); got != c.CorrectWidth {
			t.Errorf("%s %q: DisplayWidth = %d, want %d", c.Slug, c.Input, got, c.CorrectWidth)
		}
		if got := NaiveWidth(c.Input); got != c.NaiveWidth {
			t.Errorf("%s %q: NaiveWidth = %d, want %d", c.Slug, c.Input, got, c.NaiveWidth)
		}
	}
}

func TestEqualityCases(t *testing.T) {
	for _, c := range EqualityCases {
		if got := NaiveEquals(c.A, c.B); got != c.RawEqual {
			t.Errorf("%s: NaiveEquals(%q,%q) = %v, want %v", c.Slug, c.A, c.B, got, c.RawEqual)
		}
		// CanonicalEquals settles the canonical (NFC/NFD) layer for every row.
		if got := CanonicalEquals(c.A, c.B); got != c.NFCEqual {
			t.Errorf("%s: CanonicalEquals(%q,%q) = %v, want %v", c.Slug, c.A, c.B, got, c.NFCEqual)
		}
		// CompatFold here is a width-only fold, not full NFKC: it folds the
		// width variants (#9) but does not subsume canonical equivalence, so it
		// is only asserted on the #9 rows. A real NFKC normalizer would also
		// make the #7 rows equal, which is what NFKCEqual records.
		if c.Mode == 9 {
			if got := CompatEquals(c.A, c.B); got != c.NFKCEqual {
				t.Errorf("%s: CompatEquals(%q,%q) = %v, want %v", c.Slug, c.A, c.B, got, c.NFKCEqual)
			}
		}
		if c.NFCEqual && !c.NFKCEqual {
			t.Errorf("%s: NFC-equal implies NFKC-equal", c.Slug)
		}
	}
}

func TestDirectionCases(t *testing.T) {
	for _, c := range DirectionCases {
		if got := BaseDirection(c.Input); got != c.CorrectDir {
			t.Errorf("%s %q: BaseDirection = %q, want %q", c.Slug, c.Input, got, c.CorrectDir)
		}
		if got := NaiveDirection(c.Input); got != c.NaiveFirstCharDir {
			t.Errorf("%s %q: NaiveDirection = %q, want %q", c.Slug, c.Input, got, c.NaiveFirstCharDir)
		}
	}
}

func TestWhitespaceCases(t *testing.T) {
	for _, c := range WhitespaceCases {
		if got := UnicodeTrim(c.Input); got != c.CorrectTrimmed {
			t.Errorf("%s %q: UnicodeTrim = %q, want %q", c.Slug, c.Input, got, c.CorrectTrimmed)
		}
		if got := IsBlankUnicode(c.Input); got != c.CorrectBlank {
			t.Errorf("%s %q: IsBlankUnicode = %v, want %v", c.Slug, c.Input, got, c.CorrectBlank)
		}
		if got := AsciiTrim(c.Input); got != c.ASCIITrimmed {
			t.Errorf("%s %q: AsciiTrim = %q, want %q", c.Slug, c.Input, got, c.ASCIITrimmed)
		}
		if got := IsBlankAscii(c.Input); got != c.ASCIIBlank {
			t.Errorf("%s %q: IsBlankAscii = %v, want %v", c.Slug, c.Input, got, c.ASCIIBlank)
		}
	}
}

func TestSliceCases(t *testing.T) {
	for _, c := range SliceCases {
		switch c.Unit {
		case "byte":
			if got := ByteSlice(c.Input, c.Limit); got != c.Torn {
				t.Errorf("%s %q: ByteSlice(%d) = %q, want %q", c.Slug, c.Input, c.Limit, got, c.Torn)
			}
			if IsCleanUTF8(c.Torn) {
				t.Errorf("%s: torn %q should not be clean UTF-8", c.Slug, c.Torn)
			}
			if !IsCleanUTF8(c.Whole) {
				t.Errorf("%s: whole %q should be clean UTF-8", c.Slug, c.Whole)
			}
		case "grapheme":
			if got := CodePointSlice(c.Input, c.Limit); got != c.Torn {
				t.Errorf("%s %q: CodePointSlice(%d) = %q, want %q", c.Slug, c.Input, c.Limit, got, c.Torn)
			}
			if got := GraphemeSlice(c.Input, c.Limit); got != c.Whole {
				t.Errorf("%s %q: GraphemeSlice(%d) = %q, want %q", c.Slug, c.Input, c.Limit, got, c.Whole)
			}
			if c.Torn == c.Whole {
				t.Errorf("%s: torn and whole should differ", c.Slug)
			}
		default:
			t.Errorf("%s: unknown unit %q", c.Slug, c.Unit)
		}
	}
}

func TestEditorCases(t *testing.T) {
	for _, c := range EditorCases {
		good := ApplyEvents(NewEditor(), c.Events)
		if good.Value != c.Correct.Value || good.Submitted != c.Correct.Submitted {
			t.Errorf("%s: correct = {%q,%d}, want {%q,%d}",
				c.Slug, good.Value, good.Submitted, c.Correct.Value, c.Correct.Submitted)
		}
		bad := ApplyEvents(NewEditor(c.BrokenBug), c.Events)
		if bad.Value != c.Broken.Value || bad.Submitted != c.Broken.Submitted {
			t.Errorf("%s: broken = {%q,%d}, want {%q,%d}",
				c.Slug, bad.Value, bad.Submitted, c.Broken.Value, c.Broken.Submitted)
		}
		if bad.Value == c.Correct.Value && bad.Submitted == c.Correct.Submitted {
			t.Errorf("%s: bug %q did not change the outcome", c.Slug, c.BrokenBug)
		}
	}
}

func TestCaseCoverage(t *testing.T) {
	modes := map[int]bool{}
	for _, c := range WidthCases {
		modes[c.Mode] = true
	}
	for _, c := range EqualityCases {
		modes[c.Mode] = true
	}
	for _, c := range DirectionCases {
		modes[c.Mode] = true
	}
	for _, c := range WhitespaceCases {
		modes[c.Mode] = true
	}
	for _, c := range SliceCases {
		modes[c.Mode] = true
	}
	for _, c := range EditorCases {
		modes[c.Mode] = true
	}
	// Go mirrors every mode except #8 (a UTF-16-specific hazard with no native
	// analogue in Go's UTF-8 strings).
	for _, m := range []int{1, 2, 3, 4, 5, 6, 7, 9, 10, 11} {
		if !modes[m] {
			t.Errorf("mode %d missing from Go cases", m)
		}
	}
}
