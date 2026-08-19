import { describe, expect, it } from "vitest";
import { renderFields } from "./BulkItemsFields";

const baseParams = {
  displayContainerSplotLimitField: false,
  displayPreviewImage: false,
  isRented: false,
  options: [{ value: "Rent" }, { value: "Permanent" }],
  OutlinedInputStyle: {},
  renderLocationOptions: () => [],
  retrieveItemOptions: () => [],
  subLocationsOptions: [],
  suppliersOptions: [],
};

const KNOWN_SECTIONS = ["info", "location", "assignable", "ownership"];

describe("renderFields (create)", () => {
  // containerSpotLimit, "Returning date" and "Supplier" used to exist both as
  // a child of container/ownership (shown conditionally) AND as a standalone
  // top-level entry with the same label — only kept out of the rendered form
  // by BulkItemForm.jsx filtering top-level fields whose label matched a
  // child's label. That filter is gone now that fields render by section, so
  // the duplicate entries themselves have to be gone too.
  it("does not duplicate a child field at the top level", () => {
    const fields = renderFields(baseParams);
    const childLabels = new Set(
      fields.flatMap((field) => (field.children ?? []).map((child) => child.label)),
    );
    for (const field of fields) {
      expect(childLabels.has(field.label)).toBe(false);
    }
  });

  it("tags every visible top-level field with a known section", () => {
    const fields = renderFields(baseParams);
    for (const field of fields.filter((f) => f.displayField && f.name)) {
      expect(KNOWN_SECTIONS).toContain(field.section);
    }
  });

  it("keeps the returning-date and supplier fields as ownership's children, gated on isRented", () => {
    const fields = renderFields({ ...baseParams, isRented: true });
    const ownership = fields.find((field) => field.name === "ownership");
    const childLabels = ownership.children.map((child) => child.label);
    expect(childLabels).toEqual(["Returning date", "Supplier"]);
    expect(ownership.children.every((child) => child.displayField)).toBe(true);
  });

  it("hides the returning-date and supplier children when the item is not rented", () => {
    const fields = renderFields({ ...baseParams, isRented: false });
    const ownership = fields.find((field) => field.name === "ownership");
    expect(ownership.children.every((child) => !child.displayField)).toBe(true);
  });

  it("keeps containerSpotLimit as container's only child, gated on the container flag", () => {
    const shown = renderFields({ ...baseParams, displayContainerSplotLimitField: true });
    const hidden = renderFields({ ...baseParams, displayContainerSplotLimitField: false });
    const container = shown.find((field) => field.name === "container");
    expect(container.children).toHaveLength(1);
    expect(container.children[0].name).toBe("containerSpotLimit");
    expect(container.children[0].displayField).toBe(true);
    expect(hidden.find((field) => field.name === "container").children[0].displayField).toBe(
      false,
    );
  });

  it("does not declare the same field name twice among the top-level fields", () => {
    const fields = renderFields(baseParams);
    const names = fields.map((field) => field.name).filter(Boolean);
    expect(new Set(names).size).toBe(names.length);
  });
});
