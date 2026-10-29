import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import SystemUseNotice from "./SystemUseNotice";
import { SYSTEM_USE_NOTICE } from "../../../config/legalNotices";

// fedRAMP/FRONTEND_action_plan_2026-10-26.md, B2 (AC-8). What the wording
// must say is tested in src/config/legalNotices.test.js; this checks the
// sign-in screen shows that wording and nothing of its own.
describe("SystemUseNotice", () => {
  it("renders the wording from src/config/legalNotices.js as a labelled region", () => {
    render(<SystemUseNotice />);
    const region = screen.getByRole("note", { name: "System use notice" });
    expect(region.textContent).toBe(SYSTEM_USE_NOTICE.text);
  });
});
