import {
  describeLogAction,
  isInfrastructureLog,
  logHighlights,
} from "../../../../Profile/staff_activity/utils/staffActivityLogUtils";
import { newestCustodyFirst } from "./deviceProfileModel";

/**
 * Who did what to this device, from the server's audit log.
 *
 * 2b.7, meeting 2026-09-29 `1:08:32`: who did what and when, on every action,
 * "with a format common to every audit trail in the app" — the reference he
 * showed was the audit history of a QuickBooks invoice.
 *
 * The device's history came only from the SQL custody tables, which say who a
 * device was handed **to** and never who handed it. Since 2026-10-05 the
 * server audits every write, and the report takes `?serial_number=`, so the
 * missing half is available.
 *
 * The sentences come from `staffActivityLogUtils`, the same vocabulary the
 * staff activity page uses. Two audit trails saying the same thing in
 * different words would be two formats, which is what he asked us to avoid.
 */

const actorName = (log) =>
  [log?.staff_member_id?.name, log?.staff_member_id?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim() || "Unknown staff";

/**
 * Activity-log rows as timeline entries, in the shape `CustodyTimeline`
 * renders. Rows the machine wrote about itself are left out, as they are in
 * the staff trail.
 *
 * @param {object[]} logs rows from GET /api/admin/activity-logs
 */
export const buildActivityTimeline = (logs) =>
  (Array.isArray(logs) ? logs : [])
    .filter((log) => !isInfrastructureLog(log))
    .map((log, index) => ({
      id: `activity-${log?.id ?? index}`,
      kind: "activity",
      tone: "neutral",
      date: log?.timestamp ?? null,
      title: describeLogAction(log),
      personLabel: actorName(log),
      personEmail: log?.staff_member_id?.email ?? null,
      detail: logHighlights(log).join(" · ") || null,
    }));

/**
 * The two halves in one list, newest first.
 *
 * Nothing is dropped as a duplicate: a custody entry says who a device went
 * to, an activity entry says who sent it. They can share a moment and still
 * be two different facts.
 */
export const mergeDeviceTimeline = (custody, activity) =>
  [...(custody ?? []), ...(activity ?? [])].sort(newestCustodyFirst);
