import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FIELD_ERROR_ATTRIBUTE, renderFieldError } from "./fieldError";
import {
  findFirstFieldError,
  scrollToFirstFieldError,
} from "./scrollToFirstFieldError";

/**
 * He clicked Continue, nothing moved, and he reported the button as broken
 * (P1 `13:27`). The error was on screen — small, thin, and several screens
 * above where he was looking.
 *
 * > P1 `13:40` — "Can we make this bold or somehow a little bit bigger because
 * > I missed it, that it was there."
 */
describe("renderFieldError", () => {
  it("says nothing for a field that is fine", () => {
    expect(renderFieldError(undefined)).toBeNull();
    expect(renderFieldError(null)).toBeNull();
  });

  it("shows the message", () => {
    render(<div>{renderFieldError({ message: "Category is required" })}</div>);

    expect(screen.getByText("Category is required")).toBeInTheDocument();
  });

  /* The half he asked for by name. */
  it("is heavier and larger than the body text around it", () => {
    render(<div>{renderFieldError({ message: "Brand is required" })}</div>);

    const style = screen.getByText("Brand is required").style;
    expect(style.fontWeight).toBe("600");
    expect(style.fontSize).toBe("0.95rem");
  });

  /* Announced, because someone who cannot see the form at all had even less to
     go on than he did. */
  it("announces itself", () => {
    render(<div>{renderFieldError({ message: "Cost is required" })}</div>);

    expect(screen.getByRole("alert")).toHaveTextContent("Cost is required");
  });

  /* The mark that lets the first one be found without anyone keeping a list of
     field names in sync with the form. */
  it("marks itself so it can be scrolled to", () => {
    render(<div>{renderFieldError({ message: "Cost is required" })}</div>);

    expect(
      document.querySelector(`[${FIELD_ERROR_ATTRIBUTE}]`)
    ).toHaveTextContent("Cost is required");
  });
});

describe("scrollToFirstFieldError", () => {
  const form = (...messages) =>
    render(<div>{messages.map((m) => renderFieldError({ message: m }))}</div>);

  /* DOM order is page order, whatever order the form declares its fields in. */
  it("finds the first error on the page, not the last", () => {
    form("Category is required", "Cost is required");

    expect(findFirstFieldError()).toHaveTextContent("Category is required");
  });

  it("finds nothing when the form is valid", () => {
    render(<div />);

    expect(findFirstFieldError()).toBeNull();
    expect(scrollToFirstFieldError()).toBe(false);
  });

  it("scrolls the first error into view and says it did", () => {
    form("Category is required");
    const target = findFirstFieldError();
    target.scrollIntoView = vi.fn();
    vi.stubGlobal("requestAnimationFrame", (fn) => fn());

    expect(scrollToFirstFieldError()).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });

    vi.unstubAllGlobals();
  });

  /* happy-dom has no scrollIntoView, and neither do some older browsers. A
     missing scroll must not take the click down with it. */
  it("survives an element that cannot scroll", () => {
    form("Category is required");
    vi.stubGlobal("requestAnimationFrame", (fn) => fn());

    expect(() => scrollToFirstFieldError()).not.toThrow();

    vi.unstubAllGlobals();
  });
});
