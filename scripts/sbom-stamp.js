/**
 * Release step: stamps the CycloneDX SBOM from `npm sbom` with the release tag.
 * Logic and tests: src/config/sbom.js.
 *
 *   node scripts/sbom-stamp.js <npm-sbom.json> <tag> <out.json>
 */
import { readFileSync, writeFileSync } from "node:fs";
import process from "node:process";
import { stampSbom } from "../src/config/sbom.js";

const [input, tag, output] = process.argv.slice(2);
const sbom = stampSbom(JSON.parse(readFileSync(input, "utf8")), tag);
writeFileSync(output, `${JSON.stringify(sbom, null, 2)}\n`);
console.log(`${output}: ${sbom.components.length} components, version ${tag}`);
