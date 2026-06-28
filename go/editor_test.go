package cjkfixtures

import "testing"

// Failure mode #1: early-Enter compose-confirm.
// Pressing Enter to confirm the candidate 日本 fires keydown with
// isComposing=true. That confirm key must not also submit.
func runComposeConfirm(e *Editor) *Editor {
	e.CompositionStart()
	e.CompositionUpdate("にほん")
	e.Keydown("Enter", true) // candidate-confirm Enter
	e.CompositionEnd("日本")
	e.Keydown("Enter", false) // real submit Enter
	return e
}

func TestEarlyEnterComposeConfirm_Correct(t *testing.T) {
	e := runComposeConfirm(NewEditor())
	if e.Value != "日本" {
		t.Fatalf("value = %q, want 日本", e.Value)
	}
	if e.Submitted != 1 {
		t.Fatalf("submitted = %d, want 1 (only the real Enter)", e.Submitted)
	}
}

func TestEarlyEnterComposeConfirm_CatchesBug(t *testing.T) {
	e := runComposeConfirm(NewEditor("enterDuringCompose"))
	if e.Submitted != 2 {
		t.Fatalf("submitted = %d, want 2 (confirm Enter leaked a submit)", e.Submitted)
	}
}

// Failure mode #4: commit-callback-drop on focus-shift.
func runFocusDrop(e *Editor) *Editor {
	e.CompositionStart()
	e.CompositionUpdate("にほんご")
	e.Blur() // focus shifts mid-composition, no CompositionEnd
	return e
}

func TestFocusShiftDrop_Correct(t *testing.T) {
	e := runFocusDrop(NewEditor())
	if e.Value != "にほんご" {
		t.Fatalf("value = %q, want にほんご (committed on blur)", e.Value)
	}
	if e.Composing {
		t.Fatal("composing still true after blur")
	}
}

func TestFocusShiftDrop_CatchesBug(t *testing.T) {
	e := runFocusDrop(NewEditor("dropOnBlur"))
	if e.Value != "" {
		t.Fatalf("value = %q, want empty (pending composition was dropped)", e.Value)
	}
}

// Failure mode #5: composition re-entry after blur / refocus.
func runReEntry(e *Editor) *Editor {
	e.CompositionStart()
	e.CompositionUpdate("にほん")
	e.Blur()
	e.Focus()
	e.Keydown("a", false) // a plain keystroke after refocus
	return e
}

func TestReEntryAfterBlur_Correct(t *testing.T) {
	e := runReEntry(NewEditor())
	if e.Composing {
		t.Fatal("composing still true after refocus")
	}
	if len(e.Value) == 0 || e.Value[len(e.Value)-1] != 'a' {
		t.Fatalf("value = %q, want it to end with 'a'", e.Value)
	}
}

func TestReEntryAfterBlur_CatchesBug(t *testing.T) {
	e := runReEntry(NewEditor("stuckComposing"))
	if !e.Composing {
		t.Fatal("expected editor stuck in composing state")
	}
	if len(e.Value) > 0 && e.Value[len(e.Value)-1] == 'a' {
		t.Fatal("keystroke should have been swallowed while stuck composing")
	}
}

// The same three failure modes reproduce across IMEs. These table-driven tests
// cover Korean Hangul and Chinese pinyin alongside the Japanese cases above.

var composeCases = []struct {
	lang      string
	candidate string
	final     string
}{
	{"Korean Hangul", "한구", "한국"},
	{"Chinese pinyin", "riben", "日本"},
}

func TestEarlyEnterComposeConfirm_Multilingual(t *testing.T) {
	for _, c := range composeCases {
		t.Run(c.lang, func(t *testing.T) {
			run := func(e *Editor) *Editor {
				e.CompositionStart()
				e.CompositionUpdate(c.candidate)
				e.Keydown("Enter", true) // candidate-confirm Enter
				e.CompositionEnd(c.final)
				e.Keydown("Enter", false) // real submit Enter
				return e
			}
			ok := run(NewEditor())
			if ok.Value != c.final {
				t.Fatalf("value = %q, want %q", ok.Value, c.final)
			}
			if ok.Submitted != 1 {
				t.Fatalf("submitted = %d, want 1 (only the real Enter)", ok.Submitted)
			}
			bug := run(NewEditor("enterDuringCompose"))
			if bug.Submitted != 2 {
				t.Fatalf("submitted = %d, want 2 (confirm Enter leaked a submit)", bug.Submitted)
			}
		})
	}
}

var pendingCases = []struct {
	lang    string
	pending string
}{
	{"Korean Hangul", "한국"},
	{"Chinese pinyin", "zhongwen"},
}

func TestFocusShiftDrop_Multilingual(t *testing.T) {
	for _, c := range pendingCases {
		t.Run(c.lang, func(t *testing.T) {
			run := func(e *Editor) *Editor {
				e.CompositionStart()
				e.CompositionUpdate(c.pending)
				e.Blur()
				return e
			}
			ok := run(NewEditor())
			if ok.Value != c.pending {
				t.Fatalf("value = %q, want %q (committed on blur)", ok.Value, c.pending)
			}
			if ok.Composing {
				t.Fatal("composing still true after blur")
			}
			bug := run(NewEditor("dropOnBlur"))
			if bug.Value != "" {
				t.Fatalf("value = %q, want empty (pending composition dropped)", bug.Value)
			}
		})
	}
}

func TestReEntryAfterBlur_Multilingual(t *testing.T) {
	for _, c := range pendingCases {
		t.Run(c.lang, func(t *testing.T) {
			run := func(e *Editor) *Editor {
				e.CompositionStart()
				e.CompositionUpdate(c.pending)
				e.Blur()
				e.Focus()
				e.Keydown("a", false)
				return e
			}
			ok := run(NewEditor())
			if ok.Composing {
				t.Fatal("composing still true after refocus")
			}
			if len(ok.Value) == 0 || ok.Value[len(ok.Value)-1] != 'a' {
				t.Fatalf("value = %q, want it to end with 'a'", ok.Value)
			}
			bug := run(NewEditor("stuckComposing"))
			if !bug.Composing {
				t.Fatal("expected editor stuck in composing state")
			}
			if len(bug.Value) > 0 && bug.Value[len(bug.Value)-1] == 'a' {
				t.Fatal("keystroke should have been swallowed while stuck composing")
			}
		})
	}
}
