import { describe, it, expect } from "vitest";
import {
  isContractEmailRequired,
  shouldSendContractEmail,
} from "./contractEmailPolicy";

describe("isContractEmailRequired — under 13 only", () => {
  it("requires the email for a member under 13", () => {
    expect(isContractEmailRequired({ under_13: 1 })).toBe(true);
  });

  it("accepts the shapes the server actually sends for under_13", () => {
    expect(isContractEmailRequired({ under_13: "1" })).toBe(true);
    expect(isContractEmailRequired({ under_13: true })).toBe(true);
  });

  // The whole point of the rule: minor is not the same gate as under-13.
  it("does NOT require it for a 13-17 minor", () => {
    expect(isContractEmailRequired({ minor: 1, under_13: 0 })).toBe(false);
    expect(isContractEmailRequired({ minor: "1", under_13: "0" })).toBe(false);
  });

  it("does not require it for an adult", () => {
    expect(isContractEmailRequired({ minor: 0, under_13: 0 })).toBe(false);
  });

  it("stays optional when under_13 is absent or unusable", () => {
    expect(isContractEmailRequired({})).toBe(false);
    expect(isContractEmailRequired({ under_13: null })).toBe(false);
    expect(isContractEmailRequired({ under_13: "" })).toBe(false);
    expect(isContractEmailRequired(undefined)).toBe(false);
    expect(isContractEmailRequired(null)).toBe(false);
  });
});

describe("shouldSendContractEmail", () => {
  const under13 = { under_13: 1 };
  const teen = { minor: 1, under_13: 0 };
  const adult = { minor: 0, under_13: 0 };

  it("sends for an under-13 even when staff opted out", () => {
    expect(shouldSendContractEmail(under13, false)).toBe(true);
  });

  it("sends when staff opted in, whatever the age", () => {
    expect(shouldSendContractEmail(teen, true)).toBe(true);
    expect(shouldSendContractEmail(adult, true)).toBe(true);
  });

  it("skips for a teen or adult when staff opted out", () => {
    expect(shouldSendContractEmail(teen, false)).toBe(false);
    expect(shouldSendContractEmail(adult, false)).toBe(false);
  });

  it("never lets an under-13 assignment go unnotified, for any opt-in value", () => {
    for (const optedIn of [false, undefined, null, 0, ""]) {
      expect(shouldSendContractEmail(under13, optedIn)).toBe(true);
    }
  });
});
