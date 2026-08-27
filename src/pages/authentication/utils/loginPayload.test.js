import { describe, expect, it } from "vitest";
import {
  LOGIN_STEPS,
  buildLoginPayload,
  fieldsToClearFor,
  wasStaleCodeSent,
} from "./loginPayload";

const base = {
  userEmail: "root@x.com",
  userPassword: "saved-pass",
  rememberMe: false,
  forceLogin: false,
};

describe("buildLoginPayload", () => {
  it("sends the typed password on the password step", () => {
    expect(
      buildLoginPayload({
        ...base,
        step: LOGIN_STEPS.PASSWORD,
        data: { password: "typed-pass" },
      })
    ).toEqual({
      email: "root@x.com",
      password: "typed-pass",
      rememberMe: false,
      forceLogin: false,
    });
  });

  it("sends the saved password on the MFA step", () => {
    const payload = buildLoginPayload({
      ...base,
      step: LOGIN_STEPS.MFA,
      data: { mfaCode: "123456" },
    });
    expect(payload.password).toBe("saved-pass");
    expect(payload.mfaCode).toBe("123456");
  });

  it("never carries an MFA code off the MFA step", () => {
    /* The reported bug. `useForm()` keeps a field's value after its input
       unmounts, so once the user had been through the MFA step the code rode
       along on every later attempt — and the server answered "Invalid MFA code"
       for an attempt where none had been typed. */
    const payload = buildLoginPayload({
      ...base,
      step: LOGIN_STEPS.PASSWORD,
      data: { password: "typed-pass", mfaCode: "654321" },
    });
    expect(payload).not.toHaveProperty("mfaCode");
  });

  it("omits the key entirely rather than sending it empty", () => {
    // The password step's wire format is unchanged: absent before, absent now.
    [undefined, null, "", "   "].forEach((mfaCode) => {
      const payload = buildLoginPayload({
        ...base,
        step: LOGIN_STEPS.MFA,
        data: { mfaCode },
      });
      expect(Object.keys(payload)).not.toContain("mfaCode");
    });
  });

  it("trims a pasted code", () => {
    expect(
      buildLoginPayload({ ...base, step: LOGIN_STEPS.MFA, data: { mfaCode: " 123456 " } })
        .mfaCode
    ).toBe("123456");
  });

  it("carries rememberMe and forceLogin as booleans", () => {
    const payload = buildLoginPayload({
      ...base,
      rememberMe: true,
      forceLogin: true,
      step: LOGIN_STEPS.PASSWORD,
      data: { password: "p" },
    });
    expect(payload.rememberMe).toBe(true);
    expect(payload.forceLogin).toBe(true);
  });

  it("adds no field outside the contract", () => {
    const payload = buildLoginPayload({
      ...base,
      step: LOGIN_STEPS.MFA,
      data: { mfaCode: "123456", password: "ignored" },
    });
    expect(Object.keys(payload).sort()).toEqual([
      "email",
      "forceLogin",
      "mfaCode",
      "password",
      "rememberMe",
    ]);
  });

  it("does not throw on an empty form", () => {
    expect(buildLoginPayload({ ...base, step: LOGIN_STEPS.EMAIL, data: undefined }))
      .toMatchObject({ email: "root@x.com" });
  });
});

describe("fieldsToClearFor", () => {
  it("clears the code on the way to the MFA step, so it starts empty", () => {
    expect(fieldsToClearFor(LOGIN_STEPS.MFA)).toContain("mfaCode");
  });

  it("clears the code on the way back to the password step", () => {
    // The MFA step's Back button left it in the form.
    expect(fieldsToClearFor(LOGIN_STEPS.PASSWORD)).toContain("mfaCode");
  });

  it("clears both the password and the code on a full reset", () => {
    expect(fieldsToClearFor(LOGIN_STEPS.EMAIL)).toEqual(["password", "mfaCode"]);
  });

  it("is empty for a step it does not know", () => {
    expect(fieldsToClearFor("nonsense")).toEqual([]);
    expect(fieldsToClearFor(undefined)).toEqual([]);
  });
});

describe("wasStaleCodeSent", () => {
  it("is true when a code was in the form off the MFA step", () => {
    expect(
      wasStaleCodeSent({ step: LOGIN_STEPS.PASSWORD, data: { mfaCode: "654321" } })
    ).toBe(true);
  });

  it("is false on the MFA step, where a code belongs", () => {
    expect(
      wasStaleCodeSent({ step: LOGIN_STEPS.MFA, data: { mfaCode: "123456" } })
    ).toBe(false);
  });

  it("is false when there is no code", () => {
    expect(wasStaleCodeSent({ step: LOGIN_STEPS.PASSWORD, data: {} })).toBe(false);
    expect(wasStaleCodeSent({ step: LOGIN_STEPS.PASSWORD, data: { mfaCode: "  " } }))
      .toBe(false);
    expect(wasStaleCodeSent({})).toBe(false);
  });
});
