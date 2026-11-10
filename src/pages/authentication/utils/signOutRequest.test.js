import { describe, expect, it } from "vitest";
import { CSRF_FIELD, CSRF_HEADER } from "../../../api/sessionCredential";
import { signOutRequest } from "./signOutRequest";

// FRONTEND_fedramp_a2_lote2_2026-10-27 (AC-3): POST /admin/logout with only a
// uid let anyone who knew a uid end that person's session. The company
// picker signs out before the session is stored, so it authenticates with the
// sign-in answer itself.
describe("signOutRequest", () => {
  it("sends the uid in the body and the session token in x-token", () => {
    expect(signOutRequest({ uid: "u-1", answer: { token: "jwt" }, cookieSession: false })).toEqual({
      body: { uid: "u-1" },
      config: { headers: { "x-token": "jwt" } },
    });
  });

  it("sends no x-token header when there is no token", () => {
    expect(signOutRequest({ uid: "u-1", cookieSession: false }).config).toEqual({});
  });

  // GovRAMP #12: the cookie travels on its own; a write needs the CSRF token.
  it("with the cookie session, sends the CSRF token instead", () => {
    expect(
      signOutRequest({ uid: "u-1", answer: { token: "jwt", [CSRF_FIELD]: "c-1" }, cookieSession: true }).config
    ).toEqual({ headers: { [CSRF_HEADER]: "c-1" } });
  });
});
