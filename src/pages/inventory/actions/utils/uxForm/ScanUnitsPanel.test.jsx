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
  it("tells the operator what to do without telling them what they need not do", () => {
    const { container } = renderPanel();
    expect(container.textContent).toContain(
      "Point the scanner at each label and pull the trigger."
    );
    expect(container.textContent).not.toMatch(/never have to/i);
    expect(container.textContent).not.toMatch(/no mouse|do not have to/i);
  });

  it("ends the sentence at what the units carry", () => {
    const { container } = renderPanel();
    expect(container.textContent).toContain(
      "Units added this way carry a serial number only."
    );
    expect(container.textContent).not.toContain("and nothing else");
  });

  it("quotes the menu item it is pointing at, and asks for additional identifiers", () => {
    const { container } = renderPanel();
    expect(container.textContent).toContain('Use "One at a time"');
    expect(container.textContent).toContain(
      "if a unit needs additional identifiers"
    );
    expect(container.textContent).not.toContain("extra identifiers");
  });
});
