import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));
vi.mock("antd", () => ({ message: { success: vi.fn() } }));

const { agreedAgreement } = await import("./termsAgreement");

const callbacks = () => ({
  setOpen: vi.fn(),
  setIsLoading: vi.fn(),
  setAcceptanceTermsAndPoliciesResult: vi.fn(),
});

beforeEach(() => {
  post.mockReset();
});

describe("agreedAgreement", () => {
  it("records the acceptance and closes the modal", async () => {
    post.mockResolvedValue({ data: { ok: true, id: "a1" } });
    const cb = callbacks();
    await agreedAgreement({ staffMember: "Ana Ruiz", staffEmail: "ana@example.com", ...cb });
    expect(post).toHaveBeenCalledWith(
      "/devitrak/new_acceptance",
      expect.objectContaining({ signature: "Ana Ruiz", email: "ana@example.com" }),
    );
    expect(cb.setAcceptanceTermsAndPoliciesResult).toHaveBeenCalledWith({ ok: true, id: "a1" });
    expect(cb.setOpen).toHaveBeenCalledWith(false);
    expect(cb.setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it("returns the server's message when the request fails, and still closes the modal", async () => {
    post.mockRejectedValue({ response: { data: { message: "Signature required" } } });
    const cb = callbacks();
    expect(await agreedAgreement({ staffMember: "", ...cb })).toBe("Signature required");
    expect(cb.setOpen).toHaveBeenCalledWith(false);
    expect(cb.setIsLoading).toHaveBeenLastCalledWith(false);
  });

  it("falls back to the error's own message when the server sent none", async () => {
    post.mockRejectedValue(new Error("Network Error"));
    expect(await agreedAgreement({ ...callbacks() })).toBe("Network Error");
  });

  // RegisterCompany records the acceptance fire-and-forget, with no result setter.
  it("works without a result setter", async () => {
    post.mockResolvedValue({ data: { ok: true } });
    const setOpen = vi.fn();
    expect(await agreedAgreement({ setOpen, setIsLoading: vi.fn() })).toBeUndefined();
    expect(setOpen).toHaveBeenCalledWith(false);
  });
});
