import { describe, expect, it } from "vitest";

import { parseConfirmationParams } from "../../conditionalPage/utils/eventRegistrationUtils";
import { describeInvitation } from "./attendanceConfirmation";

/* 2026-10-15, first end-to-end test of a server-signed invitation: the page
   said "This confirmation link is invalid or incomplete". It required
   memberEmail, eventId, eventName, company and companyId in the URL, as the
   browser-built links had. With a token the server decides from the token
   (/confirm) and those values only label the page, so a missing one, such as
   memberEmail for a minor with no email of their own, must not lock the
   guardian out. */
const signed = (params) => new URLSearchParams({ token: "tok-1", ...params });

describe("a signed invitation link", () => {
  it("is usable with the token alone", () => {
    const parsed = parseConfirmationParams(signed({}));
    expect(parsed.error).toBeUndefined();
  });

  it("is usable when only the member's email is missing", () => {
    const parsed = parseConfirmationParams(
      signed({ memberFirstName: "Juan", eventId: "e1", eventName: "Trip", company: "School", companyId: "c1", minor: "true" })
    );
    expect(parsed.error).toBeUndefined();
    expect(parsed.memberFirstName).toBe("Juan");
    expect(parsed.minor).toBe(true);
  });

  it("an unsigned link still needs every value, because the page itself writes with them", () => {
    expect(parseConfirmationParams(new URLSearchParams({ eventId: "e1" })).error).toMatch(/invalid or incomplete/);
  });
});

describe("describeInvitation with values missing", () => {
  it("never prints an empty name or event", () => {
    const line = describeInvitation({}).invitedLine;
    expect(line).toBe("You are invited to an event.");
  });

  it("speaks to the guardian when the child's name is missing", () => {
    const description = describeInvitation({ minor: true, eventName: "Trip", company: "School" });
    expect(description.invitedLine).toBe("Your child is invited by School to Trip.");
    expect(description.roleLine).toBe("You are confirming as their parent or guardian.");
  });

  it("the confirmed and already-confirmed headings read without a name or event", () => {
    expect(describeInvitation({ minor: true }).goingLine).toBe("Your child is going to the event");
    expect(describeInvitation({}).alreadyLine).toBe("You are already going to the event");
    expect(describeInvitation({ memberFirstName: "Juan", eventName: "Trip" }).goingLine).toBe(
      "Juan is going to Trip"
    );
  });

  it("keeps the full sentence when everything is there", () => {
    expect(
      describeInvitation({ memberFirstName: "Juan", memberLastName: "Pérez", eventName: "Trip", company: "School" })
        .invitedLine
    ).toBe("Juan Pérez is invited by School to Trip.");
  });
});
