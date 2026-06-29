// Compatibility folding — NFKC, where the same text wears different costumes.
//
// Failure mode #9 (nfkc-compatibility-fold): Japanese input carries several
// width variants of the same letters. Halfwidth katakana (ﾊﾝｶｸ, U+FF61..U+FF9F)
// and fullwidth ASCII (Ａ１２３, U+FF01..U+FF5E) look like — and mean — the same
// thing as ハンカク and A123, but they are entirely different code points. A
// search, a dedup, a username check, or a payment-form validator that compares
// raw, or even after canonical (NFC) normalization, treats them as unequal: the
// record is missed, the duplicate is kept, the "already taken" check passes.
//
// This is distinct from NFC/NFD (#7). That fixture is about *canonical*
// equivalence (é vs e+◌́, which NFC settles). Width variants are only
// *compatibility* equivalent — NFC leaves them apart on purpose, and only the
// compatibility forms (NFKC / NFKD) fold them together. The fix is to NFKC
// before comparing.

/** Compatibility-composed form: folds width variants together. */
export function nfkc(s) {
  return s.normalize("NFKC");
}

/** Buggy reference: raw comparison — width variants look unequal. */
export function naiveEquals(a, b) {
  return a === b;
}

/**
 * Insufficient reference: canonical (NFC) comparison. It settles é vs e+◌́ but
 * deliberately leaves halfwidth/fullwidth width variants apart, so this still
 * reports ﾊﾝｶｸ and ハンカク as different. Shown to prove #7's fix is not enough here.
 */
export function canonicalEquals(a, b) {
  return a.normalize("NFC") === b.normalize("NFC");
}

/** Correct: compatibility (NFKC) comparison folds the width variants. */
export function compatEquals(a, b) {
  return a.normalize("NFKC") === b.normalize("NFKC");
}
