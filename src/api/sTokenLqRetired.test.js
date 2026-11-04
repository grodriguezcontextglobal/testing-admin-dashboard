import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";
import { SESSION_STORAGE_KEYS } from "./sessionHeaders";

// FedRAMP B4 (AC-3). The server takes the staff SQL id only from the signed
// JWT and no longer reads the `s-token-lq` header anywhere
// (BACKEND_fedramp_backend_blockers_REPLY_2026-11-04.md §2.1). A header the
// client can set to any id is not something to keep sending.

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The key stays in SESSION_STORAGE_KEYS so the value left by an older build
// is still wiped at logout. The generated API docs describe the server, not us.
const ALLOWED = new Set([path.join("api", "sessionHeaders.js")]);
const SKIPPED_DIRS = new Set(["docs"]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

describe("s-token-lq is retired (B4)", () => {
  let sourceLines = [];

  beforeAll(() => {
    sourceLines = walk(SRC)
      .filter((file) => !ALLOWED.has(path.relative(SRC, file)))
      .flatMap((file) =>
        fs
          .readFileSync(file, "utf8")
          .split("\n")
          .map((line, i) => ({ line, at: `${path.relative(SRC, file)}:${i + 1}` }))
          .filter(({ line }) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      );
  }, 60_000);

  it("actually reads the source tree", () => {
    expect(sourceLines.length).toBeGreaterThan(10_000);
  });

  it("no code sends or stores the s-token-lq header", () => {
    const offenders = sourceLines.filter(({ line }) => line.includes("s-token-lq")).map(({ at }) => at);
    expect(offenders).toEqual([]);
  });

  it("logout still clears a value left by an older build", () => {
    expect(SESSION_STORAGE_KEYS).toContain("s-token-lq");
  });
});
