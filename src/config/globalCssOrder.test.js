import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * The order the global stylesheets load in.
 *
 * Vite injects CSS in the order modules are first imported, so whatever is
 * imported before index.css and the Untitled UI skin loses the cascade to
 * them. On 2026-11-03 AppLoader moved out of main.jsx and was imported above
 * the global CSS; it brings ServiceWorkerUpdateNotifier, and with it BlueButton
 * and the shared button styles (`.title`, `.subtitle`, `.cardStyle`…). Those
 * rules started losing to the skin: colors, the navigation bar, icons and the
 * search modal's layout all changed with no style file touched.
 *
 * The global CSS now loads in AppLoader, right after App (whose own CSS has
 * always come first) and before any other component.
 */

const src = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (file) => fs.readFileSync(path.join(src, file), "utf-8");

const GLOBAL_CSS = [
  "./index.css",
  "./styles/untitled-ui/tokens.css",
  "./styles/untitled-ui/skin.css",
];

/** The specifiers of a file's static imports, in order. */
const importsOf = (source) =>
  [...source.matchAll(/^import\s+(?:[^'"]*?\s+from\s+)?["']([^"']+)["'];?/gm)].map(
    (match) => match[1],
  );

describe("global stylesheet order", () => {
  const appLoader = importsOf(read("AppLoader.jsx"));

  it("AppLoader loads the global CSS in order, right after App", () => {
    const app = appLoader.indexOf("./App.jsx");
    expect(app).toBeGreaterThanOrEqual(0);
    expect(appLoader.slice(app + 1, app + 1 + GLOBAL_CSS.length)).toEqual(GLOBAL_CSS);
  });

  it("no other component of AppLoader is imported before the global CSS", () => {
    const firstGlobal = appLoader.indexOf(GLOBAL_CSS[0]);
    const before = appLoader.slice(0, firstGlobal).filter((spec) => spec.startsWith("."));
    expect(before).toEqual(["./App.jsx"]);
  });

  it("main.jsx loads AppLoader before any other component of its own", () => {
    const main = importsOf(read("main.jsx")).filter((spec) => spec.startsWith("."));
    expect(main[0]).toBe("./AppLoader.jsx");
    for (const css of GLOBAL_CSS) expect(main).not.toContain(css);
  });
});
