import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import SubscriptionPlansPage from "./SubscriptionPlansPage";
import { devitrakApi } from "../../../api/devitrakApi";

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn() },
}));

const store = configureStore({
  reducer: {
    admin: () => ({
      user: { companyData: { id: "company-1", company_name: "Acme Events" } },
    }),
  },
});

const renderPage = () =>
  render(
    <Provider store={store}>
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
        <SubscriptionPlansPage />
      </QueryClientProvider>
    </Provider>,
  );

const card = (name) => screen.getByRole("region", { name: `${name} plan` });

describe("SubscriptionPlansPage", () => {
  const assign = vi.fn();

  beforeEach(() => {
    devitrakApi.get.mockReset();
    devitrakApi.post.mockReset();
    assign.mockReset();
    vi.stubGlobal("location", { ...window.location, assign });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("shows the three plans with their caps", async () => {
    devitrakApi.get.mockResolvedValue({ data: { plan: "free" } });
    renderPage();
    expect(within(card("Free")).getByText("Up to 3 staff members")).toBeTruthy();
    expect(within(card("Free")).getByText("Up to 1,000 inventory items")).toBeTruthy();
    expect(within(card("Pro")).getByText("Up to 10 staff members")).toBeTruthy();
    expect(within(card("Pro")).getByText("Up to 4,000 inventory items")).toBeTruthy();
    expect(within(card("Enterprise")).getByText("Custom")).toBeTruthy();
  });

  it("marks Free as current and says so when the plan cannot be loaded", async () => {
    devitrakApi.get.mockRejectedValue(new Error("404"));
    renderPage();
    expect(await screen.findByText(/couldn.t load your current plan/i)).toBeTruthy();
    expect(within(card("Free")).getAllByText("Current plan").length).toBeGreaterThan(0);
  });

  it("marks the plan the server reports as current", async () => {
    devitrakApi.get.mockResolvedValue({ data: { plan: "pro" } });
    renderPage();
    await waitFor(() => expect(within(card("Pro")).getAllByText("Current plan").length).toBeGreaterThan(0));
    expect(within(card("Pro")).queryByText("Upgrade to Pro")).toBeNull();
  });

  it("switches Pro to the annual price", async () => {
    devitrakApi.get.mockResolvedValue({ data: {} });
    renderPage();
    expect(within(card("Pro")).getByText("$320")).toBeTruthy();
    fireEvent.click(screen.getByText("Annual"));
    expect(within(card("Pro")).getByText("$3,000")).toBeTruthy();
    expect(within(card("Pro")).getByText(/save \$840 a year/)).toBeTruthy();
  });

  it("starts a checkout for the chosen interval and follows a Stripe Checkout URL", async () => {
    devitrakApi.get.mockResolvedValue({ data: {} });
    devitrakApi.post.mockResolvedValue({ data: { url: "https://checkout.stripe.com/c/pay/cs_test_1" } });
    renderPage();
    fireEvent.click(screen.getByText("Annual"));
    fireEvent.click(screen.getByText("Upgrade to Pro"));
    await waitFor(() => expect(assign).toHaveBeenCalledWith("https://checkout.stripe.com/c/pay/cs_test_1"));
    expect(devitrakApi.post).toHaveBeenCalledWith("/company/subscription/checkout", {
      plan: "pro",
      interval: "year",
    });
  });

  it("does not follow a checkout URL that is not Stripe's", async () => {
    devitrakApi.get.mockResolvedValue({ data: {} });
    devitrakApi.post.mockResolvedValue({ data: { url: "https://evil.example/pay" } });
    renderPage();
    fireEvent.click(screen.getByText("Upgrade to Pro"));
    await waitFor(() => expect(devitrakApi.post).toHaveBeenCalled());
    expect(await screen.findByText("We couldn't open the payment page.")).toBeTruthy();
    expect(assign).not.toHaveBeenCalled();
  });

  it("sends Enterprise to sales by email", async () => {
    devitrakApi.get.mockResolvedValue({ data: {} });
    renderPage();
    const link = within(card("Enterprise")).getByText("Contact sales").closest("a");
    expect(link.getAttribute("href")).toMatch(/^mailto:support@devitrak\.net\?subject=Devitrak%20Enterprise%20plan%3A%20Acme%20Events/);
  });
});
