import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));
vi.mock("antd", () => ({ message: { success: vi.fn(), error: vi.fn() } }));

const { message } = await import("antd");
const { agreedAgreement } = await import("./termsAgreement");

const callbacks = () => ({
  setOpen: vi.fn(),
  setIsLoading: vi.fn(),
  setAcceptanceTermsAndPoliciesResult: vi.fn(),
});

beforeEach(() => {
  post.mockReset();
  message.error.mockClear();
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
    expect(message.error).toHaveBeenCalledWith(
      "We couldn't record your agreement: Signature required",
    );
  });

  it("falls back to the error's own message when the server sent none", async () => {
    post.mockRejectedValue(new Error("Network Error"));
    expect(await agreedAgreement({ ...callbacks() })).toBe("Network Error");
    expect(message.error).toHaveBeenCalledWith(
      "We couldn't record your agreement: Network Error",
    );
  });

  it("tells the user when the server answers without ok", async () => {
    post.mockResolvedValue({ data: { ok: false, msg: "Email not found" } });
    const cb = callbacks();
    expect(await agreedAgreement({ ...cb })).toBe("Email not found");
    expect(message.error).toHaveBeenCalledWith(
      "We couldn't record your agreement: Email not found",
    );
    expect(cb.setAcceptanceTermsAndPoliciesResult).not.toHaveBeenCalled();
    expect(cb.setOpen).toHaveBeenCalledWith(false);
  });

  it("shows a generic reason when the error carries no text", async () => {
    post.mockRejectedValue({});
    expect(await agreedAgreement({ ...callbacks() })).toBe("Please try again.");
    expect(message.error).toHaveBeenCalledWith(
      "We couldn't record your agreement: Please try again.",
    );
  });

  // RegisterCompany records the acceptance fire-and-forget, with no result setter.
  it("works without a result setter", async () => {
    post.mockResolvedValue({ data: { ok: true } });
    const setOpen = vi.fn();
    expect(await agreedAgreement({ setOpen, setIsLoading: vi.fn() })).toBeUndefined();
    expect(setOpen).toHaveBeenCalledWith(false);
    expect(message.error).not.toHaveBeenCalled();
  });
});
