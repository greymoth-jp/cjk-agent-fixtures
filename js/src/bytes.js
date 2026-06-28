// Byte-boundary safety — slicing CJK text.
//
// Failure mode #2 (byte-boundary crash): code that slices a string by raw byte
// index (common when crossing into Rust / Go / C++, or old Node Buffer code)
// lands in the middle of a multi-byte sequence. Japanese characters are 3 UTF-8
// bytes each, so "give me the first 4 bytes" cuts a character in half and
// produces a replacement character (U+FFFD) or garbage.

/** Buggy reference: slice by raw UTF-8 byte index, then decode. */
export function byteSlice(str, nBytes) {
  return Buffer.from(str, "utf8").subarray(0, nBytes).toString("utf8");
}

/** Correct: slice by code point so multi-byte characters stay intact. */
export function codePointSlice(str, nChars) {
  return Array.from(str).slice(0, nChars).join("");
}

/** True if the string contains the Unicode replacement character. */
export function hasReplacementChar(str) {
  return str.includes("�");
}

/** True if re-encoding the string is lossless (no orphaned bytes). */
export function isCleanUtf8(str) {
  return !str.includes("�");
}
