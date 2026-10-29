import { describe, expect, it } from "vitest";
import {
  MFA_RESET_CONFIRMATION,
  mfaResetErrorMessage,
} from "./mfaReset";

// FedRAMP A5 · IA-5: POST /api/admin/mfa/reset/:adminUserId, for someone who
// lost both the phone and the recovery codes
// (FRONTEND_fedramp_a5_mfa_recovery_2026-10-27.md §2).
describe("MFA_RESET_CONFIRMATION", () => {
  it("tells the admin to check the person's identity another way first", () => {
    expect(MFA_RESET_CONFIRMATION.description).toMatch(/identity/i);
    expect(MFA_RESET_CONFIRMATION.description).toMatch(/phone call|in person/i);
  });

  it("says what happens to the person's sessions and next sign-in", () => {
    expect(MFA_RESET_CONFIRMATION.description).toMatch(/signed out/i);
    expect(MFA_RESET_CONFIRMATION.description).toMatch(/set up MFA again/i);
  });
});

describe("mfaResetErrorMessage", () => {
  it("shows the server's reason for a 403", () => {
    const err = { response: { status: 403, data: { msg: "User belongs to other companies" } } };
    expect(mfaResetErrorMessage(err)).toBe("User belongs to other companies");
  });

  it("explains a 403 without a reason", () => {
    expect(mfaResetErrorMessage({ response: { status: 403, data: {} } })).toMatch(
      /not allowed/i
    );
  });

  it("explains a 404 as someone outside this company", () => {
    expect(mfaResetErrorMessage({ response: { status: 404, data: {} } })).toMatch(
      /not part of this company/i
    );
  });

  it("falls back to a generic message", () => {
    expect(mfaResetErrorMessage(new Error("Network Error"))).toMatch(/try again/i);
  });
});
