import { describe, expect, it } from "vitest";
import {
  REMINDER_TEMPLATES,
  availableTemplates,
  buildReminderPayload,
  buildReminderSubject,
  describeLoan,
  memberDisplayName,
  overdueLoans,
  reminderRecipients,
  upcomingLoans,
} from "./reminderTemplates";

const NOW = new Date("2026-06-10T12:00:00");

const loan = (serial, dueOffsetDays, name = "Tablet") => {
  const due = new Date(NOW);
  due.setDate(due.getDate() + dueOffsetDays);
  return {
    device_serial_number: serial,
    device_item_group: name,
    expected_return_date: due.toISOString(),
  };
};

const member = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.org",
  minor: 0,
};

describe("memberDisplayName", () => {
  it("uses the full name when there is one", () => {
    expect(memberDisplayName(member)).toBe("Ada Lovelace");
  });

  it("falls back to the email, then to a greeting that still reads", () => {
    expect(memberDisplayName({ email: "x@y.com" })).toBe("x@y.com");
    expect(memberDisplayName(undefined)).toBe("there");
  });
});

describe("reminderRecipients", () => {
  it("emails the member", () => {
    expect(reminderRecipients(member)).toEqual(["ada@school.org"]);
  });

  it("adds the guardian for a minor", () => {
    expect(
      reminderRecipients({ ...member, minor: 1, parent_guardian_email: "mum@x.com" })
    ).toEqual(["ada@school.org", "mum@x.com"]);
  });

  it("adds the guardian when `minor` arrives as the string \"1\"", () => {
    // The old check was `memberInfo?.minor === 1` — strict, against a number.
    // Every other check in this domain reads `Number(minor) === 1`, and when the
    // field came through as a string the guardian was silently left off.
    expect(
      reminderRecipients({ ...member, minor: "1", parent_guardian_email: "mum@x.com" })
    ).toEqual(["ada@school.org", "mum@x.com"]);
  });

  it("does not email the guardian of an adult", () => {
    expect(
      reminderRecipients({ ...member, minor: 0, parent_guardian_email: "mum@x.com" })
    ).toEqual(["ada@school.org"]);
  });

  it("never lists the same address twice, and survives a member with no email", () => {
    expect(
      reminderRecipients({
        email: "same@x.com",
        minor: 1,
        parent_guardian_email: "same@x.com",
      })
    ).toEqual(["same@x.com"]);
    expect(reminderRecipients({ minor: 1, parent_guardian_email: "mum@x.com" })).toEqual([
      "mum@x.com",
    ]);
    expect(reminderRecipients(undefined)).toEqual([]);
  });
});

describe("describeLoan", () => {
  it("names the device, its serial and its due date", () => {
    const line = describeLoan(loan("SN-1", -3));
    expect(line).toContain("Tablet (SN-1)");
    expect(line).toContain("due Jun 7, 2026");
  });

  it("degrades gracefully when fields are missing", () => {
    expect(describeLoan({})).toBe("Device");
    expect(describeLoan({ device_item_group: "Radio" })).toBe("Radio");
  });
});

describe("overdueLoans", () => {
  it("keeps only what is past due, worst first", () => {
    const rows = [loan("A", -1), loan("B", 5), loan("C", -9)];
    expect(overdueLoans(rows, NOW).map((r) => r.device_serial_number)).toEqual([
      "C",
      "A",
    ]);
  });

  it("does not count something due today as overdue", () => {
    expect(overdueLoans([loan("A", 0)], NOW)).toEqual([]);
  });

  it("survives rows without a due date and a missing list", () => {
    expect(overdueLoans([{ device_serial_number: "A" }], NOW)).toEqual([]);
    expect(overdueLoans(undefined, NOW)).toEqual([]);
  });
});

describe("upcomingLoans", () => {
  it("keeps what is due within the window, soonest first", () => {
    const rows = [loan("A", 6), loan("B", 1), loan("C", 30), loan("D", -2)];
    expect(upcomingLoans(rows, 7, NOW).map((r) => r.device_serial_number)).toEqual([
      "B",
      "A",
    ]);
  });

  it("includes today and excludes anything overdue", () => {
    expect(
      upcomingLoans([loan("A", 0), loan("B", -1)], 7, NOW).map(
        (r) => r.device_serial_number
      )
    ).toEqual(["A"]);
  });
});

describe("availableTemplates", () => {
  it("offers only what makes sense: no overdue notice with nothing overdue", () => {
    const keys = availableTemplates({ overdue: [], upcoming: [] }).map((t) => t.key);
    expect(keys).toEqual(["custom"]);
  });

  it("offers the overdue notice as soon as something is late", () => {
    const keys = availableTemplates({ overdue: [loan("A", -1)], upcoming: [] }).map(
      (t) => t.key
    );
    expect(keys).toEqual(["overdue", "custom"]);
  });

  it("always offers a free-form message", () => {
    expect(REMINDER_TEMPLATES.at(-1).key).toBe("custom");
    expect(REMINDER_TEMPLATES.at(-1).available({})).toBe(true);
  });
});

describe("template bodies", () => {
  const overdue = [loan("SN-1", -3), loan("SN-2", -1, "Charger")];

  it("names every overdue device in the message", () => {
    const template = REMINDER_TEMPLATES.find((t) => t.key === "overdue");
    const { subject, message } = template.build({
      member,
      overdue,
      companyName: "Dev School",
    });
    expect(subject).toBe("Overdue devices");
    expect(message).toContain("Ada Lovelace");
    expect(message).toContain("Tablet (SN-1)");
    expect(message).toContain("Charger (SN-2)");
    expect(message).toContain("Dev School");
  });

  it("uses the singular when only one device is late", () => {
    const template = REMINDER_TEMPLATES.find((t) => t.key === "overdue");
    const { subject, message } = template.build({
      member,
      overdue: [overdue[0]],
      companyName: "Dev School",
    });
    expect(subject).toBe("Overdue device");
    expect(message).toContain("device is");
  });

  it("leaves the custom template empty for the writer", () => {
    const template = REMINDER_TEMPLATES.find((t) => t.key === "custom");
    expect(template.build({})).toEqual({ subject: "", message: "" });
  });
});

describe("buildReminderPayload", () => {
  it("keeps the exact body the notification endpoint already accepts", () => {
    expect(
      buildReminderPayload({
        member,
        subject: "Overdue device",
        message: "Please return it.",
        companyName: "Dev School",
      })
    ).toEqual({
      consumer: ["ada@school.org"],
      subject: "Overdue device - Notification from Dev School",
      message: "Please return it.",
      eventSelected: "",
      company: "Dev School",
    });
  });

  it("builds the subject the recipient will actually see", () => {
    expect(buildReminderSubject("Hello", "Dev School")).toBe(
      "Hello - Notification from Dev School"
    );
  });
});

// ─── who the reminder comes from ─────────────────────────────────────────────

describe("the sign-off names the staff member sending it", () => {
  /* It used to be the company name alone. A member holding a device and given
     three days to return it needs to know who asked — an unsigned message from
     an institution is the one people ignore, and there is nobody to reply to. */
  const member = { first_name: "Ana", email: "ana@x.com" };
  const overdue = [
    { device_item_group: "Chromebook", device_serial_number: "SN-1", expected_return_date: "2026-08-01" },
  ];
  const upcoming = [
    { device_item_group: "Chromebook", device_serial_number: "SN-2", expected_return_date: "2026-09-30" },
  ];

  const build = (key, context) =>
    REMINDER_TEMPLATES.find((template) => template.key === key).build({
      member,
      overdue,
      upcoming,
      companyName: "Context Global",
      ...context,
    }).message;

  it("signs the overdue reminder with the sender, then the company", () => {
    const message = build("overdue", { staffName: "Gustavo Rodriguez" });
    expect(message).toContain("Thank you,\nGustavo Rodriguez\nContext Global");
  });

  it("signs the upcoming reminder the same way", () => {
    const message = build("upcoming", { staffName: "Gustavo Rodriguez" });
    expect(message).toContain("Thank you,\nGustavo Rodriguez\nContext Global");
  });

  it("falls back to the company alone when the sender is unknown", () => {
    const message = build("overdue", {});
    expect(message).toContain("Thank you,\nContext Global");
    expect(message).not.toContain("Thank you,\n\n");
  });

  it("does not print an empty line for a blank sender", () => {
    const message = build("overdue", { staffName: "   " });
    expect(message).toContain("Thank you,\nContext Global");
  });

  /* These two asserted "reply to ...". Reminders go out through the company's
     notification account rather than the sender's mailbox, so replying to what
     arrives reaches an account nobody reads -- the instruction was wrong, not
     the wording. Naming the address to write to holds whichever way the mail
     was sent. */
  it("names the address to write to when the sender has an email", () => {
    const message = build("overdue", {
      staffName: "Gustavo Rodriguez",
      staffEmail: "grodriguez@contextglobal.com",
    });
    expect(message).toContain("write to grodriguez@contextglobal.com");
    expect(message).not.toContain("reply to");
  });

  it("points at the person, not the mailbox, when there is no sender email", () => {
    const message = build("overdue", { staffName: "Gustavo Rodriguez" });
    expect(message).toContain("contact the person who sent this");
    expect(message).not.toContain("reply to this email");
  });
});
