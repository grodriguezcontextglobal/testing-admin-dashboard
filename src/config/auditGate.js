/**
 * The dependency gate CI runs on `npm audit --omit=dev --json`
 * (fedRAMP/FRONTEND_action_plan_2026-10-26.md, A1 · RA-5, SI-2).
 *
 * High and critical advisories fail the build unless
 * `.github/audit-exceptions.json` accepts them in writing: the advisory, the
 * package, why the risk is accepted, and the date the acceptance runs out.
 * An expired exception blocks again, so accepted risk cannot go stale quietly.
 * Moderate and low are reported by Dependabot, not gated here.
 */

const GATED = new Set(["high", "critical"]);
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const advisoryId = (via) => String(via.url ?? "").split("/").pop() || via.title;

const isUsable = (exception) =>
  Boolean(exception?.advisory && exception?.package && String(exception.reason ?? "").trim()) &&
  ISO_DATE.test(String(exception.expires ?? ""));

/** One entry per (advisory, package), from npm audit's v2 JSON report. */
const gatedAdvisories = (report) => {
  const seen = new Map();
  Object.values(report?.vulnerabilities ?? {}).forEach((vulnerability) => {
    (vulnerability?.via ?? []).forEach((via) => {
      // A string `via` points at another package's entry, counted there.
      if (typeof via !== "object" || !GATED.has(via.severity)) return;
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

  gatedAdvisories(report).forEach((advisory) => {
    const exception = usable.find((e) => e.advisory === advisory.id && e.package === advisory.package);
    if (exception) matched.add(exception);
    if (exception && exception.expires >= today) excused.push({ ...advisory, reason: exception.reason, expires: exception.expires });
    else blocking.push(exception ? { ...advisory, expiredException: exception.expires } : advisory);
  });

  const unused = usable.filter((e) => !matched.has(e));
  return { blocking, excused, unused };
};
