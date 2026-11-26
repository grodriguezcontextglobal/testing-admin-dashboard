import { describe, it, expect } from "vitest";
import {
  GATE_ALLOW,
  GATE_REFUSE,
  GATE_WAIT,
  platformGateVerdict,
  platformMeAccess,
} from "./platformGate";

const refusal = (status) => ({ response: { status } });

describe("platformMeAccess", () => {
  it("reads the agreed { ok, data: { platformAccess } } body", () => {
    expect(platformMeAccess({ ok: true, data: { platformAccess: true } })).toBe(true);
    expect(platformMeAccess({ ok: true, data: { platformAccess: false } })).toBe(false);
  });

  it("is true only for a real boolean, never for a truthy string", () => {
    // The sign-in field has the same rule (roles.js). A server that starts
    // sending "true" is a contract change we should see, not one we absorb.
    expect(platformMeAccess({ data: { platformAccess: "true" } })).toBe(false);
    expect(platformMeAccess({ data: { platformAccess: 1 } })).toBe(false);
  });

  it("never throws on a body that is not the agreed shape", () => {
    expect(platformMeAccess(undefined)).toBe(false);
    expect(platformMeAccess(null)).toBe(false);
    expect(platformMeAccess({})).toBe(false);
    expect(platformMeAccess({ platformAccess: true })).toBe(false);
  });
});

describe("platformGateVerdict", () => {
  it("refuses without asking when the sign-in hint says no", () => {
    expect(platformGateVerdict({ hint: false, isLoading: true })).toBe(GATE_REFUSE);
    expect(platformGateVerdict({})).toBe(GATE_REFUSE);
  });

  it("waits while the first answer is in flight", () => {
    expect(platformGateVerdict({ hint: true, isLoading: true })).toBe(GATE_WAIT);
  });

  it("allows when the server says the access is still there", () => {
    expect(platformGateVerdict({ hint: true, data: { data: { platformAccess: true } } })).toBe(
      GATE_ALLOW,
    );
  });

  it("refuses when the server says the access is gone", () => {
    // The whole point of asking: the sign-in hint said yes, and it is stale.
    expect(platformGateVerdict({ hint: true, data: { data: { platformAccess: false } } })).toBe(
      GATE_REFUSE,
    );
  });

  it.each([401, 403])("treats %i as the server refusing, not as a failure to ask", (status) => {
    expect(platformGateVerdict({ hint: true, error: refusal(status) })).toBe(GATE_REFUSE);
  });

  it("refuses on a 401 that arrives while an older success is still cached", () => {
    // A revocation lands on a background refetch: React Query keeps the last
    // good data beside the new error. The error is the newer answer.
    expect(
      platformGateVerdict({
        hint: true,
        data: { data: { platformAccess: true } },
        error: refusal(401),
      }),
    ).toBe(GATE_REFUSE);
  });

  it.each([500, 502, 404, 408, 429])(
    "keeps the hint's answer when %i means we could not ask",
    (status) => {
      // A blip, a deploy, a rate limit, a route that is not there on this
      // host: none of those is the server saying no. Locking every operator
      // out of a read-only console over them would be worse than the stale
      // copy we are replacing -- and every /api/platform request behind this
      // screen is still checked server-side, so nothing is exposed.
      expect(platformGateVerdict({ hint: true, error: refusal(status) })).toBe(GATE_ALLOW);
    },
  );

  it("keeps the hint's answer when the network never answered at all", () => {
    expect(platformGateVerdict({ hint: true, error: new Error("Network Error") })).toBe(GATE_ALLOW);
  });

  it("waits rather than guessing when there is no answer and no error yet", () => {
    expect(platformGateVerdict({ hint: true })).toBe(GATE_WAIT);
  });
});
