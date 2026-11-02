/**
 * Writes src/config/iconifyIcons.json: the data of every Iconify icon the
 * code names, so the app never fetches icons at runtime. Logic and tests:
 * src/config/iconifyIcons.js.
 *
 *   node scripts/iconify-bundle.js
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { findIconNames } from "../src/config/iconifyIcons.js";

const API = "https://api.iconify.design";
const OUT = "src/config/iconifyIcons.json";

const sourceFiles = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(jsx?|tsx?)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [full] : [];
  });

const getJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: ${response.status}`);
  return response.json();
};

const knownPrefixes = Object.keys(await getJson(`${API}/collections`)).sort();
const names = [
  ...new Set(sourceFiles("src").flatMap((file) => findIconNames(readFileSync(file, "utf8"), knownPrefixes))),
].sort();

const byPrefix = Map.groupBy(names, (name) => name.split(":")[0]);
const collections = [];
for (const [prefix, icons] of byPrefix) {
  const query = icons.map((name) => name.split(":")[1]).join(",");
  const collection = await getJson(`${API}/${prefix}.json?icons=${query}`);
  if (collection.not_found?.length) {
    console.log(`not found in ${prefix}: ${collection.not_found.join(", ")}`);
    delete collection.not_found;
  }
  collections.push(collection);
}

writeFileSync(OUT, `${JSON.stringify({ knownPrefixes, collections })}\n`);
console.log(`${names.length} icons from ${collections.length} sets written to ${OUT}`);
