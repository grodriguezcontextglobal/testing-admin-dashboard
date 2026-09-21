import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ScanUnitsPanel from "./ScanUnitsPanel";

/**
 * The wording here was walked through line by line in the product review, and
 * the rules that came out of it are general: instructions never say what you do
 * NOT have to do, and a menu item is named in quotation marks so the reader
 * knows it is a thing on screen rather than a manner of working.
 *
 * Pinned because this paragraph has been rewritten more than once.
 */
const renderPanel = () =>
  render(<ScanUnitsPanel existingSerials={[]} onScan={vi.fn()} />);

describe("ScanUnitsPanel copy", () => {
  /* The two sentences this used to open with — point the scanner at a label,
     pull the trigger, the field clears itself — were deleted on his say-so:
     "You can take this away, because that's understood" (P1 `27:07`). Pinned
     so they do not creep back the next time someone feels the panel looks
     empty. */
  it("does not explain how to use a barcode scanner", () => {
    const { container } = renderPanel();

    expect(container.textContent).not.toMatch(/point the scanner/i);
    expect(container.textContent).not.toMatch(/pull the trigger/i);
    expect(container.textContent).not.toMatch(/clears itself/i);
  });

  /* What is left is the one thing that is not obvious from looking at it. */
  it("says the one thing a scan does not record", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain(
      "Units added here have a serial number and nothing else."
    );
  });

  /* And sends them to the option that does, by the name that option now
     actually has — it used to quote "One at a time", which is no longer what
     the radio says. */
  it("points at the other option by its real name", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain("Enter one at a time");
    expect(container.textContent).toContain("if a unit needs extra details");
  });
});
