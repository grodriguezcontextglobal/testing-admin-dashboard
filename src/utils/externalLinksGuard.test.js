import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

// A page opened in a new tab must not get a handle on this one
// (window.opener: "reverse tabnabbing"). Every new tab is opened with
// noopener: window.open(url, "_blank", "noopener,noreferrer") in code, and
// rel="noopener noreferrer" (or "noreferrer", which implies it) on links.

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SKIPPED_DIRS = new Set(["docs"]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

describe("new tabs are opened without an opener", () => {
  let files = [];
  beforeAll(() => {
    files = walk(SRC).map((file) => ({
      rel: path.relative(SRC, file),
      lines: fs.readFileSync(file, "utf8").split("\n"),
    }));
  }, 60_000);

  it("window.open(…, \"_blank\") passes noopener", () => {
    const offending = files.flatMap(({ rel, lines }) =>
      lines
        .map((line, i) => ({ line, at: `${rel}:${i + 1}` }))
        .filter(({ line }) => /window\.open\(/.test(line) && /_blank/.test(line))
        .filter(({ line }) => !/noopener/.test(line))
        .map(({ at }) => at)
    );
    expect(offending).toEqual([]);
  });

  it('target="_blank" links carry rel noopener or noreferrer', () => {
    const offending = files.flatMap(({ rel, lines }) =>
      lines.flatMap((line, i) => {
        if (!/target=(\{\s*)?["']_blank["']/.test(line)) return [];
        const element = lines.slice(Math.max(0, i - 4), i + 5).join(" ");
        return /rel=["'{][^>]*no(opener|referrer)/.test(element) ? [] : [`${rel}:${i + 1}`];
      })
    );
    expect(offending).toEqual([]);
  });
});
