import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const post = vi.fn();
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApiAdmin: { post: (...args) => post(...args) },
}));

import RecoveryCodesSection from "./RecoveryCodesSection";

// FedRAMP A5: POST /admin/mfa/recovery-codes with a current app code replaces
// the recovery codes. Accounts that had MFA before 2026-10-27 have none.
const CODES = ["aaaa-bbbb-cccc-dddd", "eeee-ffff-gggg-hhhh"];

const generate = (code) => {
  fireEvent.change(screen.getByLabelText("Authentication code for new recovery codes"), {
    target: { value: code },
  });
  fireEvent.click(screen.getByRole("button", { name: "Generate new codes" }));
};

beforeEach(() => post.mockReset());

describe("RecoveryCodesSection", () => {
  it("asks for an app code and shows the new codes", async () => {
    post.mockResolvedValue({ data: { ok: true, recoveryCodes: CODES } });
    render(<RecoveryCodesSection email="ana@x.com" />);
    generate("123456");
    await waitFor(() => expect(post).toHaveBeenCalledWith("/mfa/recovery-codes", { mfaCode: "123456" }));
    await screen.findByText(CODES[0]);
  });

  it("does not send a half-typed code", () => {
    render(<RecoveryCodesSection email="ana@x.com" />);
    generate("123");
    expect(post).not.toHaveBeenCalled();
  });

  it("shows the server's reason when the code is refused", async () => {
    post.mockRejectedValueOnce({ response: { status: 400, data: { msg: "Invalid MFA code" } } });
    render(<RecoveryCodesSection email="ana@x.com" />);
    generate("123456");
    await screen.findByText("Invalid MFA code");
  });

  it("goes back to the form once the new codes are saved", async () => {
    post.mockResolvedValue({ data: { ok: true, recoveryCodes: CODES } });
    render(<RecoveryCodesSection email="ana@x.com" />);
    generate("123456");
    await screen.findByText(CODES[0]);
    fireEvent.click(screen.getByLabelText(/i saved these codes/i));
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByText(CODES[0])).toBeNull();
    expect(screen.getByRole("button", { name: "Generate new codes" })).toBeTruthy();
  });
});
