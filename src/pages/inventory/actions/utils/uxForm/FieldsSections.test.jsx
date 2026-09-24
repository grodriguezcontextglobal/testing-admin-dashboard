import { Divider, Grid } from "@mui/material";
import { AutoComplete } from "antd";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import FieldsSections from "./FieldsSections";

/**
 * Step 3 of the edit-inventory wizard crashed with `i is not a function`.
 *
 * The component destructured `renderingErrorMessage` and called it unguarded,
 * but every one of its four callers — EditFieldsStep, FieldGrid, BulkItemForm,
 * BulkRentedItems — passes `renderFieldError`, the shared helper from
 * `utils/fieldError`. Nothing in `src/` has ever passed a prop by the old name.
 *
 * The rename is only half of it. `renderFieldError` is a module-level export,
 * so threading it through props buys nothing and costs exactly this: a name
 * that stops matching, with no error until the branch renders. The component
 * imports it directly now, and these tests render it the way the wizard does.
 */

const field = (overrides = {}) => ({
  name: "brand",
  label: "Brand",
  placeholder: "Pick a brand",
  htmlOption: 1,
  options: ["Shure", "Sennheiser"],
  ...overrides,
});

const renderSection = (props = {}) =>
  render(
    <FieldsSections
      Grid={Grid}
      Divider={Divider}
      AutoComplete={AutoComplete}
      AntSelectorStyle={{}}
      item={field()}
      errors={{}}
      renderingOptionsButtons={() => null}
      watch={vi.fn()}
      index={0}
      value=""
      onChange={vi.fn()}
      {...props}
    />
  );

describe("FieldsSections", () => {
  it("renders without being handed a function to draw errors with", () => {
    renderSection();

    // antd renders the AutoComplete as a combobox. Asserting on it rather
    // than on the placeholder, which antd puts on an inner node that
    // happy-dom does not expose the same way a browser does.
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("draws the field's error when there is one", () => {
    renderSection({ errors: { brand: { message: "Brand is required." } } });

    expect(screen.getByRole("alert")).toHaveTextContent("Brand is required.");
  });

  it("draws nothing when the field is fine", () => {
    renderSection();

    expect(screen.queryByRole("alert")).toBeNull();
  });

  /* A radio group is the other branch of renderComponent(), and it reaches the
     same error call underneath. */
  it("renders the radio branch and its error too", () => {
    renderSection({
      item: field({
        htmlOption: 3,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
        ],
      }),
      errors: { brand: { message: "Pick one." } },
    });

    expect(screen.getByText("Yes")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Pick one.");
  });

  it("does not draw the wizard's option buttons for a child field", () => {
    const renderingOptionsButtons = vi.fn(() => null);
    renderSection({ isChild: true, renderingOptionsButtons });

    expect(renderingOptionsButtons).not.toHaveBeenCalled();
  });
});
