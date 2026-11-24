import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createElement } from "react";
import { devitrakApi, devitrakApiAdmin } from "../../api/devitrakApi";
import { useAssistantAsk } from "./useAssistantAsk";

vi.mock("../../api/devitrakApi", () => ({
  devitrakApi: { get: vi.fn() },
  devitrakApiAdmin: { post: vi.fn() },
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

const render = () => renderHook(() => useAssistantAsk(), { wrapper: makeWrapper() });

describe("useAssistantAsk", () => {
  beforeEach(() => {
    devitrakApiAdmin.post.mockReset();
    devitrakApi.get.mockReset();
  });

  it("starts with an empty thread and nothing in flight", () => {
    const { result } = render();
    expect(result.current.messages).toEqual([]);
    expect(result.current.asking).toBe(false);
  });

  it("asks the agreed route with the body the backend confirmed", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockReturnValue(new Promise(() => {}));
    const { result } = render();

    await act(async () => {
      await result.current.ask("Which devices are overdue?");
    });

    expect(devitrakApiAdmin.post).toHaveBeenCalledWith("/assistant/ask", {
      question: "Which devices are overdue?",
      company_id: { nosql: "65f0c0ffee", sql: 12 },
      staff_member_id: { nosql: "65f0beef", sql: 34 },
    });
  });

  // The cheapest refusal is the one that never leaves the browser, and a
  // rate-limited user who spends a request on a 2,000-character paste learns
  // nothing from the 400 that comes back.
  it("refuses a question over the cap without calling the server", async () => {
    const { result } = render();
    await act(async () => {
      await result.current.ask("a".repeat(1001));
    });
    expect(devitrakApiAdmin.post).not.toHaveBeenCalled();
    expect(result.current.error).toContain("1000");
  });

  it("refuses an empty question without calling the server", async () => {
    const { result } = render();
    await act(async () => {
      await result.current.ask("   ");
    });
    expect(devitrakApiAdmin.post).not.toHaveBeenCalled();
    expect(result.current.error).toBeTruthy();
  });

  it("puts the question in the thread straight away", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockReturnValue(new Promise(() => {}));
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0]).toMatchObject({ from: "staff", text: "hello" });
    expect(result.current.asking).toBe(true);
  });

  it("polls the job route the backend told us already exists", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockReturnValue(new Promise(() => {}));
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    await waitFor(() => expect(devitrakApi.get).toHaveBeenCalledWith("/jobs/owned/j1"));
  });

  it("shows the answer when the job is done", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockResolvedValue({
      data: {
        status: "done",
        result: { answer: "Three devices.", conversation_id: "c1", sources: [] },
      },
    });
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[1]).toMatchObject({
      from: "assistant",
      text: "Three devices.",
    });
    expect(result.current.asking).toBe(false);
  });

  // Links come back from a model. Until a route matcher is wired in, none of
  // them is clickable, and that is the behaviour we want rather than a
  // placeholder: a permissive default would make a wiring mistake look like
  // working links to nowhere.
  it("hands the window sources that are already safe", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockResolvedValue({
      data: {
        status: "done",
        result: {
          answer: "x",
          sources: [
            { label: "Inventory", path: "/inventory" },
            { label: "Elsewhere", path: "https://evil.example" },
          ],
        },
      },
    });
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[1].sources).toEqual([
      { label: "Inventory", path: null },
      { label: "Elsewhere", path: null },
    ]);
  });

  it("carries the conversation id into the next question", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockResolvedValue({
      data: { status: "done", result: { answer: "x", conversation_id: "c1" } },
    });
    const { result } = render();

    await act(async () => {
      await result.current.ask("first");
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));

    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j2" } });
    await act(async () => {
      await result.current.ask("second");
    });

    expect(devitrakApiAdmin.post).toHaveBeenLastCalledWith(
      "/assistant/ask",
      expect.objectContaining({ conversation_id: "c1" }),
    );
  });

  it("says so in the thread when the job fails", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockResolvedValue({ data: { status: "failed" } });
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages[1].from).toBe("assistant");
    expect(result.current.messages[1].failed).toBe(true);
    expect(result.current.asking).toBe(false);
  });

  // A job tracked without an id would poll nothing forever while the window
  // showed a spinner that can never resolve.
  it("stops rather than waits when the server sends no job id", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: {} });
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    expect(result.current.asking).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(devitrakApi.get).not.toHaveBeenCalled();
  });

  it("names the route when the endpoint is not there yet", async () => {
    devitrakApiAdmin.post.mockRejectedValue({ response: { status: 404 } });
    const { result } = render();

    await act(async () => {
      await result.current.ask("hello");
    });

    expect(result.current.error).toContain("/assistant/ask");
    expect(result.current.asking).toBe(false);
  });

  it("refuses a second question while one is in flight", async () => {
    devitrakApiAdmin.post.mockResolvedValue({ data: { jobId: "j1" } });
    devitrakApi.get.mockReturnValue(new Promise(() => {}));
    const { result } = render();

    await act(async () => {
      await result.current.ask("first");
    });
    await act(async () => {
      await result.current.ask("second");
    });

    expect(devitrakApiAdmin.post).toHaveBeenCalledTimes(1);
    expect(result.current.messages).toHaveLength(1);
  });
});
