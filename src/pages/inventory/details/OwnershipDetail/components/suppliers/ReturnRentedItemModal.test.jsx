import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

  it("offers an empty state rather than an empty table", async () => {
    // An empty `data` means "nothing handed over", so it falls back to the
    // fetch — which the mock answers with no rows.
    renderModal({ data: [] });
    expect(await screen.findByText("No rented items")).toBeTruthy();
  });
});
