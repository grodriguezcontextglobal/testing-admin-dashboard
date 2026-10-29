import { describe, expect, it } from "vitest";
import { SYSTEM_USE_NOTICE } from "./legalNotices";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, B2 (AC-8): whatever wording
// legal settles on, the notice has to keep saying these four things.
describe("SYSTEM_USE_NOTICE", () => {
  it("covers the four points AC-8 asks for", () => {
    expect(SYSTEM_USE_NOTICE.text).toMatch(/authorized users/i);
    expect(SYSTEM_USE_NOTICE.text).toMatch(/monitored/i);
    expect(SYSTEM_USE_NOTICE.text).toMatch(/unauthorized .*prohibited/i);
    expect(SYSTEM_USE_NOTICE.text).toMatch(/by signing in, you consent/i);
  });

  it("records whether legal has approved the current wording", () => {
    expect(typeof SYSTEM_USE_NOTICE.approvedByLegal).toBe("boolean");
    expect(SYSTEM_USE_NOTICE.version).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
