import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

// FedRAMP SI-11. Errors are shown to people through userFacingError(), never
// as the raw object: `${error}` reads "AxiosError: Request failed with status
// code 500", and JSON.stringify(error) of an axios error printed the request
// config, x-token header included, on screen.

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// The error boundary sends `${error}` to the server's error log, not to a
// person. The generated API docs describe the server.
const ALLOWED = new Set([path.join("components", "utils", "ErrorBoundaryComponent.jsx")]);
const SKIPPED_DIRS = new Set(["docs"]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

const RAW_ERROR_PATTERNS = [
  /\$\{\s*(error|err|e)\s*\}/,
  /\$\{\s*(error|err|e)(\?\.|\.)message\s*\}/,
  /\$\{\s*(error|err|e)(\?\.|\.)message\s*(\|\||\?\?)/,
  /JSON\.stringify\(\s*(error|err|e)\s*\)/,
  /String\(\s*(error|err|e)\s*\)/,
];

describe("raw errors never reach the screen (SI-11)", () => {
  let offending = [];

  beforeAll(() => {
    offending = walk(SRC)
      .filter((file) => !ALLOWED.has(path.relative(SRC, file)))
      .flatMap((file) =>
        fs
          .readFileSync(file, "utf8")
          .split("\n")
          .map((line, i) => ({ line, at: `${path.relative(SRC, file)}:${i + 1}` }))
      )
      .filter(({ line }) => !/^\s*(\/\/|\*|\/\*)/.test(line))
      // Developer-only output and errors re-thrown to a caller are not shown.
      .filter(({ line }) => !/console\.(log|info|warn|error|debug)\(|throw new Error\(/.test(line))
      .filter(({ line }) => RAW_ERROR_PATTERNS.some((re) => re.test(line)))
      .map(({ at, line }) => `${at}  ${line.trim()}`);
  }, 60_000);

  it("uses userFacingError() instead of the error itself", () => {
    expect(
      offending,
      `Show userFacingError(error, "<what failed>") instead:\n${offending.join("\n")}\n`
    ).toEqual([]);
  });
});
