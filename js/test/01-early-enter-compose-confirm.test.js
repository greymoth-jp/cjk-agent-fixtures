// Failure mode #1: early-Enter compose-confirm.
//
// Typing "にほん" and pressing Enter to confirm the candidate "日本" fires a
// keydown with isComposing = true. A handler that submits on Enter without
// checking isComposing will submit (or insert a newline) on the confirm key,
// eating the user's first attempt at every message.
import { describe, it, expect } from "vitest";
import { createEditor } from "../src/editor.js";

// Drive the editor through: compose にほん -> confirm to 日本 (Enter while
// composing) -> a real Enter to submit.
function run(editor) {
  editor.compositionStart();
  editor.compositionUpdate("にほん");
  editor.keydown("Enter", true); // candidate-confirm Enter (isComposing)
  editor.compositionEnd("日本");
  editor.keydown("Enter", false); // real submit Enter
  return editor;
}

describe("early-Enter compose-confirm", () => {
  it("a correct handler submits once: only the real Enter", () => {
    const ed = run(createEditor());
    expect(ed.value).toBe("日本");
    expect(ed.submitted).toBe(1);
  });

  it("catches a handler that submits on the candidate-confirm Enter", () => {
    const buggy = run(createEditor({ bugs: ["enterDuringCompose"] }));
    // The fixture flags the regression: the confirm Enter submitted too.
    expect(buggy.submitted).toBe(2);
    expect(buggy.submitted).not.toBe(1);
  });
});
