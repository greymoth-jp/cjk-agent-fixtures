package cjkfixtures

import "testing"

// Failure mode #7: NFC/NFD normalization. The same text in precomposed (NFC)
// and decomposed (NFD) form is canonically equal but byte-different, so a raw
// == comparison reports a false mismatch. The two forms are spelled with
// explicit escapes so the test constructs both without needing a normalizer.
const (
	cafeNFC = "caf\u00e9"                            // "cafe" + precomposed e-acute (4 runes)
	cafeNFD = "cafe\u0301"                           // "cafe" + e + combining acute (5 runes)
	hanNFC  = "\ud55c\uad6d"                         // hanguk, 2 precomposed syllables
	hanNFD  = "\u1112\u1161\u11ab\u1100\u116e\u11a8" // hanguk, 6 conjoining jamo
)

func TestNormalization_CatchesBug(t *testing.T) {
	if !NaiveEquals(cafeNFC, cafeNFC) {
		t.Fatal("sanity: identical strings should be naive-equal")
	}
	if NaiveEquals(cafeNFC, cafeNFD) {
		t.Fatal("NFC and NFD cafe compared equal under ==; expected mismatch")
	}
	if NaiveEquals(hanNFC, hanNFD) {
		t.Fatal("NFC and NFD hanguk compared equal under ==; expected mismatch")
	}
}

func TestNormalization_CanonicalEquals(t *testing.T) {
	if !CanonicalEquals(cafeNFC, cafeNFD) {
		t.Fatal("cafe NFC and NFD should be canonically equal")
	}
	if !CanonicalEquals(hanNFC, hanNFD) {
		t.Fatal("hanguk NFC and NFD should be canonically equal")
	}
}

func TestNormalization_CodePointLength(t *testing.T) {
	if CodePointLength(cafeNFC) != 4 || CodePointLength(cafeNFD) != 5 {
		t.Fatalf("cafe lengths = %d / %d, want 4 / 5",
			CodePointLength(cafeNFC), CodePointLength(cafeNFD))
	}
	if CodePointLength(hanNFC) != 2 || CodePointLength(hanNFD) != 6 {
		t.Fatalf("hanguk lengths = %d / %d, want 2 / 6",
			CodePointLength(hanNFC), CodePointLength(hanNFD))
	}
}
