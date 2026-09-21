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
  it("says what the serial_number column becomes, and why it matters", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain(
      "becomes each unit's serial number — the one the system uses to tell your units apart"
    );
  });

  /* He rejected the old one-liner about the fallback (`22:47`) and accepted the
     behaviour once it was explained (`23:47`) — so the sentence has to explain
     it, not just state it. */
  it("spells out what happens when there is no serial_number column", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain(
      "the first column is used instead, and it keeps its own name as an extra detail"
    );
  });

  it("says every other column is an extra detail, and they need not match", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain(
      "Every other column becomes an extra detail for that unit."
    );
    expect(container.textContent).toContain("do not all need the same ones");
  });

  /* `26:30` — "You can only paste up to 2000 lines. If you have more, run the
     operation again." The number is read from the parser's own limit, so the
     sentence cannot promise a different one than the code enforces. */
  it("gives the real line limit and what to do about it", () => {
    const { container } = renderPanel();

    expect(container.textContent).toContain("You can only paste up to 2,000 lines");
    expect(container.textContent).toContain("If you have more, paste the rest");
  });
});
