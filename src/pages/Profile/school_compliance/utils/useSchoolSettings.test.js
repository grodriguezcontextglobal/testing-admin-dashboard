import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { useSchoolSettings } from "./useSchoolSettings";
import adminReducer from "../../../../store/slices/adminSlice";

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

function makeWrapper(industry) {
  const store = configureStore({
    reducer: { admin: adminReducer },
    preloadedState: {
      admin: {
        status: "authenticated",
        user: {
          sqlInfo: { company_id: 137 },
          companyData: { id: "abc123", industry },
          roleType: "admin",
        },
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

beforeEach(() => {
  devitrakApi.post.mockReset();
});

describe("useSchoolSettings", () => {
  it("no llama API si industry no es Education", () => {
    const wrapper = makeWrapper("Construction");
    renderHook(() => useSchoolSettings(), { wrapper });
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("llama API si industry es Education", async () => {
    devitrakApi.post.mockResolvedValue({
      data: {
        ok: true,
        settings: { enforce_member_consent: true, enforce_under_13: false },
      },
    });
    const wrapper = makeWrapper("Education");
    const { result } = renderHook(() => useSchoolSettings(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(devitrakApi.post).toHaveBeenCalledWith("/school/settings", {
      company_id: 137,
    });
  });

  it("retorna settings cuando la llamada es exitosa", async () => {
    devitrakApi.post.mockResolvedValue({
      data: {
        ok: true,
        settings: { enforce_member_consent: true, enforce_under_13: true },
      },
    });
    const wrapper = makeWrapper("Education");
    const { result } = renderHook(() => useSchoolSettings(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.settings).toEqual({
      enforce_member_consent: true,
      enforce_under_13: true,
    });
  });

  it("isEducation retorna false para industria no Education", () => {
    const wrapper = makeWrapper("Construction");
    const { result } = renderHook(() => useSchoolSettings(), { wrapper });
    expect(result.current.isEducation).toBe(false);
  });

  it("isEducation retorna true para Education", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ok: true, settings: {} },
    });
    const wrapper = makeWrapper("Education");
    const { result } = renderHook(() => useSchoolSettings(), { wrapper });
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    expect(result.current.isEducation).toBe(true);
  });
});
