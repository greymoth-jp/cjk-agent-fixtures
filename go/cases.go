package cjkfixtures

// Machine-readable regression cases for the eleven CJK / multilingual input
// failure modes, mirroring js/src/cases.js.
//
// These let you run YOUR handler instead of this package's reference helpers:
// range a slice of cases, feed each Input to your function, and assert the
// correct value. Every case also carries the wrong value a common broken
// handler produces, so you can prove your test actually bites. Each case keeps
// its Mode (1..11) and Slug, matching taxonomy.json.
//
// Where two encodings look identical (NFC vs NFD), A holds the precomposed form
// and B the decomposed form; cases_test.go checks they are byte-distinct, so a
// future reformat that collapses them fails the build rather than passing
// silently.

// WidthCase covers failure mode #3 (fullwidth / zero-width column width).
type WidthCase struct {
	Mode         int
	Slug, Script string
	Input        string
	CorrectWidth int // a correct East Asian Width counter
	NaiveWidth   int // one column per rune
}

// WidthCases: feed Input to your width function; it should return CorrectWidth.
var WidthCases = []WidthCase{
	{3, "fullwidth-width", "JP", "日本語", 6, 3},
	{3, "fullwidth-width", "ZH", "中文", 4, 2},
	{3, "fullwidth-width", "KO", "한국어", 6, 3},
	{3, "fullwidth-width", "JP", "Ａ", 2, 1},
	{3, "fullwidth-width", "JP", "ＡＢ１２", 8, 4},
	{3, "fullwidth-width", "JP", "ﾆﾎﾝ", 3, 3},
	{3, "fullwidth-width", "AR", "مرحبا", 5, 5},
	{3, "fullwidth-width", "combining", "é", 1, 2}, // NFD: e + combining acute
	{3, "fullwidth-width", "JP", "ok日本", 6, 4},
}

// EqualityCase covers failure modes #7 (NFC/NFD) and #9 (NFKC fold).
type EqualityCase struct {
	Mode         int
	Slug, Script string
	A, B         string
	RawEqual     bool // A == B
	NFCEqual     bool // equal after canonical (NFC) normalization
	NFKCEqual    bool // equal after compatibility (NFKC) folding
}

// EqualityCases. A is NFC, B is NFD for the #7 rows. NFC alone is not enough
// for #9, where NFCEqual is false but NFKCEqual is true.
var EqualityCases = []EqualityCase{
	{7, "nfc-nfd-normalization", "Latin", "é", "é", false, true, true},
	{7, "nfc-nfd-normalization", "KO", "한", "한", false, true, true},
	{9, "nfkc-compatibility-fold", "JP", "ﾊﾝｶｸ", "ハンカク", false, false, true},
	{9, "nfkc-compatibility-fold", "JP", "Ａ１", "A1", false, false, true},
}

// DirectionCase covers failure mode #6 (bidi base direction). Direction is
// "ltr" or "rtl".
type DirectionCase struct {
	Mode              int
	Slug, Script      string
	Input             string
	CorrectDir        string // Unicode Bidi P2/P3
	NaiveFirstCharDir string // guessed from the first rune only
}

// DirectionCases: the gap shows up when a strong RTL line starts with a neutral
// (digit, bracket).
var DirectionCases = []DirectionCase{
	{6, "bidi-base-direction", "AR", "مرحبا", "rtl", "rtl"},
	{6, "bidi-base-direction", "AR", "123 مرحبا", "rtl", "ltr"},
	{6, "bidi-base-direction", "HE", "(שלום)", "rtl", "ltr"},
	{6, "bidi-base-direction", "EN", "hello", "ltr", "ltr"},
}

// WhitespaceCase covers failure mode #11 (fullwidth-space trim).
type WhitespaceCase struct {
	Mode           int
	Slug, Script   string
	Input          string
	CorrectTrimmed string // Unicode-aware trim (strings.TrimSpace)
	CorrectBlank   bool
	ASCIITrimmed   string // ASCII-only trim leaves U+3000
	ASCIIBlank     bool
}

// WhitespaceCases.
var WhitespaceCases = []WhitespaceCase{
	{11, "fullwidth-space-trim", "JP", "　　", "", true, "　　", false},
	{11, "fullwidth-space-trim", "JP", "田中　", "田中", false, "田中　", false},
	{11, "fullwidth-space-trim", "JP", "　田中　", "田中", false, "　田中　", false},
}

// SliceCase covers failure modes #2 (byte boundary) and #10 (grapheme split).
// Mode #8 (UTF-16 surrogate split) is a JavaScript hazard; in Go a string is
// UTF-8 bytes and range iterates runes, so there is no native code-unit slice
// to model, and the byte cases (#2) cover sub-character cutting on this side.
//
// Cutting Input at Limit in the Unit granularity tears it into Torn; cutting at
// the next coarser granularity keeps it whole as Whole.
//
//	Unit "byte"     -> #2  (UTF-8 byte offset lands mid-rune)
//	Unit "grapheme" -> #10 (rune offset splits a joined cluster)
type SliceCase struct {
	Mode         int
	Slug, Script string
	Input        string
	Unit         string
	Limit        int
	Torn         string
	Whole        string
}

// SliceCases. For "byte", Torn is not valid UTF-8 (IsCleanUTF8 is false); assert
// your safe slicer keeps it clean. For "grapheme", Torn is valid UTF-8 but loses
// a skin tone, breaks a flag, or changes a name kanji, so assert against Whole.
var SliceCases = []SliceCase{
	// Go slices raw bytes, so a mid-character cut keeps the orphan byte (invalid
	// UTF-8). Torn is the raw truncation; assert your safe slicer never makes one.
	{2, "byte-boundary-crash", "JP", "日本語", "byte", 4, "日\xe6", "日"},
	{2, "byte-boundary-crash", "KO", "한국어", "byte", 4, "한\xea", "한"},
	{2, "byte-boundary-crash", "AR", "مرحبا", "byte", 3, "م\xd8", "م"},
	{10, "grapheme-cluster-split", "emoji", "👍🏽ok", "grapheme", 1, "👍", "👍🏽"},
	{10, "grapheme-cluster-split", "emoji", "🇯🇵 JP", "grapheme", 1, "🇯", "🇯🇵"},
	{10, "grapheme-cluster-split", "emoji", "👨‍👩‍👧!", "grapheme", 1, "👨", "👨‍👩‍👧"},
}

// EditorEvent is one step in an IME composition replay. Type is one of
// "compositionStart", "compositionUpdate", "compositionEnd", "keydown",
// "blur", "focus". Str carries the data / key; Composing mirrors
// KeyboardEvent.isComposing on a keydown.
type EditorEvent struct {
	Type      string
	Str       string
	Composing bool
}

// EditorState is the observable result of a replay.
type EditorState struct {
	Value     string
	Submitted int
}

// EditorCase covers failure modes #1, #4, #5 (IME composition lifecycle).
type EditorCase struct {
	Mode         int
	Slug, Script string
	Events       []EditorEvent
	Correct      EditorState // a correct IME-aware input
	BrokenBug    string      // bug name that breaks it
	Broken       EditorState // the broken input's result
}

// EditorCases.
var EditorCases = []EditorCase{
	{
		Mode: 1, Slug: "early-enter-compose-confirm", Script: "JP",
		Events: []EditorEvent{
			{Type: "compositionStart"},
			{Type: "compositionUpdate", Str: "にほん"},
			{Type: "keydown", Str: "Enter", Composing: true},
			{Type: "compositionEnd", Str: "日本"},
			{Type: "keydown", Str: "Enter", Composing: false},
		},
		Correct:   EditorState{Value: "日本", Submitted: 1},
		BrokenBug: "enterDuringCompose",
		Broken:    EditorState{Value: "日本", Submitted: 2},
	},
	{
		Mode: 4, Slug: "commit-callback-drop", Script: "KO",
		Events: []EditorEvent{
			{Type: "compositionStart"},
			{Type: "compositionUpdate", Str: "한국"},
			{Type: "blur"},
		},
		Correct:   EditorState{Value: "한국", Submitted: 0},
		BrokenBug: "dropOnBlur",
		Broken:    EditorState{Value: "", Submitted: 0},
	},
	{
		Mode: 5, Slug: "re-entry-after-blur", Script: "JP",
		Events: []EditorEvent{
			{Type: "compositionStart"},
			{Type: "compositionUpdate", Str: "ご"},
			{Type: "blur"},
			{Type: "focus"},
			{Type: "keydown", Str: "a", Composing: false},
		},
		Correct:   EditorState{Value: "ごa", Submitted: 0},
		BrokenBug: "stuckComposing",
		Broken:    EditorState{Value: "", Submitted: 0},
	},
}

// ApplyEvents replays an event list against an editor and returns it.
func ApplyEvents(e *Editor, events []EditorEvent) *Editor {
	for _, ev := range events {
		switch ev.Type {
		case "keydown":
			e.Keydown(ev.Str, ev.Composing)
		case "compositionStart":
			e.CompositionStart()
		case "compositionUpdate":
			e.CompositionUpdate(ev.Str)
		case "compositionEnd":
			e.CompositionEnd(ev.Str)
		case "blur":
			e.Blur()
		case "focus":
			e.Focus()
		default:
			panic("unknown editor event type: " + ev.Type)
		}
	}
	return e
}
