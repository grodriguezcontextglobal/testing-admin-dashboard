import { afterEach, describe, expect, it, vi } from "vitest";

import generateIdempotencyKey from "./generateIdempotencyKey";

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

/* FRONTEND_crypto_inventory_2026-10-15.md §4: the fallback for browsers
   without crypto.randomUUID was Date.now() + Math.random(), which is not a
   cryptographic generator. Every supported browser has getRandomValues. */
describe("generateIdempotencyKey", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("is a v4 UUID, different every time", () => {
    const a = generateIdempotencyKey();
    expect(a).toMatch(UUID_V4);
    expect(generateIdempotencyKey()).not.toBe(a);
  });

  it("without randomUUID, builds the UUID from getRandomValues, not Math.random", () => {
    const random = vi.spyOn(Math, "random");
    const getRandomValues = vi.fn((bytes) => bytes.fill(0xff));
    vi.stubGlobal("crypto", { getRandomValues });

    const key = generateIdempotencyKey();

    expect(getRandomValues).toHaveBeenCalledOnce();
    expect(random).not.toHaveBeenCalled();
    expect(key).toMatch(UUID_V4);
    // Version and variant bits are set over the random bytes.
    expect(key).toBe("ffffffff-ffff-4fff-bfff-ffffffffffff");
  });

  it("refuses to make a key without a cryptographic generator", () => {
    vi.stubGlobal("crypto", undefined);
    expect(() => generateIdempotencyKey()).toThrow(/Web Crypto/);
  });
});
