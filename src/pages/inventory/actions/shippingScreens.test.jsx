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
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ admin: { user: admin } }),
}));

const eventItems = [
  {
    event_id: 3,
    event_name: "Expo 2026",
    event_address: "Miami Convention Center",
    item_id: 11,
    serial_number: "SN-A1",
    item_group: "Tablet",
    category_name: "Comms",
    shipping_status: "locked_in_warehouse",
  },
  {
    event_id: 3,
    event_name: "Expo 2026",
    event_address: "Miami Convention Center",
    item_id: 12,
    serial_number: "SN-B2",
    item_group: "Radio",
    category_name: "Comms",
    shipping_status: "locked_in_warehouse",
  },
];

const shipments = [
  {
    shipment_id: 1,
    destination: "Miami Convention Center",
    courier: "FedEx",
    tracking_number: "7712",
    recipient_name: "Grace",
    authorizer_name: "Ada",
    status: "pending",
    package_list: [11, 12],
  },
  {
    shipment_id: 2,
    destination: "Austin Center",
    courier: "Estafeta",
    tracking_number: "EST-9",
    recipient_name: "Bob",
    authorizer_name: "Ada",
    status: "delivered",
    package_list: [],
  },
];

const post = vi.fn((url) => {
  if (url === "/db_item/event-items/search") {
    return Promise.resolve({ data: { ok: true, items: eventItems } });
  }
  if (url === "/db_shipment/search") {
    return Promise.resolve({ data: { shipments } });
  }
  return Promise.resolve({ data: {} });
});

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...a) => post(...a), put: vi.fn(), get: vi.fn() },
}));

const { default: ShippingInventoryModal } = await import("./ShippingInventoryModal");
const { ShipmentRecord } = await import("./ShipmentRecord");

const wrap = (node) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
};

describe("ShippingInventoryModal", () => {
  beforeEach(() => post.mockClear());

  it("opens on the event step, with the other steps not yet in the way", async () => {
    wrap(<ShippingInventoryModal visible onClose={vi.fn()} user={admin} />);
    expect(await screen.findByText("Which event")).toBeTruthy();
    // The six shipping fields used to render disabled from the start, with
    // nothing saying why.
    expect(screen.queryByText("Where it is going, and who signs for it")).toBeNull();
  });

  it("cannot ship before an event and the shipping details are in", async () => {
    wrap(<ShippingInventoryModal visible onClose={vi.fn()} user={admin} />);
    const button = (await screen.findByText("Ship out inventory")).closest("button");
    expect(button.disabled).toBe(true);
  });

  it("reveals the packing list and the details once an event is picked", async () => {
    wrap(<ShippingInventoryModal visible onClose={vi.fn()} user={admin} />);
    await screen.findByText("Which event");

    fireEvent.click(await screen.findByPlaceholderText("Search an event…"));
    fireEvent.click(await screen.findByText(/Expo 2026/));

    // Two event-items rows collapse into one event carrying the count.
    expect(await screen.findByText(/2 items ready/)).toBeTruthy();
    expect(await screen.findByText("What is in the shipment (2)")).toBeTruthy();
    expect(screen.getByText("SN-A1")).toBeTruthy();

    // The status label the old map did not know, so every row showed an em dash.
    expect(screen.getAllByText("Ready to ship").length).toBeGreaterThan(0);

    // And the date field says where it actually goes.
    expect(
      screen.getByText("Printed on the packing list. Not stored with the shipment record.")
    ).toBeTruthy();
  });
});

describe("ShipmentRecord", () => {
  beforeEach(() => post.mockClear());

  it("shows the status every record is created with", async () => {
    wrap(<ShipmentRecord open setOpen={vi.fn()} />);
    expect(await screen.findByText("Pending")).toBeTruthy();
    expect(screen.getByText("Delivered")).toBeTruthy();
  });

  it("offers Copy on every tracking number, and Track only for a known courier", async () => {
    wrap(<ShipmentRecord open setOpen={vi.fn()} />);
    await screen.findByText("Pending");
    // Two shipments, so two Copy links; only FedEx is a carrier we can link to.
    expect(screen.getAllByText("Copy")).toHaveLength(2);
    expect(screen.getAllByText("Track")).toHaveLength(1);
  });

  it("filters the table", async () => {
    wrap(<ShipmentRecord open setOpen={vi.fn()} />);
    await screen.findByText("Pending");

    fireEvent.change(
      screen.getByPlaceholderText("Destination, courier, tracking number or name"),
      { target: { value: "austin" } }
    );

    await waitFor(() => expect(screen.queryByText("Miami Convention Center")).toBeNull());
    expect(screen.getByText("Austin Center")).toBeTruthy();
  });
});
