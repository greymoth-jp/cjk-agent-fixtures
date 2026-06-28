package cjkfixtures

import "testing"

// Failure mode #2: byte-boundary crash.
// "ok日本語test": ASCII is 1 byte, each kanji is 3 UTF-8 bytes. s[:4] cuts 日.
const sample = "ok日本語test"

func TestByteBoundary_CatchesBug(t *testing.T) {
	broken := ByteSlice(sample, 4) // o, k, then half of 日
	if IsCleanUTF8(broken) {
		t.Fatalf("byte slice %q reported valid; expected a cut multi-byte rune", broken)
	}
}

func TestByteBoundary_CodePointSliceIsClean(t *testing.T) {
	safe := CodePointSlice(sample, 4) // first 4 runes
	if safe != "ok日本" {
		t.Fatalf("code-point slice = %q, want ok日本", safe)
	}
	if !IsCleanUTF8(safe) {
		t.Fatalf("code-point slice %q should be valid UTF-8", safe)
	}
}

func TestByteBoundary_Differ(t *testing.T) {
	if ByteSlice(sample, 4) == CodePointSlice(sample, 4) {
		t.Fatal("byte slice and code-point slice should differ on CJK input")
	}
}

// The crash is not Japanese-specific: Korean syllables are also 3 UTF-8 bytes,
// Arabic and Hebrew letters are 2. Each byteCut lands mid-character; each
// runeCut keeps characters whole.
func TestByteBoundary_Multilingual(t *testing.T) {
	cases := []struct {
		lang    string
		s       string
		byteCut int
		runeCut int
		head    string
	}{
		{"Korean", "ok한국test", 3, 3, "ok한"},
		{"Arabic", "okمرحباtest", 3, 3, "okم"},
		{"Hebrew", "okשלוםtest", 3, 3, "okש"},
	}
	for _, c := range cases {
		t.Run(c.lang, func(t *testing.T) {
			if IsCleanUTF8(ByteSlice(c.s, c.byteCut)) {
				t.Fatalf("byte slice of %q reported valid; expected a cut rune", c.s)
			}
			safe := CodePointSlice(c.s, c.runeCut)
			if safe != c.head {
				t.Fatalf("code-point slice = %q, want %q", safe, c.head)
			}
			if !IsCleanUTF8(safe) {
				t.Fatalf("code-point slice %q should be valid UTF-8", safe)
			}
			if ByteSlice(c.s, c.byteCut) == CodePointSlice(c.s, c.runeCut) {
				t.Fatal("byte slice and code-point slice should differ")
			}
		})
	}
}
