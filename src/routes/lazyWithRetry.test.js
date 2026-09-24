import { describe, expect, it, vi } from "vitest";
import { retryImport, RETRY_DELAY_MS } from "./lazyWithRetry";

/**
 * The rule that keeps a blip from taking a route out for the session.
 *
 * `React.lazy` caches whatever promise its factory returns, rejections
 * included, so without a retry inside the factory one failed chunk fetch is
 * permanent. With `v7_startTransition` — the default since react-router 7 —
 * that reads on screen as a click that did nothing: the URL changes, the old
 * page stays.
 */

describe("retryImport", () => {
  it("does not retry what worked the first time", async () => {
    const importer = vi.fn().mockResolvedValue({ default: "page" });

    await expect(retryImport(importer)).resolves.toEqual({ default: "page" });
    expect(importer).toHaveBeenCalledTimes(1);
  });

  it("retries once after a failure and resolves", async () => {
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error("Failed to fetch dynamically imported module"))
      .mockResolvedValue({ default: "page" });

    await expect(retryImport(importer)).resolves.toEqual({ default: "page" });
    expect(importer).toHaveBeenCalledTimes(2);
  });

  /* A real failure has to stay a failure: the boundary above <Routes> is what
     turns it into something a person can see, and swallowing it here would put
     the silent freeze back. */
  it("gives up after the second attempt and rethrows", async () => {
    const importer = vi.fn().mockRejectedValue(new Error("chunk 404"));

    await expect(retryImport(importer)).rejects.toThrow("chunk 404");
    expect(importer).toHaveBeenCalledTimes(2);
  });

  it("surfaces the second attempt's reason, not the first", async () => {
    const importer = vi
      .fn()
      .mockRejectedValueOnce(new Error("first"))
      .mockRejectedValue(new Error("second"));

    await expect(retryImport(importer)).rejects.toThrow("second");
  });

  it("waits before retrying rather than hammering the same failing URL", async () => {
    vi.useFakeTimers();
    try {
      const importer = vi
        .fn()
        .mockRejectedValueOnce(new Error("blip"))
        .mockResolvedValue({ default: "page" });

      const pending = retryImport(importer);
      await vi.advanceTimersByTimeAsync(0);
      expect(importer).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(RETRY_DELAY_MS);
      await expect(pending).resolves.toEqual({ default: "page" });
      expect(importer).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });
});
