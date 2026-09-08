import { Table } from "antd";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import columnsTableMain from "./ColumnsTableMain";

/**
 * The arrow icon at the end of every inventory detail table row.
 *
 * Reported from the location detail page: clicking it did nothing, while the
 * same action worked from the All devices table. The five detail tables build
 * their rows as `key: `${data.item_id}-${uniqueId()}``, and the icon used to
 * recover the id by splitting that key on "-". For a row whose `item_id` never
 * arrived the key is "undefined-47", so the split produced the *string*
 * "undefined" — truthy, so `disabled={!itemId}` never tripped — and the click
 * navigated to `/inventory/item?id=undefined`.
 */

const navigate = vi.fn();

const row = (overrides) => ({
  item_group: "Chromebook",
  category_name: "Laptop",
  serial_number: "SN-100016",
  ownership: "Permanent",
  data: { item_group: "Chromebook", location: "IT office" },
  ...overrides,
});

const renderTable = (dataSource) =>
  render(
    <Table
      columns={columnsTableMain({
        cellStyle: {},
        dictionary: { Permanent: "Permanent" },
        groupingByDeviceType: {},
        navigate,
        responsive: Array.from({ length: 8 }, () => ["xs", "sm", "md", "lg"]),
        data: dataSource,
      })}
      dataSource={dataSource}
      pagination={false}
    />
  );

beforeEach(() => {
  navigate.mockClear();
});

describe("the item details icon", () => {
  it("opens the item the row belongs to", () => {
    renderTable([row({ key: "200602-47", item_id: 200602 })]);

    fireEvent.click(screen.getByRole("button", { name: "View item details" }));

    expect(navigate).toHaveBeenCalledWith("/inventory/item?id=200602");
  });

  it("finds the id in the row key when the row itself has none", () => {
    renderTable([row({ key: "200602-47" })]);

    fireEvent.click(screen.getByRole("button", { name: "View item details" }));

    expect(navigate).toHaveBeenCalledWith("/inventory/item?id=200602");
  });

  it("falls back to the joined inventory row", () => {
    renderTable([
      row({ key: "undefined-47", data: { item_id: 200602, item_group: "Chromebook" } }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "View item details" }));

    expect(navigate).toHaveBeenCalledWith("/inventory/item?id=200602");
  });

  it("never navigates to an item page with no item", () => {
    // The reported bug: this row used to render an enabled icon that went to
    // /inventory/item?id=undefined.
    renderTable([row({ key: "undefined-47" })]);

    const button = screen.getByRole("button", { name: "Item details unavailable" });
    expect(button).toBeDisabled();

    fireEvent.click(button);
    expect(navigate).not.toHaveBeenCalled();
  });

  it("says why the icon is unavailable instead of leaving it inert", () => {
    renderTable([row({ key: "undefined-47" })]);

    expect(
      screen.getByTitle(/arrived without an item id/i)
    ).toBeInTheDocument();
  });

  it("leaves the other rows usable when one row is broken", () => {
    renderTable([
      row({ key: "undefined-47", serial_number: "SN-BROKEN" }),
      row({ key: "200602-48", item_id: 200602 }),
    ]);

    fireEvent.click(screen.getByRole("button", { name: "View item details" }));

    expect(navigate).toHaveBeenCalledWith("/inventory/item?id=200602");
  });
});
