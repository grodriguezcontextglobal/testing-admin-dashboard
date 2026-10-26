import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SystemUseNotice, { SYSTEM_USE_NOTICE } from "./SystemUseNotice";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, B2 (AC-8): the sign-in screen
// says, before access, that use is authorized-only, monitored, and that
// signing in means consent.
describe("SystemUseNotice", () => {
  it("covers the four points AC-8 asks for", () => {
    expect(SYSTEM_USE_NOTICE).toMatch(/authorized users/i);
    expect(SYSTEM_USE_NOTICE).toMatch(/monitored/i);
    expect(SYSTEM_USE_NOTICE).toMatch(/unauthorized .*prohibited/i);
    expect(SYSTEM_USE_NOTICE).toMatch(/by signing in, you consent/i);
  });

  it("renders the notice as a labelled region", () => {
    render(<SystemUseNotice />);
    const region = screen.getByRole("note", { name: "System use notice" });
    expect(region.textContent).toContain(SYSTEM_USE_NOTICE);
  });
});
