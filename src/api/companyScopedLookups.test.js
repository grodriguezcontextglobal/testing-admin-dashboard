import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { beforeAll, describe, expect, it } from "vitest";

// GovRAMP AC-4. Three SQL read routes have no company condition of their own:
// the filter is whatever columns the caller sends, so a body without a company
// column returns matching rows across every client company
// (BACKEND_si11_three_routes_fixed_2026-11-17.md §2).
//
// The server will make the column required once this is deployed. Until then
// — and afterwards, so a new call site cannot quietly reintroduce it — the
// scoping is enforced here, by reading the source rather than by remembering.

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

/** Route → the column names (or the helpers that add them) that scope it. */
const SCOPED_ROUTES = {
  "/db_event/events_information": [
    "company_assigned_event_id",
    "buildEventSqlLookup",
    "eventSqlLookupFromEvent",
    // eventDraft.js's wrapper around eventSqlLookupFromEvent.
    "sqlLookupFor",
  ],
  "/db_event/consulting-event": ["company_assigned_event_id"],
  "/db_item/consulting-item": ["company_id"],
};

const SKIPPED_DIRS = new Set(["docs"]);
// The helper and its own documentation name the routes in prose.
const ALLOWED = new Set([path.join("pages", "events", "utils", "eventSqlLookup.js")]);

const walk = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIPPED_DIRS.has(entry.name) ? [] : walk(full);
    return /\.(js|jsx)$/.test(entry.name) && !/\.test\.jsx?$/.test(entry.name) ? [full] : [];
  });

const isComment = (line) => /^\s*(\/\/|\*|\/\*)/.test(line);

/**
 * The whole call expression around `at`, by balancing parentheses from the
 * `(` that opens it. A fixed window of lines is not good enough here: it
 * reports a body built a few lines above the call, and it misses an unscoped
 * body that happens to sit near an unrelated `company_id`.
 */
const callExpressionAround = (text, at) => {
  const open = text.indexOf("(", text.lastIndexOf("devitrakApi", at));
  if (open === -1 || open > at) return text.slice(at, at + 400);
  let depth = 0;
  for (let i = open; i < text.length; i += 1) {
    if (text[i] === "(") depth += 1;
    else if (text[i] === ")") {
      depth -= 1;
      if (depth === 0) return text.slice(open, i + 1);
    }
  }
  return text.slice(open);
};

/**
 * A call that passes a body held in a variable (`devitrakApi.post(url, body)`)
 * is scoped if that variable's own literal is. Resolved within the file, which
 * is where these bodies are always built.
 */
const withResolvedBodyVariable = (expression, text) => {
  const identifiers = expression.match(/,\s*([A-Za-z_$][\w$]*)\s*[,)]/g) ?? [];
  const bodies = identifiers.map((raw) => {
    const name = raw.replace(/[,)\s]/g, "");
    // The initializer may be an object literal or a call to one of the
    // helpers, so take the declaration and enough of what follows to show
    // which.
    const declared = new RegExp(`(?:const|let|var)\\s+${name}\\s*=[\\s\\S]{0,300}`, "m");
    return text.match(declared)?.[0] ?? "";
  });
  return [expression, ...bodies].join("\n");
};

/**
 * Every source file, read once. Reading the tree per assertion took four
 * passes over ~500 files and ran into Vitest's 5s timeout on a loaded
 * machine; the offsets are precomputed here too, so locating a match is not
 * a join of every preceding line.
 */
const readSourceTree = () =>
  walk(SRC)
    .filter((file) => !ALLOWED.has(path.relative(SRC, file)))
    .map((file) => {
      const text = fs.readFileSync(file, "utf8");
      const lines = text.split("\n");
      let offset = 0;
      const offsets = lines.map((line) => {
        const start = offset;
        offset += line.length + 1;
        return start;
      });
      return { name: path.relative(SRC, file), text, lines, offsets };
    });

describe("SQL read routes are always scoped to a company (AC-4)", () => {
  let sources = [];

  beforeAll(() => {
    sources = readSourceTree();
  }, 60_000);

  it("actually reads the source tree", () => {
    expect(sources.length).toBeGreaterThan(200);
  });

  for (const [route, scopeMarkers] of Object.entries(SCOPED_ROUTES)) {
    it(`every call to ${route} names the company`, () => {
      const offenders = [];
      for (const { name, text, lines, offsets } of sources) {
        lines.forEach((line, i) => {
          if (isComment(line) || !line.includes(route)) return;
          const at = offsets[i] + line.indexOf(route);
          const body = withResolvedBodyVariable(callExpressionAround(text, at), text);
          if (!scopeMarkers.some((marker) => body.includes(marker))) {
            offenders.push(`${name}:${i + 1}`);
          }
        });
      }
      expect(offenders).toEqual([]);
    });
  }

  it("no screen takes the last row of an event lookup without checking the company", () => {
    // `events.at(-1)` on an unscoped result picked whichever company's row came
    // last. pickOwnEventRow filters first; this keeps the old shape from
    // coming back.
    const offenders = [];
    for (const { name, lines } of sources) {
      lines.forEach((line, i) => {
        if (isComment(line)) return;
        if (/\.events\.at\(-1\)|events\?\.at\(-1\)/.test(line)) {
          offenders.push(`${name}:${i + 1}`);
        }
      });
    }
    expect(offenders).toEqual([]);
  });
});
