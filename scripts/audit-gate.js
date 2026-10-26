/**
 * CI dependency gate: high and critical advisories in production dependencies
 * fail the build unless .github/audit-exceptions.json accepts them with a
 * reason and an expiry date. Logic and tests: src/config/auditGate.js.
 *
 *   node scripts/audit-gate.js
 */
import { execSync } from "node:child_process";
import process from "node:process";
import { readFileSync } from "node:fs";
import { evaluateAudit } from "../src/config/auditGate.js";

const runAudit = () => {
  try {
    return execSync("npm audit --omit=dev --json", { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    // npm audit exits 1 whenever it finds anything; the report is still on stdout.
    if (error.stdout) return error.stdout;
    throw error;
  }
};

const report = JSON.parse(runAudit());
const exceptions = JSON.parse(readFileSync(".github/audit-exceptions.json", "utf8")).exceptions;
const today = new Date().toISOString().slice(0, 10);
const { blocking, excused, unused } = evaluateAudit({ report, exceptions, today });

excused.forEach((a) => console.log(`accepted  ${a.severity}  ${a.package}  ${a.id}  until ${a.expires}: ${a.reason}`));
unused.forEach((e) => console.log(`warning   exception ${e.advisory} (${e.package}) no longer matches anything: remove it`));
blocking.forEach((a) =>
  console.error(
    `BLOCKING  ${a.severity}  ${a.package}  ${a.id}  ${a.title}` +
      (a.expiredException ? `  (exception expired ${a.expiredException})` : "")
  )
);

if (blocking.length > 0) {
  console.error(`\n${blocking.length} high/critical advisories. Fix them, or accept one in .github/audit-exceptions.json with a reason and an expiry date.`);
  process.exit(1);
}
console.log(`Dependency gate passed (${excused.length} accepted with an expiry date).`);
