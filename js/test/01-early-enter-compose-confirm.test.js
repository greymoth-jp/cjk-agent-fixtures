// Failure mode #1: early-Enter compose-confirm.
//
// Pressing Enter to confirm an IME candidate fires a keydown with
// isComposing = true. A handler that submits on Enter without checking
// isComposing submits (or inserts a newline) on the confirm key, eating the
// user's first attempt at every message. This breaks the same way for Japanese
// kana, Korean Hangul, and Chinese pinyin candidate selection.
import { describe, it, expect } from "vitest";
import { createEditor } from "../src/editor.js";

// Each case: an in-progress composition string and the confirmed result.
const CASES = [
  { lang: "Japanese kana", candidate: "にほん", final: "日本" },
  { lang: "Korean Hangul", candidate: "한구", final: "한국" },
  { lang: "Chinese pinyin", candidate: "riben", final: "日本" },
];

// Drive the editor: compose -> confirm candidate (Enter while composing) -> a
// real Enter to submit.
function run(editor, candidate, final) {
  editor.compositionStart();
  editor.compositionUpdate(candidate);
  editor.keydown("Enter", true); // candidate-confirm Enter (isComposing)
  editor.compositionEnd(final);
  editor.keydown("Enter", false); // real submit Enter
  return editor;
}

for (const { lang, candidate, final } of CASES) {
  describe(`early-Enter compose-confirm (${lang})`, () => {
    it("a correct handler submits once: only the real Enter", () => {
      const ed = run(createEditor(), candidate, final);
      expect(ed.value).toBe(final);
      expect(ed.submitted).toBe(1);
    });

    it("catches a handler that submits on the candidate-confirm Enter", () => {
      const buggy = run(
        createEditor({ bugs: ["enterDuringCompose"] }),
        candidate,
        final,
      );
      // The fixture flags the regression: the confirm Enter submitted too.
      expect(buggy.submitted).toBe(2);
      expect(buggy.submitted).not.toBe(1);
    });
  });
}
