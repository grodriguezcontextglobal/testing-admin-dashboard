import { describe, expect, it, vi } from "vitest";
import {
  EVENT_INVITATION_CONFIRM_PATH,
  INVITATION_RESPONSE_PATH,
  buildInvitationResponse,
  confirmInvitationWithToken,
  confirmationFailure,
  readLinkToken,
  describeInvitation,
  recordInvitationResponse,
  isAlreadyInEvent,
  readConfirmationError,
  readExistingConsumer,
  writeSucceeded,
} from "./attendanceConfirmation";

const adult = {
  memberFirstName: "Marcus",
  memberLastName: "Webb",
  memberEmail: "marcus@x.com",
  eventName: "Science Fair",
  company: "Summit Unified",
  eventId: "evt-1",
  minor: false,
};

const minor = {
  ...adult,
  memberFirstName: "Ada",
  memberLastName: "Lovelace",
  minor: true,
  guardianEmail: "mum@x.com",
};

describe("describeInvitation", () => {
  it("names who is inviting, which the page never showed", () => {
    // `company` was parsed off the URL and rendered nowhere, so an
    // unauthenticated page asked for a confirmation with no idea who was asking.
    expect(describeInvitation(adult).invitedLine).toBe(
      "Marcus Webb is invited by Summit Unified to Science Fair."
    );
  });

  it("drops the company clause rather than saying 'by  '", () => {
    expect(describeInvitation({ ...adult, company: "" }).invitedLine).toBe(
      "Marcus Webb is invited to Science Fair."
    );
  });

  it("says the guardian is the one confirming, for a minor", () => {
    // Which is what the write has always done, and what the page never said.
    const described = describeInvitation(minor);
    expect(described.heading).toBe("Confirm your child's attendance");
    expect(described.roleLine).toBe(
      "You are confirming as Ada Lovelace's parent or guardian (mum@x.com)."
    );
  });

  it("says nothing about a guardian for an adult", () => {
    expect(describeInvitation(adult).roleLine).toBeNull();
    expect(describeInvitation(adult).heading).toBe("Confirm your attendance");
  });

  it("omits the guardian email when the link did not carry one", () => {
    expect(describeInvitation({ ...minor, guardianEmail: "" }).roleLine).toBe(
      "You are confirming as Ada Lovelace's parent or guardian."
    );
  });

  it("falls back to the email when there is no name", () => {
    expect(
      describeInvitation({ ...adult, memberFirstName: "", memberLastName: "" })
        .memberName
    ).toBe("marcus@x.com");
  });

  it("does not throw on nothing", () => {
    expect(describeInvitation(undefined).memberName).toBe("");
  });
});

describe("isAlreadyInEvent", () => {
  it("matches an id the record stores as a number", () => {
    /* The id off the URL is always a string. `===` against a numeric
       event_providers entry reported "not confirmed" for somebody who was, and
       the page offered to confirm them again. */
    expect(isAlreadyInEvent({ event_providers: [77] }, "77")).toBe(true);
  });

  it("matches a plain string id", () => {
    expect(isAlreadyInEvent({ event_providers: ["evt-1"] }, "evt-1")).toBe(true);
  });

  it("is false for a different event", () => {
    expect(isAlreadyInEvent({ event_providers: ["evt-2"] }, "evt-1")).toBe(false);
  });

  it("is false for a record with no events, and for no event asked about", () => {
    expect(isAlreadyInEvent({}, "evt-1")).toBe(false);
    expect(isAlreadyInEvent({ event_providers: ["evt-1"] }, "")).toBe(false);
    expect(isAlreadyInEvent(undefined, "evt-1")).toBe(false);
  });
});

describe("readExistingConsumer", () => {
  it("takes the newest record, as CreateNewUser does", () => {
    expect(
      readExistingConsumer({
        data: { ok: true, users: [{ id: "a" }, { id: "b" }] },
      })
    ).toEqual({ id: "b" });
  });

  it("is null when the lookup found nobody", () => {
    expect(readExistingConsumer({ data: { ok: true, users: [] } })).toBeNull();
  });

  it("is null when the lookup itself did not succeed", () => {
    expect(readExistingConsumer({ data: { ok: false } })).toBeNull();
    expect(readExistingConsumer(undefined)).toBeNull();
  });
});

describe("writeSucceeded", () => {
  it("refuses a 200 that says ok:false", () => {
    /* `POST /auth/new` answers 200 with `{ ok: false }` when it refuses. The
       page went on to create the SQL consumer and reported the attendance
       confirmed for a person who had not been created. */
    expect(writeSucceeded({ data: { ok: false, msg: "Email in use" } })).toBe(false);
  });

  it("accepts a response that does not carry ok at all", () => {
    // Several of these endpoints answer with the record and no `ok`.
    expect(writeSucceeded({ data: { id: "usr-1" } })).toBe(true);
    expect(writeSucceeded({ data: { ok: true } })).toBe(true);
  });

  it("refuses an empty response", () => {
    expect(writeSucceeded({})).toBe(false);
    expect(writeSucceeded(undefined)).toBe(false);
  });
});

describe("readConfirmationError", () => {
  it("prefers the server's own reason", () => {
    expect(readConfirmationError({ response: { data: { msg: "Event is full." } } })).toBe(
      "Event is full."
    );
  });

  it("falls back to the thrown error, then to a sentence of its own", () => {
    expect(readConfirmationError(new Error("Network Error"))).toBe("Network Error");
    expect(readConfirmationError({})).toBe("Something went wrong. Please try again.");
  });
});

/* 2026-09-29 `48:52`: "you need to log everything, like when the parent
   clicked". The page is public, so the response is sent to its own route and
   the server stamps the time; the client time rides along only for context. */
describe("buildInvitationResponse", () => {
  const now = new Date("2026-10-08T14:00:00.000Z");
  const link = {
    memberEmail: "timmy@x.com",
    memberId: "42",
    eventId: "evt-1",
    eventName: "Science Fair",
    companyId: "co-1",
  };

  it("names the guardian as the one responding for a minor", () => {
    expect(
      buildInvitationResponse(
        { ...link, minor: true, guardianEmail: "mum@x.com" },
        "confirmed",
        { now }
      )
    ).toEqual({
      company_id: "co-1",
      event_id: "evt-1",
      event_name: "Science Fair",
      member_id: "42",
      member_email: "timmy@x.com",
      responder_email: "mum@x.com",
      responder_role: "guardian",
      response: "confirmed",
      client_time: "2026-10-08T14:00:00.000Z",
    });
  });

  it("names the member for an adult, and carries why a confirmation failed", () => {
    const payload = buildInvitationResponse({ ...link, minor: false }, "failed", {
      now,
      reason: "Email already in use.",
    });
    expect(payload.responder_role).toBe("member");
    expect(payload.responder_email).toBe("timmy@x.com");
    expect(payload.reason).toBe("Email already in use.");
  });

  it("sends no member id for a link written before it carried one", () => {
    const { memberId: _unused, ...oldLink } = link;
    expect(_unused).toBe("42");
    expect(buildInvitationResponse(oldLink, "opened", { now }).member_id).toBeNull();
  });
});

describe("recordInvitationResponse", () => {
  it("posts the response to its own route", async () => {
    const api = { post: vi.fn(() => Promise.resolve({ data: { ok: true } })) };
    expect(await recordInvitationResponse(api, { response: "opened" })).toBe(true);
    expect(api.post).toHaveBeenCalledWith(INVITATION_RESPONSE_PATH, { response: "opened" });
  });

  it("never throws: recording the click must not stop the confirmation", async () => {
    // A server without the route answers 404.
    const notDeployed = { post: vi.fn(() => Promise.reject({ response: { status: 404 } })) };
    expect(await recordInvitationResponse(notDeployed, {})).toBe(false);
    const broken = {
      post: () => {
        throw new Error("boom");
      },
    };
    expect(await recordInvitationResponse(broken, {})).toBe(false);
  });
});

/* 2026-10-14 (FRONTEND_attendance_invitation_link_2026-10-14.md): the server
   signs the link, so a recorded response is only trusted when it carries the
   token. With a token, only the two steps the server cannot see are sent —
   /confirm records the confirmation itself and answers 400 to a copy. */
describe("recordInvitationResponse with a signed link", () => {
  it("sends the link token as x-link-token", async () => {
    const api = { post: vi.fn(() => Promise.resolve({ data: { ok: true } })) };
    expect(await recordInvitationResponse(api, { response: "opened" }, "tok-1")).toBe(true);
    expect(api.post).toHaveBeenCalledWith(
      INVITATION_RESPONSE_PATH,
      { response: "opened" },
      { headers: { "x-link-token": "tok-1" } }
    );
  });

  it("does not send what /confirm already recorded", async () => {
    const api = { post: vi.fn(() => Promise.resolve({ data: { ok: true } })) };
    expect(await recordInvitationResponse(api, { response: "confirmed" }, "tok-1")).toBe(false);
    expect(await recordInvitationResponse(api, { response: "already_confirmed" }, "tok-1")).toBe(
      false
    );
    expect(api.post).not.toHaveBeenCalled();
  });
});

describe("readLinkToken", () => {
  it("reads the token from the link, trimmed", () => {
    expect(readLinkToken(new URLSearchParams("token=%20abc%20&eventId=1"))).toBe("abc");
  });

  it("is empty for a link sent before the server signed them", () => {
    expect(readLinkToken(new URLSearchParams("eventId=1"))).toBe("");
    expect(readLinkToken(null)).toBe("");
  });
});

describe("confirmInvitationWithToken", () => {
  it("confirms with the token and nothing else from the URL", async () => {
    const api = { post: vi.fn(() => Promise.resolve({ data: { outcome: "confirmed" } })) };
    expect(await confirmInvitationWithToken(api, "tok-1")).toBe("confirmed");
    expect(api.post).toHaveBeenCalledWith(
      EVENT_INVITATION_CONFIRM_PATH,
      {},
      { headers: { "x-link-token": "tok-1" } }
    );
  });

  it("passes on that the person was already on the event", async () => {
    const api = { post: () => Promise.resolve({ data: { outcome: "already" } }) };
    expect(await confirmInvitationWithToken(api, "tok-1")).toBe("already");
  });

  it("does not report a confirmation the server did not state", async () => {
    const api = { post: () => Promise.resolve({ data: { ok: false } }) };
    await expect(confirmInvitationWithToken(api, "tok-1")).rejects.toThrow();
  });
});

describe("confirmationFailure", () => {
  it("an expired or forged link cannot be retried", () => {
    expect(confirmationFailure({ response: { status: 401 } }).state).toBe("expired");
  });

  it("a link already used cannot be retried", () => {
    expect(confirmationFailure({ response: { status: 410 } }).state).toBe("used");
  });

  it("anything else keeps the link and offers Try again", () => {
    const failure = confirmationFailure({
      response: { status: 500, data: { msg: "Database unavailable." } },
    });
    expect(failure).toEqual({ state: "retry", message: "Database unavailable." });
  });
});
