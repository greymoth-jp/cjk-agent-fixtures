// Internal test subject. Every handler is a known-broken implementation drawn
// from the package's own naive references, so the gate has something to fail on.
// Used by cli-runner.test.js and by the action's self-test (the regressing case).
import {
  naiveWidth,
  rawEqual,
  naiveDirection,
  asciiTrim,
  byteSlice,
  utf16Slice,
  codePointSlice,
  createEditor,
} from "../../index.js";

export default {
  name: "naive (broken)",
  width: (s) => naiveWidth(s),
  equalNFC: (a, b) => rawEqual(a, b),
  equalNFKC: (a, b) => rawEqual(a, b),
  direction: (s) => naiveDirection(s),
  trim: (s) => asciiTrim(s),
  slice: (s, limit, unit) =>
    unit === "byte" ? byteSlice(s, limit) : unit === "utf16" ? utf16Slice(s, limit) : codePointSlice(s, limit),
  editor: () => createEditor({ bugs: ["enterDuringCompose", "dropOnBlur", "stuckComposing"] }),
};
