import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import adminReducer from "../store/slices/adminSlice";
import { devitrakApi } from "../api/devitrakApi";
import { useCompanyScopeLocations } from "./useCompanyScopeLocations";

vi.mock("../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

function makeWrapper(companyId) {
  const store = configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: companyId ? { sqlInfo: { company_id: companyId } } : {},
        errorMessage: undefined,
        companyAccountStripe: undefined,
        companyInfo: undefined,
        mfaEnabled: false,
      },
    },
  });
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  function Wrapper({ children }) {
    return createElement(
      Provider,
      { store },
      createElement(QueryClientProvider, { client: queryClient }, children)
    );
  }
  return Wrapper;
}

describe("useCompanyScopeLocations", () => {
  beforeEach(() => {
    devitrakApi.post.mockReset();
  });

  it("does not fire the query when there is no company id", () => {
    renderHook(() => useCompanyScopeLocations(), {
      wrapper: makeWrapper(undefined),
    });
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("maps result[] into label/value options carrying the numeric location_id", async () => {
    // LIVE contract: POST /db_company/locations -> { ok, result: [...] }.
    devitrakApi.post.mockResolvedValue({
      data: {
        ok: true,
        result: [
          { location_id: 3, location_name: "Warehouse A" },
          { location_id: 7, location_name: "Warehouse B" },
        ],
      },
    });

    const { result } = renderHook(() => useCompanyScopeLocations(), {
      wrapper: makeWrapper("company-123"),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(devitrakApi.post).toHaveBeenCalledWith("/db_company/locations", {
      company_id: "company-123",
    });
    expect(result.current.options).toEqual([
      { label: "Warehouse A", value: 3 },
      { label: "Warehouse B", value: 7 },
    ]);
  });

  it("drops entries with no location_id and tolerates a non-array result", async () => {
    devitrakApi.post.mockResolvedValue({
      data: {
        ok: true,
        result: [
          { location_id: 3, location_name: "Warehouse A" },
          { location_name: "No id here" },
        ],
      },
    });

    const { result } = renderHook(() => useCompanyScopeLocations(), {
      wrapper: makeWrapper("company-123"),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.options).toEqual([
      { label: "Warehouse A", value: 3 },
    ]);
  });
});
