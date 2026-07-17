import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import adminReducer from "../store/slices/adminSlice";
import { devitrakApi } from "../api/devitrakApi";
import { useCompanyCategories } from "./useCompanyCategories";

vi.mock("../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

function makeWrapper(companyId) {
  const store = configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: companyId ? { companyData: { id: companyId } } : {},
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

describe("useCompanyCategories", () => {
  beforeEach(() => {
    devitrakApi.post.mockReset();
  });

  it("does not fire the query when there is no company id", () => {
    renderHook(() => useCompanyCategories(), { wrapper: makeWrapper(undefined) });
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("fetches categories and dedupes them into label/value options", async () => {
    devitrakApi.post.mockResolvedValue({
      data: {
        categories: [
          { category_id: 1, category_name: "Cameras" },
          { category_id: 99, category_name: "Cameras" },
          { category_id: 2, category_name: "Lenses" },
        ],
      },
    });

    const { result } = renderHook(() => useCompanyCategories(), {
      wrapper: makeWrapper("company-123"),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(devitrakApi.post).toHaveBeenCalledWith("/db_company/categories", {
      company_id: "company-123",
    });
    expect(result.current.categories).toHaveLength(2);
    expect(result.current.options).toEqual([
      { label: "Cameras", value: "Cameras" },
      { label: "Lenses", value: "Lenses" },
    ]);
  });
});
