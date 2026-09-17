import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn() },
}));

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({ admin: { user: { sqlInfo: { company_id: 62 } } } }),
}));

import { devitrakApi } from "../../../../api/devitrakApi";
import useSerialSuggest from "./useSerialSuggest";

const wrapper = ({ children }) => {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

const suggestResponse = (serials) => ({
  data: {
    ok: true,
    items: serials.map((serial_number, index) => ({
      item_id: 200000 + index,
      serial_number,
      category_name: "Laptop",
      item_group: "Dell XPS",
    })),
  },
});

beforeEach(() => {
  vi.clearAllMocks();
  devitrakApi.get.mockResolvedValue(suggestResponse(["00100001", "00100002"]));
});

afterEach(() => {
  vi.useRealTimers();
});

describe("useSerialSuggest", () => {
  // The endpoint answers 400 under two characters. Not asking beats asking and
  // handling the error, and the first keystroke of a scanned serial would
  // otherwise fire one request per character.
  it("stays quiet under two characters", async () => {
    renderHook(() => useSerialSuggest({ term: "0", enabled: true, delay: 0 }), {
      wrapper,
    });

    await act(async () => {});
    expect(devitrakApi.get).not.toHaveBeenCalled();
  });

  it("asks with the term and a limit the endpoint allows", async () => {
    renderHook(
      () => useSerialSuggest({ term: " 001 ", enabled: true, delay: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(devitrakApi.get).toHaveBeenCalled());
    expect(devitrakApi.get).toHaveBeenCalledWith("/db_item/serial-suggest", {
      params: { q: "001", limit: 20 },
    });
  });

  it("asks for no more than the twenty the endpoint caps at", async () => {
    renderHook(
      () => useSerialSuggest({ term: "001", enabled: true, limit: 500, delay: 0 }),
      { wrapper },
    );

    await waitFor(() => expect(devitrakApi.get).toHaveBeenCalled());
    expect(devitrakApi.get.mock.calls[0][1].params.limit).toBe(20);
  });

  // The select needs strings; the endpoint sends rows.
  it("hands back the serials, not the rows", async () => {
    const { result } = renderHook(
      () => useSerialSuggest({ term: "001", enabled: true, delay: 0 }),
      { wrapper },
    );

    await waitFor(() =>
      expect(result.current.suggestions).toEqual(["00100001", "00100002"]),
    );
  });

  // The flag has to be inert in production: the route 404s until the backend
  // deploys it.
  it("asks nothing while the flag is off", async () => {
    renderHook(() => useSerialSuggest({ term: "001", enabled: false, delay: 0 }), {
      wrapper,
    });

    await act(async () => {});
    expect(devitrakApi.get).not.toHaveBeenCalled();
  });

  it("collapses a burst of keystrokes into one request", async () => {
    vi.useFakeTimers();
    const { rerender } = renderHook(
      ({ term }) => useSerialSuggest({ term, enabled: true, delay: 250 }),
      { wrapper, initialProps: { term: "00" } },
    );

    for (const term of ["001", "0010", "00100"]) {
      rerender({ term });
      act(() => {
        vi.advanceTimersByTime(100);
      });
    }

    expect(devitrakApi.get).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(250);
    });

    expect(devitrakApi.get).toHaveBeenCalledTimes(1);
    expect(devitrakApi.get.mock.calls[0][1].params.q).toBe("00100");
  });
});
