import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import MainMerchantSection from "./MainMerchantSection";

/**
 * Without a Stripe account the "Yes" is disabled and says why — the pattern
 * lostFee/Choice.jsx already uses ("Unavailable — no merchant account on this
 * event"). A missing option reads as a bug; a disabled one that names what is
 * missing leads to the fix, so it links to where the account is created.
 */
const setup = (props = {}) => {
  const setMerchant = vi.fn();
  render(
    <MemoryRouter>
      <MainMerchantSection merchant={false} setMerchant={setMerchant} {...props} />
    </MemoryRouter>
  );
  return { setMerchant, yes: screen.getByRole("button", { name: /yes/i }) };
};

describe("MainMerchantSection", () => {
  it("offers Yes when the company has its Stripe account", () => {
    const { yes, setMerchant } = setup({ merchantAvailable: true });
    expect(yes).toBeEnabled();
    fireEvent.click(yes);
    expect(setMerchant).toHaveBeenCalledWith(true);
  });

  it("disables Yes, and says why, when there is no Stripe account", () => {
    const { yes, setMerchant } = setup({ merchantAvailable: false });
    expect(yes).toBeDisabled();
    fireEvent.click(yes);
    expect(setMerchant).not.toHaveBeenCalled();
    expect(
      screen.getByText(/unavailable — this company has no stripe account yet/i)
    ).toBeInTheDocument();
  });

  it("links to where the account is created", () => {
    setup({ merchantAvailable: false });
    expect(screen.getByRole("link", { name: /set up the stripe account/i })).toHaveAttribute(
      "href",
      "/profile/stripe_connected_account"
    );
  });

  it("still lets No be chosen", () => {
    const setMerchant = vi.fn();
    render(
      <MemoryRouter>
        <MainMerchantSection merchant={false} setMerchant={setMerchant} merchantAvailable={false} />
      </MemoryRouter>
    );
    fireEvent.click(screen.getByRole("button", { name: /no/i }));
    expect(setMerchant).toHaveBeenCalledWith(false);
  });
});
