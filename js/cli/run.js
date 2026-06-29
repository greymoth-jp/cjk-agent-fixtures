#!/usr/bin/env node
// cjk-fixtures-check — run @greymoth/cjk-agent-fixtures as a CI regression gate.
//
// It replays the bundled CJK / IME / Unicode regression cases against your input
// handlers (a "subject") and fails the build when a case the corpus says should
// pass does not. With no subject it runs the package's own reference handlers,
// which pass every case, so the gate stays green until you point it at your code.
// With a baseline it fails only on NEW breakage, so a project that already has
// gaps can adopt the gate and still block the next regression.

import process from "node:process";
import { readFileSync, writeFileSync, appendFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

import { referenceSubject, buildChecks, summarize, gate, CATEGORIES } from "./runner.js";

const USAGE = `cjk-fixtures-check — Japanese-IME / CJK / Unicode reliability gate

Usage:
  cjk-fixtures-check [options]

Options:
  --subject <path>      Module exporting a subject (default export, or named
                        handlers). Omitted: run the bundled reference handlers,
                        a corpus self-check that passes every case.
  --baseline <path>     Baseline JSON written by --update-baseline. When set, the
                        gate fails only on NEW failures (regressions).
  --update-baseline     Write the current failures to --baseline and exit 0.
  --min-score <0-100>   Fail if the score is below this. Ignored with --baseline.
  --categories <list>   Comma list to run: ${CATEGORIES.join(",")}.
  --json <path>         Write the full machine-readable result.
  --md <path>           Write a Markdown report (also added to the job summary).
  --quiet               Print only the verdict line.
  -h, --help            Show this help.

Exit code is 0 when the gate passes and 1 when it does not, so it gates CI.`;

function parseArgs(argv) {
  const o = { categories: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    switch (a) {
      case "-h":
      case "--help": o.help = true; break;
      case "--subject": o.subject = next(); break;
      case "--baseline": o.baseline = next(); break;
      case "--update-baseline": o.updateBaseline = true; break;
      case "--min-score": o.minScore = Number(next()); break;
      case "--categories": o.categories = next().split(",").map((s) => s.trim()).filter(Boolean); break;
      case "--json": o.json = next(); break;
      case "--md": o.md = next(); break;
      case "--quiet": o.quiet = true; break;
      default:
        process.stderr.write(`cjk-fixtures-check: unknown option ${a}\n\n${USAGE}\n`);
        process.exit(2);
    }
  }
  return o;
}

async function loadSubject(path) {
  if (!path) return referenceSubject;
  const url = pathToFileURL(resolve(process.cwd(), path)).href;
  const mod = await import(url);
  const subject = mod.default ?? mod;
  if (!subject || typeof subject !== "object") {
    throw new Error(`subject ${path} must export an object of handler functions`);
  }
  return subject;
}

function pad(s, n) {
  return s + " ".repeat(Math.max(0, n - s.length));
}

function reportText(subjectName, summary, verdict, quiet) {
  const lines = [];
  if (!quiet) {
    lines.push(`cjk-fixtures-check · subject: ${subjectName}`, "");
    for (const cat of summary.categoriesRun) {
      const { pass, fail } = summary.byCat[cat];
      const total = pass + fail;
      const mark = fail === 0 ? "ok " : "BAD";
      lines.push(`  ${mark}  ${pad(cat, 11)} ${pass}/${total}`);
    }
    if (summary.failing.length) {
      lines.push("", "  failing checks:");
      for (const c of summary.failing) {
        lines.push(`    ${pad(c.id, 16)} #${c.mode} ${c.slug} (${c.script})`);
        lines.push(`      ${c.label}  expected ${stringify(c.expected)}  got ${stringify(c.actual)}`);
      }
    }
    lines.push("", `  score ${summary.score}  (${summary.pass}/${summary.total} checks, ${summary.categoriesRun.length} categories)`);
  }
  lines.push(verdict.line);
  return lines.join("\n");
}

function stringify(v) {
  return typeof v === "string" ? v : String(v);
}

function reportMarkdown(subjectName, summary, verdict) {
  const lines = [];
  lines.push(`### CJK / IME reliability check`, "");
  lines.push(`Subject: \`${subjectName}\` — **${verdict.ok ? "PASS" : "FAIL"}** (${verdict.reason})`, "");
  lines.push(`Score **${summary.score}** · ${summary.pass}/${summary.total} checks pass`, "");
  lines.push(`| Category | Pass | Total |`, `|---|---|---|`);
  for (const cat of summary.categoriesRun) {
    const { pass, fail } = summary.byCat[cat];
    lines.push(`| ${cat} | ${pass} | ${pass + fail} |`);
  }
  if (summary.failing.length) {
    lines.push("", `<details><summary>${summary.failing.length} failing check(s)</summary>`, "");
    for (const c of summary.failing) {
      lines.push(`- \`${c.id}\` #${c.mode} ${c.slug} (${c.script}) — expected \`${stringify(c.expected)}\`, got \`${stringify(c.actual)}\``);
    }
    lines.push("", `</details>`);
  }
  return lines.join("\n") + "\n";
}

function verdictOf(summary, gateResult) {
  if (gateResult.mode === "baseline") {
    if (gateResult.ok) {
      const fixedNote = gateResult.fixed.length ? `, ${gateResult.fixed.length} fixed` : "";
      return { ok: true, reason: `no regressions${fixedNote}`, line: `PASS — no new failures against baseline${fixedNote}` };
    }
    return { ok: false, reason: `${gateResult.regressions.length} regression(s)`, line: `FAIL — ${gateResult.regressions.length} regression(s): ${gateResult.regressions.join(", ")}` };
  }
  if (gateResult.mode === "min-score") {
    const ok = gateResult.ok;
    return { ok, reason: `score ${summary.score} vs min ${gateResult.minScore}`, line: ok ? `PASS — score ${summary.score} ≥ ${gateResult.minScore}` : `FAIL — score ${summary.score} < ${gateResult.minScore}` };
  }
  const ok = gateResult.ok;
  return { ok, reason: ok ? "no failing checks" : `${summary.fail} failing check(s)`, line: ok ? "PASS — no failing checks" : `FAIL — ${summary.fail} failing check(s)` };
}

function emitAnnotations(summary, gateResult) {
  if (!process.env.GITHUB_ACTIONS) return;
  const flagged = gateResult.mode === "baseline"
    ? summary.failing.filter((c) => gateResult.regressions.includes(c.id))
    : summary.failing;
  for (const c of flagged) {
    const msg = `${c.label} expected ${stringify(c.expected)}, got ${stringify(c.actual)}`;
    process.stdout.write(`::error title=CJK regression #${c.mode} ${c.slug}::${msg}\n`);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (opts.help) {
    process.stdout.write(USAGE + "\n");
    return 0;
  }
  if (opts.categories) {
    const bad = opts.categories.filter((c) => !CATEGORIES.includes(c));
    if (bad.length) {
      process.stderr.write(`cjk-fixtures-check: unknown categor(y/ies): ${bad.join(", ")}\n`);
      return 2;
    }
  }

  const subject = await loadSubject(opts.subject);
  const subjectName = subject.name || (opts.subject ? opts.subject : "reference");
  const checks = buildChecks(subject, { categories: opts.categories });
  if (checks.length === 0) {
    process.stderr.write("cjk-fixtures-check: subject implements no handlers; nothing to check\n");
    return 2;
  }
  const summary = summarize(checks);

  if (opts.updateBaseline) {
    if (!opts.baseline) {
      process.stderr.write("cjk-fixtures-check: --update-baseline needs --baseline <path>\n");
      return 2;
    }
    const body = {
      schema: "cjk-fixtures-check/baseline@1",
      generatedAt: new Date().toISOString(),
      subject: subjectName,
      score: summary.score,
      knownFailures: summary.failing.map((c) => c.id),
    };
    writeFileSync(opts.baseline, JSON.stringify(body, null, 2) + "\n");
    process.stdout.write(`wrote baseline ${opts.baseline} (${body.knownFailures.length} known failure(s), score ${summary.score})\n`);
    return 0;
  }

  let baseline = null;
  if (opts.baseline) {
    baseline = JSON.parse(readFileSync(opts.baseline, "utf8"));
  }
  const gateResult = gate(summary, checks, { baseline, minScore: Number.isFinite(opts.minScore) ? opts.minScore : null });
  const verdict = verdictOf(summary, gateResult);

  process.stdout.write(reportText(subjectName, summary, verdict, opts.quiet) + "\n");

  const md = reportMarkdown(subjectName, summary, verdict);
  if (opts.md) writeFileSync(opts.md, md);
  if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, md);
  if (opts.json) {
    writeFileSync(opts.json, JSON.stringify({ subject: subjectName, summary: { ...summary, failing: undefined }, verdict, checks }, null, 2) + "\n");
  }
  emitAnnotations(summary, gateResult);

  return verdict.ok ? 0 : 1;
}

main().then((code) => process.exit(code)).catch((err) => {
  process.stderr.write(`cjk-fixtures-check: ${err && err.stack ? err.stack : err}\n`);
  process.exit(2);
});
