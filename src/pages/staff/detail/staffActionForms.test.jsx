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
  adminUserInfo: { id: "au-1", name: "Ada", lastName: "Lovelace", email: "ada@x.com" },
  companyData: { id: "co-1", employees: [] },
  preference: { managerLocation: [{ location: "WH A", actions: { view: true } }] },
};

const admin = {
  email: "root@x.com",
  uid: "u-root",
  name: "Root",
  lastName: "Admin",
  company: "Dev Co",
  companyData: {
    id: "co-1",
    // `company_name`, which is what the session actually carries — see
    // UpperBanner and EventLinkNotification. This fixture used to say
    // `companyName`, a field nothing in the app writes, and inventing it here
    // hid a modal that loaded forever in production.
    company_name: "Dev Co",
    employees: [{ user: "root@x.com", role: "0" }],
    roleLabels: {},
  },
  roleType: "root_admin",
  sqlInfo: { company_id: 7 },
  sqlMemberInfo: { staff_id: 3 },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ staffDetail: { profile }, admin: { user: admin } }),
}));

const post = vi.fn((url) => {
  if (url === "/event/event-list") {
    return Promise.resolve({
      data: {
        list: [
          {
            id: "e1",
            eventInfoDetail: { eventName: "Expo 2026" },
            staff: { adminUser: [], headsetAttendees: [] },
          },
        ],
      },
    });
  }
  if (url === "/staff/admin-users") {
    return Promise.resolve({
      data: { adminUsers: [{ id: "au-1", email: "ada@x.com", name: "Ada", lastName: "L" }] },
    });
  }
  if (url === "/company/search-company") {
    return Promise.resolve({
      data: { company: [{ id: "co-1", employees: [{ user: "ada@x.com", preference: { managerLocation: [{ location: "WH A", actions: { view: true } }] } }] }] },
    });
  }
  if (String(url).includes("/locations")) {
    return Promise.resolve({ data: { data: { "WH A": {}, "WH B": {} } } });
  }
  if (url === "/db_event/retrieve-item-group-location-quantity") {
    return Promise.resolve({
      data: { groupedInventory: { Comms: { Radio: { "WH A": 3 } } } },
    });
  }
  if (url === "/db_staff/consulting-member") {
    return Promise.resolve({ data: { member: [{ staff_id: 9 }] } });
  }
  return Promise.resolve({ data: {} });
});

vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...a) => post(...a), patch: vi.fn(), get: vi.fn() },
}));

const { default: AssignStaffMemberToEvent } = await import(
  "./components/AssignStaffMemberToEvent"
);
const { default: ResetPasswordLink } = await import(
  "./components/equipment_components/ResetPasswordLink"
);
const { default: AssignLocationManager } = await import(
  "./components/equipment_components/assingmentComponents/AssignLocationManager"
);
const { default: AssignmentFromExistingInventory } = await import(
  "./components/equipment_components/assingmentComponents/AssignmentFromExistingInventory"
);
const { default: UpdateContactInfo } = await import(
  "./components/equipment_components/UpdateContactInfo"
);
const { default: EditProfileModal } = await import("./EditProfileModal");

const wrap = (node) => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>{node}</MemoryRouter>
    </QueryClientProvider>
  );
};

describe("staff action forms render", () => {
  it("assign to event", async () => {
    wrap(<AssignStaffMemberToEvent />);
    expect(await screen.findByText("Add to an event")).toBeTruthy();
    expect(await screen.findByText(/Only events that are still running/)).toBeTruthy();
  });

  it("reset password names the target instead of asking for it", async () => {
    wrap(<ResetPasswordLink />);
    expect(await screen.findByText("Send a password reset link")).toBeTruthy();
    expect(await screen.findByText("Sending to")).toBeTruthy();
  });

  it("reset password settles instead of loading forever", async () => {
    // The modal used to sit on its skeleton with no way out. It looked up the
    // account by fetching the whole company's admin users, gated on
    // `companyData.companyName` — a field the session does not carry — so
    // `enabled` was false, and a disabled query in react-query v4 stays at
    // status "loading" for good. The spinner was permanent and nothing errored.
    wrap(<ResetPasswordLink />);
    expect(await screen.findByText("Ada L")).toBeTruthy();
    expect(await screen.findByText("Send reset link")).toBeTruthy();
  });

  it("looks the account up by the person's own email", async () => {
    // One record instead of every admin user in the company, and no dependency
    // on a company name to get there.
    wrap(<ResetPasswordLink />);
    await screen.findByText("Send reset link");
    expect(post).toHaveBeenCalledWith("/staff/admin-users", {
      email: "ada@x.com",
    });
  });

  it("locations and permissions", async () => {
    wrap(<AssignLocationManager />);
    expect(await screen.findByText("Locations & permissions")).toBeTruthy();
    expect(await screen.findByText("Manager")).toBeTruthy();
  });

  it("assignment starts on the device step, not on an address", async () => {
    wrap(<AssignmentFromExistingInventory />);
    expect(await screen.findByText("Device and location")).toBeTruthy();
    expect(screen.getByText(/Where the equipment will be used/)).toBeTruthy();
    expect(screen.getByText("Assign equipment")).toBeTruthy();
  });

  it("contact info", async () => {
    wrap(<UpdateContactInfo />);
    expect(await screen.findByText("Your contact details")).toBeTruthy();
  });

  it("edit details", async () => {
    wrap(<EditProfileModal editProfile setEditProfile={vi.fn()} />);
    expect(await screen.findByText("Edit staff details")).toBeTruthy();
  });
});
