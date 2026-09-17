import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn() },
}));

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({ admin: { user: { sqlInfo: { company_id: 62 } } } }),
}));

import { devitrakApi } from "../../../../api/devitrakApi";
import useInventoryFacets from "./useInventoryFacets";
import useInventoryPage from "./useInventoryPage";

const wrapper = ({ children }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
};

const pageResponse = (overrides = {}) => ({
  data: {
    ok: true,
    items: [{ item_id: 1, serial_number: "00100001" }],
    pageSize: 50,
    nextCursor: { v: "Laptop", id: 200436 },
    hasMore: true,
    ...overrides,
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  devitrakApi.post.mockResolvedValue(pageResponse());
});

describe("useInventoryPage", () => {
  it("asks for the first page with no cursor", async () => {
    const { result } = renderHook(() => useInventoryPage({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.items).toHaveLength(1));

    const [url, body] = devitrakApi.post.mock.calls[0];
    expect(url).toBe("/db_item/inventory-page");
    expect(body.cursor).toBeNull();
  });

  it("never puts company_id in the body", async () => {
    // The company travels in the s-company-lq header. A body copy read from
    // Redux can disagree with it after a company switch, and the server answers
    // that disagreement with a 400.
    renderHook(() => useInventoryPage({ enabled: true }), { wrapper });
    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalled());
    expect(devitrakApi.post.mock.calls[0][1]).not.toHaveProperty("company_id");
  });

  it("does not fetch while disabled, which is how the flag stays off", async () => {
    renderHook(() => useInventoryPage({ enabled: false }), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("walks forward with the cursor the server handed back", async () => {
    const { result } = renderHook(() => useInventoryPage({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.nextPage());
    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalledTimes(2));
    expect(devitrakApi.post.mock.calls[1][1].cursor).toEqual({
      v: "Laptop",
      id: 200436,
    });
  });

  it("refuses to step past the end", async () => {
    devitrakApi.post.mockResolvedValue(
      pageResponse({ hasMore: false, nextCursor: null }),
    );
    const { result } = renderHook(() => useInventoryPage({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.hasMore).toBe(false));

    act(() => result.current.nextPage());
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(devitrakApi.post).toHaveBeenCalledTimes(1);
  });

  it("steps back to the cursor it came from, and knows when it is home", async () => {
    const { result } = renderHook(() => useInventoryPage({ enabled: true }), {
      wrapper,
    });
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    expect(result.current.hasPrevious).toBe(false);

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.hasPrevious).toBe(true));

    const callsAfterForward = devitrakApi.post.mock.calls.length;

    act(() => result.current.previousPage());
    await waitFor(() => expect(result.current.hasPrevious).toBe(false));
    expect(result.current.cursor).toBeNull();

    // Page one is already in the cache under its own key, so stepping back is
    // free. Keying each cursor separately is what buys this.
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(devitrakApi.post).toHaveBeenCalledTimes(callsAfterForward);
  });

  it("sends the table back to page one when the query changes", async () => {
    // A cursor belongs to one ordering of one filtered set. Reusing it across a
    // filter change is how a table shows page 3 of a set that no longer exists.
    const { result, rerender } = renderHook(
      ({ filters }) => useInventoryPage({ enabled: true, filters }),
      { wrapper, initialProps: { filters: { brand: "Dell" } } },
    );
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.hasPrevious).toBe(true));

    rerender({ filters: { brand: "HP" } });
    await waitFor(() => expect(result.current.hasPrevious).toBe(false));

    const lastBody =
      devitrakApi.post.mock.calls[devitrakApi.post.mock.calls.length - 1][1];
    expect(lastBody.cursor).toBeNull();
    expect(lastBody.filters).toEqual({ brand: "HP" });
  });

  it("sends the sort to the server and starts the ordering over", async () => {
    // A cursor is a position inside one ordering. Keeping it across a re-sort
    // would resume from wherever the old order had reached, which is a page of
    // rows that belongs to no order at all.
    const { result, rerender } = renderHook(
      ({ sortBy, sortDir }) =>
        useInventoryPage({ enabled: true, sortBy, sortDir }),
      { wrapper, initialProps: { sortBy: "location", sortDir: "asc" } },
    );
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    expect(devitrakApi.post.mock.calls[0][1]).toMatchObject({
      sortBy: "location",
      sortDir: "asc",
    });

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.hasPrevious).toBe(true));

    rerender({ sortBy: "location", sortDir: "desc" });
    await waitFor(() => expect(result.current.hasPrevious).toBe(false));

    const lastBody =
      devitrakApi.post.mock.calls[devitrakApi.post.mock.calls.length - 1][1];
    expect(lastBody.sortDir).toBe("desc");
    expect(lastBody.cursor).toBeNull();
  });

  it("drops a sort the server would reject rather than earning a 400", async () => {
    renderHook(
      () => useInventoryPage({ enabled: true, sortBy: "cost", sortDir: "asc" }),
      { wrapper },
    );
    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalled());
    expect(devitrakApi.post.mock.calls[0][1]).not.toHaveProperty("sortBy");
  });

  it("does not reset the cursor when only the page size changes", async () => {
    const { result, rerender } = renderHook(
      ({ pageSize }) => useInventoryPage({ enabled: true, pageSize }),
      { wrapper, initialProps: { pageSize: 50 } },
    );
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    act(() => result.current.nextPage());
    await waitFor(() => expect(result.current.hasPrevious).toBe(true));

    rerender({ pageSize: 100 });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(result.current.hasPrevious).toBe(true);
  });

  it("reports an empty page rather than undefined while loading", () => {
    const { result } = renderHook(() => useInventoryPage({ enabled: true }), {
      wrapper,
    });
    // Components gated on a truthy dataset render nothing at all while a query
    // is in flight. An array that is empty-but-present keeps that from being a
    // separate branch at every call site.
    expect(result.current.items).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });
});

describe("useInventoryFacets", () => {
  beforeEach(() => {
    devitrakApi.post.mockResolvedValue({
      data: {
        ok: true,
        matchedTotal: 48213,
        facets: { brand: [{ value: "Dell", count: 12044 }] },
      },
    });
  });

  it("calls the facets endpoint with the page's filters and no company_id", async () => {
    const { result } = renderHook(
      () => useInventoryFacets({ enabled: true, filters: { brand: "Dell" } }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.matchedTotal).toBe(48213));

    const [url, body] = devitrakApi.post.mock.calls[0];
    expect(url).toBe("/db_item/inventory-facets");
    expect(body).toEqual({ filters: { brand: "Dell" } });
  });

  it("does not refetch when only the cursor moves", async () => {
    // Facets describe the whole filtered set. Re-running the aggregate on every
    // Next click is the cost this endpoint exists to avoid.
    const { rerender } = renderHook(
      ({ cursor }) => useInventoryFacets({ enabled: true, cursor }),
      { wrapper, initialProps: { cursor: null } },
    );
    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalledTimes(1));

    rerender({ cursor: { v: "Laptop", id: 200436 } });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(devitrakApi.post).toHaveBeenCalledTimes(1);
  });

  it("gives back a null total rather than zero before the answer arrives", () => {
    // Zero is a real answer — "nothing matches". Showing it while loading tells
    // the user something false.
    const { result } = renderHook(() => useInventoryFacets({ enabled: true }), {
      wrapper,
    });
    expect(result.current.matchedTotal).toBeNull();
  });

  it("stays quiet while disabled", async () => {
    renderHook(() => useInventoryFacets({ enabled: false }), { wrapper });
    await new Promise((resolve) => setTimeout(resolve, 20));
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });
});

describe("useInventoryFacets identity", () => {
  it("hands back the same facets object across renders while loading", async () => {
    // Not a nicety. The page feeds this into an effect that calls
    // setDataFilterOptions, so a fresh object every render schedules the next
    // render forever. The table already had that loop once, through groupBy.
    devitrakApi.post.mockReturnValue(new Promise(() => {}));
    const { result, rerender } = renderHook(
      () => useInventoryFacets({ enabled: true }),
      { wrapper },
    );
    const first = result.current.facets;
    rerender();
    rerender();
    expect(result.current.facets).toBe(first);
  });

  it("keeps it stable once the answer has arrived", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ok: true, matchedTotal: 3, facets: { brand: [{ value: "Dell" }] } },
    });
    const { result, rerender } = renderHook(
      () => useInventoryFacets({ enabled: true }),
      { wrapper },
    );
    await waitFor(() => expect(result.current.matchedTotal).toBe(3));
    const settled = result.current.facets;
    rerender();
    expect(result.current.facets).toBe(settled);
  });
});
