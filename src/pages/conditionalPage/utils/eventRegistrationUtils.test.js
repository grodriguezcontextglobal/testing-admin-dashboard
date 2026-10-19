import { describe, it, expect, vi } from "vitest";
import {
  getConfirmationRecipient,
  parseConfirmationParams,
  buildConsumerEventPayloads,
  filterInviteRows,
  inviteSelectionCounts,
  selectableInviteKeys,
  getDirectAddTarget,
  registerConsumerToEvent,
  EVENT_INVITATIONS_SEND_PATH,
  INVITATION_SEND_LIMIT,
  sendEventInvitations,
  invitationSendNotice,
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

describe("parseConfirmationParams", () => {
  /* The parameters the server puts in the link it signs (/send,
     controller/eventInvitation.js), without the token: an unsigned link must
     carry them all. */
  it("reads every value of an invitation link", () => {
    const parsed = parseConfirmationParams(
      new URLSearchParams({
        memberEmail: "timmy@test.com",
        memberFirstName: "Timmy",
        memberLastName: "Turner",
        eventId: "event-123",
        eventName: "Spring Fair",
        company: "Acme School",
        companyId: "company-abc",
        minor: "true",
        guardianEmail: "guardian@test.com",
      })
    );
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
      memberId: "",
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

/* 2026-10-14 (FRONTEND_attendance_invitation_link_2026-10-14.md): the server
   builds, signs and emails the link. The dashboard names who and which event;
   the server reads email, name and minor status from members_info itself. */
describe("sendEventInvitations", () => {
  const row = (id, extra = {}) => ({
    member_id: id,
    key: id,
    first_name: `First${id}`,
    last_name: `Last${id}`,
    _recipient: { email: `m${id}@x.com` },
    ...extra,
  });

  it("sends ids only, with the SQL company id", async () => {
    const api = {
      post: vi.fn(() =>
        Promise.resolve({ data: { ok: true, results: [{ member_id: "10", ok: true }] } })
      ),
    };
    const outcome = await sendEventInvitations(api, {
      companyId: 7,
      event,
      members: [row(10)],
    });
    expect(api.post).toHaveBeenCalledWith(EVENT_INVITATIONS_SEND_PATH, {
      company_id: 7,
      event_id: "event-123",
      member_ids: [10],
    });
    expect(outcome).toEqual({ sent: 1, alreadyInvited: [], failures: [], refused: null });
  });

  /* FRONTEND_event_invitation_send_2026-10-15.md §2: event_id is
     `selectedEvent.id ?? selectedEvent._id`. */
  it("takes the Mongo _id when the event has no id", async () => {
    const api = { post: vi.fn(() => Promise.resolve({ data: { ok: true, results: [] } })) };
    await sendEventInvitations(api, { companyId: 7, event: { _id: "mongo-1" }, members: [row(10)] });
    expect(api.post.mock.calls[0][1].event_id).toBe("mongo-1");
  });

  it("reads each row's failure, matching ids as strings", async () => {
    const api = {
      post: () =>
        Promise.resolve({
          data: {
            ok: true,
            results: [
              { member_id: "10", ok: true },
              { member_id: "12", ok: false, error: "Missing guardian email for this minor member." },
            ],
          },
        }),
    };
    const twelve = row(12);
    const outcome = await sendEventInvitations(api, {
      companyId: 7,
      event,
      members: [row(10), twelve],
    });
    expect(outcome.sent).toBe(1);
    expect(outcome.failures).toEqual([
      { member: twelve, reason: "Missing guardian email for this minor member." },
    ]);
  });

  it("does not send a member the table already knows cannot be reached", async () => {
    const api = {
      post: vi.fn(() =>
        Promise.resolve({ data: { ok: true, results: [{ member_id: "10", ok: true }] } })
      ),
    };
    const blocked = row(11, { _recipient: { error: "No guardian email on file." } });
    const outcome = await sendEventInvitations(api, {
      companyId: 7,
      event,
      members: [row(10), blocked],
    });
    expect(api.post.mock.calls[0][1].member_ids).toEqual([10]);
    expect(outcome.failures).toEqual([{ member: blocked, reason: "No guardian email on file." }]);
  });

  it("splits a school-sized selection into the server's batch size", async () => {
    const members = Array.from({ length: INVITATION_SEND_LIMIT + 1 }, (_, i) => row(i + 1));
    const api = {
      post: vi.fn((_path, body) =>
        Promise.resolve({
          data: { ok: true, results: body.member_ids.map((id) => ({ member_id: String(id), ok: true })) },
        })
      ),
    };
    const outcome = await sendEventInvitations(api, { companyId: 7, event, members });
    expect(api.post).toHaveBeenCalledTimes(2);
    expect(api.post.mock.calls[0][1].member_ids).toHaveLength(INVITATION_SEND_LIMIT);
    expect(api.post.mock.calls[1][1].member_ids).toEqual([INVITATION_SEND_LIMIT + 1]);
    expect(outcome).toEqual({ sent: INVITATION_SEND_LIMIT + 1, alreadyInvited: [], failures: [], refused: null });
  });

  /* §5 of the backend's note: a 401, 403, 404 or 500 means nothing went out.
     The modal says so once, with the server's msg, and leaves the selection
     alone; `refused` is what tells it apart from per-member failures. */
  it("a request refused outright is reported once, as `refused`", async () => {
    const api = {
      post: () => Promise.reject({ response: { status: 404, data: { msg: "Event not found" } } }),
    };
    const ten = row(10);
    const outcome = await sendEventInvitations(api, { companyId: 7, event, members: [ten] });
    expect(outcome).toEqual({
      sent: 0,
      alreadyInvited: [],
      failures: [{ member: ten, reason: "Event not found" }],
      refused: "Event not found",
    });
  });

  it("a later batch refused after earlier ones went out is per member, not `refused`", async () => {
    const members = Array.from({ length: INVITATION_SEND_LIMIT + 1 }, (_, i) => row(i + 1));
    let call = 0;
    const api = {
      post: (_path, body) =>
        call++ === 0
          ? Promise.resolve({
              data: { ok: true, results: body.member_ids.map((id) => ({ member_id: String(id), ok: true })) },
            })
          : Promise.reject({ response: { status: 500, data: { msg: "Could not send the invitations." } } }),
    };
    const outcome = await sendEventInvitations(api, { companyId: 7, event, members });
    expect(outcome.sent).toBe(INVITATION_SEND_LIMIT);
    expect(outcome.refused).toBeNull();
    expect(outcome.failures).toEqual([
      { member: members.at(-1), reason: "Could not send the invitations." },
    ]);
  });

  it("does not count as sent a member the server did not answer for", async () => {
    const api = { post: () => Promise.resolve({ data: { ok: true, results: [] } }) };
    const ten = row(10);
    const outcome = await sendEventInvitations(api, { companyId: 7, event, members: [ten] });
    expect(outcome.sent).toBe(0);
    expect(outcome.failures[0].member).toBe(ten);
  });
});

/* 2026-10-16, backend f808e9d (W2), in production: /send no longer emails a
   member who already has a live invitation. Their row comes back
   `{ ok: true, skipped: "already_invited" }`, and `resend: true` sends a new
   link that voids the old one. Counting a skipped row as sent would say an
   email went out when none did. */
describe("sendEventInvitations — members who already have an invitation", () => {
  const row = (id) => ({
    member_id: id,
    key: id,
    first_name: `First${id}`,
    last_name: `Last${id}`,
    _recipient: { email: `m${id}@x.com` },
  });

  it("reports a skipped member as already invited, not as sent or failed", async () => {
    const api = {
      post: () =>
        Promise.resolve({
          data: {
            ok: true,
            results: [
              { member_id: "10", ok: true },
              { member_id: "11", ok: true, skipped: "already_invited" },
            ],
          },
        }),
    };
    const eleven = row(11);
    const outcome = await sendEventInvitations(api, { companyId: 7, event, members: [row(10), eleven] });
    expect(outcome.sent).toBe(1);
    expect(outcome.alreadyInvited).toEqual([eleven]);
    expect(outcome.failures).toEqual([]);
  });

  it("asks for a new link only when told to resend", async () => {
    const api = { post: vi.fn(() => Promise.resolve({ data: { ok: true, results: [] } })) };
    await sendEventInvitations(api, { companyId: 7, event, members: [row(10)] });
    await sendEventInvitations(api, { companyId: 7, event, members: [row(10)], resend: true });
    expect(api.post.mock.calls[0][1]).not.toHaveProperty("resend");
    expect(api.post.mock.calls[1][1].resend).toBe(true);
  });
});

describe("invitationSendNotice", () => {
  const member = (id) => ({ first_name: `First${id}`, last_name: `Last${id}` });

  it("all sent", () => {
    expect(invitationSendNotice({ sent: 3, alreadyInvited: [], failures: [], total: 3 })).toEqual({
      type: "success",
      title: "3 invitations sent",
    });
  });

  it("says who already had an invitation, and how to send a new one", () => {
    const notice = invitationSendNotice({
      sent: 2,
      alreadyInvited: [member(1), member(2), member(3)],
      failures: [],
      total: 5,
    });
    expect(notice.type).toBe("info");
    expect(notice.title).toBe("2 sent · 3 already had an invitation");
    expect(notice.description).toMatch(/Resend/);
    expect(notice.description).toMatch(/previous link stops working/);
  });

  it("a failure makes it a warning and names each one", () => {
    const notice = invitationSendNotice({
      sent: 1,
      alreadyInvited: [member(2)],
      failures: [{ member: member(3), reason: "Member has no email address." }],
      total: 3,
    });
    expect(notice.type).toBe("warning");
    expect(notice.title).toBe("1 of 3 sent · 1 already had an invitation");
    expect(notice.description).toContain("First3 Last3: Member has no email address.");
  });

  it("one invitation reads in the singular", () => {
    expect(invitationSendNotice({ sent: 1, alreadyInvited: [], failures: [], total: 1 }).title).toBe(
      "1 invitation sent"
    );
  });
});
