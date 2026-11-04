import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

// FedRAMP B5 (AC-6). These three routes take the caller's role from
// company_staff through the signed JWT and ignore `role` in the body
// (BACKEND_fedramp_backend_blockers_REPLY_2026-11-04.md §1.2 Q1). Sending it
// only suggests the client decides the scope, so it is not sent at all.
//   POST /db_item/warehouse-items
//   POST /db_company/company-inventory-structure
//   POST /db_location/companies/:id/locations

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROUTE = /warehouse-items|company-inventory-structure|companies\/\$\{[^}]*\}\/locations/;
const COMMENT = /^\s*(\/\/|\*|\/\*)/;

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === "docs" ? [] : walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

// The body of a call starts on the route line or right after it and ends at
// the first line that closes a brace. A `role:` key in between is the offender.
const roleKeysInBodies = (file) => {
  const lines = fs.readFileSync(file, "utf8").split("\n");
  const found = [];
  lines.forEach((line, i) => {
    if (COMMENT.test(line) || !ROUTE.test(line)) return;
    for (let j = i + 1; j < Math.min(i + 20, lines.length); j += 1) {
      if (/^\s*\}/.test(lines[j])) break;
      if (/^\s*role\s*:/.test(lines[j])) found.push(`${path.relative(SRC, file)}:${j + 1}`);
    }
  });
  return found;
};

describe("scope routes get no role in the body (B5)", () => {
  let files = [];

  beforeAll(() => {
    files = walk(SRC);
  }, 60_000);

  it("actually finds the callers", () => {
    const callers = files.filter((file) =>
      fs.readFileSync(file, "utf8").split("\n").some((l) => !COMMENT.test(l) && ROUTE.test(l))
    );
    expect(callers.length).toBeGreaterThan(10);
  });

  it("no call to the three routes sends `role`", () => {
    expect(files.flatMap(roleKeysInBodies)).toEqual([]);
  });
});
