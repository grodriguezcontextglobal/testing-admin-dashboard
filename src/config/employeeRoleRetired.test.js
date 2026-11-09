import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

// GovRAMP code action #7 (AC-6, AC-2). Company.employees[] entries the
// dashboard writes carry roleType only. The numeric role is still read from
// old entries (resolveRoleType), never written. This catches a `role:` key
// in a new entry (`employees: [ ... ]`) or in an edited one
// (`employees.toSpliced(i, 1, { ... })`), the two shapes the writes take.

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ENTRY_START = /employees\??\.toSpliced\(|employees:\s*\[/;
const COMMENT = /^\s*(\/\/|\*|\/\*)/;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "docs" ? [] : walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

// From the line that opens the entry to the line that closes it.
const roleKeysInEntries = (file) => {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const found = [];
  lines.forEach((line, i) => {
    if (COMMENT.test(line) || !ENTRY_START.test(line)) return;
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j += 1) {
      if (/^\s*[\]}]\)?[,;]?\s*$/.test(lines[j]) && /^\s{0,10}[\]}]/.test(lines[j])) break;
      if (/^\s*role\s*:/.test(lines[j])) found.push(`${path.relative(SRC, file)}:${j + 1}`);
    }
  });
  return found;
};

describe("Company.employees[] entries carry roleType only (GovRAMP #7)", () => {
  let files = [];

  beforeAll(() => {
    files = walk(SRC);
  }, 60_000);

  it("actually finds the writes", () => {
    const writers = files.filter((file) =>
      fs.readFileSync(file, "utf8").split("\n").some((l) => !COMMENT.test(l) && ENTRY_START.test(l))
    );
    expect(writers.length).toBeGreaterThanOrEqual(4);
  });

  it("no entry the dashboard writes sets the numeric role", () => {
    expect(files.flatMap(roleKeysInEntries)).toEqual([]);
  });
});
