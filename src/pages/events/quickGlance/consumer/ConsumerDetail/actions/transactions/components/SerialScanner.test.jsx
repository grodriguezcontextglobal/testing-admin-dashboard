import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import SerialScanner from "./SerialScanner";

/**
 * Reported from a real assignment: the serial was typed, the rest of the form
 * was filled in, and submitting said no serial number had been assigned. The
 * serial was never added because Enter was never pressed in that field — and
 * nothing on screen said it had to be.
 *
 * The instruction did exist, in the placeholder. A placeholder disappears the
 * moment you type, so it is gone exactly when it is needed. What replaces it:
 *
 * - leaving the field commits what is in it, so the reported path cannot lose
 *   a serial again;
 * - while there is text that is not yet on the list, the pending state is
 *   visible and has a button, instead of depending on a hint that vanished.
 */

const pool = [
  { device: "AUD-1", type: "Receiver", status: "Operational" },
  { device: "AUD-2", type: "Receiver", status: "Operational" },
];

const renderScanner = (props = {}) => {
  const onChange = vi.fn();
  const utils = render(
    <SerialScanner
      pool={pool}
      group="Receiver"
      quantity={2}
      picked={[]}
      onChange={onChange}
      {...props}
    />
  );
  return { ...utils, onChange, field: screen.getByLabelText(/serial number to add/i) };
};

describe("SerialScanner", () => {
  it("adds the serial that was typed but never confirmed, when the field is left", () => {
    const { field, onChange } = renderScanner();

    fireEvent.change(field, { target: { value: "AUD-1" } });
    fireEvent.blur(field);

    expect(onChange).toHaveBeenCalledWith(["AUD-1"]);
  });

  it("says the typed serial is not on the list yet, while it is not", () => {
    const { field } = renderScanner();

    expect(screen.queryByRole("button", { name: /add/i })).toBeNull();

    fireEvent.change(field, { target: { value: "AUD-1" } });

    expect(screen.getByText(/not added yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add/i })).toBeInTheDocument();
  });

  it("adds it from the button, for anyone who never learned the Enter rule", () => {
    const { field, onChange } = renderScanner();

    fireEvent.change(field, { target: { value: "AUD-2" } });
    fireEvent.click(screen.getByRole("button", { name: /add/i }));

    expect(onChange).toHaveBeenCalledWith(["AUD-2"]);
  });

  /* The barcode gun fires Enter after every read; that path must not change. */
  it("still adds on Enter, and does not submit the form around it", () => {
    const { field, onChange } = renderScanner();

    fireEvent.change(field, { target: { value: "AUD-1" } });
    const prevented = !fireEvent.keyDown(field, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["AUD-1"]);
    expect(prevented).toBe(true);
  });

  it("leaving an empty field is not an error", () => {
    const { field, onChange } = renderScanner();

    fireEvent.blur(field);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("leaving the field does nothing once every device is scanned", () => {
    const { field, onChange } = renderScanner({ picked: ["AUD-1", "AUD-2"], quantity: 2 });

    fireEvent.change(field, { target: { value: "AUD-2" } });
    fireEvent.blur(field);

    expect(onChange).not.toHaveBeenCalled();
  });

  it("surfaces the reason when what was typed cannot be added", () => {
    const { field, onChange } = renderScanner();

    fireEvent.change(field, { target: { value: "NOPE-9" } });
    fireEvent.blur(field);

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent(/not in this event's inventory/i);
  });
});
