/**
 * Release step: keeps the production packages of the full CycloneDX SBOM from
 * `npm sbom` (by package-lock.json's dev flags, GovRAMP #14) and stamps it
 * with the release tag. Logic and tests: src/config/sbom.js.
 *
 *   npm sbom --package-lock-only --sbom-format cyclonedx --sbom-type application > full.json
 *   node scripts/sbom-stamp.js full.json <tag> <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { productionOnly, stampSbom } from "../src/config/sbom.js";

const [input, tag, output] = process.argv.slice(2);
const lock = JSON.parse(readFileSync("package-lock.json", "utf8"));
const sbom = stampSbom(productionOnly(JSON.parse(readFileSync(input, "utf8")), lock), tag);
writeFileSync(output, `${JSON.stringify(sbom, null, 2)}\n`);
console.log(`${output}: ${sbom.components.length} components, version ${tag}`);
