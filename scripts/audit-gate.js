/**
 * CI dependency gate: high and critical advisories in production dependencies
 * fail the build unless .github/audit-exceptions.json accepts them with a
 * reason and an expiry date. Low and moderate never fail; they are listed as
 * accepted or unreviewed. Logic and tests: src/config/auditGate.js.
 *
 *   node scripts/audit-gate.js [--summary <file.md>]
 *
 * --summary writes the audit section of the release notes (GovRAMP D3).
 */
import { execSync } from "node:child_process";
import process from "node:process";
import { readFileSync, writeFileSync } from "node:fs";
import { auditSummaryMarkdown, evaluateAudit } from "../src/config/auditGate.js";

const runAudit = () => {
  try {
    return execSync("npm audit --omit=dev --json", { encoding: "utf8", maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    // npm audit exits 1 whenever it finds anything; the report is still on stdout.
    if (error.stdout) return error.stdout;
    throw error;
  }
};

const summaryIndex = process.argv.indexOf("--summary");
const summaryFile = summaryIndex > -1 ? process.argv[summaryIndex + 1] : null;
if (summaryIndex > -1 && !summaryFile) {
  console.error("--summary needs a file name");
  process.exit(2);
}

const report = JSON.parse(runAudit());
const exceptions = JSON.parse(readFileSync(".github/audit-exceptions.json", "utf8")).exceptions;
const today = new Date().toISOString().slice(0, 10);
const result = evaluateAudit({ report, exceptions, today });
const { blocking, excused, unused, accepted, unreviewed } = result;

[...excused, ...accepted].forEach((a) =>
  console.log(`accepted  ${a.severity}  ${a.package}  ${a.id}  until ${a.expires}: ${a.reason}`)
);
unreviewed.forEach((a) =>
  console.log(
    `unreviewed  ${a.severity}  ${a.package}  ${a.id}  ${a.title}` +
      (a.expiredException ? `  (acceptance expired ${a.expiredException})` : "")
  )
);
unused.forEach((e) => console.log(`warning   exception ${e.advisory} (${e.package}) no longer matches anything: remove it`));
blocking.forEach((a) =>
  console.error(
    `BLOCKING  ${a.severity}  ${a.package}  ${a.id}  ${a.title}` +
      (a.expiredException ? `  (exception expired ${a.expiredException})` : "")
  )
);

if (summaryFile) {
  writeFileSync(summaryFile, `${auditSummaryMarkdown(result, { counts: report.metadata?.vulnerabilities, today })}\n`);
}

if (blocking.length > 0) {
  console.error(`\n${blocking.length} high/critical advisories. Fix them, or accept one in .github/audit-exceptions.json with a reason and an expiry date.`);
  process.exit(1);
}
console.log(`Dependency gate passed (${excused.length + accepted.length} accepted with a review date).`);
