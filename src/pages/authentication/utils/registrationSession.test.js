import { describe, expect, it } from "vitest";

import { signupNeedsPasswordAgain } from "./registrationSession";

/* The typed password is no longer written to localStorage
   (store/persistTransforms.js). A reload between the two sign-up steps
   therefore loses it, and RegisterCompany would post `password: undefined`
   to /registration/new. It sends the person back to step one instead. */
describe("signupNeedsPasswordAgain", () => {
  it("a new account without its password has to go back to step one", () => {
    expect(signupNeedsPasswordAgain({ existing: false, email: "a@x.org" })).toBe(true);
    expect(signupNeedsPasswordAgain({ existing: false, password: "" })).toBe(true);
  });

  it("a new account that still has it in memory carries on", () => {
    expect(signupNeedsPasswordAgain({ existing: false, password: "Str0ng!pass" })).toBe(false);
  });

  // Path B only adds a company to an account that already has a password.
  it("an existing account never needs it", () => {
    expect(signupNeedsPasswordAgain({ existing: true })).toBe(false);
  });

  it("no session at all also starts over", () => {
    expect(signupNeedsPasswordAgain(undefined)).toBe(true);
    expect(signupNeedsPasswordAgain([])).toBe(true);
  });
});
