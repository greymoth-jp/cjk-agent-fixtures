// Failure mode #5: composition re-entry after blur / refocus.
//
// On some browsers compositionend never fires when focus leaves during
// composition, so isComposing stays true. After the user clicks back in, the
// composition guard rejects every keystroke and the field looks frozen until a
// reload. A correct editor resets composition state on blur/focus. Same across
// IMEs.
import { describe, it, expect } from "vitest";
import { createEditor } from "../src/editor.js";

const CASES = [
  { lang: "Japanese kana", pending: "にほん" },
  { lang: "Korean Hangul", pending: "한국" },
  { lang: "Chinese pinyin", pending: "zhongwen" },
];

// Compose, lose focus mid-composition, refocus, then type a normal ASCII key.
function run(editor, pending) {
  editor.compositionStart();
  editor.compositionUpdate(pending);
  editor.blur(); // focus leaves; compositionend may never fire
  editor.focus(); // user clicks back in
  editor.keydown("a", false); // a plain keystroke after refocus
  return editor;
}

for (const { lang, pending } of CASES) {
  describe(`re-entry after blur (${lang})`, () => {
    it("a correct editor accepts input again after refocus", () => {
      const ed = run(createEditor(), pending);
      expect(ed.composing).toBe(false);
      expect(ed.value.endsWith("a")).toBe(true);
    });

    it("catches an editor left stuck in composing state", () => {
      const buggy = run(createEditor({ bugs: ["stuckComposing"] }), pending);
      expect(buggy.composing).toBe(true); // never reset
      expect(buggy.value.endsWith("a")).toBe(false); // keystroke swallowed
    });
  });
}
