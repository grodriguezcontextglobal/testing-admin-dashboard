import { describe, expect, it } from "vitest";
import {
  EVENT_STAFF_ROLES,
  buildStaffPayload,
  describeEmailLookup,
  mergeEventStaff,
  buildStaffRows,
  eventRoleFor,
  staffInitials,
  validateNewStaff,
} from "./eventStaffUtils";

const event = {
  staff: {
    adminUser: [
      { firstName: "Ana", lastName: "Gómez", email: "ana@x.com" },
      { firstName: "Sin", lastName: "Cuenta", email: "sin@x.com" },
    ],
    headsetAttendees: [{ firstName: "Luis", lastName: "Pérez", email: "luis@x.com" }],
  },
};

const adminUsers = [
  { id: "a1", name: "Ana", lastName: "Gómez R.", email: "ana@x.com", online: true },
  { id: "l1", name: "Luis", lastName: "Pérez R.", email: "luis@x.com", online: false },
];

describe("mergeEventStaff", () => {
  it("lists administrators and assistants with their event role", () => {
    const merged = mergeEventStaff({ event, adminUsers });
    expect(merged.map((member) => [member.email, member.role])).toEqual([
      ["ana@x.com", "Administrator"],
      ["sin@x.com", "Administrator"],
      ["luis@x.com", "Assistant"],
    ]);
  });

  it("prefers the registered account's name and online state", () => {
    const ana = mergeEventStaff({ event, adminUsers }).find(
      (member) => member.email === "ana@x.com"
    );
    expect(ana.name).toBe("Ana Gómez R.");
    expect(ana.online).toBe(true);
    expect(ana.id).toBe("a1");
  });

  it("falls back to the event's own name when there is no account yet", () => {
    const pending = mergeEventStaff({ event, adminUsers }).find(
      (member) => member.email === "sin@x.com"
    );
    expect(pending.name).toBe("Sin Cuenta");
    expect(pending.online).toBe(false);
    expect(pending.hasAccount).toBe(false);
  });

  it("gives every member a stable unique key even without an account id", () => {
    // Cards were previously keyed on `member.id`, which the no-account branch
    // never set — so every pending member shared the key `undefined`.
    const merged = mergeEventStaff({ event, adminUsers });
    const keys = merged.map((member) => member.key);
    expect(new Set(keys).size).toBe(merged.length);
    expect(keys.every(Boolean)).toBe(true);
  });

  it("keeps one entry per email, administrator winning", () => {
    const both = {
      staff: {
        adminUser: [{ firstName: "Ana", lastName: "G", email: "ana@x.com" }],
        headsetAttendees: [{ firstName: "Ana", lastName: "G", email: "ana@x.com" }],
      },
    };
    const merged = mergeEventStaff({ event: both, adminUsers });
    expect(merged).toHaveLength(1);
    expect(merged[0].role).toBe("Administrator");
  });

  it("matches accounts case-insensitively", () => {
    const merged = mergeEventStaff({
      event: {
        staff: {
          adminUser: [{ firstName: "A", lastName: "B", email: "ANA@X.COM" }],
          headsetAttendees: [],
        },
      },
      adminUsers,
    });
    expect(merged[0].hasAccount).toBe(true);
  });

  it("uses the newest account record when an email appears twice", () => {
    const merged = mergeEventStaff({
      event,
      adminUsers: [
        { id: "old", name: "Ana", lastName: "Old", email: "ana@x.com", online: false },
        { id: "new", name: "Ana", lastName: "New", email: "ana@x.com", online: true },
      ],
    });
    expect(merged[0].id).toBe("new");
  });

  it("survives an event with no staff at all", () => {
    expect(mergeEventStaff({ event: {}, adminUsers })).toEqual([]);
    expect(mergeEventStaff({ event: undefined, adminUsers: undefined })).toEqual([]);
  });

  it("survives a staff entry with no email", () => {
    const broken = {
      staff: { adminUser: [{ firstName: "No", lastName: "Email" }], headsetAttendees: [] },
    };
    expect(mergeEventStaff({ event: broken, adminUsers })).toEqual([]);
  });
});

describe("EVENT_STAFF_ROLES", () => {
  it("offers exactly the two roles that behave differently", () => {
    // A third option existed, "Event assistant/staff (remove when event
    // finishes)", which was compared only against "administrator" and so was
    // byte-for-byte identical in behaviour to the plain assistant option.
    expect(EVENT_STAFF_ROLES.map((role) => role.value)).toEqual([
      "administrator",
      "assistant",
    ]);
  });

  it("says what each role can do on the event", () => {
    EVENT_STAFF_ROLES.forEach((role) => {
      expect(role.label).toBeTruthy();
      expect(role.description).toBeTruthy();
    });
  });
});

describe("buildStaffPayload", () => {
  const member = { firstName: "New", lastName: "Person", email: "new@x.com" };

  it("adds an administrator to adminUser and leaves assistants alone", () => {
    const payload = buildStaffPayload({
      event,
      action: "add",
      role: "administrator",
      member,
    });
    expect(payload.staff.adminUser).toHaveLength(3);
    expect(payload.staff.adminUser.at(-1)).toEqual(member);
    expect(payload.staff.headsetAttendees).toHaveLength(1);
  });

  it("adds an assistant to headsetAttendees and leaves administrators alone", () => {
    const payload = buildStaffPayload({
      event,
      action: "add",
      role: "assistant",
      member,
    });
    expect(payload.staff.headsetAttendees).toHaveLength(2);
    expect(payload.staff.adminUser).toHaveLength(2);
  });

  it("removes an administrator by email", () => {
    const payload = buildStaffPayload({
      event,
      action: "remove",
      role: "Administrator",
      member: { email: "ana@x.com" },
    });
    expect(payload.staff.adminUser.map((m) => m.email)).toEqual(["sin@x.com"]);
    expect(payload.staff.headsetAttendees).toHaveLength(1);
  });

  it("removes an assistant by email", () => {
    const payload = buildStaffPayload({
      event,
      action: "remove",
      role: "Assistant",
      member: { email: "luis@x.com" },
    });
    expect(payload.staff.headsetAttendees).toEqual([]);
    expect(payload.staff.adminUser).toHaveLength(2);
  });

  it("matches the role label regardless of casing", () => {
    const payload = buildStaffPayload({
      event,
      action: "remove",
      role: "ADMINISTRATOR",
      member: { email: "ana@x.com" },
    });
    expect(payload.staff.adminUser).toHaveLength(1);
  });

  it("removes by email case-insensitively", () => {
    const payload = buildStaffPayload({
      event,
      action: "remove",
      role: "Administrator",
      member: { email: "ANA@X.COM" },
    });
    expect(payload.staff.adminUser.map((m) => m.email)).toEqual(["sin@x.com"]);
  });

  it("never drops the other bucket when the event has only one", () => {
    const onlyAdmins = { staff: { adminUser: [], headsetAttendees: undefined } };
    const payload = buildStaffPayload({
      event: onlyAdmins,
      action: "add",
      role: "administrator",
      member,
    });
    expect(payload.staff.headsetAttendees).toEqual([]);
  });
});

describe("validateNewStaff", () => {
  const base = {
    email: "new@x.com",
    role: "assistant",
    needsCreation: false,
    name: "",
    lastName: "",
    existingEmails: ["ana@x.com"],
  };

  it("passes an existing company member being added to the event", () => {
    expect(validateNewStaff(base)).toEqual({ ok: true, problems: [] });
  });

  it("requires an email", () => {
    const result = validateNewStaff({ ...base, email: "" });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/email/i);
  });

  it("rejects a malformed email", () => {
    expect(validateNewStaff({ ...base, email: "not-an-email" }).ok).toBe(false);
    expect(validateNewStaff({ ...base, email: "a@b" }).ok).toBe(false);
  });

  it("requires a role", () => {
    const result = validateNewStaff({ ...base, role: null });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/role/i);
  });

  it("rejects someone already on the event", () => {
    // Was a browser alert() mid-submit.
    const result = validateNewStaff({ ...base, email: "ana@x.com" });
    expect(result.ok).toBe(false);
    expect(result.problems.join(" ")).toMatch(/already on this event/i);
  });

  it("matches an existing member case-insensitively", () => {
    expect(validateNewStaff({ ...base, email: "ANA@X.COM" }).ok).toBe(false);
  });

  it("requires a name only when the person has to be created", () => {
    // The old form marked both name fields `required` unconditionally, so
    // adding an existing colleague meant retyping a name the system already had.
    expect(validateNewStaff({ ...base, needsCreation: false }).ok).toBe(true);

    const missing = validateNewStaff({ ...base, needsCreation: true });
    expect(missing.ok).toBe(false);
    expect(missing.problems.join(" ")).toMatch(/name/i);
  });

  it("passes a new person with both names", () => {
    expect(
      validateNewStaff({
        ...base,
        needsCreation: true,
        name: "New",
        lastName: "Person",
      })
    ).toEqual({ ok: true, problems: [] });
  });

  it("reports every problem at once", () => {
    const result = validateNewStaff({
      email: "",
      role: null,
      needsCreation: true,
      name: "",
      lastName: "",
      existingEmails: [],
    });
    expect(result.problems.length).toBeGreaterThan(2);
  });
});

describe("describeEmailLookup", () => {
  it("says nothing before an email is typed", () => {
    expect(describeEmailLookup({ email: "", isChecking: false })).toBeNull();
  });

  it("says nothing while the email is still incomplete", () => {
    expect(describeEmailLookup({ email: "ana@", isChecking: false })).toBeNull();
  });

  it("reports the lookup in progress", () => {
    const hint = describeEmailLookup({ email: "a@b.com", isChecking: true });
    expect(hint.tone).toBe("neutral");
    expect(hint.message).toMatch(/checking/i);
  });

  it("confirms an existing company member and asks for nothing more", () => {
    const hint = describeEmailLookup({
      email: "a@b.com",
      isChecking: false,
      found: true,
      companyName: "Context Global",
    });
    expect(hint.tone).toBe("success");
    expect(hint.needsCreation).toBe(false);
    expect(hint.message).toContain("Context Global");
  });

  it("warns that a new person will be invited to the company", () => {
    const hint = describeEmailLookup({
      email: "a@b.com",
      isChecking: false,
      found: false,
      companyName: "Context Global",
    });
    // Informational, not an error — the old form rendered this in danger red
    // with `cursor: pointer` on a paragraph that was not clickable.
    expect(hint.tone).toBe("warning");
    expect(hint.needsCreation).toBe(true);
    expect(hint.message).toContain("Context Global");
  });
});

describe("eventRoleFor", () => {
  it("reads the role off the event's own lists, not off the row", () => {
    expect(eventRoleFor({ event, email: "ana@x.com" })).toBe("Administrator");
    expect(eventRoleFor({ event, email: "luis@x.com" })).toBe("Assistant");
  });

  it("matches regardless of case and padding", () => {
    expect(eventRoleFor({ event, email: "  ANA@X.COM " })).toBe("Administrator");
  });

  it("is null for somebody the event does not list", () => {
    expect(eventRoleFor({ event, email: "nobody@x.com" })).toBeNull();
    expect(eventRoleFor({ event: undefined, email: "ana@x.com" })).toBeNull();
  });
});

describe("staffInitials", () => {
  it("takes the first and last initial", () => {
    expect(staffInitials("Ana Gómez")).toBe("AG");
    expect(staffInitials("Ana Maria Gómez Ruiz")).toBe("AR");
  });

  it("uses two letters of a single-word name instead of throwing", () => {
    // `initials[1][0]` on a one-word name was a TypeError that took the whole
    // table down with it.
    expect(staffInitials("Madonna")).toBe("MA");
  });

  it("never renders the word undefined", () => {
    // A staff entry saved with empty name fields produced ["", ""], and
    // `""[0]` is undefined — the avatar read "undefinedundefined".
    expect(staffInitials(" ")).toBe("?");
    expect(staffInitials("")).toBe("?");
    expect(staffInitials(null)).toBe("?");
    expect(staffInitials(undefined)).toBe("?");
  });
});

describe("buildStaffRows", () => {
  const rows = [
    // Added as an existing colleague: the modal never asked for a name, so the
    // event entry carries empty strings. This is the reported bug.
    { admin_id: "a1", staff: { firstName: "", lastName: "", email: "ana@x.com" } },
    // Invited from the modal: the name was typed, and there is no account yet.
    { admin_id: null, staff: { firstName: "Sin", lastName: "Cuenta", email: "sin@x.com" } },
  ];

  it("falls back to the registered account for a name the entry does not carry", () => {
    const [ana] = buildStaffRows({ rows, event, accounts: adminUsers });
    expect(ana.name).toBe("Ana Gómez R.");
  });

  it("keeps the typed name for somebody with no account yet", () => {
    const [, pending] = buildStaffRows({ rows, event, accounts: adminUsers });
    expect(pending.name).toBe("Sin Cuenta");
    expect(pending.id).toBeNull();
  });

  it("shows the email rather than a blank cell when nothing carries a name", () => {
    const [row] = buildStaffRows({
      rows: [{ admin_id: null, staff: { firstName: "", lastName: "", email: "ghost@x.com" } }],
      event,
      accounts: [],
    });
    expect(row.name).toBe("ghost@x.com");
  });

  it("reads a name written in any of the three shapes in use", () => {
    const built = buildStaffRows({
      rows: [
        { staff: { firstName: "Event", lastName: "Entry", email: "a@x.com" } },
        { staff: { name: "Account", lastName: "Shape", email: "b@x.com" } },
        { staff: { first_name: "Sql", last_name: "Shape", email: "c@x.com" } },
      ],
      event,
      accounts: [],
    });
    expect(built.map((row) => row.name)).toEqual([
      "Event Entry",
      "Account Shape",
      "Sql Shape",
    ]);
  });

  it("gives an event administrator the Administrator role", () => {
    // The row carries no role at all — buildStaffPayload writes only
    // firstName/lastName/email — and the table read `staff.role !==
    // "Administrator"`, so every administrator was displayed as an assistant.
    const [ana] = buildStaffRows({ rows, event, accounts: adminUsers });
    expect(ana.role).toBe("Administrator");
  });

  it("falls back to the role on the row for somebody the event no longer lists", () => {
    const [row] = buildStaffRows({
      rows: [{ staff: { firstName: "Old", lastName: "Hand", email: "old@x.com", role: "Administrator" } }],
      event,
      accounts: [],
    });
    expect(row.role).toBe("Administrator");
  });

  it("defaults to Assistant when neither the event nor the row says", () => {
    const [row] = buildStaffRows({
      rows: [{ staff: { firstName: "No", lastName: "Role", email: "no@x.com" } }],
      event,
      accounts: [],
    });
    expect(row.role).toBe("Assistant");
  });

  it("carries the account id when the row has none, so the row stays clickable", () => {
    const [row] = buildStaffRows({
      rows: [{ admin_id: null, staff: { firstName: "Ana", lastName: "G", email: "ana@x.com" } }],
      event,
      accounts: adminUsers,
    });
    expect(row.id).toBe("a1");
  });

  it("keys every row, including one with no email", () => {
    const built = buildStaffRows({
      rows: [{ staff: { email: "ana@x.com" } }, { staff: {} }],
      event,
      accounts: adminUsers,
    });
    expect(built[0].key).toBe("ana@x.com");
    expect(built[1].key).toBe("row-1");
  });

  it("keeps the placeholder phone and empty photo the table renders today", () => {
    const [row] = buildStaffRows({
      rows: [{ staff: { email: "ana@x.com" } }],
      event,
      accounts: [],
    });
    expect(row.phone).toBe("000-000-0000");
    expect(row.photo).toBe("");
  });

  it("returns an empty list for a response that carried nothing", () => {
    expect(buildStaffRows({ rows: undefined, event, accounts: adminUsers })).toEqual([]);
    expect(buildStaffRows({ rows: null, event, accounts: null })).toEqual([]);
  });
});
