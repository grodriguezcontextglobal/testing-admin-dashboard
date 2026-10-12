import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import RenderingMoreThanTreeviewElements from "./RenderingMoreThanTreeviewElements";

/**
 * The cards under each collapsed section of the inventory filters panel.
 *
 * Reported from `/inventory` as the page crashing while the table loaded:
 * `Cannot read properties of undefined (reading 'Charger')`. The component
 * read `dictionary[opt.key]` from a prop the caller had stopped passing, so
 * the first card of the first section threw and took the whole panel with it.
 * "Charger" is a category name — every section renders through here, not just
 * the ownership one.
 *
 * The lookup is only meaningful for the ownership section, where the stored
 * value and the label are different words. Everywhere else `opt.key` is the
 * name itself, and a category that happens to be called "Rent" is a category,
 * not a lease.
 */

const section = (overrides = {}) => ({
  key: "category_name",
  routeTitle: "category_name",
  data: [{ key: "Charger", value: 12, totalAvailable: 9 }],
  ...overrides,
});

const renderSection = (item) =>
  render(
    <MemoryRouter>
      <RenderingMoreThanTreeviewElements item={item} searchItem="" />
    </MemoryRouter>
  );

describe("RenderingMoreThanTreeviewElements", () => {
  it("renders a category card without being handed a dictionary", () => {
    renderSection(section());

    expect(screen.getByText("Charger")).toBeInTheDocument();
  });

  it("labels an ownership value the way a person reads it", () => {
    renderSection(
      section({
        key: "ownership",
        routeTitle: "ownership",
        data: [{ key: "Resale", value: 4 }],
      })
    );

    expect(screen.getByText("For Resale")).toBeInTheDocument();
  });

  it("labels a row still stored as the old Sale value the same way", () => {
    renderSection(
      section({
        key: "ownership",
        routeTitle: "ownership",
        data: [{ key: "Sale", value: 2 }],
      })
    );

    expect(screen.getByText("For Resale")).toBeInTheDocument();
  });

  it("leaves a category named like an ownership value alone", () => {
    renderSection(section({ data: [{ key: "Rent", value: 1 }] }));

    expect(screen.getByText("Rent")).toBeInTheDocument();
    expect(screen.queryByText("Leased")).not.toBeInTheDocument();
  });
});

/* A company with dozens of categories or brands used to get every card at
   once, and the panel grew until it pushed the table off the page. The cards
   now come twelve at a time, in a carousel. */
describe("RenderingMoreThanTreeviewElements — carousel", () => {
  const cards = (count) =>
    Array.from({ length: count }, (_, i) => ({
      key: `Brand ${String(i + 1).padStart(2, "0")}`,
      value: i + 1,
    }));

  it("shows at most twelve cards at a time", () => {
    renderSection(section({ key: "brand", routeTitle: "brand", data: cards(25) }));

    expect(screen.getByText("Brand 01")).toBeInTheDocument();
    expect(screen.getByText("Brand 12")).toBeInTheDocument();
    expect(screen.queryByText("Brand 13")).not.toBeInTheDocument();
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });

  it("moves to the next twelve and back", () => {
    renderSection(section({ key: "brand", routeTitle: "brand", data: cards(25) }));

    fireEvent.click(screen.getByRole("button", { name: "Next cards" }));
    expect(screen.getByText("Brand 13")).toBeInTheDocument();
    expect(screen.queryByText("Brand 01")).not.toBeInTheDocument();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous cards" }));
    expect(screen.getByText("Brand 01")).toBeInTheDocument();
  });

  it("jumps straight to a page", () => {
    renderSection(section({ key: "brand", routeTitle: "brand", data: cards(25) }));

    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));
    expect(screen.getByText("Brand 25")).toBeInTheDocument();
    expect(screen.queryByText("Brand 24")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next cards" })).toBeDisabled();
  });

  it("has no controls when twelve cards or fewer fit on one page", () => {
    renderSection(section({ key: "brand", routeTitle: "brand", data: cards(12) }));

    expect(screen.getByText("Brand 12")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Next cards" })).not.toBeInTheDocument();
  });

  /* A search can shrink the list while the carousel is on a later page; it
     must not be left on a page that no longer exists, showing nothing. */
  it("falls back to the last page that still exists when the list shrinks", () => {
    const { rerender } = renderSection(
      section({ key: "brand", routeTitle: "brand", data: cards(25) })
    );
    fireEvent.click(screen.getByRole("button", { name: "Go to page 3" }));

    rerender(
      <MemoryRouter>
        <RenderingMoreThanTreeviewElements
          item={section({ key: "brand", routeTitle: "brand", data: cards(20) })}
          searchItem=""
        />
      </MemoryRouter>
    );
    expect(screen.getByText("Brand 13")).toBeInTheDocument();
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
  });
});
