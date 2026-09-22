import { describe, expect, it } from "vitest";
import {
  OWNERSHIP_VALUES,
  normalizeOwnership,
  ownershipLabel,
} from "./ownershipUtils";

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
    expect(normalizeOwnership("Resale")).toBe("Resale");
    expect(normalizeOwnership("resale")).toBe("Resale");
  });

  it("recognizes other common synonyms", () => {
    expect(normalizeOwnership("Own")).toBe("Permanent");
    expect(normalizeOwnership("Purchased")).toBe("Permanent");
    expect(normalizeOwnership("Purchase")).toBe("Permanent");
    expect(normalizeOwnership("Rental")).toBe("Rent");
    expect(normalizeOwnership("Rented")).toBe("Rent");
    expect(normalizeOwnership("Lease")).toBe("Rent");
    expect(normalizeOwnership("Leased")).toBe("Rent");
    expect(normalizeOwnership("Sold")).toBe("Resale");
    expect(normalizeOwnership("For Sale")).toBe("Resale");
    expect(normalizeOwnership("For resale")).toBe("Resale");
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

  it("recognizes 'Consignment' as 'Resale' (vendor-owned stock held for sale)", () => {
    expect(normalizeOwnership("Consignment")).toBe("Resale");
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

/* The value was "Sale" in half the app and "Resale" in the other half, and five
   display dictionaries hid it by mapping both to the same words — while
   disagreeing on which words. The table even offered them as two filters, so
   choosing one hid every row the other half of the app had written. */
describe("the two spellings that were one value all along", () => {
  it("takes the old stored value as the new one", () => {
    expect(normalizeOwnership("Sale")).toBe("Resale");
  });

  /* The stored value is "Resale"; what it reads as is "For Resale". Two jobs,
     and conflating them was the mistake in the first pass at this. */
  it("reads them all as the words a person expects", () => {
    expect(ownershipLabel("Resale")).toBe("For Resale");
    expect(ownershipLabel("Sale")).toBe("For Resale");
    expect(ownershipLabel("for resale")).toBe("For Resale");
  });

  /* The reported bug. The old import let "For Resale" through unchanged, so
     rows hold it — and the two inventory tables looked the dictionary up raw,
     so anything that was not exactly a key rendered an empty cell. */
  it("reads a row stored as 'For Resale' instead of showing nothing", () => {
    expect(ownershipLabel("For Resale")).toBe("For Resale");
    expect(ownershipLabel("FOR RESALE")).toBe("For Resale");
  });

  it("keeps the other two reading as they always did", () => {
    expect(ownershipLabel("Permanent")).toBe("Permanent");
    expect(ownershipLabel("Rent")).toBe("Leased");
  });

  /* A value nobody documented still has to show as itself rather than blank —
     the old dictionaries returned undefined and the cell went empty. */
  it("shows an unknown value rather than nothing", () => {
    expect(ownershipLabel("Borrowed forever")).toBe("Borrowed forever");
    expect(ownershipLabel("")).toBe("");
  });

  it("offers the three in the order the dropdowns use", () => {
    expect(OWNERSHIP_VALUES).toEqual(["Permanent", "Rent", "Resale"]);
  });
});
