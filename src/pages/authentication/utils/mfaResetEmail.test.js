import { describe, expect, it } from "vitest";
import { readMfaSetupChallenge } from "./mfaEnrollment";
import { maskEmail, readMfaResetEmailChallenge } from "./mfaResetEmail";

// FedRAMP A5 · IA-5: after an admin resets someone's MFA, the right password
// alone no longer hands out a setup token. The person has to follow the
// password-reset link the server emailed them
// (BACKEND_fedramp_a5_reset_email_step_REPLY_2026-10-30.md §2, prod fdd5de2).
const refusal = (data, status = 403) => ({ response: { status, data } });
const resetBody = {
  ok: false,
  msg: "Your MFA was reset. Follow the link we emailed you to set it up again.",
  mfaSetupRequired: true,
  mfaResetEmailRequired: true,
};

describe("readMfaResetEmailChallenge", () => {
  it("recognises the refused login of an account whose MFA was reset", () => {
    expect(readMfaResetEmailChallenge(refusal(resetBody))).toEqual({
      message: resetBody.msg,
    });
  });

  it("has its own words when the server sends none", () => {
    expect(
      readMfaResetEmailChallenge(refusal({ ...resetBody, msg: undefined })).message,
    ).toMatch(/link we emailed you/i);
  });

  it("is not the enrolment challenge: there is no setup token to enrol with", () => {
    expect(readMfaSetupChallenge(refusal(resetBody))).toBeNull();
  });

  it("ignores every other failure, including a plain MFA setup challenge", () => {
    expect(readMfaResetEmailChallenge(refusal({ mfaSetupRequired: true, mfaSetupToken: "t" }))).toBeNull();
    expect(readMfaResetEmailChallenge(refusal({ msg: "Incorrect password" }, 400))).toBeNull();
    expect(readMfaResetEmailChallenge(new Error("Network Error"))).toBeNull();
    expect(readMfaResetEmailChallenge(undefined)).toBeNull();
  });
});

describe("maskEmail", () => {
  it("keeps the first letter and the domain", () => {
    expect(maskEmail("ada@x.com")).toBe("a•••@x.com");
    expect(maskEmail("  Grace.Hopper@navy.mil ")).toBe("G•••@navy.mil");
  });

  it("returns an empty string for anything that is not an address", () => {
    expect(maskEmail("")).toBe("");
    expect(maskEmail("no-at-sign")).toBe("");
    expect(maskEmail("@x.com")).toBe("");
    expect(maskEmail(null)).toBe("");
  });
});
