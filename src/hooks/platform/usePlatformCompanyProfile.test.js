import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { usePlatformCompany, usePlatformCompanySection } from "./usePlatformCompanyProfile";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApiPlatform: { get: vi.fn() },
}));

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe("usePlatformCompany", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
  });

  it("asks GET /companies/:id and returns the company", async () => {
    const company = { id: "c1", name: "Northwind Events" };
    devitrakApiPlatform.get.mockResolvedValue({ data: { ok: true, data: company } });
    const { result } = renderHook(() => usePlatformCompany("c1"), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/companies/c1");
    expect(result.current.company).toEqual(company);
  });

  it("encodes the id in the path", async () => {
    devitrakApiPlatform.get.mockResolvedValue({ data: { ok: true, data: {} } });
    renderHook(() => usePlatformCompany("a/b"), { wrapper: makeWrapper() });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/companies/a%2Fb");
  });

  it("does not ask without an id, and company is null", () => {
    const { result } = renderHook(() => usePlatformCompany(undefined), { wrapper: makeWrapper() });
    expect(devitrakApiPlatform.get).not.toHaveBeenCalled();
    expect(result.current.company).toBeNull();
  });
});

describe("usePlatformCompanySection", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
  });

  it("asks GET /companies/:id/<resource> with page, limit and category", async () => {
    devitrakApiPlatform.get.mockResolvedValue({
      data: { ok: true, data: [{ id: 1 }], page: 2, limit: 25, total: 30 },
    });
    const { result } = renderHook(
      () => usePlatformCompanySection("c1", "activity", { page: 2, category: "event" }),
      { wrapper: makeWrapper() },
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/companies/c1/activity", {
      params: { page: 2, limit: 25, category: "event" },
    });
    expect(result.current.rows).toEqual([{ id: 1 }]);
    expect(result.current.total).toBe(30);
  });

  it("returns a record for record tabs", async () => {
    devitrakApiPlatform.get.mockResolvedValue({ data: { ok: true, data: { chargesEnabled: true } } });
    const { result } = renderHook(() => usePlatformCompanySection("c1", "merchant"), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.record).toEqual({ chargesEnabled: true });
  });

  it("does not ask for the overview tab (no resource)", () => {
    const { result } = renderHook(() => usePlatformCompanySection("c1", null), {
      wrapper: makeWrapper(),
    });
    expect(devitrakApiPlatform.get).not.toHaveBeenCalled();
    expect(result.current.rows).toEqual([]);
  });
});
