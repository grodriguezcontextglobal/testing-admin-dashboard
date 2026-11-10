/**
 * Removing staff access when an event ends (GovRAMP #5, AC-2).
 *
 * The server owns the decision: POST /api/company/event-staff/deactivate
 * (backend reply 2026-11-04 §1.3) removes access from the event's staff
 * ranked inventory manager or assistant, keeps it for anyone on another
 * active event of the company, and, with sqlCompanyId, sets
 * company_staff.is_active=0 too. It answers 409 while the event is still
 * active, so it is called after the event is marked inactive.
 *
 * Before it, the client computed the list (staffToDeactivateAtEventEnd) and
 * sent every employee of the company to update-company. That path remains
 * only as a fallback for a server without the route (404), decision D7.
 */

export const DEACTIVATE_PATH = "/company/event-staff/deactivate";

export const buildDeactivationRequest = ({ event, user }) => {
  if (!event?.id) throw new Error("The event has no id.");
  const sqlCompanyId = user?.sqlInfo?.company_id;
  return sqlCompanyId === undefined || sqlCompanyId === null || sqlCompanyId === ""
    ? { eventId: event.id }
    : { eventId: event.id, sqlCompanyId };
};

const emails = (value) => (Array.isArray(value) ? value.filter((email) => typeof email === "string") : []);

export const readDeactivationResult = (data) => ({
  deactivated: emails(data?.deactivated),
  keptInOtherEvents: emails(data?.keptInOtherEvents),
  sqlSkipped: typeof data?.sql?.skipped === "string" ? data.sql.skipped : null,
});

/**
 * Only a missing route falls back. A server without it answers Express's own
 * HTML 404 ("Cannot POST …"); the route's own 404s ("Event not found",
 * "Company not found") are JSON and, like a 403 or 409, are the answer.
 */
export const shouldUseLegacyDeactivation = (error) => {
  const { status, data } = error?.response ?? {};
  if (status !== 404) return false;
  return !(data && typeof data === "object");
};

/** The company's employees with the server's list marked inactive. */
export const markDeactivated = (employees, deactivatedEmails) => {
  const list = Array.isArray(employees) ? employees : [];
  const lost = new Set(emails(deactivatedEmails).map((email) => email.trim().toLowerCase()));
  if (lost.size === 0) return list;
  return list.map((employee) =>
    lost.has(String(employee?.user ?? "").trim().toLowerCase()) ? { ...employee, active: false } : employee
  );
};

const ENDED = "Event ended. Inventory is now in transit and will be available after warehouse check-in.";

const staffCount = (count) => `${count} staff member${count === 1 ? "" : "s"}`;

/** The success notice, from what the server answered. */
export const deactivationNotice = ({ deactivated, keptInOtherEvents, sqlSkipped }) => {
  const parts = [ENDED];
  if (deactivated.length) {
    parts.push(`${staffCount(deactivated.length)} no longer ${deactivated.length === 1 ? "has" : "have"} access.`);
  }
  if (keptInOtherEvents.length) {
    parts.push(`${keptInOtherEvents.length} kept access because they work another active event.`);
  }
  // no_sql_company only means the company has no SQL record to update.
  if (sqlSkipped && sqlSkipped !== "no_sql_company") {
    parts.push("Their access in the company's staff list could not be updated; ask an administrator to check it.");
  }
  return parts.join(" ");
};
