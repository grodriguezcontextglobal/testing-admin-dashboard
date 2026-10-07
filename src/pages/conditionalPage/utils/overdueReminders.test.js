import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

import { devitrakApi } from "../../../api/devitrakApi";
import {
  isReminderDay,
  daysToNextReminder,
  supportsReminderToggle,
  areRemindersStopped,
  nextReminderLabel,
  buildReminderTogglePayload,
  stopRemindersConfirmation,
  withRemindersStopped,
  reminderToggleFailure,
  stopLeaseReminders,
  resumeLeaseReminders,
} from "./overdueReminders";

const row = {
  lease_id: 1,
  member_id: 5001,
  device_id: 9001,
  device_serial_number: "5CD1234",
  device_item_group: "Chromebook",
  first_name: "Ana",
  last_name: "Ruiz",
  days_overdue: 18,
  reminders_stopped_at: null,
};

beforeEach(() => {
  devitrakApi.post.mockReset();
});

describe("isReminderDay — the server's cadence", () => {
  it("sends every day from the due date through day 14", () => {
    for (let d = 0; d <= 14; d++) expect(isReminderDay(d)).toBe(true);
  });

  it("then on days 17, 22 and 29", () => {
    expect([15, 16, 17, 18, 21, 22, 23, 28, 29].filter(isReminderDay)).toEqual([
      17, 22, 29,
    ]);
  });

  it("then once a week from day 29", () => {
    expect([30, 35, 36, 43, 50, 51].filter(isReminderDay)).toEqual([36, 43, 50]);
  });

  it("is false for anything that is not a non-negative integer", () => {
    [-1, 1.5, "3", null, undefined, NaN].forEach((d) =>
      expect(isReminderDay(d)).toBe(false)
    );
  });
});

describe("daysToNextReminder", () => {
  it("is 0 on a reminder day", () => {
    expect(daysToNextReminder(3)).toBe(0);
    expect(daysToNextReminder(29)).toBe(0);
  });

  it("counts forward to the next one, without restarting the cadence", () => {
    expect(daysToNextReminder(15)).toBe(2);
    expect(daysToNextReminder(25)).toBe(4);
    expect(daysToNextReminder(30)).toBe(6);
  });

  it("accepts a numeric string, as days_overdue may arrive", () => {
    expect(daysToNextReminder("18")).toBe(4);
  });

  it("is null when the value is unusable", () => {
    expect(daysToNextReminder(null)).toBeNull();
    expect(daysToNextReminder(-2)).toBeNull();
  });
});

describe("supportsReminderToggle", () => {
  it("is true once the list carries the field, stopped or not", () => {
    expect(supportsReminderToggle(row)).toBe(true);
    expect(supportsReminderToggle({ ...row, reminders_stopped_at: "2026-10-07" })).toBe(true);
  });

  it("is false before the backend ships it: the endpoints 404 until then", () => {
    const legacy = { ...row };
    delete legacy.reminders_stopped_at;
    expect(supportsReminderToggle(legacy)).toBe(false);
  });

  it("is false without a device_id to send", () => {
    expect(supportsReminderToggle({ ...row, device_id: null })).toBe(false);
  });
});

describe("areRemindersStopped", () => {
  it("reads a date as stopped, null or a missing field as active", () => {
    expect(areRemindersStopped({ reminders_stopped_at: "2026-10-07T14:03:00.000Z" })).toBe(true);
    expect(areRemindersStopped({ reminders_stopped_at: null })).toBe(false);
    expect(areRemindersStopped({})).toBe(false);
  });
});

describe("nextReminderLabel", () => {
  it("says today, tomorrow or in N days", () => {
    expect(nextReminderLabel({ ...row, days_overdue: 3 })).toBe("Today, 8:00 AM ET");
    expect(nextReminderLabel({ ...row, days_overdue: 16 })).toBe("Tomorrow");
    expect(nextReminderLabel({ ...row, days_overdue: 18 })).toBe("In 4 days");
  });

  it("is a dash when reminders are stopped or the count is unusable", () => {
    expect(nextReminderLabel({ ...row, reminders_stopped_at: "2026-10-07" })).toBe("—");
    expect(nextReminderLabel({ ...row, days_overdue: null })).toBe("—");
  });
});

describe("buildReminderTogglePayload", () => {
  it("sends the inventory device_id, never the serial number", () => {
    expect(buildReminderTogglePayload({ companyId: 61, row })).toEqual({
      company_id: 61,
      member_id: 5001,
      device_id: 9001,
    });
  });
});

describe("stopRemindersConfirmation", () => {
  it("names the device and says the student's other devices keep theirs", () => {
    expect(stopRemindersConfirmation(row)).toBe(
      "Reminders for Chromebook 5CD1234 will stop. Ana Ruiz's other overdue devices will keep receiving theirs."
    );
  });

  it("falls back when the device or the name is missing", () => {
    expect(
      stopRemindersConfirmation({ device_serial_number: "", first_name: "" })
    ).toBe(
      "Reminders for this device will stop. This student's other overdue devices will keep receiving theirs."
    );
  });
});

describe("withRemindersStopped", () => {
  const response = { data: { ok: true, count: 2, rows: [row, { ...row, lease_id: 2, device_id: 9002 }] } };

  it("updates only the row for that member and device", () => {
    const next = withRemindersStopped(response, row, "2026-10-07T14:03:00.000Z");
    expect(next.data.rows[0].reminders_stopped_at).toBe("2026-10-07T14:03:00.000Z");
    expect(next.data.rows[1].reminders_stopped_at).toBeNull();
    expect(next.data.count).toBe(2);
  });

  it("does not mutate the cached response", () => {
    withRemindersStopped(response, row, "2026-10-07T14:03:00.000Z");
    expect(response.data.rows[0].reminders_stopped_at).toBeNull();
  });

  it("returns what it got when there is nothing cached", () => {
    expect(withRemindersStopped(undefined, row, null)).toBeUndefined();
  });
});

describe("reminderToggleFailure", () => {
  const err = (status, msg) => ({ response: { status, data: { ok: false, msg } } });

  it("a 404 for the lease means the row is stale: refresh", () => {
    expect(
      reminderToggleFailure(err(404, "No outstanding lease found for this member and device"))
    ).toEqual({
      refresh: true,
      message: "This device is no longer overdue for this student. The list was refreshed.",
    });
  });

  it("a 404 without that message is the route itself missing", () => {
    expect(reminderToggleFailure(err(404, undefined))).toEqual({
      refresh: false,
      message: "Stopping reminders is not available yet.",
    });
  });

  it("401 and 403 are a permission problem", () => {
    expect(reminderToggleFailure(err(403)).message).toBe(
      "You don't have permission to change reminders."
    );
    expect(reminderToggleFailure(err(401)).refresh).toBe(false);
  });

  it("anything else is a generic failure", () => {
    expect(reminderToggleFailure(new Error("network"))).toEqual({
      refresh: false,
      message: "The reminder setting was not saved.",
    });
  });
});

describe("stop/resume endpoints", () => {
  const payload = { company_id: 61, member_id: 5001, device_id: 9001 };

  it("stop posts to /school/reminders/stop", async () => {
    devitrakApi.post.mockResolvedValue({ data: { ok: true, reminders_stopped: true } });
    await expect(stopLeaseReminders(payload)).resolves.toEqual({
      ok: true,
      reminders_stopped: true,
    });
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/reminders/stop", payload);
  });

  it("resume posts to /school/reminders/resume", async () => {
    devitrakApi.post.mockResolvedValue({ data: { ok: true, reminders_stopped: false } });
    await resumeLeaseReminders(payload);
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/reminders/resume", payload);
  });

  it("propagates errors", async () => {
    devitrakApi.post.mockRejectedValue(new Error("boom"));
    await expect(stopLeaseReminders(payload)).rejects.toThrow("boom");
  });
});
