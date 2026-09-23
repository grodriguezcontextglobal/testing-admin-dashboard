import { render, screen } from "@testing-library/react";
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
