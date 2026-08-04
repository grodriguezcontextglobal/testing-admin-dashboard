import { describe, expect, it } from "vitest";
import { normalizeOwnership } from "./ownershipUtils";

describe("normalizeOwnership", () => {
  it("recognizes 'Owned' as a synonym for the canonical 'Permanent' value", () => {
    expect(normalizeOwnership("Owned")).toBe("Permanent");
    expect(normalizeOwnership("owned")).toBe("Permanent");
    expect(normalizeOwnership("OWNED")).toBe("Permanent");
  });

  it("passes through the canonical values unchanged (case-insensitive input, canonical casing out)", () => {
    expect(normalizeOwnership("Permanent")).toBe("Permanent");
    expect(normalizeOwnership("permanent")).toBe("Permanent");
    expect(normalizeOwnership("Rent")).toBe("Rent");
    expect(normalizeOwnership("rent")).toBe("Rent");
    expect(normalizeOwnership("Sale")).toBe("Sale");
    expect(normalizeOwnership("sale")).toBe("Sale");
  });

  it("recognizes other common synonyms", () => {
    expect(normalizeOwnership("Own")).toBe("Permanent");
    expect(normalizeOwnership("Purchased")).toBe("Permanent");
    expect(normalizeOwnership("Purchase")).toBe("Permanent");
    expect(normalizeOwnership("Rental")).toBe("Rent");
    expect(normalizeOwnership("Rented")).toBe("Rent");
    expect(normalizeOwnership("Lease")).toBe("Rent");
    expect(normalizeOwnership("Leased")).toBe("Rent");
    expect(normalizeOwnership("Sold")).toBe("Sale");
    expect(normalizeOwnership("For Sale")).toBe("Sale");
  });

  it("recognizes donation-related synonyms as 'Permanent'", () => {
    expect(normalizeOwnership("Donated")).toBe("Permanent");
    expect(normalizeOwnership("Donation")).toBe("Permanent");
  });

  it("recognizes loaner/trial/demo synonyms as 'Rent' (temporary, not owned, no purchase)", () => {
    expect(normalizeOwnership("Loaner")).toBe("Rent");
    expect(normalizeOwnership("Loan")).toBe("Rent");
    expect(normalizeOwnership("Loaned")).toBe("Rent");
    expect(normalizeOwnership("Trial")).toBe("Rent");
    expect(normalizeOwnership("Demo")).toBe("Rent");
  });

  it("recognizes 'Consignment' as 'Sale' (vendor-owned stock held for sale)", () => {
    expect(normalizeOwnership("Consignment")).toBe("Sale");
  });

  it("trims surrounding whitespace before matching", () => {
    expect(normalizeOwnership("  Owned  ")).toBe("Permanent");
  });

  it("preserves a genuinely unrecognized value as-is (trimmed) instead of silently dropping it", () => {
    expect(normalizeOwnership("Refurbished")).toBe("Refurbished");
  });

  it("returns an empty string for empty/null/undefined input", () => {
    expect(normalizeOwnership("")).toBe("");
    expect(normalizeOwnership(null)).toBe("");
    expect(normalizeOwnership(undefined)).toBe("");
  });
});
