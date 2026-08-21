import { describe, expect, it } from "vitest";
import {
  EVENT_STAFF_ROLES,
  buildStaffPayload,
  describeEmailLookup,
  mergeEventStaff,
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
