import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import bundle from "./iconifyIcons.json";
import { findIconNames, registerOfflineIcons } from "./iconifyIcons";

// With the CSP enforced, @iconify/react could not reach api.iconify.design and
// icons vanished (2026-10-29). The icons now ship with the app; these tests
// keep the bundle in step with the code.

const SRC = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const sourceFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(jsx?|tsx?)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });

const bundled = new Set(
  bundle.collections.flatMap(({ prefix, icons, aliases }) =>
    [...Object.keys(icons), ...Object.keys(aliases ?? {})].map((name) => `${prefix}:${name}`)
  )
);

describe("findIconNames", () => {
  it("finds quoted prefix:name strings for the given icon sets only", () => {
    const code = `<Icon icon="tabler:trash" /> {icon: 'mdi:close'} hasPermission("member:update") \`ph:x\``;
    expect(findIconNames(code, ["tabler", "mdi", "ph"])).toEqual(["tabler:trash", "mdi:close", "ph:x"]);
  });
});

describe("registerOfflineIcons", () => {
  it("adds every bundled collection", () => {
    const added = [];
    registerOfflineIcons((collection) => added.push(collection.prefix) || true, {
      collections: [{ prefix: "a", icons: {} }, { prefix: "b", icons: {} }],
    });
    expect(added).toEqual(["a", "b"]);
  });
});

describe("the offline icon bundle", () => {
  it("holds every icon the code names", () => {
    const missing = sourceFiles(SRC)
      .flatMap((file) => findIconNames(fs.readFileSync(file, "utf8"), bundle.knownPrefixes))
      .filter((name) => !bundled.has(name));
    expect([...new Set(missing)]).toEqual([]);
  });
});

// "@iconify/react" resolves to dist/iconify.mjs. Importing a dist file by path
// loads a second copy of the library, with its own empty icon storage: the
// bundle registered in main.jsx never reaches it, and its icons are fetched
// from Iconify's API, which the CSP blocks once enforced. Found by the E2E CSP
// check (GovRAMP #9) on /consumers.
describe("@iconify/react imports", () => {
  it("all go through the package entry, so every icon uses the bundle", () => {
    const byPath = sourceFiles(SRC)
      .filter((file) => /["']@iconify\/react\/dist\//.test(fs.readFileSync(file, "utf8")))
      .map((file) => path.relative(SRC, file).replace(/\\/g, "/"));
    expect(byPath).toEqual([]);
  });
});
