import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const profile = {
  email: "ada@x.com",
  firstName: "Ada",
  lastName: "Lovelace",
  status: true,
  active: true,
  roleType: "event_manager",
  adminUserInfo: { id: "au-1", name: "Ada", lastName: "Lovelace", email: "ada@x.com", phone: "555" },
  companyData: { id: "co-1", employees: [] },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) =>
    fn({
      staffDetail: { profile },
      admin: {
        user: {
          email: "root@x.com",
          uid: "u-root",
          company: "Dev Co",
          companyData: { id: "co-1", employees: [], roleLabels: {} },
          roleType: "root_admin",
          sqlInfo: { company_id: 7 },
        },
      },
    }),
}));

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn().mockResolvedValue({ data: { list: [] } }), patch: vi.fn() },
}));

vi.mock("./components/equipment_components/useStaffEquipmentData", () => ({
  useStaffEquipmentData: () => ({
    staffMemberQuery: { data: {}, isLoading: false, refetch: vi.fn() },
    listImagePerItemQuery: { data: { data: { item: [] } }, isLoading: false, refetch: vi.fn() },
    itemsInInventoryQuery: {
      data: { data: { items: [{ item_id: 1, item_group: "Radio", serial_number: "SN-1", cost: 120 }] } },
      isLoading: false,
      refetch: vi.fn(),
    },
    leaseQuery: {
      data: [{ device_id: 1, subscription_initial_date: "2026-06-01T10:00:00.000Z", verification_id: "v1", active: 1 }],
      isLoading: false,
      isFetching: false,
      refetch: vi.fn(),
    },
    verificationQueries: [{ data: { docs: [], allSigned: false }, isLoading: false }],
  }),
}));

const { default: StaffDetail } = await import("./StaffDetail");

describe("StaffDetail shell", () => {
  it("renders the person as the page heading, with tiles and tabs", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <MemoryRouter initialEntries={["/staff/au-1"]}>
          <StaffDetail />
        </MemoryRouter>
      </QueryClientProvider>
    );

    expect(await screen.findByTestId("profile-name")).toHaveTextContent("Ada Lovelace");
    expect(screen.getByText("Devices out")).toBeTruthy();
    expect(screen.getByText("Value held")).toBeTruthy();
    expect(screen.getByText("Contracts pending")).toBeTruthy();
    // Verbs are actions, not tabs. The tab is a noun and matches the member
    // profile's word for the same section.
    expect(screen.getByText("Devices")).toBeTruthy();
    expect(screen.getByTestId("staff-devices-section")).toBeTruthy();
    // Flat, like the member rail — no "Manage" dropdown to open first.
    expect(screen.getByText("Assign devices")).toBeTruthy();
    expect(screen.getByText("Change role")).toBeTruthy();
    expect(screen.getByText("Send password reset email")).toBeTruthy();
    expect(screen.queryByText("Manage")).toBeNull();
    expect(screen.getByText("Remove access")).toBeTruthy();
    expect(screen.getAllByText("$120.00").length).toBeGreaterThan(1);
  });
});
