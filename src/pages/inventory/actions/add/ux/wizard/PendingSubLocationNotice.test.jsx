import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import PendingSubLocationNotice from "./PendingSubLocationNotice";

/**
 * Meeting 2026-09-29 `20:26`–`20:57`: a sub-location typed and not added was
 * silently dropped. "If it's either blank is okay. Or if it is something in
 * there, then obviously it needs to be added" — or erased.
 *
 * The same fix as SerialScanner (18d7da99): the pending state is on screen,
 * with the action that resolves it next to it.
 */
const setup = (value = "Supply room") => {
  const onAdd = vi.fn();
  const onClear = vi.fn();
  const utils = render(
    <PendingSubLocationNotice value={value} onAdd={onAdd} onClear={onClear} />
  );
  return { ...utils, onAdd, onClear };
};

describe("PendingSubLocationNotice", () => {
  it("names what is typed and says it is not added yet", () => {
    const { container } = setup();
    expect(container.textContent).toContain("“Supply room” is not added yet.");
  });

  it("adds what is typed", () => {
    const { onAdd } = setup();
    fireEvent.click(screen.getByRole("button", { name: /add sub-location/i }));
    expect(onAdd).toHaveBeenCalledWith("Supply room");
  });

  it("clears it, for someone who did not mean to add one", () => {
    const { onClear } = setup();
    fireEvent.click(screen.getByRole("button", { name: /clear/i }));
    expect(onClear).toHaveBeenCalled();
  });

  it("renders nothing when nothing is pending", () => {
    const { container } = setup("");
    expect(container.textContent).toBe("");
  });
});
