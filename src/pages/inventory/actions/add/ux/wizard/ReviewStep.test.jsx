import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ReviewStep from "./ReviewStep";

/**
 * The last thing anyone reads before writing a batch of items they cannot undo
 * in one go. Two corrections came out of the product review: things are added
 * TO the inventory, and a step that cannot be reversed says so in the sentence
 * every other system uses, rather than inventing its own phrasing.
 */
const values = {
  category_name: "Laptops",
  item_group: "Chromebook",
  brand: "Acme",
  cost: "100",
  location: "IT office",
  tax_location: "DC",
  ownership: "Own",
  supplier: "—",
  container: "No",
  enableAssignFeature: "NO",
};

const renderReview = (serials = ["SN-1", "SN-2"]) =>
  render(
    <ReviewStep
      watch={(field) => values[field]}
      scannedSerialNumbers={serials}
      moreInfo={[]}
      subLocationsSubmitted={[]}
      imageUrlGenerated={[]}
      handleSubmit={(fn) => fn}
      savingNewItem={vi.fn()}
      loadingStatus={false}
      goToStep={vi.fn()}
    />
  );

describe("ReviewStep confirmation copy", () => {
  it("adds items to the inventory, not in it", () => {
    const { container } = renderReview();
    expect(container.textContent).toContain(
      "I understand this adds 2 new items to the inventory."
    );
  });

  it("says the operation cannot be undone, in the words every system uses", () => {
    const { container } = renderReview();
    expect(container.textContent).toContain("This operation cannot be undone.");
    expect(container.textContent).not.toContain("There is no bulk undo");
  });

  it("explains removal as the thing you have to do, one at a time", () => {
    const { container } = renderReview();
    expect(container.textContent).toContain(
      "If you need to remove them after adding them, you have to do that one at a time."
    );
    expect(container.textContent).not.toContain("one group at a time");
  });

  it("still counts a single unit in the singular", () => {
    const { container } = renderReview(["SN-1"]);
    expect(container.textContent).toContain(
      "I understand this adds 1 new item to the inventory."
    );
  });
});
