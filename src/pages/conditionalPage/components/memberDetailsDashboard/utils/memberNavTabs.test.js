import { describe, expect, it } from "vitest";
import { MEMBER_NAV_TABS, memberNavTabs } from "./memberNavTabs";

describe("memberNavTabs", () => {
  it("opens with Devices and ends with Reminders", () => {
    // Order is reading order: what they are holding, who they are, what we
    // have sent them.
    expect(memberNavTabs("root_admin").map((tab) => tab.label)).toEqual([
      "Devices",
      "Details",
      "Reminders",
    ]);
  });

  it("sends the reminders tab to the page that already exists", () => {
    // /member/:id/reminders is a registered route with Reminders.jsx behind
    // it; the tab is a second door to it, not a new screen.
    const reminders = memberNavTabs("admin").find(
      (tab) => tab.key === "reminders"
    );
    expect(reminders.to).toBe("reminders");
    expect(reminders.permission).toBe("member:notify");
  });

  it("gives an assistant the same three sections", () => {
    expect(memberNavTabs("assistant").map((tab) => tab.key)).toEqual([
      "main",
      "details",
      "reminders",
    ]);
  });

  it("shows nothing to a role that cannot open members at all", () => {
    // sale_manager has no member permissions today, and the route guard turns
    // them away — a tab bar for a page they cannot reach would be a lie.
    expect(memberNavTabs("sale_manager")).toEqual([]);
    expect(memberNavTabs("inventory_manager")).toEqual([]);
    expect(memberNavTabs(undefined)).toEqual([]);
  });

  it("labels every section with a noun", () => {
    // The rule the tab bar is built on: a place gets a noun, an action gets a
    // verb and lives in the action rail instead. "Send reminder" in here is
    // the mistake this list is meant to prevent.
    const verbs = /^(send|assign|export|delete|update|add|create)\b/i;
    MEMBER_NAV_TABS.forEach((tab) => {
      expect(tab.label).not.toMatch(verbs);
    });
  });
});
