import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { usePlatformList, usePlatformSummary } from "./usePlatformLists";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApiPlatform: { get: vi.fn() },
}));

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("usePlatformList", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
  });

  it("asks GET /<resource> with the query and returns rows and totals", async () => {
    devitrakApiPlatform.get.mockResolvedValue({
      data: { ok: true, data: [{ id: 1 }], totals: { lost: 2 }, page: 1, limit: 25, total: 1 },
    });
    const { result } = renderHook(
      () => usePlatformList("inventory", { status: "lost", page: 1, limit: 25 }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/inventory", {
      params: { status: "lost", page: 1, limit: 25 },
    });
    expect(result.current.rows).toEqual([{ id: 1 }]);
    expect(result.current.totals).toEqual({ lost: 2 });
  });

  it("has empty rows while loading", () => {
    devitrakApiPlatform.get.mockReturnValue(new Promise(() => {}));
    const { result } = renderHook(() => usePlatformList("audit", {}), { wrapper: makeWrapper() });
    expect(result.current.rows).toEqual([]);
  });
});

describe("usePlatformSummary", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
  });

  it("asks GET /summary for the range and returns the summary", async () => {
    const summary = { range: "7d", current: {}, previous: {} };
    devitrakApiPlatform.get.mockResolvedValue({ data: { ok: true, data: summary } });
    const { result } = renderHook(() => usePlatformSummary("7d"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/summary", { params: { range: "7d" } });
    expect(result.current.summary).toEqual(summary);
  });
});
