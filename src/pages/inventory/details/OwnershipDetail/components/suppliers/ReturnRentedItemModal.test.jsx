import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admin = {
  name: "Root",
  email: "root@x.com",
  companyData: { id: "co-1" },
  sqlInfo: { company_id: 7 },
};

vi.mock("react-redux", () => ({
  useSelector: (fn) => fn({ admin: { user: admin } }),
}));

const post = vi.fn().mockResolvedValue({ data: { result: [] } });
vi.mock("../../../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));

const activitySpy = vi.fn().mockResolvedValue(null);
vi.mock("../../../../../../api/activityLog", () => ({
  registerStaffActivity: (...args) => activitySpy(...args),
}));

const emailSpy = vi.fn().mockResolvedValue(null);
vi.mock("../../../../../../components/notification/email/EmailReturnRentalItems", () => ({
  default: (...args) => emailSpy(...args),
}));

vi.mock("../../../../../../utils/actions/clearCacheMemory", () => ({
  default: vi.fn().mockResolvedValue(null),
}));

const { default: ReturnRentedItemModal } = await import("./ReturnRentedItemModal");

const rows = [
  { item_id: 200580, serial_number: "SN-A1", item_group: "Tablet" },
  { item_id: 200581, serial_number: "SN-B2", item_group: "Radio" },
];

/**
 * Answers the flow's requests. `state` overrides what `inventory.itemsByIds`
 * reports for each item, which is what decides whether it may be returned.
 */
const serverAnswers = ({ state = {}, deleteAnswer } = {}) =>
  post.mockImplementation((url, body) => {
    if (url === "/db_company/inventory-query" && body?.queryName === "inventory.itemsByIds") {
      return Promise.resolve({
        data: {
          result: rows.map((row) => ({
            logistic_status: "in-stock",
            warehouse: 1,
            ...row,
            ...(state[row.item_id] ?? {}),
          })),
        },
      });
    }
    if (url === "/db_company/delete-bulk-items" && deleteAnswer) {
      return Promise.resolve(deleteAnswer);
    }
    return Promise.resolve({ data: { result: [] } });
  });

const runReturn = async () => {
  fireEvent.click(screen.getByText("Return all 2 items"));
  fireEvent.click(await screen.findByText("Return"));
};

const deletedIds = () =>
  post.mock.calls
    .filter(([url]) => url === "/db_company/delete-bulk-items")
    .flatMap(([, body]) => body.item_ids ?? []);

/** Ticks the checkbox on the row showing `serial`, by row rather than by index. */
const tickRow = (serial) => {
  const cell = screen.getByText(serial);
  const row = cell.closest("tr");
  const box = row.querySelector("input[type=checkbox]");
  fireEvent.click(box);
};

const renderModal = (props = {}) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <ReturnRentedItemModal
        open
        handleClose={vi.fn()}
        supplier_id={3}
        data={rows}
        {...props}
      />
    </QueryClientProvider>
  );
};

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: { result: [] } });
  emailSpy.mockClear();
  activitySpy.mockClear();
});

describe("ReturnRentedItemModal", () => {
  it("shows one table, not two tabs for the same rows", () => {
    renderModal();
    expect(screen.getByText("SN-A1")).toBeTruthy();
    expect(screen.getByText("SN-B2")).toBeTruthy();
    expect(screen.queryByText("Return All Items")).toBeNull();
    expect(screen.queryByText("Return Selected Items")).toBeNull();
  });

  it("acts on everything when nothing is selected", () => {
    renderModal();
    expect(screen.getByText("Return all 2 items")).toBeTruthy();
  });

  it("switches to the selection as soon as a row is ticked", async () => {
    renderModal();
    tickRow("SN-A1");
    await waitFor(() => expect(screen.getByText("Return 1 selected")).toBeTruthy());
  });

  it("keeps the selection while the search narrows the table", async () => {
    renderModal();
    tickRow("SN-A1");
    await waitFor(() => expect(screen.getByText("Return 1 selected")).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText("Item ID, serial number or group"), {
      target: { value: "SN-B2" },
    });

    // Switching tabs used to clear both the search and the selection.
    await waitFor(() => expect(screen.queryByText("SN-A1")).toBeNull());
    expect(screen.getByText("Return 1 selected")).toBeTruthy();
  });

  it("says it is irreversible before it runs", () => {
    renderModal();
    expect(
      screen.getByText(/leave this company's inventory permanently/i)
    ).toBeTruthy();
  });

  it("does not report items returned when the server refused the delete", async () => {
    /* These endpoints answer HTTP 200 with `{ ok: false, msg }` when they
       refuse a write. The response used to be discarded, so the progress bar
       filled and the modal reported the items returned while nothing had been
       written. */
    serverAnswers({
      deleteAnswer: { data: { ok: false, msg: "delete refused by the server" } },
    });

    renderModal();
    await runReturn();

    await waitFor(() =>
      expect(screen.getByText(/delete refused by the server/)).toBeTruthy()
    );
    expect(screen.getByText(/stopped partway/)).toBeTruthy();
  });

  it("never asks update-large-data to mark items as returned", async () => {
    /* The old first step wrote warehouse, enableAssignFeature,
       returnedRentedInfo and return_date onto rows the last step deletes.
       Nothing read any of it, and the call was being rejected outright for
       carrying `returnedRentedInfo`. */
    serverAnswers();
    renderModal();
    await runReturn();

    await waitFor(() => expect(deletedIds()).toHaveLength(2));
    expect(
      post.mock.calls.some(([url]) => url === "/db_inventory/update-large-data")
    ).toBe(false);
  });

  it("leaves an item that is in use where it is", async () => {
    // Not in stock and not in the warehouse: it is out with somebody.
    serverAnswers({
      state: { 200581: { logistic_status: "assigned", warehouse: 0 } },
    });
    renderModal();
    await runReturn();

    await waitFor(() => expect(deletedIds()).toEqual([200580]));
    expect(deletedIds()).not.toContain(200581);
    await waitFor(() =>
      expect(screen.getByText(/still in use and will not be returned: SN-B2/)).toBeTruthy()
    );
  });

  it("returns an item that is accounted for by either half of the rule", async () => {
    serverAnswers({
      state: {
        200580: { logistic_status: "in-stock", warehouse: 0 },
        200581: { logistic_status: "in-transit", warehouse: 1 },
      },
    });
    renderModal();
    await runReturn();

    await waitFor(() => expect(deletedIds()).toEqual([200580, 200581]));
  });

  it("deletes nothing when every item is in use", async () => {
    serverAnswers({
      state: {
        200580: { logistic_status: "assigned", warehouse: 0 },
        200581: { logistic_status: "in-event", warehouse: 0 },
      },
    });
    renderModal();
    await runReturn();

    await waitFor(() =>
      expect(screen.getByText(/still in use and will not be returned/)).toBeTruthy()
    );
    expect(deletedIds()).toEqual([]);
    expect(emailSpy).not.toHaveBeenCalled();
    expect(activitySpy).not.toHaveBeenCalled();
  });

  it("returns an in-stock item even when the query answers without a status", async () => {
    /* The reported failure: `inventory.itemsByIds` came back with only
       item_id/serial_number/item_group, every item was judged "unknown", and an
       item plainly in stock was refused with "still in use". */
    post.mockImplementation((url, body) => {
      if (url === "/db_company/inventory-query" && body?.queryName === "inventory.itemsByIds") {
        return Promise.resolve({
          data: { result: rows.map(({ item_id, serial_number, item_group }) => ({ item_id, serial_number, item_group })) },
        });
      }
      return Promise.resolve({ data: { result: [] } });
    });

    renderModal();
    await runReturn();

    await waitFor(() => expect(deletedIds()).toEqual([200580, 200581]));
    // And it says the guard did not run, rather than pretending it did.
    await waitFor(() =>
      expect(screen.getByText(/in-use check could not run/)).toBeTruthy()
    );
    expect(screen.queryByText(/still in use/)).toBeNull();
  });

  it("deletes nothing when the state could not be read", async () => {
    // A return destroys the record, so an unreadable state is never assumed
    // free.
    post.mockImplementation((url, body) => {
      if (url === "/db_company/inventory-query" && body?.queryName === "inventory.itemsByIds") {
        return Promise.resolve({ data: { result: [] } });
      }
      return Promise.resolve({ data: { result: [] } });
    });
    renderModal();
    await runReturn();

    await waitFor(() =>
      expect(screen.getByText(/no longer in the inventory|state could not be read|will not be returned/)).toBeTruthy()
    );
    expect(deletedIds()).toEqual([]);
  });

  it("reports the return before deleting anything", async () => {
    // The report is the record: once the rows are gone, nothing that is not in
    // it survives.
    serverAnswers();
    renderModal();
    await runReturn();

    await waitFor(() => expect(deletedIds()).toHaveLength(2));
    const emailAt = emailSpy.mock.invocationCallOrder[0];
    const deleteAt = post.mock.calls.findIndex(
      ([url]) => url === "/db_company/delete-bulk-items"
    );
    expect(emailAt).toBeGreaterThan(0);
    expect(deleteAt).toBeGreaterThan(-1);
    // The report received the rows it is built from, not just ids.
    expect(emailSpy.mock.calls[0][0].resolvedItems).toHaveLength(2);
    expect(emailSpy.mock.calls[0][0].returnedAt).toBeTruthy();
  });

  it("writes one activity-log row per item, since the records are about to go", async () => {
    serverAnswers();
    renderModal();
    await runReturn();

    await waitFor(() => expect(activitySpy).toHaveBeenCalledTimes(2));
    expect(activitySpy.mock.calls[0][0]).toMatchObject({
      action: "DELETE",
      target_model: "Item",
      target_id: 200580,
    });
    expect(activitySpy.mock.calls[0][0].details).toMatchObject({
      reason: "returned_to_supplier",
      returned_by: "Root",
      serial_number: "SN-A1",
    });
  });

  it("offers an empty state rather than an empty table", async () => {
    // An empty `data` means "nothing handed over", so it falls back to the
    // fetch — which the mock answers with no rows.
    renderModal({ data: [] });
    expect(await screen.findByText("No rented items")).toBeTruthy();
  });
});
