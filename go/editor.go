package cjkfixtures

import "unicode/utf8"

// Editor is a minimal, framework-agnostic model of an IME-aware text input,
// mirroring the DOM lifecycle a real input goes through during CJK composition:
// CompositionStart -> CompositionUpdate(s) -> CompositionEnd, plus Keydown,
// Blur and Focus. The bugs map lets a fixture build a deliberately broken
// editor and prove the test catches it.
type Editor struct {
	Value         string
	Composing     bool
	ComposingData string
	Submitted     int
	bugs          map[string]bool
}

// NewEditor builds an editor. Pass bug names ("enterDuringCompose",
// "dropOnBlur", "stuckComposing") to construct a broken one; none = correct.
func NewEditor(bugs ...string) *Editor {
	m := make(map[string]bool, len(bugs))
	for _, b := range bugs {
		m[b] = true
	}
	return &Editor{bugs: m}
}

// Keydown handles a key press. isComposing mirrors KeyboardEvent.isComposing:
// true while the IME owns the keystroke (e.g. Enter confirming a candidate).
func (e *Editor) Keydown(key string, isComposing bool) {
	midComposition := e.Composing || isComposing

	if key == "Enter" {
		// Failure mode #1: the Enter that confirms an IME candidate must not
		// also submit.
		if e.bugs["enterDuringCompose"] {
			e.Submitted++ // buggy: ignores isComposing
			return
		}
		if !midComposition {
			e.Submitted++
		}
		return
	}

	// While composing, text arrives via composition events, not raw keydown.
	if !e.Composing && utf8.RuneCountInString(key) == 1 {
		e.Value += key
	}
}

func (e *Editor) CompositionStart() {
	e.Composing = true
	e.ComposingData = ""
}

func (e *Editor) CompositionUpdate(data string) {
	e.ComposingData = data
}

func (e *Editor) CompositionEnd(data string) {
	e.Value += data
	e.Composing = false
	e.ComposingData = ""
}

func (e *Editor) Blur() {
	// Failure mode #5: leaving composition state stuck so later input is lost.
	if e.bugs["stuckComposing"] {
		return // buggy: never resets, CompositionEnd never arrives
	}
	// Failure mode #4: dropping the pending composition instead of committing.
	if e.bugs["dropOnBlur"] {
		e.Composing = false
		e.ComposingData = "" // buggy: silently drops pending text
		return
	}
	// Correct: finalize the pending composition so nothing is lost.
	if e.Composing {
		e.Value += e.ComposingData
		e.Composing = false
		e.ComposingData = ""
	}
}

func (e *Editor) Focus() {
	if e.bugs["stuckComposing"] {
		return // does not clear stuck state
	}
	e.Composing = false // correct: start from a clean composition state
}
