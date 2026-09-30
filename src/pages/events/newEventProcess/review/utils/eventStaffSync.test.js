import { describe, expect, it, vi } from "vitest";
import { isAlreadyLinked, staffToLink, syncEventStaff } from "./eventStaffSync";

/**
 * Reported 2026-09-30: finishing a resumed draft failed with a 408, because
 * the review step inserted again the staff that the first attempt had already
 * linked to the event. Unchanged staff must not stop the event from being
 * created.
 *
 * Underneath it, a second bug: the loop read `employeeStaff.entries()`, whose
 * keys are array INDEXES, and passed them as the email — so it looked staff up
 * by `email: 0`, `email: 1`… instead of by their address.
 */

const staff = {
  adminUser: [
    { email: "Fredrik@x.com", firstName: "Fredrik", lastName: "S", role: "Administrator" },
  ],
  headsetAttendees: [
    { email: "cesar@x.com", firstName: "Cesar", lastName: "C", role: "Headset attendee" },
    // Listed twice (both lists): linked once, with the first role.
    { email: "fredrik@x.com ", firstName: "Fredrik", lastName: "S", role: "Headset attendee" },
  ],
};

describe("staffToLink", () => {
  it("is every person once, by their email — not by their position in the list", () => {
    expect(staffToLink(staff)).toEqual([
      { email: "fredrik@x.com", firstName: "Fredrik", lastName: "S", role: "Administrator" },
      { email: "cesar@x.com", firstName: "Cesar", lastName: "C", role: "Headset attendee" },
    ]);
  });

  it("tolerates missing lists and entries without an email", () => {
    expect(staffToLink({ adminUser: [{ firstName: "No email" }] })).toEqual([]);
    expect(staffToLink(undefined)).toEqual([]);
  });
});

describe("isAlreadyLinked", () => {
  it("recognises the server saying the staff member is already on the event", () => {
    expect(isAlreadyLinked({ response: { status: 408 } })).toBe(true);
    expect(isAlreadyLinked({ response: { status: 409 } })).toBe(true);
    expect(isAlreadyLinked({ response: { status: 400, data: { msg: "Duplicate entry '12-5'" } } })).toBe(true);
  });

  it("does not hide any other failure", () => {
    expect(isAlreadyLinked({ response: { status: 500, data: { msg: "boom" } } })).toBe(false);
    expect(isAlreadyLinked(new Error("Network Error"))).toBe(false);
  });
});

describe("syncEventStaff", () => {
  const client = ({ existing = {}, linkError } = {}) => {
    let nextId = 100;
    return {
      post: vi.fn(async (url, body) => {
        if (url === "/db_staff/consulting-member") {
          return { data: { member: existing[body.email] ? [{ staff_id: existing[body.email] }] : [] } };
        }
        if (url === "/db_staff/new_member") return { data: { member: { insertId: nextId++ } } };
        if (url === "/db_event/event_staff") {
          const failure = linkError?.(body);
          if (failure) throw failure;
          return { data: { ok: true } };
        }
        throw new Error(`unexpected ${url}`);
      }),
    };
  };

  it("looks each person up by their email", async () => {
    const api = client({ existing: { "fredrik@x.com": 5, "cesar@x.com": 6 } });
    await syncEventStaff({ api, eventId: 88, staff });
    const lookups = api.post.mock.calls
      .filter(([url]) => url === "/db_staff/consulting-member")
      .map(([, body]) => body.email);
    expect(lookups).toEqual(["fredrik@x.com", "cesar@x.com"]);
  });

  it("links existing staff, and creates the ones the company does not have yet", async () => {
    const api = client({ existing: { "fredrik@x.com": 5 } });
    const result = await syncEventStaff({ api, eventId: 88, staff });

    expect(api.post).toHaveBeenCalledWith("/db_event/event_staff", {
      event_id: 88,
      staff_id: 5,
      role: "Administrator",
    });
    expect(api.post).toHaveBeenCalledWith(
      "/db_staff/new_member",
      expect.objectContaining({ email: "cesar@x.com", first_name: "Cesar" })
    );
    expect(result).toEqual({ linked: ["fredrik@x.com", "cesar@x.com"], alreadyLinked: [] });
  });

  /* The reported case: the first attempt linked them, the second must go on. */
  it("goes on past staff already on the event instead of failing", async () => {
    const api = client({
      existing: { "fredrik@x.com": 5, "cesar@x.com": 6 },
      linkError: (body) =>
        body.staff_id === 5 ? { response: { status: 408, data: { msg: "Already exists" } } } : null,
    });
    const result = await syncEventStaff({ api, eventId: 88, staff });
    expect(result).toEqual({ linked: ["cesar@x.com"], alreadyLinked: ["fredrik@x.com"] });
  });

  it("still stops on a real failure", async () => {
    const api = client({
      existing: { "fredrik@x.com": 5 },
      linkError: () => ({ response: { status: 500, data: { msg: "boom" } } }),
    });
    await expect(syncEventStaff({ api, eventId: 88, staff })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });
});
