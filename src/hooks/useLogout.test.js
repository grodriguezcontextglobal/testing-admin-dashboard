import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls = [];
const post = vi.fn((url, body) => {
  calls.push(`post ${url}`);
  return Promise.resolve({ data: { ok: true }, body });
});
const patch = vi.fn((url) => {
  calls.push(`patch ${url}`);
  return Promise.resolve({ data: { ok: true } });
});
vi.mock("../api/devitrakApi", () => ({
  devitrakApi: { post: (...a) => post(...a), patch: (...a) => patch(...a) },
}));

const clearSessionStorage = vi.fn(() => calls.push("clearSessionStorage"));
vi.mock("../api/sessionHeaders", () => ({
  clearSessionStorage: () => clearSessionStorage(),
}));

const purge = vi.fn();
vi.mock("../store/Store", () => ({ persistor: { purge: () => purge() } }));

const dispatch = vi.fn((action) => calls.push(`dispatch ${action?.type}`));
vi.mock("react-redux", () => ({
  useDispatch: () => dispatch,
  useSelector: (fn) => fn({ admin: { user: { uid: "u-1" } } }),
}));

const navigate = vi.fn((to) => calls.push(`navigate ${to}`));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));

const { default: useLogout } = await import("./useLogout");

const runLogout = async () => {
  const { result } = renderHook(() => useLogout());
  await act(async () => {
    await result.current();
  });
};

beforeEach(() => {
  calls.length = 0;
  post.mockClear();
  patch.mockClear();
  clearSessionStorage.mockClear();
  purge.mockClear();
  dispatch.mockClear();
  navigate.mockClear();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useLogout", () => {
  /* The reported bug: the navigation bar's logout never told the server, so
     the session stayed open and the next login answered "Active session
     already exists". */
  it("ends the session on the server, naming the account", async () => {
    await runLogout();
    expect(post).toHaveBeenCalledWith("/admin/logout", { uid: "u-1" });
  });

  /* The request authenticates with x-token, which the interceptor reads from
     localStorage — so it has to leave before the storage is cleared. */
  it("tells the server before it clears the stored token", async () => {
    await runLogout();
    expect(calls.indexOf("post /admin/logout")).toBeLessThan(
      calls.indexOf("clearSessionStorage")
    );
  });

  it("marks the account offline too", async () => {
    await runLogout();
    expect(patch).toHaveBeenCalledWith("/staff/edit-admin/u-1", { online: false });
  });

  it("still ends the server session when marking offline fails", async () => {
    patch.mockImplementationOnce(() => Promise.reject(new Error("500")));
    await runLogout();
    expect(post).toHaveBeenCalledWith("/admin/logout", { uid: "u-1" });
  });

  /* Leaving must never depend on the network: a person who clicks Log out is
     logged out of this browser whatever the server answers. */
  it("logs out of the browser even when the server cannot be reached", async () => {
    post.mockImplementationOnce(() => Promise.reject(new Error("Network Error")));
    patch.mockImplementationOnce(() => Promise.reject(new Error("Network Error")));
    await runLogout();
    expect(clearSessionStorage).toHaveBeenCalled();
    expect(purge).toHaveBeenCalled();
    expect(calls).toContain("dispatch admin/onLogout");
    expect(navigate).toHaveBeenCalledWith("/login");
  });
});
