import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { devitrakApiPlatform } from "../../api/devitrakApi";
import { usePlatformMe } from "./usePlatformMe";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApiPlatform: { get: vi.fn() },
}));

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const body = {
  ok: true,
  data: {
    uid: "u1",
    email: "operator1@devitrak.com",
    platformAccess: true,
    domain: "devitrak.com",
    platformObserver: true,
    mfaEnabled: true,
    checkedAt: "2026-11-25T14:00:00Z",
  },
};

describe("usePlatformMe", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
  });

  it("asks GET /me, with no company in a header or a parameter", async () => {
    devitrakApiPlatform.get.mockResolvedValue({ data: body });
    renderHook(() => usePlatformMe(), { wrapper: makeWrapper() });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/me");
  });

  it("hands back the response body, not the axios envelope", async () => {
    devitrakApiPlatform.get.mockResolvedValue({ data: body });
    const { result } = renderHook(() => usePlatformMe(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.body).toEqual(body);
  });

  it("asks nothing at all when it is disabled", async () => {
    // The guard disables it for an account the sign-in hint already refused,
    // and for the dev bypass. A request on their behalf would be answered 403
    // and tell us nothing we did not know.
    renderHook(() => usePlatformMe({ enabled: false }), { wrapper: makeWrapper() });
    await waitFor(() => expect(devitrakApiPlatform.get).not.toHaveBeenCalled());
  });

  it("keeps the error so the guard can tell a refusal from a failure to ask", async () => {
    const error = Object.assign(new Error("Forbidden"), { response: { status: 403 } });
    devitrakApiPlatform.get.mockRejectedValue(error);
    const { result } = renderHook(() => usePlatformMe(), { wrapper: makeWrapper() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.response?.status).toBe(403);
    expect(result.current.body).toBeUndefined();
  });
});
