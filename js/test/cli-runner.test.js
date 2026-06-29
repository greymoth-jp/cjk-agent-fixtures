import { describe, it, expect } from "vitest";
import { referenceSubject, buildChecks, summarize, gate, CATEGORIES } from "../cli/runner.js";
import naiveSubject from "../cli/__fixtures__/naive-subject.mjs";

describe("reference subject", () => {
  const checks = buildChecks(referenceSubject);
  const summary = summarize(checks);

  it("covers every category", () => {
    expect(summary.categoriesRun.sort()).toEqual([...CATEGORIES].sort());
  });

  it("passes every check at score 100", () => {
    expect(summary.fail).toBe(0);
    expect(summary.score).toBe(100);
    expect(summary.total).toBeGreaterThanOrEqual(30);
  });

  it("passes the strict gate", () => {
    expect(gate(summary, checks).ok).toBe(true);
  });
});

describe("naive subject bites", () => {
  const checks = buildChecks(naiveSubject);
  const summary = summarize(checks);

  it("fails a large share of checks but not all (per-check granularity)", () => {
    expect(summary.fail).toBeGreaterThan(20);
    expect(summary.pass).toBeGreaterThan(0);
    expect(summary.score).toBeLessThan(50);
  });

  it("tears byte and surrogate slices and breaks the IME editor", () => {
    const failing = new Set(summary.failing.map((c) => c.id));
    const sliceFails = summary.failing.filter((c) => c.category === "slice");
    expect(sliceFails.length).toBe(checks.filter((c) => c.category === "slice").length);
    const editorFails = summary.failing.filter((c) => c.category === "editor");
    expect(editorFails.length).toBe(checks.filter((c) => c.category === "editor").length);
    expect(failing.has("whitespace[0]")).toBe(true);
  });

  it("fails the strict gate", () => {
    expect(gate(summary, checks).ok).toBe(false);
  });
});

describe("category filter", () => {
  it("runs only the requested categories", () => {
    const checks = buildChecks(referenceSubject, { categories: ["editor"] });
    expect(checks.every((c) => c.category === "editor")).toBe(true);
    expect(checks.length).toBeGreaterThan(0);
  });
});

describe("baseline regression gate", () => {
  const refChecks = buildChecks(referenceSubject);
  const naiveChecks = buildChecks(naiveSubject);
  const naiveSummary = summarize(naiveChecks);
  const refSummary = summarize(refChecks);

  const naiveBaseline = { knownFailures: naiveSummary.failing.map((c) => c.id) };
  const cleanBaseline = { knownFailures: [] };

  it("tolerates known failures (naive against a naive baseline)", () => {
    const g = gate(naiveSummary, naiveChecks, { baseline: naiveBaseline });
    expect(g.ok).toBe(true);
    expect(g.regressions.length).toBe(0);
  });

  it("flags new failures as regressions (naive against a clean baseline)", () => {
    const g = gate(naiveSummary, naiveChecks, { baseline: cleanBaseline });
    expect(g.ok).toBe(false);
    expect(g.regressions.length).toBe(naiveSummary.fail);
  });

  it("reports fixed checks (reference against a naive baseline)", () => {
    const g = gate(refSummary, refChecks, { baseline: naiveBaseline });
    expect(g.ok).toBe(true);
    expect(g.fixed.length).toBe(naiveBaseline.knownFailures.length);
  });
});

describe("min-score gate", () => {
  it("passes at or above the threshold and fails below it", () => {
    const naiveSummary = summarize(buildChecks(naiveSubject));
    expect(gate(naiveSummary, buildChecks(naiveSubject), { minScore: 90 }).ok).toBe(false);
    const refSummary = summarize(buildChecks(referenceSubject));
    expect(gate(refSummary, buildChecks(referenceSubject), { minScore: 90 }).ok).toBe(true);
  });
});
