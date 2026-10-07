import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({
      admin: {
        user: {
          sqlInfo: { company_id: 61 },
          companyData: { company_name: "ABC School" },
        },
      },
    }),
}));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("../../../config/roles", () => ({
  hasPermission: () => true,
  resolveRoleType: () => "admin",
}));
const baseRow = {
  lease_id: 1,
  member_id: 5001,
  device_id: 9001,
  device_serial_number: "5CD1234",
  device_item_group: "Chromebook",
  first_name: "Ana",
  last_name: "Ruiz",
  days_overdue: 18,
  reminders_stopped_at: null,
};

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

import { devitrakApi } from "../../../api/devitrakApi";
import OverdueDevicesTable from "./OverdueDevicesTable";

beforeEach(() => {
  devitrakApi.post.mockReset();
  devitrakApi.post.mockResolvedValue({
    data: { ok: true, count: 1, rows: [baseRow] },
  });
});

/* 2026-10-07: the row's buttons sit side by side from md up, one above the
   other below it — the same breakpoint as DraftEventsTable. */
const viewport = (small) =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query) => ({
      // MUI asks "(max-width:899.95px)" for down("md").
      matches: small && /max-width/.test(query),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  );

const renderTable = () =>
  render(
    <QueryClientProvider client={new QueryClient()}>
      <OverdueDevicesTable />
    </QueryClientProvider>
  );

const actions = async () =>
  (await screen.findByRole("button", { name: /stop reminders/i })).closest(
    "[data-overdue-row-actions]"
  );

afterEach(() => vi.unstubAllGlobals());

describe("OverdueDevicesTable — row action layout", () => {
  it("puts the buttons side by side on md and larger screens", async () => {
    viewport(false);
    renderTable();
    expect((await actions()).style.flexDirection).toBe("row");
  });

  it("stacks them on smaller screens", async () => {
    viewport(true);
    renderTable();
    expect((await actions()).style.flexDirection).toBe("column");
  });
});

describe("OverdueDevicesTable — Stop reminders", () => {
  /* 2026-10-07: stopping is the destructive choice, so it is a danger button. */
  it("uses the danger style", async () => {
    viewport(false);
    renderTable();
    const stop = await screen.findByRole("button", { name: /stop reminders/i });
    expect(stop).toHaveClass("customized__dangerButton");
    expect(stop).toBeEnabled();
  });

  /* 2026-10-07: visible before the backend ships, but it cannot be pressed —
     a row without reminders_stopped_at comes from a server without the routes. */
  it("is shown but disabled when the server does not support it yet", async () => {
    viewport(false);
    const legacy = { ...baseRow };
    delete legacy.reminders_stopped_at;
    devitrakApi.post.mockResolvedValueOnce({
      data: { ok: true, count: 1, rows: [legacy] },
    });
    renderTable();
    const stop = await screen.findByRole("button", { name: /stop reminders/i });
    expect(stop).toBeDisabled();
  });
});
