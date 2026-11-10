/**
 * The dependency gate CI runs on `npm audit --omit=dev --json`
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, A1 · RA-5, SI-2).
 *
 * High and critical advisories fail the build unless
 * `.github/audit-exceptions.json` accepts them in writing: the advisory, the
 * package, why the risk is accepted, and the date the acceptance runs out.
 * An expired exception blocks again, so accepted risk cannot go stale quietly.
 *
 * Moderate and low never block. A moderate or low advisory with no fix can be
 * accepted in the same file, with a reason and a review date (GovRAMP D3);
 * those not accepted, or past their date, are listed as unreviewed. Every
 * release writes the result into its notes (auditSummaryMarkdown).
 */

const GATED = new Set(["high", "critical"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const advisoryId = (via) => String(via.url ?? "").split("/").pop() || via.title;

const isUsable = (exception) =>
  Boolean(exception?.advisory && exception?.package && String(exception.reason ?? "").trim()) &&
  ISO_DATE.test(String(exception.expires ?? ""));

/** One entry per (advisory, package), from npm audit's v2 JSON report. */
const advisories = (report) => {
  const seen = new Map();
  Object.values(report?.vulnerabilities ?? {}).forEach((vulnerability) => {
    (vulnerability?.via ?? []).forEach((via) => {
      // A string `via` points at another package's entry, counted there.
      if (typeof via !== "object") return;
      const entry = { id: advisoryId(via), package: via.name, severity: via.severity, title: via.title, range: via.range };
      seen.set(`${entry.id}|${entry.package}`, entry);
    });
  });
  return [...seen.values()];
};

export const evaluateAudit = ({ report, exceptions, today }) => {
  const usable = (Array.isArray(exceptions) ? exceptions : []).filter(isUsable);
  const matched = new Set();
  const blocking = [];
  const excused = [];
  const accepted = [];
  const unreviewed = [];

  advisories(report).forEach((advisory) => {
    const exception = usable.find((e) => e.advisory === advisory.id && e.package === advisory.package);
    if (exception) matched.add(exception);
    const current = exception && exception.expires >= today;
    const withException = current
      ? { ...advisory, reason: exception.reason, expires: exception.expires }
      : exception
        ? { ...advisory, expiredException: exception.expires }
        : advisory;
    if (GATED.has(advisory.severity)) (current ? excused : blocking).push(withException);
    else (current ? accepted : unreviewed).push(withException);
  });

  const unused = usable.filter((e) => !matched.has(e));
  return { blocking, excused, unused, accepted, unreviewed };
};

const SEVERITIES = ["critical", "high", "moderate", "low"];

const listOr = (items, render) => (items.length ? items.map(render).join("\n") : "None.");

/**
 * The audit section of a release's notes: what `npm audit --omit=dev` found,
 * which risks are accepted and until when, and what nobody has reviewed.
 */
export const auditSummaryMarkdown = (result, { counts = {}, today }) =>
  [
    `## Dependency audit (${today})`,
    "",
    `\`npm audit --omit=dev\`, vulnerable packages: ${SEVERITIES.map((severity) => `${counts[severity] ?? 0} ${severity}`).join(", ")}.`,
    "",
    "**Accepted risks**",
    "",
    listOr(
      [...result.excused, ...result.accepted],
      (a) => `- \`${a.package}\` ${a.id} (${a.severity}), review by ${a.expires}: ${a.reason}`
    ),
    "",
    "**Unreviewed**",
    "",
    listOr(
      result.unreviewed,
      (a) => `- \`${a.package}\` ${a.id} (${a.severity})${a.expiredException ? `, acceptance expired ${a.expiredException}` : ""}: ${a.title}`
    ),
  ].join("\n");
