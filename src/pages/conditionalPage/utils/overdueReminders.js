import { devitrakApi } from "../../../api/devitrakApi";

/**
 * Stopping and resuming the automatic overdue reminder for one device.
 *
 * The server emails a reminder per overdue device (not per student) at 8:00 AM
 * Eastern, and stops on its own when the device comes back — including a return
 * marked `lost`. These endpoints are for the case in between: staff has given up
 * on the device and the guardian should stop hearing about it. See
 * FRONTEND_overdue_reminders_2026-10-07.md.
 *
 * Both routes take the same body, need `member:update` and an Education
 * company, and are idempotent. The state comes back on each row of
 * `/db_member/overdue-leases` as `reminders_stopped_at`.
 */

/**
 * Whether the server sends a reminder on this day of lateness (due date = 0).
 * Mirrors the server: daily through day 14, then 17, 22, 29, and weekly after.
 */
export function isReminderDay(days) {
  return (
    Number.isInteger(days) &&
    days >= 0 &&
    (days <= 14 ||
      days === 17 ||
      days === 22 ||
      (days >= 29 && (days - 29) % 7 === 0))
  );
}

/** Days until the next reminder goes out (0 = today), or null. */
export function daysToNextReminder(daysOverdue) {
  const start = Number(daysOverdue);
  if (daysOverdue === null || !Number.isInteger(start) || start < 0) return null;
  // The longest gap in the cadence is 7 days, so 8 always finds one.
  for (let d = start; d < start + 8; d++) {
    if (isReminderDay(d)) return d - start;
  }
  return null;
}

/**
 * The field and the two routes ship in the same backend commit. Until it is
 * deployed the list has no `reminders_stopped_at` and the routes answer 404, so
 * a row without the field gets no button rather than one that always fails.
 */
export function supportsReminderToggle(row) {
  return (
    Boolean(row) &&
    Object.prototype.hasOwnProperty.call(row, "reminders_stopped_at") &&
    row.device_id !== null &&
    row.device_id !== undefined
  );
}

/** A date means stopped; null or a missing field means active. */
export function areRemindersStopped(row) {
  return Boolean(row?.reminders_stopped_at);
}

export function nextReminderLabel(row) {
  if (areRemindersStopped(row)) return "—";
  const days = daysToNextReminder(row?.days_overdue);
  if (days === null) return "—";
  if (days === 0) return "Today, 8:00 AM ET";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}

/** `device_id` is the inventory item_id from the row, not the serial number. */
export function buildReminderTogglePayload({ companyId, row }) {
  return {
    company_id: companyId,
    member_id: row.member_id,
    device_id: row.device_id,
  };
}

const text = (value) => String(value ?? "").trim();

export function stopRemindersConfirmation(row) {
  const device =
    [text(row?.device_item_group), text(row?.device_serial_number)]
      .filter(Boolean)
      .join(" ") || "this device";
  const student = [text(row?.first_name), text(row?.last_name)]
    .filter(Boolean)
    .join(" ");
  return `Reminders for ${device} will stop. ${
    student ? `${student}'s` : "This student's"
  } other overdue devices will keep receiving theirs.`;
}

/**
 * The cached overdue-leases response with one row's state changed. The match
 * is member + device, the same pair the server keys the lease on.
 */
export function withRemindersStopped(response, row, stoppedAt) {
  const rows = response?.data?.rows;
  if (!Array.isArray(rows)) return response;
  return {
    ...response,
    data: {
      ...response.data,
      rows: rows.map((r) =>
        r.member_id === row.member_id && r.device_id === row.device_id
          ? { ...r, reminders_stopped_at: stoppedAt }
          : r
      ),
    },
  };
}

const LEASE_NOT_FOUND = "No outstanding lease found";

/** What to tell staff when stop/resume fails, and whether the list is stale. */
export function reminderToggleFailure(error) {
  const status = error?.response?.status;
  const msg = text(error?.response?.data?.msg);
  if (status === 404 && msg.startsWith(LEASE_NOT_FOUND)) {
    return {
      refresh: true,
      message:
        "This device is no longer overdue for this student. The list was refreshed.",
    };
  }
  if (status === 404) {
    return { refresh: false, message: "Stopping reminders is not available yet." };
  }
  if (status === 401 || status === 403) {
    return {
      refresh: false,
      message: "You don't have permission to change reminders.",
    };
  }
  return { refresh: false, message: "The reminder setting was not saved." };
}

export async function stopLeaseReminders(payload) {
  const response = await devitrakApi.post("/school/reminders/stop", payload);
  return response.data;
}

export async function resumeLeaseReminders(payload) {
  const response = await devitrakApi.post("/school/reminders/resume", payload);
  return response.data;
}
