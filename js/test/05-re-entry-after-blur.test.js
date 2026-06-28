// Failure mode #5: composition re-entry after blur / refocus.
//
// On some browsers compositionend never fires when focus leaves during
// composition, so `isComposing` stays true. After the user clicks back in, the
// composition guard rejects every keystroke and the field looks frozen until a
// page reload. A correct editor resets composition state on blur/focus.
import { describe, it, expect } from "vitest";
import { createEditor } from "../src/editor.js";

// Compose, lose focus mid-composition, refocus, then type a normal ASCII key.
function run(editor) {
  editor.compositionStart();
  editor.compositionUpdate("にほん");
  editor.blur(); // focus leaves; compositionend may never fire
  editor.focus(); // user clicks back in
  editor.keydown("a", false); // a plain keystroke after refocus
  return editor;
}

describe("re-entry after blur", () => {
  it("a correct editor accepts input again after refocus", () => {
    const ed = run(createEditor());
    expect(ed.composing).toBe(false);
    expect(ed.value.endsWith("a")).toBe(true);
  });

  it("catches an editor left stuck in composing state", () => {
    const buggy = run(createEditor({ bugs: ["stuckComposing"] }));
    expect(buggy.composing).toBe(true); // never reset
    expect(buggy.value.endsWith("a")).toBe(false); // keystroke was swallowed
  });
});
