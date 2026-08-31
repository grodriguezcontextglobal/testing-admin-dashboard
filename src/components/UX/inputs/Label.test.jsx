import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Label from "./Label";

/**
 * Before this prop existed the component had no required marker at all, so
 * every screen that needed one wrote its own — which is why the asterisk landed
 * on a different side of the text from one form to the next. One place decides
 * now: after the title, in the danger colour, so the mark reads as a
 * requirement rather than as decoration.
 */
describe("Label", () => {
  it("shows no marker unless the field is required", () => {
    const { container } = render(<Label htmlFor="a">Street</Label>);
    expect(container.textContent).toBe("Street");
    expect(container.querySelector(".form-label__required")).toBeNull();
  });

  it("puts the asterisk after the title, never before", () => {
    const { container } = render(
      <Label htmlFor="a" required>
        Street
      </Label>
    );
    expect(container.textContent.trim()).toMatch(/^Street\s*\*$/);
  });

  it("marks it in its own class, so the colour is set in one stylesheet", () => {
    const { container } = render(
      <Label htmlFor="a" required>
        Street
      </Label>
    );
    expect(container.querySelector(".form-label__required")).not.toBeNull();
  });

  it("hides the asterisk from screen readers — the input carries `required`", () => {
    const { container } = render(
      <Label htmlFor="a" required>
        Street
      </Label>
    );
    expect(
      container.querySelector(".form-label__required").getAttribute("aria-hidden")
    ).toBe("true");
  });

  it("still links to its input", () => {
    render(
      <Label htmlFor="street-input" required>
        Street
      </Label>
    );
    expect(screen.getByText(/Street/).getAttribute("for")).toBe("street-input");
  });
});
