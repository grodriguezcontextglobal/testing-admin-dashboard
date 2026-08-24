import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * Every page in AuthRoutes is `lazy(() => import("…"))`, so a page that is
 * renamed, moved or deleted breaks nothing until somebody navigates to it —
 * the bundler resolves the path, but no test imports this file, and the failure
 * is a blank screen in production.
 *
 * This is exactly how `/member/:id/assignment` broke: the route lazily imported
 * `MainPageAssignmentComponent`, a two-line pass-through, and deleting it left
 * the route pointing at a file that no longer existed. The full unit suite
 * stayed green.
 */
const RESOLVABLE = ["", ".jsx", ".js", ".tsx", ".ts", "/index.jsx", "/index.js"];

describe("AuthRoutes lazy imports", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const source = fs.readFileSync(path.join(here, "AuthRoutes.jsx"), "utf-8");
  const specifiers = [...source.matchAll(/import\(\s*"([^"]+)"\s*\)/g)].map(
    (match) => match[1]
  );

  it("finds the lazy imports at all, so a rewrite cannot silently empty this test", () => {
    expect(specifiers.length).toBeGreaterThan(50);
  });

  it("resolves every lazily loaded page to a file on disk", () => {
    const missing = specifiers.filter(
      (specifier) =>
        !RESOLVABLE.some((extension) =>
          fs.existsSync(path.resolve(here, `${specifier}${extension}`))
        )
    );
    expect(missing).toEqual([]);
  });
});
