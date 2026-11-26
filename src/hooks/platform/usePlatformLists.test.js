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

describe("the Event collection discriminator", () => {
  beforeEach(() => {
    devitrakApiPlatform.get.mockReset();
    devitrakApiPlatform.get.mockResolvedValue({ data: { ok: true, data: [] } });
  });

  it("sends type=event on the cross-client events list", async () => {
    // Mongo's `Event` collection does not hold only events. Every read in the
    // dashboard that asks for a LIST carries the discriminator
    // (eventsListQuery.js:16, and the /event/event-list bodies in home,
    // consumers and posts). Gustavo's instruction, 2026-11-25: anything the
    // console reads out of Event is filtered the same way.
    renderHook(() => usePlatformList("events", { status: "live", page: 1, limit: 25 }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/events", {
      params: { status: "live", page: 1, limit: 25, type: "event" },
    });
  });

  it("is added by the hook, so no screen can forget it", async () => {
    // The point of putting it here rather than in buildListQuery: this hook is
    // the one place every cross-client list read goes through. A caller that
    // passes a hand-built query still gets the filter.
    renderHook(() => usePlatformList("events"), { wrapper: makeWrapper() });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/events", {
      params: { type: "event" },
    });
  });

  it("cannot be overridden by a caller's own type", async () => {
    renderHook(() => usePlatformList("events", { type: "anything" }), { wrapper: makeWrapper() });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/events", {
      params: { type: "event" },
    });
  });

  it("leaves the transactions type filter alone", async () => {
    // A different table and a different meaning: this one IS the operator's
    // filter.
    renderHook(() => usePlatformList("transactions", { type: "refund" }), {
      wrapper: makeWrapper(),
    });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/transactions", {
      params: { type: "refund" },
    });
  });

  it("adds nothing to the other lists", async () => {
    renderHook(() => usePlatformList("inventory", { page: 1 }), { wrapper: makeWrapper() });
    await waitFor(() => expect(devitrakApiPlatform.get).toHaveBeenCalledTimes(1));
    expect(devitrakApiPlatform.get).toHaveBeenCalledWith("/inventory", { params: { page: 1 } });
  });
});
