package cjkfixtures

import "strings"

// Grapheme clusters (failure mode #10, grapheme-cluster-split). One thing a
// reader sees as a single character is often several code points glued together:
// a ZWJ emoji family (👨‍👩‍👧 is man + ZWJ + woman + ZWJ + girl), a skin-tone emoji
// (👍 + a U+1F3FB..U+1F3FF modifier), a flag (🇯🇵 is two regional indicators), or a
// Japanese ideographic variation sequence (a name kanji + U+E0100 selecting an
// official-register glyph). Truncating or measuring by code point — even with
// the correct rune slice that fixes #2 and #8 — still cuts these apart. The fix
// is to segment by grapheme cluster.
//
// The Go standard library has no grapheme segmenter (that lives in
// golang.org/x/text). The minimal segmenter below covers the joiners these
// fixtures exercise (ZWJ, variation selectors, skin tones, regional-indicator
// pairs, combining marks) without a dependency; it is not the full UAX #29.

const zwj = 0x200d

// isGraphemeExtend reports whether a rune attaches to the previous one
// (Grapheme_Cluster_Break = Extend, narrowed to what these fixtures use).
func isGraphemeExtend(r rune) bool {
	switch {
	case r >= 0x0300 && r <= 0x036f: // combining diacritical marks (Latin)
		return true
	case r >= 0x0591 && r <= 0x05bd: // Hebrew points
		return true
	case r >= 0x064b && r <= 0x065f: // Arabic harakat
		return true
	case r >= 0xfe00 && r <= 0xfe0f: // variation selectors
		return true
	case r >= 0x1f3fb && r <= 0x1f3ff: // emoji skin-tone modifiers
		return true
	case r >= 0xe0100 && r <= 0xe01ef: // variation selectors supplement (IVS)
		return true
	}
	return false
}

func isRegionalIndicator(r rune) bool { return r >= 0x1f1e6 && r <= 0x1f1ff }

// Graphemes splits a string into grapheme clusters: code points are kept
// together when joined by ZWJ, when one is an Extend mark, or when two regional
// indicators pair into a flag.
func Graphemes(s string) []string {
	out := []string{}
	cur := []rune{}
	prevZWJ := false
	ri := 0 // regional indicators in the current cluster
	startCluster := func(r rune) {
		cur = []rune{r}
		prevZWJ = r == zwj
		if isRegionalIndicator(r) {
			ri = 1
		} else {
			ri = 0
		}
	}
	for _, r := range s {
		switch {
		case len(cur) == 0:
			startCluster(r)
		case r == zwj:
			cur = append(cur, r)
			prevZWJ = true
		case prevZWJ:
			cur = append(cur, r)
			prevZWJ = false
			if isRegionalIndicator(r) {
				ri = 1
			} else {
				ri = 0
			}
		case isGraphemeExtend(r):
			cur = append(cur, r)
		case isRegionalIndicator(r) && ri == 1:
			cur = append(cur, r)
			ri = 2
		default:
			out = append(out, string(cur))
			startCluster(r)
		}
	}
	if len(cur) > 0 {
		out = append(out, string(cur))
	}
	return out
}

// GraphemeLength counts grapheme clusters (what a reader calls "characters").
func GraphemeLength(s string) int {
	return len(Graphemes(s))
}

// GraphemeSlice takes the first n grapheme clusters, never splitting one.
func GraphemeSlice(s string, n int) string {
	g := Graphemes(s)
	if n > len(g) {
		n = len(g)
	}
	return strings.Join(g[:n], "")
}
