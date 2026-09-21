import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PasteUnitsPanel from "./PasteUnitsPanel";

/**
 * He dictated this block almost line by line (P1 `22:38`–`26:30`) after
 * rejecting the previous one, so it is pinned sentence by sentence.
 */
const renderPanel = () =>
  render(<PasteUnitsPanel existingSerials={[]} onAdd={vi.fn()} />);

describe("PasteUnitsPanel copy", () => {
  /* Third version. The first was unreadable, the second explained the fallback
     and what a primary key is — neither is what someone about to paste a
     spreadsheet is asking. */
  it("names the one column that has to be there, and what the others are", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain(
      "Your spreadsheet needs a serial_number column."
    );
    expect(container.textContent).toContain(
      "Every other column is extra information about that unit."
    );
  });

  /* The number comes from the parser's own limit, so the sentence cannot
     promise a different one than the code enforces. */
  it("gives the real row limit and what to do about it", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain(
      "You can paste up to 2,000 rows, counting the row of column names."
    );
    expect(container.textContent).toContain("If you have more, repeat the process.");
  });

  it("stops explaining things nobody asked", () => {
    const { container } = renderPanel();

    expect(container.textContent).not.toMatch(/primary key/i);
    expect(container.textContent).not.toMatch(/tell your units apart/i);
    expect(container.textContent).not.toMatch(/the first column is used instead/i);
  });
});
