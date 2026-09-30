import { describe, expect, it } from "vitest";
import { pendingSubLocation } from "./pendingSubLocation";

/**
 * Meeting 2026-09-29 `20:25`: "So what would happen if I put supply room here
 * and I didn't click add sublocation?" — "It wouldn't take it." Only the list
 * of added sub-locations is saved; text left in the field is dropped without a
 * word. Agreed: while something is typed and not added, Continue waits.
 */
describe("pendingSubLocation", () => {
  it("is the typed text, trimmed, while it has not been added", () => {
    expect(pendingSubLocation("  Supply room ")).toBe("Supply room");
  });

  it("is empty for an empty field — leaving it blank is fine", () => {
    for (const blank of ["", "   ", null, undefined]) {
      expect(pendingSubLocation(blank)).toBe("");
    }
  });
});
