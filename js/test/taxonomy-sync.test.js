// The npm package ships its own copy of taxonomy.json (the package root is js/,
// so the repo-root file is not otherwise included). This guards the copy
// against drift. It runs in the repo, where the canonical file is one level up;
// when run from an installed package the canonical is absent and the check is
// skipped.
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

const shipped = fileURLToPath(new URL("../taxonomy.json", import.meta.url));
const canonical = fileURLToPath(new URL("../../taxonomy.json", import.meta.url));

describe("taxonomy.json", () => {
  it("the packaged copy matches the repo-root canonical", () => {
    if (!existsSync(canonical)) return; // installed package: nothing to compare
    expect(readFileSync(shipped, "utf8")).toBe(readFileSync(canonical, "utf8"));
  });

  it("the slugs in taxonomy.json match the case slugs", () => {
    const tax = JSON.parse(readFileSync(shipped, "utf8"));
    const taxSlugs = new Set(tax.fixtures.map((f) => f.slug));
    expect(taxSlugs.size).toBe(11);
  });
});
