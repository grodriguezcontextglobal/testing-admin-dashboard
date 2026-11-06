import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { PRODUCTION_STRIPPED_CONSOLE } from "./productionConsole";

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ROOT = path.resolve(SRC, "..");

// FedRAMP plan E3 (SI-11, AU-9): some console.error / console.warn calls print
// a whole axios error, request headers included (x-token). The production
// build drops every console method, not only the debug ones.
describe("PRODUCTION_STRIPPED_CONSOLE", () => {
  it.each(["log", "info", "debug", "trace", "warn", "error"])(
    "strips console.%s from the production build",
    (method) => {
      expect(PRODUCTION_STRIPPED_CONSOLE).toContain(`console.${method}`);
    },
  );

  // esbuild drops a pure call only when its result is unused. An arrow with no
  // braces returns it — `.catch((e) => console.error("…", e))` — so that call
  // stays in the bundle with the whole error. Braces make it a statement.
  it("has no arrow function in src that returns a console call", () => {
    const pattern = /=>\s*console\.(log|info|debug|trace|warn|error)\(/g;
    const offenders = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (/\.(js|jsx)$/.test(entry.name) && !/\.test\./.test(entry.name)) {
          const text = fs.readFileSync(full, "utf8");
          for (const match of text.matchAll(pattern)) {
            const line = text.slice(0, match.index).split("\n").length;
            offenders.push(`${path.relative(SRC, full)}:${line}`);
          }
        }
      }
    };
    walk(SRC);
    expect(offenders).toEqual([]);
  });

  it("is what vite.config.js passes to esbuild for builds", () => {
    const config = fs.readFileSync(path.join(ROOT, "vite.config.js"), "utf8");
    expect(config).toMatch(/import \{ PRODUCTION_STRIPPED_CONSOLE \} from "\.\/src\/config\/productionConsole\.js"/);
    expect(config).toMatch(/pure:\s*PRODUCTION_STRIPPED_CONSOLE/);
  });
});
