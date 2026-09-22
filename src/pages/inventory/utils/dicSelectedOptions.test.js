import { describe, expect, it } from "vitest";
import { dicSelectedOptions, dictionary } from "./dicSelectedOptions";

describe("dicSelectedOptions", () => {
  it("no longer offers a Staff member filter", () => {
    // It read `assignedToStaffMember`, derived from `usage`, and a real
    // warehouse-items response has no `usage` column at all — so the value was
    // null on every row and the filter matched nothing. A control that is
    // always empty is worse than no control: it reads as "no devices are
    // assigned" rather than "this cannot answer that question".
    //
    // It comes back when the backend settles where "assigned to staff" lives
    // (leases or events) — see FRONTEND_inventory_page_endpoints.md §6.1.
    expect(Object.values(dicSelectedOptions)).not.toContain("Staff member");
  });

  it("keeps the filters that map to a real column", () => {
    expect(dicSelectedOptions).toEqual({
      0: "Brand",
      1: "Group",
      2: "Serial Number",
      3: "Location",
      4: "Ownership",
      5: "Condition",
      7: "Status",
      8: "Category",
    });
  });

  it("gives Category a fresh index rather than reusing the vacated 6", () => {
    // 6 belonged to Staff member. Reusing it would make a filter chosen before
    // the removal — one that survived in state — come back as a Category
    // filter carrying a staff member's name.
    expect(dicSelectedOptions[8]).toBe("Category");
    expect(dicSelectedOptions[6]).toBeUndefined();
  });

  it("leaves index 7 where it was rather than closing the gap", () => {
    // Renumbering would have been tidier and wrong: the index is the wire
    // format of a chosen filter ({category, value}), read by toServerFilters
    // and by the in-memory branch. Shifting Status from 7 to 6 would make every
    // one of those read the wrong column.
    expect(dicSelectedOptions[6]).toBeUndefined();
    expect(dicSelectedOptions[7]).toBe("Status");
  });

  /* The dictionary is no longer this file's: it lives in ownershipUtils, one
     copy for the five screens that each had their own and disagreed — the main
     table said "For sale" here, the filters "For resale", the export
     "For Resale". */
  it("still translates the ownership values the table paints", () => {
    expect(dictionary.Rent).toBe("Leased");
    expect(dictionary.Resale).toBe("For Resale");
  });

  /* "Sale" is still a key because rows written before the two spellings were
     reconciled are still in the database, and they have to read as what they
     are rather than as a blank cell. */
  it("keeps reading rows that were stored under the old spelling", () => {
    expect(dictionary.Sale).toBe("For Resale");
  });
});
