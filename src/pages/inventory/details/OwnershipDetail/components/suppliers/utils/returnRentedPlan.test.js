import { describe, expect, it } from "vitest";
import {
  RETURN_STEPS,
  canShrinkBatch,
  chunkForBatching,
  describeReturnAction,
  filterRentedRows,
  nextBatchSize,
  progressPercent,
} from "./returnRentedPlan";

describe("chunkForBatching", () => {
  it("splits in order, with a short final batch", () => {
    expect(chunkForBatching([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns one batch when everything fits", () => {
    expect(chunkForBatching([1, 2], 10)).toEqual([[1, 2]]);
  });

  it("never loops forever on a zero or negative size", () => {
    // The size comes from a shrink rule; a zero would have made the old
    // index-mutating loop spin.
    expect(chunkForBatching([1, 2], 0)).toEqual([[1], [2]]);
    expect(chunkForBatching([1, 2], -5)).toEqual([[1], [2]]);
  });

  it("survives an empty or missing list", () => {
    expect(chunkForBatching([], 10)).toEqual([]);
    expect(chunkForBatching(undefined, 10)).toEqual([]);
  });
});

describe("nextBatchSize", () => {
  it("shrinks gently for a body measured as too large locally", () => {
    expect(nextBatchSize(200, "payload-large")).toBe(140);
  });

  it("shrinks hard when the server answered 413", () => {
    expect(nextBatchSize(200, "payload-too-large")).toBe(100);
  });

  it("never goes below the floor", () => {
    expect(nextBatchSize(60, "payload-too-large")).toBe(50);
    expect(nextBatchSize(50, "payload-too-large")).toBe(50);
    expect(nextBatchSize(10, "payload-large")).toBe(50);
  });

  it("always shrinks, so a retry cannot grow the batch it just failed on", () => {
    for (const size of [51, 75, 120, 300, 1000]) {
      expect(nextBatchSize(size, "payload-large")).toBeLessThan(size);
    }
  });

  it("survives nonsense", () => {
    expect(nextBatchSize(undefined, "payload-large")).toBe(50);
    expect(nextBatchSize("abc", "payload-large")).toBe(50);
  });
});

describe("canShrinkBatch", () => {
  it("is false once the floor is reached", () => {
    expect(canShrinkBatch(51)).toBe(true);
    expect(canShrinkBatch(50)).toBe(false);
    expect(canShrinkBatch(0)).toBe(false);
  });
});

describe("describeReturnAction", () => {
  it("acts on everything when nothing is selected", () => {
    const action = describeReturnAction({ totalItems: 340, selectedCount: 0 });
    expect(action).toMatchObject({ isAll: true, count: 340, canSubmit: true });
    expect(action.label).toBe("Return all 340 items");
    expect(action.confirmTitle).toContain("all 340");
  });

  it("acts on the selection when there is one", () => {
    const action = describeReturnAction({ totalItems: 340, selectedCount: 12 });
    expect(action).toMatchObject({ isAll: false, count: 12 });
    expect(action.label).toBe("Return 12 selected");
  });

  it("uses the singular for one item", () => {
    expect(describeReturnAction({ totalItems: 1 }).label).toBe("Return all 1 item");
  });

  it("cannot submit when there is nothing to return", () => {
    expect(describeReturnAction({ totalItems: 0, selectedCount: 0 })).toMatchObject({
      count: 0,
      canSubmit: false,
    });
  });

  it("always says the action is irreversible", () => {
    // The old screen said "delete them from records" once, in body text, and
    // the confirmation was generic.
    expect(describeReturnAction({ totalItems: 5 }).confirmDescription).toMatch(
      /cannot be undone/i
    );
  });

  it("survives being handed nothing", () => {
    expect(describeReturnAction()).toMatchObject({ count: 0, canSubmit: false });
  });
});

describe("RETURN_STEPS", () => {
  it("lists the steps in the order they run", () => {
    // The old component labelled the delete call "Step 3: Email notification to
    // staff" and set the progress step to "Sending email notification" *after*
    // the delete had already finished.
    expect(RETURN_STEPS.map((step) => step.key)).toEqual([
      "check",
      "email",
      "audit",
      "delete",
    ]);
  });

  it("no longer marks items as returned before deleting them", () => {
    // That step wrote four columns onto rows the last step deletes, and nothing
    // read any of them. It is a state *read* now, which is what decides
    // whether an item may leave at all.
    expect(RETURN_STEPS.map((step) => step.key)).not.toContain("return");
  });
});

describe("progressPercent", () => {
  it("reports the share done", () => {
    expect(progressPercent({ current: 25, total: 100 })).toBe(25);
  });

  it("is 0 rather than NaN before a total is known", () => {
    // `Math.round((0 / 0) * 100)` is NaN, which the old progress bar rendered.
    expect(progressPercent({ current: 0, total: 0 })).toBe(0);
    expect(progressPercent()).toBe(0);
  });

  it("clamps to 0..100", () => {
    expect(progressPercent({ current: 150, total: 100 })).toBe(100);
    expect(progressPercent({ current: -5, total: 100 })).toBe(0);
  });
});

describe("filterRentedRows", () => {
  const rows = [
    { item_id: 200580, serial_number: "SN-A1", item_group: "Tablet" },
    { item_id: 200581, serial_number: "SN-B2", item_group: "Radio" },
  ];

  it("matches the id, the serial or the group, case-insensitively", () => {
    expect(filterRentedRows(rows, "sn-b2")).toHaveLength(1);
    expect(filterRentedRows(rows, "tablet")).toHaveLength(1);
    expect(filterRentedRows(rows, "200580")).toHaveLength(1);
  });

  it("returns everything for an empty search", () => {
    expect(filterRentedRows(rows, "   ")).toHaveLength(2);
    expect(filterRentedRows(rows, undefined)).toHaveLength(2);
  });

  it("survives rows with missing fields and a missing list", () => {
    expect(filterRentedRows([{ item_id: 1 }], "zzz")).toEqual([]);
    expect(filterRentedRows(undefined, "x")).toEqual([]);
  });
});
