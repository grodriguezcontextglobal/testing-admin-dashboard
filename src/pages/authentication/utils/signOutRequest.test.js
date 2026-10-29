import { describe, expect, it } from "vitest";
import { signOutRequest } from "./signOutRequest";

// FRONTEND_fedramp_a2_lote2_2026-10-27 (AC-3): POST /admin/logout with only a
// uid let anyone who knew a uid end that person's session. The company
// picker signs out before the token is stored, so it passes it explicitly.
describe("signOutRequest", () => {
  it("sends the uid in the body and the session token in x-token", () => {
    expect(signOutRequest({ uid: "u-1", token: "jwt" })).toEqual({
      body: { uid: "u-1" },
      config: { headers: { "x-token": "jwt" } },
    });
  });

  it("sends no x-token header when there is no token", () => {
    expect(signOutRequest({ uid: "u-1" }).config).toEqual({});
  });
});
