import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

/**
 * A guard against a silent bug this repo has hit twice.
 *
 * React Query invalidates by PREFIX: a query keyed
 * ["staffMemberInfo", "ana@x.com"] is invalidated by ["staffMemberInfo"].
 * `exact: true` turns that off and demands an identical key, element for
 * element. So this:
 *
 *   useQuery({ queryKey: ["staffMemberInfo", profile.email] })
 *   invalidateQueries({ queryKey: ["staffMemberInfo"], exact: true })
 *
 * matches nothing at all. And nothing complains: invalidateQueries does not
 * error when it finds no query, so the call reads like a refresh and refreshes
 * nothing. That is why the staff table went on showing a device as out after
 * it had been returned.
 *
 * `exact: true` is not a bug by itself — it is right when the key really is one
 * element. What is always wrong is asking for an exact match on a key that is
 * a prefix of the real one. This test finds those.
 *
 * Reading the files with readFileSync rather than importing them: the point is
 * the text of every source file, and transforming them all would put a minute
 * on this run.
 */
describe("invalidateQueries + exact: true", () => {
  const SRC_DIR = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
  );

  const sourceFiles = (dir) =>
    fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) return sourceFiles(full);
      return /\.jsx?$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name)
        ? [full]
        : [];
    });

  const files = sourceFiles(SRC_DIR).map((full) => ({
    rel: path.relative(SRC_DIR, full).replace(/\\/g, "/"),
    text: fs.readFileSync(full, "utf8"),
  }));

  /* invalidateQueries({ queryKey: ["X"], ... exact: true }) — the bounded
     [^)]{0,200} keeps this linear; an unbounded gap backtracks badly on files
     with long call sites. */
  const EXACT_INVALIDATION =
    /invalidateQueries\(\{\s*queryKey:\s*\[\s*"([^"]+)"\s*\][^)]{0,200}?exact:\s*true/g;

  /* queryKey: ["X", <something>] — a key with more than one element. */
  const MULTI_ELEMENT_KEY = /queryKey:\s*\[\s*"([^"]+)"\s*,/g;

  const multiElementKeys = new Set();
  for (const file of files) {
    for (const match of file.text.matchAll(MULTI_ELEMENT_KEY)) {
      multiElementKeys.add(match[1]);
    }
  }

  it("never asks for an exact match on a key that is only a prefix", () => {
    const dead = [];
    for (const file of files) {
      for (const match of file.text.matchAll(EXACT_INVALIDATION)) {
        if (multiElementKeys.has(match[1])) {
          dead.push(`${file.rel} → ["${match[1]}"]`);
        }
      }
    }

    expect(
      dead,
      `These invalidations can never match: the query is keyed with more than ` +
        `one element, and exact: true demands an identical key. Drop the flag ` +
        `so it matches by prefix.\n\n${dead.join("\n")}\n`
    ).toEqual([]);
  });

  it("finds the multi-element keys it is checking against", () => {
    // If the shape of key declarations ever changes, the test above would pass
    // by finding nothing rather than by everything being correct.
    expect(multiElementKeys.size).toBeGreaterThan(10);
  });
});
