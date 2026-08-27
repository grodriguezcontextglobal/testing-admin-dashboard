import { describe, expect, it } from "vitest";
import {
  describeInvitation,
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
