// Failure mode #4: commit-callback-drop on focus-shift.
//
// Focus moves away (clicking another field, an autosuggest popup stealing
// focus, a programmatic blur) while "にほんご" is still being composed and
// compositionend never fires. A correct editor finalizes the pending text; a
// buggy one silently drops it.
import { describe, it, expect } from "vitest";
import { createEditor } from "../src/editor.js";

// Compose にほんご, then lose focus before confirming (no compositionend).
function run(editor) {
  editor.compositionStart();
  editor.compositionUpdate("にほんご");
  editor.blur(); // focus shifts mid-composition
  return editor;
}

describe("commit-callback-drop on focus-shift", () => {
  it("a correct editor commits the pending composition on blur", () => {
    const ed = run(createEditor());
    expect(ed.value).toBe("にほんご");
    expect(ed.composing).toBe(false);
  });

  it("catches an editor that drops the pending composition", () => {
    const buggy = run(createEditor({ bugs: ["dropOnBlur"] }));
    expect(buggy.value).toBe(""); // text was lost
    expect(buggy.value).not.toBe("にほんご");
  });
});
