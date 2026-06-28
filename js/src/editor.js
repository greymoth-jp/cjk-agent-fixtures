// A minimal, framework-agnostic model of an IME-aware text input.
//
// It reproduces the lifecycle a real DOM input goes through during composition
// for any IME — Japanese kana, Korean Hangul, Chinese pinyin candidates:
// compositionstart -> compositionupdate(s) -> compositionend, plus keydown /
// blur / focus. The `bugs` set lets a fixture construct a deliberately broken
// editor and prove the test catches it.
//
// Adapt the event methods to your real component (wire `keydown` to your
// keydown handler, `compositionStart/Update/End` to the matching DOM events,
// etc.) and the assertions in /test carry straight over. See README for a DOM
// adapter using real CompositionEvent objects.

export function createEditor(opts = {}) {
  return new ImeInput(new Set(opts.bugs || []));
}

class ImeInput {
  constructor(bugs) {
    this.bugs = bugs;
    this.value = "";
    this.composing = false;
    this.composingData = "";
    this.submitted = 0;
  }

  // A key was pressed. `isComposing` mirrors KeyboardEvent.isComposing — it is
  // true while the IME owns the keystroke (e.g. Enter confirming a candidate).
  keydown(key, isComposing = false) {
    const midComposition = this.composing || isComposing;

    if (key === "Enter") {
      // Failure mode #1 (early-Enter compose-confirm): the Enter that confirms
      // an IME candidate must NOT also submit / insert a newline.
      if (this.bugs.has("enterDuringCompose")) {
        this.submitted++; // buggy: ignores isComposing
        return;
      }
      if (!midComposition) this.submitted++;
      return;
    }

    // While composing, the IME produces text via composition events, not via
    // raw keydown, so a printable keydown here is part of candidate selection.
    if (!this.composing && key.length === 1) {
      this.value += key;
    }
  }

  compositionStart() {
    this.composing = true;
    this.composingData = "";
  }

  compositionUpdate(data) {
    this.composingData = data;
  }

  compositionEnd(data) {
    this.value += data;
    this.composing = false;
    this.composingData = "";
  }

  blur() {
    // Failure mode #5 (re-entry after blur): some browsers never fire
    // compositionend when focus leaves mid-composition, leaving `composing`
    // stuck true so all later input is ignored.
    if (this.bugs.has("stuckComposing")) {
      return; // buggy: never resets, compositionend never arrives
    }
    // Failure mode #4 (commit-callback-drop on focus-shift): the pending
    // composition is thrown away instead of committed.
    if (this.bugs.has("dropOnBlur")) {
      this.composing = false;
      this.composingData = ""; // buggy: silently drops pending text
      return;
    }
    // Correct: finalize the pending composition so nothing is lost.
    if (this.composing) {
      this.value += this.composingData;
      this.composing = false;
      this.composingData = "";
    }
  }

  focus() {
    if (this.bugs.has("stuckComposing")) return; // does not clear stuck state
    this.composing = false; // correct: start from a clean composition state
  }
}
