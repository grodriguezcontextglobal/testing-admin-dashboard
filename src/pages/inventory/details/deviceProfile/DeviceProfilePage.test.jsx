import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { configureStore } from "@reduxjs/toolkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DeviceProfilePage from "./DeviceProfilePage";
import { devitrakApi } from "../../../../api/devitrakApi";

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../../../hooks/usePermission", () => ({
  usePermission: () => true,
}));

const ITEM = {
  item_id: 7,
  serial_number: "HSP-6001",
  item_group: "MiFi Hotspot X2",
  category_name: "Connectivity",
  cost: 90,
  ownership: "Permanent",
  warehouse: 0,
  location: "Central Warehouse",
  create_at: "2026-06-12",
  container: 0,
};

const MEMBER = {
  member_id: 4,
  first_name: "Marcus",
  last_name: "Webb",
  grade: "10",
  minor: 0,
};

// An open, overdue member lease — the state the redesign exists to surface.
const LEASE = {
  member_id: 4,
  device_id: 7,
  assigned_date: "2026-07-21",
  expected_return_date: "2026-08-04",
  returned: 0,
  returned_date: null,
  location: "Lincoln High School, Room 214",
};

const respond = (url) => {
  if (url.startsWith("/db_item/tracking_item")) {
    // The LEFT JOIN produces null address columns when a device has no event —
    // the exact payload that used to render "null, null, null, null".
    return Promise.resolve({
      data: {
        result: [
          {
            ...ITEM,
            street_address: null,
            city_address: null,
            state_address: null,
            zip_address: null,
          },
        ],
      },
    });
  }
  if (url === "/db_item/consulting-item") {
    return Promise.resolve({ data: { items: [ITEM] } });
  }
  if (url === "/db_member/retrieve-members-assigned-devices") {
    return Promise.resolve({ data: { rows: [LEASE] } });
  }
  if (url === "/db_lease/consulting-lease") {
    return Promise.resolve({ data: { lease: [] } });
  }
  if (url === "/db_member/consulting-member") {
    return Promise.resolve({ data: { members: [MEMBER] } });
  }
  if (url === "/db_item/warehouse-items") {
    return Promise.resolve({ data: { items: [ITEM, { ...ITEM, item_id: 8, warehouse: 1 }] } });
  }
  return Promise.resolve({ data: {} });
};

const store = configureStore({
  reducer: {
    admin: () => ({
      user: {
        sqlInfo: { company_id: 137 },
        sqlMemberInfo: { staff_id: 1 },
        companyData: { id: "abc", industry: "Education" },
        company: "Summit Unified",
      },
    }),
    member: () => ({ memberInfo: null }),
    staffDetail: () => ({ profile: null }),
  },
});

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={["/inventory/item?id=7"]}>
          <DeviceProfilePage />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe("DeviceProfilePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devitrakApi.post.mockImplementation((url) => respond(url));
  });

  it("leads with the serial number, not the model", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("profile-name")).toHaveTextContent("HSP-6001")
    );
  });

  it("never renders a string of nulls for the location", async () => {
    const { container } = renderPage();
    await waitFor(() => expect(screen.getByTestId("profile-name")).toBeTruthy());
    expect(container.textContent).not.toContain("null, null");
    expect(screen.getByTestId("device-stat-location")).toHaveTextContent(
      "Central Warehouse"
    );
  });

  it("surfaces the overdue loan as a critical tile", async () => {
    renderPage();
    const tile = await screen.findByTestId("device-stat-due");
    expect(tile.textContent).toMatch(/Overdue/i);
    expect(tile.className).toContain("profile-tile--critical");
  });

  it("names who is holding the device", async () => {
    renderPage();
    const tile = await screen.findByTestId("device-stat-holder");
    expect(tile).toHaveTextContent("Marcus Webb");
  });

  it("offers Return — not Assign — while the device is out", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId("profile-name")).toBeTruthy());
    expect(screen.getByText("Return device")).toBeTruthy();
    expect(screen.queryByText("Assign device")).toBeNull();
  });

  it("drops the dead search box the old page shipped", async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId("profile-name")).toBeTruthy());
    expect(screen.queryByPlaceholderText("Search devices here")).toBeNull();
  });
});
