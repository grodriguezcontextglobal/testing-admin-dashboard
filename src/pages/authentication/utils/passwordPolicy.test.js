import { describe, expect, it } from "vitest";
import {
  PASSWORD_LENGTH_MESSAGE,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  PASSWORD_RULES,
  buildPasswordUpdatePayload,
  buildResetEmailRequest,
  checkPassword,
  describePasswordUpdateError,
  newPasswordSchema,
  passwordStrength,
  readPasswordMfaOutcome,
} from "./passwordPolicy";

describe("checkPassword", () => {
  // FRONTEND_login_lockout_password_policy_2026-10-21.md §2: the server takes
  // 12 to 128 characters of anything. Length is the only rule (NIST 800-63B).
  it("has length as its only rule", () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual(["length"]);
    expect(PASSWORD_MIN_LENGTH).toBe(12);
    expect(PASSWORD_MAX_LENGTH).toBe(128);
  });

  it("accepts 12 and 128 characters, and nothing outside them", () => {
    expect(checkPassword("a".repeat(11)).isValid).toBe(false);
    expect(checkPassword("a".repeat(12)).isValid).toBe(true);
    expect(checkPassword("a".repeat(128)).isValid).toBe(true);
    expect(checkPassword("a".repeat(129)).isValid).toBe(false);
  });

  it("asks for no uppercase, number or symbol", () => {
    expect(checkPassword("correct horse battery").isValid).toBe(true);
  });

  it("counts spaces like any other character, untrimmed", () => {
    expect(checkPassword("  abcdefghij").isValid).toBe(true);
  });

  it("refuses an empty or missing password", () => {
    expect(checkPassword("")).toMatchObject({ isValid: false, metCount: 0 });
    expect(checkPassword(undefined).isValid).toBe(false);
  });

  it("states the server's wording", () => {
    expect(PASSWORD_LENGTH_MESSAGE).toBe("Password must have between 12 and 128 characters.");
  });
});

describe("passwordStrength", () => {
  it("is empty before anything is typed", () => {
    expect(passwordStrength("")).toEqual({ percent: 0, label: "", tone: "none" });
  });

  it("fills with length until the minimum", () => {
    expect(passwordStrength("abc")).toMatchObject({ percent: 25, label: "Too short", tone: "danger" });
    expect(passwordStrength("a".repeat(9))).toMatchObject({ percent: 75, label: "Too short", tone: "warning" });
    expect(passwordStrength("a".repeat(12))).toMatchObject({ percent: 100, label: "Long enough", tone: "success" });
  });

  it("flags a password over the maximum", () => {
    expect(passwordStrength("a".repeat(129))).toMatchObject({ percent: 100, label: "Too long", tone: "danger" });
  });
});

describe("newPasswordSchema", () => {
  const validate = (values) =>
    newPasswordSchema
      .validate(values, { abortEarly: false })
      .then(() => [])
      .catch((error) => error.inner.map((issue) => issue.message));

  it("passes a valid, confirmed password", async () => {
    expect(await validate({ password: "abcdefghijkl", password2: "abcdefghijkl" })).toEqual([]);
  });

  it("rejects a short password with the length message", async () => {
    expect(await validate({ password: "Abcdef1!", password2: "Abcdef1!" })).toEqual([
      PASSWORD_LENGTH_MESSAGE,
    ]);
  });

  it("rejects a confirmation that does not match", async () => {
    expect(await validate({ password: "abcdefghijkl", password2: "abcdefghijkm" })).toEqual([
      "Passwords must match",
    ]);
  });
});

describe("buildPasswordUpdatePayload", () => {
  it("identifies a signed-in account by email, with the code as digits", () => {
    expect(
      buildPasswordUpdatePayload({ email: "a@b.co", password: "Abcdef1!", mfaCode: " 123 456 " }),
    ).toEqual({ email: "a@b.co", password: "Abcdef1!", mfaCode: "123456" });
  });

  it("sends the email from a reset link rather than its uid", () => {
    expect(
      buildPasswordUpdatePayload({
        uid: "abc123",
        email: " a@b.co ",
        password: "Abcdef1!",
        mfaCode: "123456",
      }),
    ).toEqual({ email: "a@b.co", password: "Abcdef1!", mfaCode: "123456" });
  });

  it("falls back to the uid of an older link that carries no email", () => {
    expect(
      buildPasswordUpdatePayload({ uid: "abc123", email: null, password: "Abcdef1!", mfaCode: "123456" }),
    ).toEqual({ uid: "abc123", password: "Abcdef1!", mfaCode: "123456" });
  });

  // The server builds and signs the link itself and ignores one sent by the
  // client; the email is all it needs (FRONTEND_password_reset_sin_mfa).
  it("asks for the reset email with the address alone, trimmed", () => {
    expect(buildResetEmailRequest("  ana+1@b.co ")).toEqual({
      contactInfo: { email: "ana+1@b.co" },
    });
  });

  it("leaves the code out when there is none, to ask the server whether the account has MFA", () => {
    expect(buildPasswordUpdatePayload({ email: "a@b.co", password: "Abcdef1!" })).toEqual({
      email: "a@b.co",
      password: "Abcdef1!",
    });
  });

  // FRONTEND_password_reset_sin_mfa_2026-10-13.md: with the signed link's
  // token the server takes the account from it and ignores uid and email.
  it("sends only the reset token of a signed link, not uid or email", () => {
    expect(
      buildPasswordUpdatePayload({
        resetToken: "reset.jwt",
        uid: "abc123",
        email: "a@b.co",
        password: "Abcdef1!",
        mfaCode: "123456",
      }),
    ).toEqual({ resetToken: "reset.jwt", password: "Abcdef1!", mfaCode: "123456" });
  });

  it("never sends the current password", () => {
    const payload = buildPasswordUpdatePayload({
      email: "a@b.co",
      password: "Abcdef1!",
      mfaCode: "123456",
      current_password: "old",
    });
    expect(payload).not.toHaveProperty("current_password");
  });
});

describe("describePasswordUpdateError", () => {
  it("says the account has no MFA when the server asks for setup", () => {
    expect(
      describePasswordUpdateError({ response: { status: 403, data: { mfaSetupRequired: true } } }),
    ).toMatch(/doesn't have two-step verification/);
  });

  it("asks for the code when the server says it is missing", () => {
    expect(
      describePasswordUpdateError({ response: { status: 403, data: { mfaRequired: true } } }),
    ).toMatch(/Enter the code/);
  });

  it("does not tell a wrong code from an unknown account, as the server intends", () => {
    expect(
      describePasswordUpdateError({ response: { status: 400, data: { msg: "Invalid email or MFA code" } } }),
    ).toBe("The code or the account isn't valid. Codes expire every 30 seconds — try the one showing now.");
  });

  it("passes any other server message through", () => {
    expect(
      describePasswordUpdateError({ response: { status: 400, data: { error: "Password too short" } } }),
    ).toBe("Password too short");
  });

  it("falls back to a generic message", () => {
    expect(describePasswordUpdateError(new Error("Network Error"))).toBe(
      "We couldn't update your password. Please try again.",
    );
  });
});

describe("readPasswordMfaOutcome", () => {
  const refused = (data, status = 403) => ({ response: { status, data } });

  it("opens the setup with the token the server hands an account without MFA", () => {
    expect(
      readPasswordMfaOutcome(refused({ mfaSetupRequired: true, mfaSetupToken: "setup.jwt" })),
    ).toEqual({ action: "enroll", setupToken: "setup.jwt" });
  });

  // The server's exact answer for an account without MFA (2026-10-13).
  const NO_MFA_ANSWER = {
    ok: false,
    mfaSetupRequired: true,
    msg: "MFA is not enabled on this account. Enable MFA and then send this request again.",
  };

  it("offers the setup on the server's no-MFA answer when signed in", () => {
    expect(readPasswordMfaOutcome(refused(NO_MFA_ANSWER), { hasSession: true })).toEqual({
      action: "enroll",
      setupToken: undefined,
    });
  });

  it("opens the setup on the open session when the user is signed in", () => {
    expect(
      readPasswordMfaOutcome(refused({ mfaSetupRequired: true }), { hasSession: true }),
    ).toEqual({ action: "enroll", setupToken: undefined });
  });

  // Without a session and without a token the client has nothing that
  // authenticates /mfa/generate; offering the setup would only fail later.
  // That is a link sent before the server signed them.
  it("does not offer a setup it cannot authenticate", () => {
    expect(readPasswordMfaOutcome(refused({ mfaSetupRequired: true }))).toEqual({
      action: "setupUnavailable",
    });
  });

  it("recognises a fake, expired or used reset link", () => {
    expect(
      readPasswordMfaOutcome(refused({ ok: false, resetLinkInvalid: true }, 400)),
    ).toEqual({ action: "linkInvalid" });
  });

  it("asks for the code when the account already has MFA", () => {
    expect(readPasswordMfaOutcome(refused({ mfaRequired: true }))).toEqual({ action: "enterCode" });
  });

  it("passes every other failure through as a message", () => {
    expect(
      readPasswordMfaOutcome(refused({ msg: "Invalid email or MFA code" }, 400)),
    ).toEqual({
      action: "error",
      message: "The code or the account isn't valid. Codes expire every 30 seconds — try the one showing now.",
    });
  });
});
