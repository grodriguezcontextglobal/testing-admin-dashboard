import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApiAdmin: { post: (...args) => post(...args) },
}));

import MfaEnrollmentModal from "./MfaEnrollmentModal";

const QR = "data:image/png;base64,AAA";

const renderModal = (overrides = {}) => {
  const props = {
    open: true,
    authToken: "jwt-from-login",
    email: "fredrik@abcinterpreting.com",
    onEnrolled: vi.fn(),
    onDismiss: vi.fn(),
    dismissLabel: "Cancel and return to sign in",
    ...overrides,
  };
  render(<MfaEnrollmentModal {...props} />);
  return props;
};

beforeEach(() => {
  post.mockReset();
  post.mockResolvedValue({ data: { ok: true, qrCode: QR, secret: "JBSWY3" } });
});

describe("preparing the enrolment", () => {
  it("asks for a setup code with the token it was handed, not the stored one", async () => {
    renderModal();

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith("/mfa/generate", {}, {
        headers: { "x-token": "jwt-from-login" },
      })
    );
  });

  it("shows the QR code and the key for an app that cannot scan it", async () => {
    renderModal();

    expect(
      await screen.findByAltText("Two-step verification setup code")
    ).toHaveAttribute("src", QR);
    expect(screen.getByText("JBSWY3")).toBeInTheDocument();
  });

  it("offers a retry instead of a dead modal when the code cannot be prepared", async () => {
    post.mockRejectedValueOnce(new Error("network"));

    renderModal();

    expect(
      await screen.findByText(
        "We couldn't prepare the setup code. Please try again."
      )
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});

describe("verifying the code", () => {
  it("enables MFA and hands control back to the caller", async () => {
    const { onEnrolled } = renderModal();
    await screen.findByAltText("Two-step verification setup code");

    fireEvent.change(screen.getByLabelText("Authentication code"), {
      target: { value: "123456" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify and continue/ }));

    await waitFor(() =>
      expect(post).toHaveBeenCalledWith(
        "/mfa/verify",
        { token: "123456" },
        { headers: { "x-token": "jwt-from-login" } }
      )
    );
    await waitFor(() => expect(onEnrolled).toHaveBeenCalledTimes(1));
  });

  /* A stale code and a mistyped one look identical to the user, so the message
     names the reason it is usually the former. */
  it("says why a code that was correct a minute ago is refused", async () => {
    const { onEnrolled } = renderModal();
    await screen.findByAltText("Two-step verification setup code");
    post.mockRejectedValueOnce({
      response: { status: 400, data: { ok: false, msg: "Invalid token" } },
    });

    fireEvent.change(screen.getByLabelText("Authentication code"), {
      target: { value: "000000" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify and continue/ }));

    expect(
      await screen.findByText(
        "That code didn't match. Codes expire every 30 seconds — try the one showing now."
      )
    ).toBeInTheDocument();
    expect(onEnrolled).not.toHaveBeenCalled();
  });

  it("does not spend a request on a half-typed code", async () => {
    renderModal();
    await screen.findByAltText("Two-step verification setup code");
    post.mockClear();

    fireEvent.change(screen.getByLabelText("Authentication code"), {
      target: { value: "123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /Verify and continue/ }));

    expect(
      await screen.findByText("Enter the 6 digits shown in your app.")
    ).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("keeps letters out of the field", async () => {
    renderModal();
    await screen.findByAltText("Two-step verification setup code");

    const input = screen.getByLabelText("Authentication code");
    fireEvent.change(input, { target: { value: "12ab34" } });

    expect(input).toHaveValue("1234");
  });
});

describe("the way out", () => {
  /* Mandatory means the modal has no X and does not close on a click outside.
     The only exit is the button, whose words the caller chooses because leaving
     means something different at login than it does at registration. */
  it("exits only through the button the caller labelled", async () => {
    const { onDismiss } = renderModal();
    await screen.findByAltText("Two-step verification setup code");

    expect(screen.queryByRole("button", { name: /close/i })).toBeNull();

    fireEvent.click(
      screen.getByRole("button", { name: "Cancel and return to sign in" })
    );
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
