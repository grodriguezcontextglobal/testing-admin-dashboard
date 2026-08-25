import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

let member = {
  member_id: 12,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.org",
  minor: 0,
};

let rows = [];

const admin = {
  email: "root@school.org",
  companyData: { id: "co-1", company_name: "Dev School" },
  sqlInfo: { company_id: 7 },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ admin: { user: admin }, member: { memberInfo: member } }),
}));

vi.mock("../../../hooks/useMemberAssignedDevices", () => ({
  default: () => ({ rows, isLoading: false, summary: {} }),
  useMemberAssignedDevices: () => ({ rows, isLoading: false, summary: {} }),
}));

const post = vi.fn().mockResolvedValue({ data: { ok: true } });
vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...a) => post(...a) },
}));

const { default: Reminders } = await import("./Reminders");

const renderScreen = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Reminders />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

const overdueRow = (serial) => {
  const due = new Date();
  due.setDate(due.getDate() - 4);
  return {
    device_serial_number: serial,
    device_item_group: "Tablet",
    expected_return_date: due.toISOString(),
  };
};

describe("Reminders", () => {
  beforeEach(() => {
    post.mockClear();
    rows = [];
    member = {
      member_id: 12,
      first_name: "Ada",
      last_name: "Lovelace",
      email: "ada@school.org",
      minor: 0,
    };
  });

  it("says who the email goes to, instead of leaving it to be guessed", () => {
    renderScreen();
    expect(screen.getByText("Send a reminder")).toBeTruthy();
    expect(screen.getByText("ada@school.org")).toBeTruthy();
  });

  it("lists the guardian for a minor whose flag arrives as a string", () => {
    member = { ...member, minor: "1", parent_guardian_email: "mum@school.org" };
    renderScreen();
    expect(screen.getByText("mum@school.org")).toBeTruthy();
  });

  it("does not offer an overdue notice when nothing is overdue", () => {
    renderScreen();
    expect(screen.queryByText("Overdue return")).toBeNull();
    expect(screen.getByText("Something else")).toBeTruthy();
  });

  it("offers the overdue notice and writes the message when something is late", () => {
    rows = [overdueRow("SN-1")];
    renderScreen();

    expect(screen.getByText(/1 device is overdue/)).toBeTruthy();
    fireEvent.click(screen.getByText("Overdue return"));

    // Not `querySelector("textarea")`: antd's autoSize renders a hidden mirror
    // textarea for measurement, and it comes first in the DOM.
    const textarea = screen.getByPlaceholderText("Write the message here.");
    expect(textarea.value).toContain("Tablet (SN-1)");
    expect(textarea.value).toContain("Ada Lovelace");
  });

  it("keeps the send button off until there is something to send", () => {
    renderScreen();
    const button = screen.getByText("Send reminder").closest("button");
    expect(button.disabled).toBe(true);
    expect(post).not.toHaveBeenCalled();
  });
});
