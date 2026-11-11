import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { usePlatformCompanies } from "./usePlatformCompanies";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApiPlatform: { get: vi.fn() },
}));

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("usePlatformCompanies", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
  });

  it("asks GET /companies with the built query, company in no header", async () => {
    devitrakApiPlatform.get.mockResolvedValue({ data: { ok: true, data: [], total: 0 } });
    renderHook(() => usePlatformCompanies({ search: " north ", status: "all", page: 2 }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/companies", {
      params: { search: "north", page: 2, limit: 25 },
    });
  });

  it("returns normalized rows and totals", async () => {
    const rows = [{ id: "c1", name: "Northwind Events", status: "at_risk" }];
    devitrakApiPlatform.get.mockResolvedValue({
      data: { ok: true, data: rows, page: 1, limit: 25, total: 48 },
    });
    const { result } = renderHook(() => usePlatformCompanies({}), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.rows).toEqual(rows);
    expect(result.current.total).toBe(48);
  });

  it("has empty rows, not undefined, while loading", () => {
    devitrakApiPlatform.get.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlatformCompanies({}), { wrapper: makeWrapper() });
    expect(result.current.rows).toEqual([]);
    expect(result.current.isLoading).toBe(true);
  });

  it("does not ask the server when disabled", () => {
    renderHook(() => usePlatformCompanies({}, { enabled: false }), { wrapper: makeWrapper() });
    expect(devitrakApiPlatform.get).not.toHaveBeenCalled();
  });
});
