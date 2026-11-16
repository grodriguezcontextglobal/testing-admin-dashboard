import { describe, it, expect } from "vitest";
import { createPlatformMockAdapter } from "./platformMockAdapter";

const NOW = new Date("2026-11-12T15:00:00Z");

describe("createPlatformMockAdapter", () => {
  const adapter = createPlatformMockAdapter({ now: NOW, delayMs: 0 });

  it("answers like axios: data, status, config", async () => {
    const config = { method: "get", url: "/companies", params: { limit: 2 } };
    const response = await adapter(config);
    expect(response.status).toBe(200);
    expect(response.config).toBe(config);
    expect(response.data.data).toHaveLength(2);
  });

  it("rejects a 404 the way axios does, so error.response.status works", async () => {
    await expect(adapter({ method: "get", url: "/nothing" })).rejects.toMatchObject({
      response: { status: 404 },
      isAxiosError: true,
    });
  });
});
