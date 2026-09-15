import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The flag is read at module scope, so it has to be stubbed before ItemTable is
// imported. Every assertion in this file is about the OFF state: the whole
// point of Phase 3 is that the server branch ships inert.
vi.mock("../../../config/featureFlags", () => ({
  FEATURE_INVENTORY_SERVER_PAGINATION: false,
  FEATURE_SCOPED_ROLES: false,
}));

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn() },
}));

// ItemTable reads its context from MainPage, and MainPage lazily imports
// ItemTable back — a cycle the app gets away with because the import is lazy.
// Pulling MainPage in for real here drags the whole page behind it (exceljs,
// the datepicker stylesheet, every modal) and the file never finishes loading.
// Standing in for the two contexts breaks both the cycle and the weight.
vi.mock("../MainPage", async () => {
  const { createContext } = await import("react");
  return {
    SearchItemContext: createContext(),
    FilterOptionsContext: createContext(),
  };
});

// The three lazy children pull in the rest of the page; none of them is what
// this test is about.
vi.mock("./extras/RenderingFilters", () => ({ default: () => null }));
vi.mock("../actions/DownloadXlsx", () => ({ default: () => null }));
vi.mock("../../../components/utils/BannerMsg", () => ({ default: () => null }));

import { devitrakApi } from "../../../api/devitrakApi";
import { SearchItemContext } from "../MainPage";
import ItemTable from "./ItemTable";

const ROWS = [
  {
    item_id: 101,
    serial_number: "HSP-6001",
    item_group: "MiFi Hotspot X2",
    category_name: "Connectivity",
    brand: "Netgear",
    ownership: "Permanent",
    location: "Central Warehouse",
    main_warehouse: "Denver",
    warehouse: 1,
    logistic_status: "in-stock",
    status: "Good",
    image_url: "",
    enableAssignFeature: 1,
  },
  {
    item_id: 102,
    serial_number: "HSP-6002",
    item_group: "MiFi Hotspot X2",
    category_name: "Connectivity",
    brand: "Netgear",
    ownership: "Permanent",
    location: "Central Warehouse",
    main_warehouse: "Denver",
    warehouse: 1,
    logistic_status: "in-stock",
    status: "Good",
    image_url: "",
    enableAssignFeature: 1,
  },
];

const store = configureStore({
  reducer: {
    admin: () => ({
      user: {
        email: "ana@x.com",
        role: 0,
        sqlInfo: { company_id: 62 },
        companyData: { id: "mongo-62", employees: [] },
      },
    }),
    permission: () => ({ roleType: "admin", categories: [] }),
  },
});

const renderTable = (context = {}) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={client}>
        <MemoryRouter>
          <SearchItemContext.Provider
            value={{
              chosenOption: [],
              searchItem: "",
              refreshFn: () => {},
              setChosenOption: () => {},
              ...context,
            }}
          >
            <ItemTable
              setOpenAdvanceSearchModal={() => {}}
              setDataFilterOptions={() => {}}
              downloadDataReport={() => {}}
              setOpenCreateLocationModal={() => {}}
              setTypePerLocationInfoModal={() => {}}
              setOpenDetails={() => {}}
              allowedLocations={null}
              userPreferences={{}}
            />
          </SearchItemContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

beforeEach(() => {
  vi.clearAllMocks();
  devitrakApi.post.mockImplementation((url) => {
    if (url === "/db_item/warehouse-items") {
      return Promise.resolve({ data: { items: ROWS } });
    }
    if (url === "/image/images") {
      return Promise.resolve({ data: { item: [] } });
    }
    return Promise.resolve({ data: {} });
  });
});

describe("ItemTable with server pagination off", () => {
  // One mount for the whole block. Rendering this component is expensive —
  // ColumnsFormat alone pulls in most of the design system — and four separate
  // renders were enough extra load to time out two slow tests elsewhere in the
  // suite. Every assertion below is about the same settled page anyway.
  beforeEach(async () => {
    renderTable();
    await waitFor(() => expect(screen.getByText("HSP-6001")).toBeTruthy());
  });

  it("renders the rows from the in-memory dataset", () => {
    expect(screen.getByText("HSP-6002")).toBeTruthy();
  });

  it("still loads the inventory the way it does today", () => {
    expect(
      devitrakApi.post.mock.calls.some(
        ([url]) => url === "/db_item/warehouse-items",
      ),
    ).toBe(true);
  });

  it("does not call any of the three endpoints that 404 in production", () => {
    // The flag exists so this whole migration can sit on main while the server
    // side is still undeployed. If the page reached for these with the flag
    // off, every inventory load in production would take a 404.
    const posted = devitrakApi.post.mock.calls.map(([url]) => url);
    expect(posted).not.toContain("/db_item/inventory-page");
    expect(posted).not.toContain("/db_item/inventory-facets");
    expect(devitrakApi.get.mock.calls.map(([url]) => url)).not.toContain(
      "/db_item/serial-suggest",
    );
  });

  it("keeps antd's own pager and does not render the cursor pager", () => {
    expect(screen.queryByText("Next")).toBeNull();
    expect(screen.queryByText("Previous")).toBeNull();
    expect(document.querySelector(".ant-pagination")).toBeTruthy();
  });

  it("settles instead of re-rendering forever", async () => {
    // groupBy returns a new object on every call, and it fed the dependency
    // array behind baseDataset, which the search effect writes to state. Every
    // render produced a new identity, so the effect fired again — an update
    // loop with no exit, and the reason this file used to hang. The fetch count
    // holding still is the cheapest proof that it settles.
    const settled = devitrakApi.post.mock.calls.length;
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(devitrakApi.post.mock.calls.length).toBe(settled);
  });
});

describe("when a combination of filters matches nothing", () => {
  // The feature the filters exist for: Brand *and* Group, narrowing until the
  // answer is small — or until there is no answer. "Brand: Dell + Group: HP
  // Laptop" is a legitimate question with zero rows, and the table has to say
  // which of the two empties it is. The generic placeholder ("Nothing here
  // yet — once there is data to show, it will appear here") reads as "this
  // company has no inventory", which is the opposite of the truth.

  it("names the criteria instead of implying the company is empty", async () => {
    renderTable({
      chosenOption: [
        { category: 0, value: "Netgear" },
        { category: 1, value: "HP Laptop" },
      ],
    });

    await waitFor(() =>
      expect(screen.getByText(/No inventory matches/i)).toBeTruthy(),
    );
    expect(screen.getByText(/Brand: Netgear · Group: HP Laptop/)).toBeTruthy();
    expect(screen.queryByText("HSP-6001")).toBeNull();
  });

  it("offers a way back out of the dead end", async () => {
    const setChosenOption = vi.fn();
    renderTable({
      chosenOption: [{ category: 0, value: "Netgear" }, { category: 1, value: "HP Laptop" }],
      setChosenOption,
    });

    await waitFor(() =>
      expect(screen.getByText(/No inventory matches/i)).toBeTruthy(),
    );
    screen.getByText("Clear filters").click();
    expect(setChosenOption).toHaveBeenCalledWith([]);
  });

  it("says something different when nothing is filtered at all", async () => {
    // Same empty table, opposite meaning: no criteria, no rows.
    devitrakApi.post.mockImplementation((url) =>
      url === "/db_item/warehouse-items"
        ? Promise.resolve({ data: { items: [] } })
        : Promise.resolve({ data: { item: [] } }),
    );
    renderTable();

    await waitFor(() =>
      expect(devitrakApi.post).toHaveBeenCalled(),
    );
    expect(screen.queryByText(/No inventory matches/i)).toBeNull();
  });
});
