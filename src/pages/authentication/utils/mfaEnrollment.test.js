import { describe, expect, it } from "vitest";

import {
  MFA_CODE_LENGTH,
  isCompleteMfaCode,
  isMfaEnrolled,
  markEnrolled,
  mfaRequestConfig,
  needsMfaEnrollment,
  enrolmentAuthToken,
  normalizeMfaCode,
  readMfaSetupChallenge,
} from "./mfaEnrollment";

/* The shape POST /api/admin/login answers with. `entire` is the whole admin
   document, so `mfaEnabled` rides along on every successful login. */
const loginResponse = (mfaEnabled) => ({
  ok: true,
  entire: { _id: "abc", email: "a@b.com", mfaEnabled },
  token: "jwt",
  uid: "abc",
});

describe("reading enrolment off a login response", () => {
  it("lets an enrolled account through", () => {
    expect(isMfaEnrolled(loginResponse(true))).toBe(true);
    expect(needsMfaEnrollment(loginResponse(true))).toBe(false);
  });

  it("stops an account that never enrolled", () => {
    expect(isMfaEnrolled(loginResponse(false))).toBe(false);
    expect(needsMfaEnrollment(loginResponse(false))).toBe(true);
  });

  /* An account created before the field existed has no `mfaEnabled` at all.
     Absent is not enrolled — the opposite reading would let exactly the oldest
     accounts, the ones this rule exists for, walk past it. */
  it("treats a missing flag as not enrolled", () => {
    expect(needsMfaEnrollment({ ok: true, entire: { email: "a@b.com" } })).toBe(
      true
    );
    expect(needsMfaEnrollment({})).toBe(true);
    expect(needsMfaEnrollment(undefined)).toBe(true);
  });

  it("reads the flag at the top level too", () => {
    expect(isMfaEnrolled({ mfaEnabled: true })).toBe(true);
  });
});

describe("marking the stashed response as enrolled", () => {
  /* The response was captured before /mfa/verify ran, so it still says
     `mfaEnabled: false`. It is what onLogin() copies into the Redux slice, and
     an unpatched copy tells the profile page MFA is off on the very session
     that just turned it on. */
  it("flips the flag the session is about to be built from", () => {
    const before = loginResponse(false);

    const after = markEnrolled(before);

    expect(after.entire.mfaEnabled).toBe(true);
    expect(before.entire.mfaEnabled).toBe(false);
    expect(after.token).toBe("jwt");
    expect(after.entire.email).toBe("a@b.com");
  });

  it("survives a response with no document on it", () => {
    expect(markEnrolled(undefined)).toEqual({ entire: { mfaEnabled: true } });
  });
});

describe("the code the user types", () => {
  it("keeps digits and drops everything else", () => {
    expect(normalizeMfaCode(" 12 34-56 ")).toBe("123456");
    expect(normalizeMfaCode("abc")).toBe("");
    expect(normalizeMfaCode(null)).toBe("");
  });

  it("never grows past the length the app expects", () => {
    expect(normalizeMfaCode("1234567890")).toBe("123456");
    expect(MFA_CODE_LENGTH).toBe(6);
  });

  it("is complete only at full length", () => {
    expect(isCompleteMfaCode("12345")).toBe(false);
    expect(isCompleteMfaCode("123456")).toBe(true);
    expect(isCompleteMfaCode("12 34 56")).toBe(true);
  });
});

describe("authenticating the enrolment calls", () => {
  /* Enrolment happens before the session exists: at the login gate nothing has
     been written to localStorage yet, and during registration nothing ever
     will be. So the token travels as an explicit header instead of relying on
     the request interceptor, which reads localStorage. */
  it("sends the token it was handed", () => {
    expect(mfaRequestConfig("jwt")).toEqual({ headers: { "x-token": "jwt" } });
  });

  it("falls back to the interceptor when there is no token to pass", () => {
    expect(mfaRequestConfig()).toEqual({});
    expect(mfaRequestConfig("")).toEqual({});
  });
});

describe("the server refusing a login until MFA is set up", () => {
  /* What POST /api/admin/login answers for an account without MFA, now that
     the server enforces it: no session token, only a short-lived one scoped to
     the enrolment calls. */
  const refusal = (data, status = 403) => ({ response: { status, data } });
  const body = {
    ok: false,
    msg: "MFA setup required. Set up an authenticator app to continue.",
    mfaSetupRequired: true,
    mfaSetupToken: "setup-jwt",
  };

  it("hands back the setup token", () => {
    expect(readMfaSetupChallenge(refusal(body))).toEqual({
      setupToken: "setup-jwt",
    });
  });

  it("does not depend on the status code", () => {
    expect(readMfaSetupChallenge(refusal(body, 401))).toEqual({
      setupToken: "setup-jwt",
    });
  });

  it("is not a setup challenge without a token to enrol with", () => {
    expect(readMfaSetupChallenge(refusal({ ...body, mfaSetupToken: "" }))).toBeNull();
    expect(readMfaSetupChallenge(refusal({ ...body, mfaSetupToken: undefined }))).toBeNull();
  });

  it("ignores every other failure", () => {
    expect(readMfaSetupChallenge(refusal({ ok: false, msg: "Incorrect password" }, 400))).toBeNull();
    expect(readMfaSetupChallenge(refusal({ mfaRequired: true }))).toBeNull();
    expect(readMfaSetupChallenge(new Error("Network Error"))).toBeNull();
    expect(readMfaSetupChallenge(undefined)).toBeNull();
  });
});

describe("the token the enrolment modal authenticates with", () => {
  it("prefers the setup token the server issued", () => {
    expect(enrolmentAuthToken({ setupToken: "setup-jwt" })).toBe("setup-jwt");
  });

  it("falls back to the session token of a login that went through", () => {
    expect(
      enrolmentAuthToken({ loginResponse: { data: { token: "jwt" } } })
    ).toBe("jwt");
  });

  it("has nothing when no login is pending", () => {
    expect(enrolmentAuthToken(null)).toBeUndefined();
  });
});
