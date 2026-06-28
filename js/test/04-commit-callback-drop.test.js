// Failure mode #4: commit-callback-drop on focus-shift.
//
// Focus moves away (another field, an autosuggest popup stealing focus, a
// programmatic blur) while text is still being composed and compositionend
// never fires. A correct editor finalizes the pending text; a buggy one
// silently drops it. Same hazard for any IME.
import { describe, it, expect } from "vitest";
import { createEditor } from "../src/editor.js";

const CASES = [
  { lang: "Japanese kana", pending: "にほんご" },
  { lang: "Korean Hangul", pending: "한국" },
  { lang: "Chinese pinyin", pending: "zhongwen" },
];

// Compose, then lose focus before confirming (no compositionend).
function run(editor, pending) {
  editor.compositionStart();
  editor.compositionUpdate(pending);
  editor.blur(); // focus shifts mid-composition
  return editor;
}

for (const { lang, pending } of CASES) {
  describe(`commit-callback-drop on focus-shift (${lang})`, () => {
    it("a correct editor commits the pending composition on blur", () => {
      const ed = run(createEditor(), pending);
      expect(ed.value).toBe(pending);
      expect(ed.composing).toBe(false);
    });

    it("catches an editor that drops the pending composition", () => {
      const buggy = run(createEditor({ bugs: ["dropOnBlur"] }), pending);
      expect(buggy.value).toBe(""); // text was lost
      expect(buggy.value).not.toBe(pending);
    });
  });
}
