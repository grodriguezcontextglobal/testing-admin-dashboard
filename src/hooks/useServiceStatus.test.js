import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import {
  useServiceStatus,
  STATUS_ENDPOINT,
  STATUS_POLL_MS,
} from "./useServiceStatus";

/**
 * The public service-status page reads a status document straight from the
 * browser. The contract is FRONTEND_status_page_integration.md, and the rules
 * that matter are the ones that decide whether the page tells the truth:
 *
 * - A failed request is `unknown`, never `operational`. A status page that
 *   shows green when it cannot reach the service is worse than no page.
 * - The endpoint is a third party. It must not be called through devitrakApi,
 *   whose request interceptor attaches `x-token` and `s-token-lq` from
 *   localStorage to every request — that would hand our session tokens to
 *   another origin.
 * - No more than one request a minute. The worker refreshes once a minute and
 *   caches for thirty seconds, so polling harder buys nothing.
 */

function makeWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const payload = (overrides = {}) => ({
  overall: "operational",
  components: [
    {
      key: "application",
      name: "Application",
      description: "The service responds over the public internet",
      status: "operational",
      since: "2026-09-24T13:06:45.516Z",
      uptime90d: 100,
    },
  ],
  incident: null,
  generatedAt: "2026-09-24T14:05:00.000Z",
  ...overrides,
});

const render = () => renderHook(() => useServiceStatus(), { wrapper: makeWrapper() });

describe("useServiceStatus", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("reads the document the contract describes", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => payload() });

    const { result } = render();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.overall).toBe("operational");
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].key).toBe("application");
    expect(result.current.incident).toBeNull();
  });

  it("calls the worker directly, with no credentials and no headers of ours", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => payload() });

    render();

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe(STATUS_ENDPOINT);
    expect(init?.credentials).toBe("omit");
    expect(init?.headers).toBeUndefined();
  });

  /* The rule the whole page rests on. */
  it("is unknown when the request fails, never operational", async () => {
    fetch.mockRejectedValue(new Error("Network Error"));

    const { result } = render();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.overall).toBe("unknown");
    expect(result.current.components).toEqual([]);
    expect(result.current.unreachable).toBe(true);
  });

  it("is unknown when the worker answers with an error status", async () => {
    fetch.mockResolvedValue({ ok: false, status: 503, json: async () => ({}) });

    const { result } = render();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.overall).toBe("unknown");
    expect(result.current.unreachable).toBe(true);
  });

  /* A body that is not the document we were promised is also "we do not know",
     not "everything is fine". */
  it("is unknown when the body is not the document the contract promises", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => ({ hello: "world" }) });

    const { result } = render();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.overall).toBe("unknown");
    expect(result.current.components).toEqual([]);
  });

  it("keeps an unrecognised status instead of guessing it is fine", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () => payload({ overall: "maintenance" }),
    });

    const { result } = render();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.overall).toBe("unknown");
  });

  it("carries components it has never heard of, rather than filtering them out", async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: async () =>
        payload({
          components: [
            ...payload().components,
            {
              key: "something_new",
              name: "Something new",
              description: "Published after this page was written",
              status: "degraded",
              since: null,
              uptime90d: null,
            },
          ],
        }),
    });

    const { result } = render();

    await waitFor(() => expect(result.current.components).toHaveLength(2));
    expect(result.current.components[1].key).toBe("something_new");
    expect(result.current.components[1].uptime90d).toBeNull();
  });

  it("polls once a minute and not on every tab focus", async () => {
    fetch.mockResolvedValue({ ok: true, json: async () => payload() });

    const { result } = render();

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(STATUS_POLL_MS).toBe(60_000);
    // One screen load is one request. The worker refreshes once a minute and
    // caches for thirty seconds; asking more often returns the same bytes.
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
