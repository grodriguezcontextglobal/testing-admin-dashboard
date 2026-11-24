import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { devitrakApi } from "../../api/devitrakApi";
import { useAssistantAsk } from "./useAssistantAsk";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApi: { get: vi.fn(), post: vi.fn() },
}));

const user = {
  uid: "65f0beef",
  companyData: { id: "65f0c0ffee" },
  sqlInfo: { company_id: 12, staff_id: 34 },
};

vi.mock("react-redux", () => ({
  useSelector: (select) => select({ admin: { user } }),
}));

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return function Wrapper({ children }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

const render = (options) =>
  renderHook(() => useAssistantAsk(options), { wrapper: makeWrapper() });

const answered = {
  ok: true,
  question_id: "company_devices_out",
  answer: "Tienes **4** equipos fuera del almacen ahora mismo.",
  data: { devicesOut: 4 },
  scope: { scoped: false, roleType: "admin" },
  params: {},
};

const textOf = (message) => message.segments.map((segment) => segment.text).join("");

describe("useAssistantAsk", () => {
  beforeEach(() => {
    devitrakApi.post.mockReset();
    devitrakApi.get.mockReset();
    devitrakApi.get.mockResolvedValue({ data: { ok: true, catalog: [] } });
  });

  it("starts with an empty thread and nothing in flight", () => {
    const { result } = render();
    expect(result.current.messages).toEqual([]);
    expect(result.current.asking).toBe(false);
  });

  // The route is its own namespace and the body is the one the contract
  // describes. Both were different a day ago, and both fail silently if wrong:
  // the old path 404s, and the ids are read by nobody.
  it("posts to the assistant's own namespace, not to /admin", async () => {
    devitrakApi.post.mockResolvedValue({ data: answered });
    const { result } = render();

    await act(() => result.current.ask("cuantos equipos tengo fuera"));

    const [path, body] = devitrakApi.post.mock.calls[0];
    expect(path).toBe("/assistant/ask");
    expect(body.question).toBe("cuantos equipos tengo fuera");
    expect(body).not.toHaveProperty("conversation_id");
  });

  it("keeps the asked question in the thread before the answer lands", async () => {
    devitrakApi.post.mockResolvedValue({ data: answered });
    const { result } = render();

    await act(() => result.current.ask("  cuantos equipos tengo fuera  "));

    expect(result.current.messages[0].from).toBe("staff");
    expect(textOf(result.current.messages[0])).toBe("cuantos equipos tengo fuera");
  });

  // The language rule: every other string in this dashboard is English, and a
  // chat bubble is not the place to make an exception. The server's Spanish
  // sentence stays available as a fallback, it is just not what is shown when
  // we can build the sentence from `data` ourselves.
  it("renders the English sentence built from data, not the server's Spanish one", async () => {
    devitrakApi.post.mockResolvedValue({ data: answered });
    const { result } = render();

    await act(() => result.current.ask("equipos fuera"));

    const answer = result.current.messages[1];
    expect(textOf(answer)).toBe("4 devices are out of the warehouse right now.");
    expect(textOf(answer)).not.toContain("equipos");
  });

  it("falls back to the server's own sentence for a question id we do not know", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ...answered, question_id: "company_something_new", data: { total: 9 } },
    });
    const { result } = render();

    await act(() => result.current.ask("algo nuevo"));

    expect(textOf(result.current.messages[1])).toContain("equipos fuera del almacen");
  });

  it("splits the server's bold markers instead of printing asterisks", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ...answered, question_id: "company_something_new" },
    });
    const { result } = render();

    await act(() => result.current.ask("algo nuevo"));

    expect(result.current.messages[1].segments.some((segment) => segment.bold)).toBe(true);
    expect(textOf(result.current.messages[1])).not.toContain("**");
  });

  // A miss is a 200 and the single most likely outcome of a keyword matcher.
  // It must never reach the red error strip.
  it("treats an unsupported question as an answer with the catalogue in it", async () => {
    devitrakApi.post.mockResolvedValue({
      data: {
        ok: true,
        question_id: "unsupported",
        answer: "No se contestar eso todavia.",
        data: null,
        catalog: [{ id: "company_devices_out", label: "Equipos fuera" }],
      },
    });
    const { result } = render();

    await act(() => result.current.ask("what is the meaning of life"));

    expect(result.current.error).toBeNull();
    expect(result.current.messages[1].catalog).toHaveLength(1);
    expect(textOf(result.current.messages[1])).toContain("what I can look up");
  });

  // Unknown and zero are different sentences about the business.
  it("says unknown, not zero, when the company cannot be resolved", async () => {
    devitrakApi.post.mockResolvedValue({ data: { ...answered, data: null } });
    const { result } = render();

    await act(() => result.current.ask("equipos fuera"));

    const answer = result.current.messages[1];
    expect(answer.unknown).toBe(true);
    expect(textOf(answer)).toContain("unknown");
    expect(textOf(answer)).not.toMatch(/\b0\b/);
  });

  it("marks a scoped answer as partial so the window can say so", async () => {
    devitrakApi.post.mockResolvedValue({
      data: { ...answered, scope: { scoped: true, roleType: "category_assistant" } },
    });
    const { result } = render();

    await act(() => result.current.ask("equipos fuera"));

    expect(result.current.messages[1].partial).toBe(true);
  });

  it("refuses a question past the cap without spending a request", async () => {
    const { result } = render();

    await act(() => result.current.ask("a".repeat(1001)));

    expect(devitrakApi.post).not.toHaveBeenCalled();
    expect(result.current.error).toContain("1000");
  });

  it("refuses an empty question", async () => {
    const { result } = render();
    await act(() => result.current.ask("   "));
    expect(devitrakApi.post).not.toHaveBeenCalled();
  });

  it("tells the user when they may ask again after a 429", async () => {
    devitrakApi.post.mockRejectedValue({
      response: { status: 429, headers: { "ratelimit-reset": "45" }, data: { msg: "too many" } },
    });
    const { result } = render();

    await act(() => result.current.ask("equipos fuera"));

    expect(result.current.error).toContain("45 seconds");
    expect(result.current.asking).toBe(false);
  });

  it("passes the server's own refusal through on a 400", async () => {
    devitrakApi.post.mockRejectedValue({
      response: {
        status: 400,
        headers: {},
        data: { ok: false, msg: "Company context is required (send the s-company-lq header)." },
      },
    });
    const { result } = render();

    await act(() => result.current.ask("equipos fuera"));

    expect(result.current.error).toContain("s-company-lq");
  });

  it("stops asking even when the request throws", async () => {
    devitrakApi.post.mockRejectedValue(new Error("Network Error"));
    const { result } = render();

    await act(() => result.current.ask("equipos fuera"));

    expect(result.current.asking).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it("clears the error when the user dismisses it", async () => {
    const { result } = render();
    await act(() => result.current.ask(""));
    expect(result.current.error).toBeTruthy();
    act(() => result.current.dismissError());
    expect(result.current.error).toBeNull();
  });

  // Until the endpoint is deployed this is a 404, and a 404 nobody asked for
  // in every session is noise that teaches people to ignore the console.
  it("does not fetch the catalogue until the panel is open", async () => {
    render({ enabled: false });
    await waitFor(() => expect(devitrakApi.get).not.toHaveBeenCalled());
  });

  it("fetches the catalogue once the panel is open", async () => {
    devitrakApi.get.mockResolvedValue({
      data: { ok: true, catalog: [{ id: "company_devices_out", label: "Equipos fuera" }] },
    });
    const { result } = render({ enabled: true });

    await waitFor(() => expect(result.current.catalog).toHaveLength(1));
    expect(devitrakApi.get).toHaveBeenCalledWith("/assistant/catalog");
  });

  it("survives a catalogue the server does not have yet", async () => {
    devitrakApi.get.mockRejectedValue({ response: { status: 404 } });
    const { result } = render({ enabled: true });

    await waitFor(() => expect(result.current.catalog).toEqual([]));
    expect(result.current.error).toBeNull();
  });
});
