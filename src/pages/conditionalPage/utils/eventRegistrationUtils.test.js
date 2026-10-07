import { describe, it, expect, vi } from "vitest";
import {
  getConfirmationRecipient,
  buildConfirmationLink,
  parseConfirmationParams,
  buildConsumerEventPayloads,
  buildAttendanceEmail,
  ATTENDANCE_CONFIRMATION_PATH,
  filterInviteRows,
  inviteSelectionCounts,
  selectableInviteKeys,
  getDirectAddTarget,
  registerConsumerToEvent,
} from "./eventRegistrationUtils";

const adultMember = {
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@test.com",
  phone_number: "555-0100",
  minor: false,
};

const minorMemberWithGuardian = {
  first_name: "Timmy",
  last_name: "Turner",
  email: "timmy@test.com",
  phone_number: "555-0200",
  minor: true,
  parent_guardian_email: "guardian@test.com",
};

const minorMemberNoGuardian = {
  first_name: "Lost",
  last_name: "Kid",
  email: "lost@test.com",
  minor: true,
  parent_guardian_email: "",
};

const event = {
  id: "event-123",
  eventInfoDetail: {
    eventName: "Spring Fair",
    dateBegin: "2026-08-01T00:00:00.000Z",
    dateEnd: "2026-08-02T00:00:00.000Z",
  },
};

const company = { id: "company-abc", name: "Acme School" };

describe("getConfirmationRecipient", () => {
  it("resolves adult members to themselves", () => {
    expect(getConfirmationRecipient(adultMember)).toEqual({
      email: "ada@test.com",
      isGuardian: false,
      error: null,
    });
  });

  it("resolves minors to their guardian", () => {
    expect(getConfirmationRecipient(minorMemberWithGuardian)).toEqual({
      email: "guardian@test.com",
      isGuardian: true,
      error: null,
    });
  });

  it("treats numeric minor=1 (SQL shape) the same as boolean true", () => {
    const record = { ...minorMemberWithGuardian, minor: 1 };
    expect(getConfirmationRecipient(record).isGuardian).toBe(true);
  });

  it("reports (not silently skips) minors missing a guardian email", () => {
    const result = getConfirmationRecipient(minorMemberNoGuardian);
    expect(result.email).toBeNull();
    expect(result.isGuardian).toBe(true);
    expect(result.error).toMatch(/guardian email/i);
  });

  it("reports adults missing an email", () => {
    const result = getConfirmationRecipient({ ...adultMember, email: "" });
    expect(result.email).toBeNull();
    expect(result.error).toMatch(/no email/i);
  });
});

describe("buildConfirmationLink", () => {
  it("builds an encoded /attendance-confirmation URL with all params", () => {
    const link = buildConfirmationLink(
      "https://app.devitrak.net",
      minorMemberWithGuardian,
      event,
      company,
    );
    expect(link.startsWith(`https://app.devitrak.net${ATTENDANCE_CONFIRMATION_PATH}?`)).toBe(true);
    const url = new URL(link);
    expect(url.searchParams.get("memberEmail")).toBe("timmy@test.com");
    expect(url.searchParams.get("memberFirstName")).toBe("Timmy");
    expect(url.searchParams.get("eventId")).toBe("event-123");
    expect(url.searchParams.get("eventName")).toBe("Spring Fair");
    expect(url.searchParams.get("company")).toBe("Acme School");
    expect(url.searchParams.get("companyId")).toBe("company-abc");
    expect(url.searchParams.get("minor")).toBe("true");
    expect(url.searchParams.get("guardianEmail")).toBe("guardian@test.com");
  });

  it("leaves guardianEmail empty for adults", () => {
    const link = buildConfirmationLink("https://app.devitrak.net", adultMember, event, company);
    const url = new URL(link);
    expect(url.searchParams.get("minor")).toBe("false");
    expect(url.searchParams.get("guardianEmail")).toBe("");
  });

  it("encodes special characters in names", () => {
    const member = { ...adultMember, first_name: "Anne & Marie" };
    const link = buildConfirmationLink("https://app.devitrak.net", member, event, company);
    expect(link).toContain("Anne+%26+Marie");
    const url = new URL(link);
    expect(url.searchParams.get("memberFirstName")).toBe("Anne & Marie");
  });

  it("strips a trailing slash from origin", () => {
    const link = buildConfirmationLink("https://app.devitrak.net/", adultMember, event, company);
    expect(link.startsWith("https://app.devitrak.net/attendance-confirmation?")).toBe(true);
    expect(link).not.toContain("//attendance-confirmation");
  });
});

describe("parseConfirmationParams", () => {
  it("round-trips a link built by buildConfirmationLink", () => {
    const link = buildConfirmationLink(
      "https://app.devitrak.net",
      minorMemberWithGuardian,
      event,
      company,
    );
    const url = new URL(link);
    const parsed = parseConfirmationParams(url.searchParams);
    expect(parsed).toEqual({
      memberEmail: "timmy@test.com",
      memberFirstName: "Timmy",
      memberLastName: "Turner",
      eventId: "event-123",
      eventName: "Spring Fair",
      company: "Acme School",
      companyId: "company-abc",
      minor: true,
      guardianEmail: "guardian@test.com",
    });
  });

  it("accepts a plain object in addition to URLSearchParams", () => {
    const parsed = parseConfirmationParams({
      memberEmail: "a@test.com",
      eventId: "e1",
      eventName: "Fair",
      company: "Acme",
      companyId: "c1",
    });
    expect(parsed.error).toBeUndefined();
    expect(parsed.memberEmail).toBe("a@test.com");
  });

  it("returns an error when required params are missing", () => {
    const parsed = parseConfirmationParams({ memberEmail: "a@test.com" });
    expect(parsed.error).toMatch(/invalid or incomplete/i);
  });

  it("returns an error for null/undefined input", () => {
    expect(parseConfirmationParams(null).error).toBeTruthy();
    expect(parseConfirmationParams(undefined).error).toBeTruthy();
  });
});

describe("buildConsumerEventPayloads", () => {
  it("builds the new-consumer auth + db payloads when no existing consumer", () => {
    const result = buildConsumerEventPayloads(adultMember, event, company, null);
    expect(result.auth).toEqual({
      name: "Ada",
      lastName: "Lovelace",
      email: "ada@test.com",
      phoneNumber: "555-0100",
      privacyPolicy: true,
      category: "Regular",
      provider: ["Acme School"],
      eventSelected: ["Spring Fair"],
      company_providers: ["company-abc"],
      event_providers: ["event-123"],
      groupName: [],
    });
    expect(result.db).toEqual({
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@test.com",
      phone_number: "555-0100",
    });
    expect(result.merge).toBeUndefined();
  });

  it("builds the merge payload for an existing consumer, deduping arrays", () => {
    const existingConsumer = {
      id: "consumer-1",
      eventSelected: ["Spring Fair", "Winter Gala"],
      provider: ["Acme School"],
      company_providers: ["company-abc"],
      event_providers: ["event-999"],
    };
    const result = buildConsumerEventPayloads(adultMember, event, company, existingConsumer);
    expect(result.merge.id).toBe("consumer-1");
    // event already present in eventSelected -> no duplicate
    expect(result.merge.eventSelected).toEqual(["Spring Fair", "Winter Gala"]);
    expect(result.merge.provider).toEqual(["Acme School"]);
    expect(result.merge.company_providers).toEqual(["company-abc"]);
    // new event id appended, old one preserved
    expect(result.merge.event_providers).toEqual(["event-999", "event-123"]);
    expect(result.auth).toBeUndefined();
  });
});

describe("buildAttendanceEmail", () => {
  it("addresses the member directly when not a guardian", () => {
    const recipient = getConfirmationRecipient(adultMember);
    const email = buildAttendanceEmail({
      member: adultMember,
      event,
      recipient,
      confirmationLink: "https://app.devitrak.net/attendance-confirmation?x=1",
    });
    expect(email.to).toBe("ada@test.com");
    expect(email.subject).toContain("Spring Fair");
    expect(email.message).toContain("Hi Ada Lovelace");
    expect(email.message).toContain("https://app.devitrak.net/attendance-confirmation?x=1");
  });

  it("uses neutral 'on behalf of' wording for guardians", () => {
    const recipient = getConfirmationRecipient(minorMemberWithGuardian);
    const email = buildAttendanceEmail({
      member: minorMemberWithGuardian,
      event,
      recipient,
      confirmationLink: "https://app.devitrak.net/attendance-confirmation?x=2",
    });
    expect(email.to).toBe("guardian@test.com");
    expect(email.message).toContain("on behalf of Timmy Turner");
  });

  it("includes the event date range", () => {
    const recipient = getConfirmationRecipient(adultMember);
    const email = buildAttendanceEmail({
      member: adultMember,
      event,
      recipient,
      confirmationLink: "https://app.devitrak.net/attendance-confirmation?x=3",
    });
    expect(email.message).toMatch(/August/);
  });

  it("renders the confirmation link as a button (anchor), not as the primary raw string", () => {
    const recipient = getConfirmationRecipient(adultMember);
    const link = "https://app.devitrak.net/attendance-confirmation?a=1&b=2";
    const email = buildAttendanceEmail({
      member: adultMember,
      event,
      recipient,
      confirmationLink: link,
    });
    // button = anchor with the link in href (& escaped for valid HTML)
    expect(email.message).toContain(
      'href="https://app.devitrak.net/attendance-confirmation?a=1&amp;b=2"'
    );
    expect(email.message).toContain("Confirm attendance");
  });

  it("includes the URL as a visible copy/paste fallback in case the button doesn't navigate", () => {
    const recipient = getConfirmationRecipient(adultMember);
    const link = "https://app.devitrak.net/attendance-confirmation?a=1&b=2";
    const email = buildAttendanceEmail({
      member: adultMember,
      event,
      recipient,
      confirmationLink: link,
    });
    expect(email.message).toMatch(/copy and paste this link/i);
    // fallback shows the link as visible text too (HTML-escaped)
    const fallbackOccurrences = email.message.split(
      "https://app.devitrak.net/attendance-confirmation?a=1&amp;b=2"
    ).length - 1;
    expect(fallbackOccurrences).toBeGreaterThanOrEqual(2); // href + visible fallback
  });

  it("escapes HTML in member/event names so generated markup stays safe", () => {
    const trickyMember = { ...adultMember, first_name: "Ada <script>", last_name: "L & co" };
    const recipient = getConfirmationRecipient(trickyMember);
    const email = buildAttendanceEmail({
      member: trickyMember,
      event,
      recipient,
      confirmationLink: "https://app.devitrak.net/attendance-confirmation?x=9",
    });
    expect(email.message).not.toContain("<script>");
    expect(email.message).toContain("Ada &lt;script&gt;");
    expect(email.message).toContain("L &amp; co");
  });
});

describe("the invite table's selection", () => {
  const rows = [
    {
      key: 1,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@x.com",
      _recipient: { email: "ada@x.com", isGuardian: false, error: null },
    },
    {
      key: 2,
      first_name: "Grace",
      last_name: "Hopper",
      email: "grace@x.com",
      parent_guardian_email: "mum@x.com",
      _recipient: { email: "mum@x.com", isGuardian: true, error: null },
    },
    {
      key: 3,
      first_name: "Alan",
      last_name: "Turing",
      email: "alan@x.com",
      _recipient: { email: null, isGuardian: true, error: "Missing guardian email." },
    },
  ];

  describe("filterInviteRows", () => {
    it("matches a name, an email or a guardian email", () => {
      expect(filterInviteRows(rows, "lovelace")).toHaveLength(1);
      expect(filterInviteRows(rows, "mum@x.com")).toHaveLength(1);
      expect(filterInviteRows(rows, "x.com")).toHaveLength(3);
    });

    it("matches across the first and last name together", () => {
      expect(filterInviteRows(rows, "ada love")).toHaveLength(1);
    });

    it("returns everything for an empty search", () => {
      expect(filterInviteRows(rows, "  ")).toHaveLength(3);
      expect(filterInviteRows(rows, undefined)).toHaveLength(3);
    });

    it("survives a missing list", () => {
      expect(filterInviteRows(undefined, "ada")).toEqual([]);
    });
  });

  describe("selectableInviteKeys", () => {
    it("leaves out the member who has nobody to email", () => {
      expect(selectableInviteKeys(rows)).toEqual([1, 2]);
    });
  });

  describe("inviteSelectionCounts", () => {
    it("says how many are blocked, which the table never did", () => {
      expect(inviteSelectionCounts(rows, [1])).toEqual({
        total: 3,
        blocked: 1,
        selectable: 2,
        selected: 1,
      });
    });

    it("counts only selected keys that are still on screen", () => {
      expect(inviteSelectionCounts(rows, [1, 99]).selected).toBe(1);
    });

    it("survives nothing", () => {
      expect(inviteSelectionCounts(undefined, undefined)).toEqual({
        total: 0,
        blocked: 0,
        selectable: 0,
        selected: 0,
      });
    });
  });
});

/* 2026-09-29 `46:06`: "They may have a waiver on the beginning of the semester
   that allows them to join any events… So you should be able to add them to
   the event here without that invitation thing." */
describe("getDirectAddTarget", () => {
  it("registers the member under their own email", () => {
    expect(getDirectAddTarget(adultMember)).toEqual({
      email: "ada@test.com",
      isGuardian: false,
      error: null,
    });
  });

  it("does not need a guardian email: nobody is being asked", () => {
    expect(getDirectAddTarget(minorMemberNoGuardian).error).toBeNull();
  });

  it("refuses a member with no email, because a consumer is found by email", () => {
    expect(getDirectAddTarget({ ...adultMember, email: "  " })).toEqual({
      email: null,
      isGuardian: false,
      error: "No email on file for this member.",
    });
  });
});

describe("registerConsumerToEvent", () => {
  const api = (responses) => ({
    post: vi.fn((url) => Promise.resolve(responses[url] ?? { data: { ok: true } })),
    patch: vi.fn(() => Promise.resolve(responses.patch ?? { data: { ok: true } })),
  });

  it("creates the consumer when the email is new", async () => {
    const client = api({ "/auth/user-query": { data: { ok: true, users: [] } } });
    await expect(
      registerConsumerToEvent(client, { member: adultMember, event, company })
    ).resolves.toBe("added");
    expect(client.post).toHaveBeenCalledWith(
      "/auth/new",
      expect.objectContaining({ email: "ada@test.com", event_providers: ["event-123"] })
    );
    expect(client.post).toHaveBeenCalledWith(
      "/db_consumer/new_consumer",
      expect.objectContaining({ email: "ada@test.com" })
    );
  });

  it("adds the event to a consumer that already exists", async () => {
    const existing = { id: "c-1", eventSelected: ["Old"], event_providers: ["e-0"] };
    const client = api({ "/auth/user-query": { data: { ok: true, users: [existing] } } });
    await expect(
      registerConsumerToEvent(client, { member: adultMember, event, company })
    ).resolves.toBe("added");
    expect(client.patch).toHaveBeenCalledWith(
      "/auth/c-1",
      expect.objectContaining({ event_providers: ["e-0", "event-123"] })
    );
    expect(client.post).not.toHaveBeenCalledWith("/auth/new", expect.anything());
  });

  it("writes nothing when the consumer is already on the event", async () => {
    const existing = { id: "c-1", event_providers: [123] };
    const client = api({ "/auth/user-query": { data: { ok: true, users: [existing] } } });
    await expect(
      registerConsumerToEvent(client, {
        member: adultMember,
        event: { ...event, id: "123" },
        company,
      })
    ).resolves.toBe("already");
    expect(client.patch).not.toHaveBeenCalled();
  });

  it("stops before the SQL insert when the account is refused", async () => {
    const client = api({
      "/auth/user-query": { data: { ok: true, users: [] } },
      "/auth/new": { data: { ok: false, msg: "Email already in use" } },
    });
    await expect(
      registerConsumerToEvent(client, { member: adultMember, event, company })
    ).rejects.toThrow("Email already in use");
    expect(client.post).not.toHaveBeenCalledWith("/db_consumer/new_consumer", expect.anything());
  });

  it("reports a refused update", async () => {
    const client = api({
      "/auth/user-query": { data: { ok: true, users: [{ id: "c-1" }] } },
      patch: { data: { ok: false } },
    });
    await expect(
      registerConsumerToEvent(client, { member: adultMember, event, company })
    ).rejects.toThrow("The registration was not saved.");
  });
});
