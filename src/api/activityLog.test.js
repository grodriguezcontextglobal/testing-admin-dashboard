import { vi, describe, it, expect, beforeEach } from "vitest";

vi.mock("./devitrakApi", () => ({
  devitrakApiAdmin: { post: vi.fn() },
}));

import { devitrakApiAdmin } from "./devitrakApi";
import { registerStaffActivity } from "./activityLog";

beforeEach(() => {
  devitrakApiAdmin.post.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("registerStaffActivity", () => {
  it("posts to /activity-logs with action, target_model, target_id and details", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { ok: true } });
    await registerStaffActivity({
      action: "CREATE",
      target_model: "Member",
      target_id: "member-1",
      details: { name: "Jane Doe" },
    });
    expect(devitrakApiAdmin.post).toHaveBeenCalledWith("/activity-logs", {
      action: "CREATE",
      target_model: "Member",
      target_id: "member-1",
      details: { name: "Jane Doe" },
    });
  });

  it("nunca lanza ni bloquea al caller cuando el registro falla (fire-and-forget)", async () => {
    devitrakApiAdmin.post.mockRejectedValue(new Error("network down"));
    await expect(
      registerStaffActivity({ action: "CREATE", target_model: "Member" })
    ).resolves.toBeUndefined();
    expect(console.error).toHaveBeenCalled();
  });
});
