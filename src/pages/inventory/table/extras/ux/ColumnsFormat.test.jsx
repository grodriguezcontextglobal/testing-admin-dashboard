import { describe, expect, it } from "vitest";
import ColumnsFormat from "./ColumnsFormat";
import { INVENTORY_SORT_COLUMNS } from "../../../utils/inventoryPageContract";

const build = (overrides = {}) =>
  ColumnsFormat({
    dictionary: {},
    navigate: () => {},
    cellStyle: {},
    ...overrides,
  });

const byKey = (columns, key) => columns.find((column) => column.key === key);

describe("ColumnsFormat with client-side sorting (flag off)", () => {
  const columns = build();

  it("keeps a comparator on every sortable column", () => {
    // The in-memory branch has the whole dataset, so antd sorting it is
    // correct. Nothing here changes until the flag flips.
    for (const key of [
      "category_name",
      "item_group",
      "warehouse",
      "ownership",
      "main_warehouse",
      "location",
      "serial_number",
    ]) {
      expect(byKey(columns, key)?.sorter).toBeTruthy();
      expect(byKey(columns, key)?.sorter).not.toBe(true);
    }
  });

  it("still shows the Status column off `warehouse`", () => {
    expect(byKey(columns, "warehouse")?.title).toBe("Status");
  });
});

describe("ColumnsFormat with server-side sorting (flag on)", () => {
  const columns = build({ serverSorted: true });

  it("hands every sortable column to antd as `sorter: true`", () => {
    // `true` is antd's "this column sorts, but not by me" — it draws the
    // arrows and fires onChange without touching row order. A comparator here
    // would re-sort the fifty rows of the current page on top of an order MySQL
    // already applied across the whole set, so page 2 would be internally
    // sorted and wrong relative to page 1.
    const sortable = columns.filter((column) => column.sorter);
    expect(sortable.length).toBeGreaterThan(0);
    for (const column of sortable) {
      expect(column.sorter).toBe(true);
    }
  });

  it("only marks columns the server will actually order by", () => {
    // Sending a sortBy outside the whitelist is a 400. The column keys are
    // where that request originates, so they are what has to match.
    for (const column of columns.filter((c) => c.sorter)) {
      expect(INVENTORY_SORT_COLUMNS).toContain(column.key);
    }
  });

  it("moves the Status column onto the field it paints", () => {
    // It sorted by `warehouse` and displayed `logistic_status`, so clicking the
    // header reordered by something invisible. `warehouse` is an int flag —
    // 1 in stock, 0 out — which is also why its localeCompare was sorting
    // numbers as text.
    const status = byKey(columns, "logistic_status");
    expect(status?.title).toBe("Status");
    expect(status?.dataIndex).toBe("logistic_status");
    expect(byKey(columns, "warehouse")).toBeUndefined();
  });

  it("reflects the active sort back into the header arrows", () => {
    const sorted = build({
      serverSorted: true,
      sortBy: "location",
      sortDir: "desc",
    });
    expect(byKey(sorted, "location")?.sortOrder).toBe("descend");
    expect(byKey(sorted, "serial_number")?.sortOrder).toBeNull();
  });

  it("leaves every arrow unset when nothing is sorted", () => {
    for (const column of columns.filter((c) => c.sorter)) {
      expect(column.sortOrder).toBeNull();
    }
  });
});

describe("the Status pill", () => {
  it("reads logistic_status off the row, not out of the raw nested object", () => {
    // The server contract drops the duplicated `data: <raw item>` that each row
    // carried, and this render was its only reader. The top-level field is
    // present in both branches, so the switch is behaviour-identical today.
    const status = byKey(build(), "warehouse");
    const painted = status.render(1, {
      logistic_status: "in-stock",
      data: undefined,
    });
    expect(painted).toBeTruthy();
    expect(JSON.stringify(painted.props)).toContain("In Stock");
  });
});
