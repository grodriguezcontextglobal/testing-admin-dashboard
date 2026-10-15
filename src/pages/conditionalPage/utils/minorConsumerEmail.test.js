import { describe, expect, it, vi } from "vitest";

import { consumerEmailFor } from "./minorConsumerEmail";
import {
  buildConfirmationLink,
  getDirectAddTarget,
  registerConsumerToEvent,
} from "./eventRegistrationUtils";

/* 2026-10-15: a minor registered with a guardian email but no email of their
   own could not be put on an event. The event's consumer is looked up and
   created by email, so "Add directly" refused the row, and the invitation's
   link went out without the memberEmail the landing requires. Decision
   (Gustavo, same day): the guardian's address with a +m<member_id> tag. It is
   unique per child, so siblings stay two consumers, and mail still reaches
   the guardian. */
const minor = {
  member_id: 1234,
  first_name: "Juan",
  last_name: "Pérez",
  email: "",
  minor: 1,
  parent_guardian_email: "maria@gmail.com",
};

describe("consumerEmailFor", () => {
  it("uses the member's own email when there is one", () => {
    expect(consumerEmailFor({ ...minor, email: " juan@school.org " })).toBe("juan@school.org");
  });

  it("a minor without one gets the guardian's address tagged with the member id", () => {
    expect(consumerEmailFor(minor)).toBe("maria+m1234@gmail.com");
  });

  it("siblings with the same guardian stay two consumers", () => {
    expect(consumerEmailFor({ ...minor, member_id: 1235 })).toBe("maria+m1235@gmail.com");
    expect(consumerEmailFor({ ...minor, member_id: 1235 })).not.toBe(consumerEmailFor(minor));
  });

  it("reads minor the way the rest of the module does (number, string, boolean)", () => {
    for (const flag of [1, "1", true]) {
      expect(consumerEmailFor({ ...minor, minor: flag })).toBe("maria+m1234@gmail.com");
    }
  });

  it("an adult without email is still missing one: no guardian stands in", () => {
    expect(consumerEmailFor({ ...minor, minor: 0 })).toBeNull();
  });

  it("is null when there is nothing safe to build it from", () => {
    expect(consumerEmailFor({ ...minor, parent_guardian_email: "" })).toBeNull();
    expect(consumerEmailFor({ ...minor, parent_guardian_email: "not-an-email" })).toBeNull();
    expect(consumerEmailFor({ ...minor, member_id: undefined })).toBeNull();
    expect(consumerEmailFor({ ...minor, member_id: "12 34" })).toBeNull();
    expect(consumerEmailFor(undefined)).toBeNull();
  });
});

describe("a minor with only a guardian email can go on an event", () => {
  it("Add directly accepts the row", () => {
    expect(getDirectAddTarget(minor)).toEqual({
      email: "maria+m1234@gmail.com",
      isGuardian: false,
      error: null,
    });
  });

  it("Add directly still refuses a minor with no email anywhere", () => {
    expect(getDirectAddTarget({ ...minor, parent_guardian_email: "" }).error).toMatch(/email/i);
  });

  it("the invitation link carries the consumer email the landing requires", () => {
    const link = new URL(
      buildConfirmationLink("https://admin.devitrak.net", minor, { id: "e1", eventName: "Trip" }, { id: "c1", name: "School" })
    );
    expect(link.searchParams.get("memberEmail")).toBe("maria+m1234@gmail.com");
    expect(link.searchParams.get("guardianEmail")).toBe("maria@gmail.com");
  });

  it("registers the consumer under that email, created and looked up the same way", async () => {
    const api = {
      post: vi.fn(async (url) =>
        url === "/auth/user-query" ? { data: { ok: true, users: [] } } : { data: { ok: true } }
      ),
      patch: vi.fn(),
    };

    await registerConsumerToEvent(api, {
      member: minor,
      event: { id: "e1", eventName: "Trip" },
      company: { id: "c1", name: "School" },
    });

    const calls = Object.fromEntries(api.post.mock.calls.map(([url, body]) => [url, body]));
    expect(calls["/auth/user-query"]).toEqual({ email: "maria+m1234@gmail.com" });
    expect(calls["/auth/new"].email).toBe("maria+m1234@gmail.com");
    expect(calls["/auth/new"].name).toBe("Juan");
    expect(calls["/db_consumer/new_consumer"].email).toBe("maria+m1234@gmail.com");
  });
});
