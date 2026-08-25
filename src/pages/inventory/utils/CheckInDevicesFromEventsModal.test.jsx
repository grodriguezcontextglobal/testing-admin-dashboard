import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const admin = {
  companyData: { id: "co-1" },
  sqlInfo: { company_id: 7 },
  sqlMemberInfo: { staff_id: 42 },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ admin: { user: admin } }),
}));

vi.mock("../actions/utils/useCompanyLocations", () => ({
  default: () => ({ data: [{ id: "loc-1", location: "Warehouse A" }], isLoading: false }),
}));

vi.mock("../actions/utils/useSubLocations", () => ({
  default: () => ({ data: ["Shelf 1"], isLoading: false }),
}));

const closedEvent = {
  id: "evt-1",
  active: false,
  eventInfoDetail: { eventName: "Expo 2026" },
  deviceSetup: [{ group: "Receiver" }],
};

const receiversInventory = [
  { device: "SN-001", type: "Receiver" },
  { device: "SN-002", type: "Receiver" },
];

const post = vi.fn((url) => {
  if (url === "/event/event-list") {
    return Promise.resolve({ data: { list: [closedEvent] } });
  }
  if (url === "/receiver/receiver-pool-list") {
    return Promise.resolve({ data: { receiversInventory } });
  }
  return Promise.resolve({ data: { ok: true } });
});

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...args) => post(...args),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
  },
}));

const { default: CheckInDevicesFromEventsModal } = await import(
  "./CheckInDevicesFromEventsModal"
);

const wrap = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <CheckInDevicesFromEventsModal open close={vi.fn()} />
    </QueryClientProvider>
  );
};

const pickTheEvent = async () => {
  fireEvent.click(await screen.findByPlaceholderText("Search closed events…"));
  fireEvent.click(await screen.findByText("Expo 2026"));
  return screen.findByPlaceholderText("Scan or type a serial, then press Enter");
};

const scan = (field, serial) => {
  fireEvent.change(field, { target: { value: serial } });
  fireEvent.keyDown(field, { key: "Enter" });
};

describe("CheckInDevicesFromEventsModal", () => {
  beforeEach(() => post.mockClear());

  it("opens on the event step and keeps the later steps out of the way", async () => {
    wrap();
    expect(await screen.findByText("Which event came back")).toBeTruthy();
    expect(screen.queryByText("Scan what arrived")).toBeNull();
    expect(screen.queryByText("Where the devices are stored")).toBeNull();
  });

  it("cannot check in before anything is scanned, and says why", async () => {
    wrap();
    await pickTheEvent();
    expect(screen.getByText("Scan at least one device that belongs to this event."))
      .toBeTruthy();
    expect(
      screen.getByText("Check in devices").closest("button").disabled
    ).toBe(true);
  });

  it("reconciles as you scan, with no Compare button to press", async () => {
    wrap();
    const field = await pickTheEvent();

    // The old screen froze the comparison behind a "Compare" button, so a scan
    // made afterwards was quietly left out of the check-in.
    expect(screen.queryByText("Compare")).toBeNull();

    scan(field, "SN-001");
    expect(await screen.findByText("SN-001 matched.")).toBeTruthy();
    // "Scanned" also labels a filter, so read the status off the row itself.
    expect(
      screen.getByText("SN-001").closest("tr").textContent
    ).toContain("Scanned");

    // The second scan updates the counts without any further action.
    scan(field, "SN-002");
    await waitFor(() =>
      expect(screen.getByText("Check in 2 devices")).toBeTruthy()
    );
  });

  it("names the serial that differs only in casing instead of filing it as an extra", async () => {
    wrap();
    const field = await pickTheEvent();
    scan(field, "sn-002");
    expect(
      await screen.findByText("sn-002 is not in this event — did you mean SN-002?")
    ).toBeTruthy();
  });

  it("says a re-scan was a duplicate rather than doing nothing", async () => {
    wrap();
    const field = await pickTheEvent();
    scan(field, "SN-001");
    scan(field, "SN-001");
    expect(await screen.findByText("SN-001 was already scanned.")).toBeTruthy();
  });

  it("warns that unscanned devices stay out with the event", async () => {
    wrap();
    const field = await pickTheEvent();
    scan(field, "SN-001");
    expect(
      await screen.findByText(/1 device is still not scanned/)
    ).toBeTruthy();
  });

  it("asks for a location before it will check anything in", async () => {
    wrap();
    const field = await pickTheEvent();
    scan(field, "SN-001");

    expect(await screen.findByText("Where the devices are stored")).toBeTruthy();
    expect(screen.getByText("Pick where the devices are being stored.")).toBeTruthy();
    expect(
      screen.getByText("Check in 1 device").closest("button").disabled
    ).toBe(true);
  });

  it("offers Cancel from the start", async () => {
    // The whole footer used to render only once a comparison had matches, so
    // there was no Cancel until then either.
    wrap();
    await screen.findByText("Which event came back");
    expect(screen.getByText("Cancel")).toBeTruthy();
  });
});
