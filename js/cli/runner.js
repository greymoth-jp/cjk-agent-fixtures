// Pure check-runner for cjk-fixtures-check. No IO and no process access: the CLI
// in run.js wraps this with argument parsing, file output, and the exit code.
//
// A "subject" is a plain object of handler functions. Each function maps to one
// category of the corpus; missing functions skip that category, so a project can
// adopt the gate one handler at a time. The check compares the subject's output
// to the value the corpus says a correct handler returns. For byte and UTF-16
// slicing the corpus documents a property rather than one right answer (a safe
// slicer must not emit U+FFFD or a lone surrogate), so those are asserted as
// properties, matching the README.

import {
  cases,
  applyEvents,
  displayWidth,
  nfcEqual,
  nfkcEqual,
  baseDirection,
  unicodeTrim,
  codePointSlice,
  graphemeSlice,
  isCleanUtf8,
  isWellFormed,
  createEditor,
} from "../index.js";

export const CATEGORIES = ["width", "equality", "direction", "whitespace", "slice", "editor"];

// The package's own correct handlers, wired to the subject contract. This is the
// default subject, so the gate is green with no configuration until you point it
// at your code. It also documents the shape your own subject should implement.
export const referenceSubject = {
  name: "reference",
  width: (s) => displayWidth(s),
  equalNFC: (a, b) => nfcEqual(a, b),
  equalNFKC: (a, b) => nfkcEqual(a, b),
  direction: (s) => baseDirection(s),
  trim: (s) => unicodeTrim(s),
  slice: (s, limit, unit) => (unit === "grapheme" ? graphemeSlice(s, limit) : codePointSlice(s, limit)),
  editor: () => createEditor(),
};

function show(v) {
  return typeof v === "string" ? JSON.stringify(v) : String(v);
}

function mk(category, index, c, ok, label, expected, actual, aspect) {
  const id = aspect ? `${category}[${index}].${aspect}` : `${category}[${index}]`;
  return {
    id,
    category,
    index,
    mode: c.mode,
    slug: c.slug,
    script: c.script,
    label,
    expected,
    actual,
    status: ok ? "pass" : "fail",
  };
}

// Run a subject against the corpus and return a flat list of checks. `opts.categories`
// limits the run to a subset (defaults to all).
export function buildChecks(subject, opts = {}) {
  const only = opts.categories && opts.categories.length ? new Set(opts.categories) : null;
  const want = (c) => !only || only.has(c);
  const checks = [];

  if (want("width") && typeof subject.width === "function") {
    cases.width.forEach((c, i) => {
      const got = subject.width(c.input);
      checks.push(mk("width", i, c, got === c.correctWidth, `width(${show(c.input)})`, c.correctWidth, got));
    });
  }

  if (want("equality")) {
    cases.equality.forEach((c, i) => {
      if (typeof subject.equalNFC === "function") {
        const got = subject.equalNFC(c.a, c.b);
        checks.push(mk("equality", i, c, got === c.nfcEqual, `nfcEqual(${show(c.a)}, ${show(c.b)})`, c.nfcEqual, got, "nfc"));
      }
      if (typeof subject.equalNFKC === "function") {
        const got = subject.equalNFKC(c.a, c.b);
        checks.push(mk("equality", i, c, got === c.nfkcEqual, `nfkcEqual(${show(c.a)}, ${show(c.b)})`, c.nfkcEqual, got, "nfkc"));
      }
    });
  }

  if (want("direction") && typeof subject.direction === "function") {
    cases.direction.forEach((c, i) => {
      const got = subject.direction(c.input);
      checks.push(mk("direction", i, c, got === c.correctDir, `direction(${show(c.input)})`, c.correctDir, got));
    });
  }

  if (want("whitespace") && typeof subject.trim === "function") {
    cases.whitespace.forEach((c, i) => {
      const got = subject.trim(c.input);
      checks.push(mk("whitespace", i, c, got === c.correctTrimmed, `trim(${show(c.input)})`, c.correctTrimmed, got));
    });
  }

  if (want("slice") && typeof subject.slice === "function") {
    cases.slice.forEach((c, i) => {
      const got = subject.slice(c.input, c.limit, c.unit);
      let ok;
      let expected;
      if (c.unit === "byte") {
        ok = isCleanUtf8(got);
        expected = "no U+FFFD";
      } else if (c.unit === "utf16") {
        ok = isWellFormed(got);
        expected = "well-formed UTF-16";
      } else {
        ok = got === c.whole;
        expected = c.whole;
      }
      checks.push(mk("slice", i, c, ok, `slice(${show(c.input)}, ${c.limit}, ${c.unit})`, expected, got));
    });
  }

  if (want("editor") && typeof subject.editor === "function") {
    cases.editor.forEach((c, i) => {
      const ed = applyEvents(subject.editor(), c.events);
      const ok = ed.value === c.correct.value && ed.submitted === c.correct.submitted;
      checks.push(
        mk("editor", i, c, ok, `replay ${c.slug}`, `${show(c.correct.value)} / ${c.correct.submitted}`, `${show(ed.value)} / ${ed.submitted}`),
      );
    });
  }

  return checks;
}

export function summarize(checks) {
  const byCat = {};
  for (const c of CATEGORIES) byCat[c] = { pass: 0, fail: 0 };
  let pass = 0;
  let fail = 0;
  for (const ch of checks) {
    byCat[ch.category][ch.status]++;
    if (ch.status === "pass") pass++;
    else fail++;
  }
  const total = pass + fail;
  const score = total === 0 ? 0 : Math.round((pass / total) * 100);
  const categoriesRun = CATEGORIES.filter((c) => byCat[c].pass + byCat[c].fail > 0);
  return { pass, fail, total, score, byCat, categoriesRun, failing: checks.filter((c) => c.status === "fail") };
}

// Decide whether the run passes the gate. Three modes, in priority order:
//   baseline  — fail only on NEW failures (regressions); tolerate known ones.
//   min-score — fail if the score is below a threshold.
//   strict    — fail on any failing check (the default).
export function gate(summary, checks, opts = {}) {
  const failingIds = checks.filter((c) => c.status === "fail").map((c) => c.id);

  if (opts.baseline) {
    const known = new Set(opts.baseline.knownFailures || []);
    const regressions = failingIds.filter((id) => !known.has(id));
    const presentIds = new Set(checks.map((c) => c.id));
    const fixed = [...known].filter((id) => presentIds.has(id) && !failingIds.includes(id));
    return { mode: "baseline", ok: regressions.length === 0, regressions, fixed };
  }
  if (opts.minScore != null) {
    return { mode: "min-score", ok: summary.score >= opts.minScore, minScore: opts.minScore };
  }
  return { mode: "strict", ok: summary.fail === 0 };
}
