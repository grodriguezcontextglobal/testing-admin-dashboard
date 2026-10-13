import { describe, expect, it } from "vitest";
import {
  PASSWORD_RULES,
  buildPasswordUpdatePayload,
  buildResetPasswordLink,
  checkPassword,
  describePasswordUpdateError,
  newPasswordSchema,
  passwordStrength,
} from "./passwordPolicy";

const ruleIds = (password) =>
  checkPassword(password)
    .rules.filter((rule) => !rule.met)
    .map((rule) => rule.id);

describe("checkPassword", () => {
  it("lists the five rules in a fixed order", () => {
    expect(PASSWORD_RULES.map((rule) => rule.id)).toEqual([
      "length",
      "uppercase",
      "lowercase",
      "number",
      "symbol",
    ]);
  });

  it("accepts a password with one of each kind and eight characters", () => {
    const result = checkPassword("Abcdef1!");
    expect(result.isValid).toBe(true);
    expect(result.metCount).toBe(5);
  });

  it("names every rule an empty password misses", () => {
    const result = checkPassword("");
    expect(result.isValid).toBe(false);
    expect(result.metCount).toBe(0);
    expect(ruleIds(undefined)).toHaveLength(5);
  });

  it("asks for each missing kind on its own", () => {
    expect(ruleIds("abcdef1!")).toEqual(["uppercase"]);
    expect(ruleIds("ABCDEF1!")).toEqual(["lowercase"]);
    expect(ruleIds("Abcdefg!")).toEqual(["number"]);
    expect(ruleIds("Abcdefg1")).toEqual(["symbol"]);
    expect(ruleIds("Abc1!")).toEqual(["length"]);
  });

  it("does not count a space as a symbol", () => {
    expect(ruleIds("Abcdefg1 ")).toEqual(["symbol"]);
  });
});

describe("passwordStrength", () => {
  it("is empty before anything is typed", () => {
    expect(passwordStrength("")).toEqual({ percent: 0, label: "", tone: "none" });
  });

  it("grows with each rule met", () => {
    expect(passwordStrength("a")).toMatchObject({ percent: 20, label: "Weak", tone: "danger" });
    expect(passwordStrength("aB1")).toMatchObject({ percent: 60, label: "Fair", tone: "warning" });
    expect(passwordStrength("aB1!")).toMatchObject({ percent: 80, label: "Fair", tone: "warning" });
    expect(passwordStrength("Abcdef1!")).toMatchObject({ percent: 100, label: "Strong", tone: "success" });
  });
});

describe("newPasswordSchema", () => {
  const validate = (values) =>
    newPasswordSchema
      .validate(values, { abortEarly: false })
      .then(() => [])
      .catch((error) => error.inner.map((issue) => issue.path));

  it("passes a valid, confirmed password", async () => {
    expect(await validate({ password: "Abcdef1!", password2: "Abcdef1!" })).toEqual([]);
  });

  it("rejects a password that breaks a rule", async () => {
    expect(await validate({ password: "abcdef1!", password2: "abcdef1!" })).toEqual(["password"]);
  });

  it("rejects a confirmation that does not match", async () => {
    expect(await validate({ password: "Abcdef1!", password2: "Abcdef1?" })).toEqual(["password2"]);
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

  it("puts the email in the reset link, encoded", () => {
    const link = buildResetPasswordLink({
      origin: "https://admin.devitrak.net",
      uid: "abc123",
      email: "ana+1@b.co",
      stampTime: "Mon Oct 13 2026",
    });
    const params = new URL(link).searchParams;
    expect(new URL(link).pathname).toBe("/reset-password");
    expect(params.get("uid")).toBe("abc123");
    expect(params.get("email")).toBe("ana+1@b.co");
    expect(params.get("stamp-time")).toBe("Mon Oct 13 2026");
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
