import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { SIGNUP_DONE_PATH, signupNeedsPasswordAgain } from "./registrationSession";

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

// 2026-11-02: the Stripe connected account is created only from Profile ->
// Stripe, in a signed-in session. Sign-up used to end on a public
// /register/connected-account page that created it with no session at all.
describe("sign-up and the Stripe connected account", () => {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const resolve = (relative) => path.resolve(here, relative);
  const read = (relative) => fs.readFileSync(resolve(relative), "utf8");

  it("sends a finished sign-up to the login", () => {
    expect(SIGNUP_DONE_PATH).toBe("/login");
    const registerCompany = read("../RegisterCompany.jsx");
    expect(registerCompany).toContain("navigate(SIGNUP_DONE_PATH)");
    expect(registerCompany).not.toContain("connected-account");
  });

  it("has no public route that creates a connected account", () => {
    expect(read("../../../routes/no-authorized/NoAuthRoutes.jsx")).not.toMatch(
      /connected-account|RegisterStripeConnectedAccount/
    );
    expect(fs.existsSync(resolve("../RegisterStripeConnectedAccount.jsx"))).toBe(false);
  });
});
