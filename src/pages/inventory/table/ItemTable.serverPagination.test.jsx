import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

// The mirror of ItemTable.test.jsx: everything here is about the flag being ON.
vi.mock("../../../config/featureFlags", () => ({
  FEATURE_INVENTORY_SERVER_PAGINATION: true,
  FEATURE_SCOPED_ROLES: false,
}));

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn() },
}));

vi.mock("../MainPage", async () => {
  const { createContext } = await import("react");
  return {
    SearchItemContext: createContext(),
    FilterOptionsContext: createContext(),
  };
});

vi.mock("./extras/RenderingFilters", () => ({ default: () => null }));
vi.mock("../actions/DownloadXlsx", () => ({ default: () => null }));
vi.mock("../../../components/utils/BannerMsg", () => ({ default: () => null }));

import { devitrakApi } from "../../../api/devitrakApi";
import { SearchItemContext } from "../MainPage";
import ItemTable from "./ItemTable";

const row = (item_id, serial_number, brand) => ({
  item_id,
  serial_number,
  brand,
  item_group: "MiFi Hotspot X2",
  category_name: "Connectivity",
  ownership: "Permanent",
  location: "Central Warehouse",
  main_warehouse: "Denver",
  warehouse: 1,
  logistic_status: "in-stock",
  status: "Good",
  image_url: "",
  enableAssignFeature: 1,
});

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

const renderTable = (context = {}, props = {}) => {
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
              {...props}
            />
          </SearchItemContext.Provider>
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>,
  );
};

const pageWith = (items) => ({
  data: { ok: true, items, pageSize: 50, nextCursor: null, hasMore: false },
});

beforeEach(() => {
  vi.clearAllMocks();
  devitrakApi.post.mockImplementation((url) => {
    if (url === "/db_item/inventory-page") {
      return Promise.resolve(pageWith([row(101, "HSP-6001", "Netgear")]));
    }
    if (url === "/db_item/inventory-facets") {
      return Promise.resolve({
        data: {
          ok: true,
          matchedTotal: 48213,
          facets: { brand: [{ value: "Dell" }, { value: "Netgear" }] },
        },
      });
    }
    return Promise.resolve({ data: { item: [] } });
  });
});

describe("the filters ask the server, not the page", () => {
  it("sends the chosen filters in the request", async () => {
    // The trap this guards against: fetching a page and then narrowing those
    // rows in the client. That answers "which of these fifty match" instead of
    // "which of the whole inventory match" — a different, wrong question, and
    // one that looks right until the matching row sits on page four.
    renderTable({ chosenOption: [{ category: 0, value: "Netgear" }] });

    await waitFor(() =>
      expect(
        devitrakApi.post.mock.calls.some(
          ([url]) => url === "/db_item/inventory-page",
        ),
      ).toBe(true),
    );
    const [, body] = devitrakApi.post.mock.calls.find(
      ([url]) => url === "/db_item/inventory-page",
    );
    expect(body.filters).toEqual({ brand: "Netgear" });
  });

  it("renders the page the server returned without filtering it again", async () => {
    // The server has already applied the filter across the whole set. A second
    // pass here could only remove rows the server deliberately included, and
    // would quietly disagree with the count beside the table.
    devitrakApi.post.mockImplementation((url) =>
      url === "/db_item/inventory-page"
        ? Promise.resolve(
            pageWith([
              row(101, "HSP-6001", "Netgear"),
              row(102, "HSP-6002", "HP"),
            ]),
          )
        : Promise.resolve({ data: { item: [] } }),
    );

    renderTable({ chosenOption: [{ category: 0, value: "Netgear" }] });

    await waitFor(() => expect(screen.getByText("HSP-6001")).toBeTruthy());
    expect(screen.getByText("HSP-6002")).toBeTruthy();
  });

  it("stops downloading the whole inventory", async () => {
    // The point of the migration. Leaving warehouse-items alive behind the flag
    // would mean paying for every row *and* paging — the cost this replaces,
    // plus a second one.
    renderTable();

    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalled());
    await new Promise((resolve) => setTimeout(resolve, 50));
    expect(devitrakApi.post.mock.calls.map(([url]) => url)).not.toContain(
      "/db_item/warehouse-items",
    );
  });

  it("drives paging with the cursor pager, not antd's", async () => {
    renderTable();
    await waitFor(() => expect(screen.getByText("HSP-6001")).toBeTruthy());

    expect(screen.getByText("Next")).toBeTruthy();
    expect(screen.getByText("Previous")).toBeTruthy();
    expect(document.querySelector(".ant-pagination")).toBeNull();
  });
});

describe("the filter options describe the whole inventory", () => {
  const facetBodies = () =>
    devitrakApi.post.mock.calls
      .filter(([url]) => url === "/db_item/inventory-facets")
      .map(([, body]) => body);

  it("asks for the option lists without the active filters", async () => {
    // The requirement: choosing Brand must not shrink the Group list, so the
    // user can keep combining. Asking for the lists with no filters guarantees
    // that whatever the server decides to do about narrowing its own facets.
    renderTable({ chosenOption: [{ category: 0, value: "Netgear" }] });

    await waitFor(() => expect(facetBodies().length).toBeGreaterThan(0));
    expect(facetBodies().some((body) => !body.filters)).toBe(true);
  });

  it("asks separately, with the filters, for the number on screen", async () => {
    // matchedTotal has to count the set being shown, so that one call does
    // carry them. Two questions, two calls — the lists are cached and rarely
    // change; only this one moves when a filter moves.
    renderTable({ chosenOption: [{ category: 0, value: "Netgear" }] });

    await waitFor(() =>
      expect(
        facetBodies().some(
          (body) => body.filters && body.filters.brand === "Netgear",
        ),
      ).toBe(true),
    );
  });

  it("feeds the selects from the server, not from the page", async () => {
    const setDataFilterOptions = vi.fn();
    renderTable({}, { setDataFilterOptions });

    await waitFor(() =>
      expect(
        setDataFilterOptions.mock.calls.some(([o]) => o?.[0]?.length === 2),
      ).toBe(true),
    );
    const last = setDataFilterOptions.mock.calls.at(-1)[0];
    expect(last[0]).toEqual(["Dell", "Netgear"]);
  });

  it("reports the filtered total upward", async () => {
    const reportMatchedTotal = vi.fn();
    renderTable({}, { reportMatchedTotal });
    await waitFor(() => expect(reportMatchedTotal).toHaveBeenCalledWith(48213));
  });
});
