import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import Input from "./Input";

/**
 * The outlined input's label.
 *
 * This component always renders its `<InputLabel>` with `shrink`, so the label
 * floats up onto the top border — and MUI only opens a gap in that border for
 * it when `label` is also handed to the `OutlinedInput`, which is what sizes
 * the `<legend>` inside the outline. Without it the text is drawn straight
 * over the border line.
 *
 * It was passed, commented out, passed again four hours later and commented
 * out once more (`38ac53e8`, `48affbdd`, `4748cd9f`, February 2026) — the only
 * reason ever recorded was "potential UI rendering issues", with no issue
 * named. These tests are here so the next person does not have to guess: the
 * legend is the gap, and the gap is the point.
 */
describe("Input", () => {
  it("opens a gap in the outline the size of the label", () => {
    const { container } = render(<Input label="Serial number" name="serial" />);
    // MUI draws the gap as a <legend> inside the notched outline. The text
    // appearing twice — once as the label, once sizing the gap — is the
    // point: the second copy is invisible and only reserves the space.
    const legend = container.querySelector("fieldset legend");
    expect(legend).toHaveTextContent("Serial number");
    expect(container.querySelector("label")).toHaveTextContent("Serial number");
  });

  it("ties the label to the field, so clicking it focuses the input", () => {
    render(<Input label="Serial number" name="serial" />);
    expect(screen.getByLabelText("Serial number")).toBe(
      document.querySelector("input[name='serial']")
    );
  });

  /* No label means no gap: an empty legend would leave a notch cut out of the
     border with nothing in it. */
  it("leaves the outline whole when there is no label", () => {
    const { container } = render(<Input name="serial" placeholder="Type here" />);
    // MUI fills the unused legend with a zero-width space, not nothing.
    expect(container.querySelector("fieldset legend").textContent.trim()).toBe("​");
    expect(container.querySelector("label")).toBeNull();
  });

  it("marks a required field on the label", () => {
    const { container } = render(<Input label="Serial number" name="serial" required />);
    // The label, not the outline's legend, which also carries the text now.
    expect(container.querySelector("label").textContent).toContain("*");
  });

  it("shows the helper text as the field's error", () => {
    render(<Input label="Serial number" name="serial" error helperText="Already in use." />);
    expect(screen.getByText("Already in use.")).toBeInTheDocument();
  });
});
