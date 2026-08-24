import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";

const member = {
  member_id: 12,
  first_name: "Ada",
  last_name: "Lovelace",
  email: "ada@school.org",
  minor: 0,
  under_13: 0,
};

const admin = {
  email: "root@school.org",
  uid: "u-root",
  name: "Root",
  lastName: "Admin",
  company: "Dev School",
  companyData: { id: "co-1", company_name: "Dev School", industry: "Education" },
  sqlInfo: { company_id: 7 },
  sqlMemberInfo: { staff_id: 3 },
};

vi.mock("react-redux", () => ({
  useDispatch: () => vi.fn(),
  useSelector: (fn) => fn({ admin: { user: admin }, member: { memberInfo: member } }),
}));

vi.mock("../../../../../../utils/checkStaffRoleAndLocations", () => ({
  useStaffRoleAndLocations: () => ({ role: "0", locationsAssignPermission: [] }),
}));

const post = vi.fn((url) => {
  if (url === "/db_event/retrieve-item-group-location-quantity") {
    return Promise.resolve({
      data: { groupedInventory: { Comms: { Tablet: { "Library": 4 } } } },
    });
  }
  if (url === "/document/folders") return Promise.resolve({ data: { folders: [] } });
  return Promise.resolve({ data: {} });
});

vi.mock("../../../../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...a) => post(...a),
    get: vi.fn().mockResolvedValue({ data: { documents: [] } }),
    patch: vi.fn(),
  },
}));

const { default: AssignmentDevicesToMember } = await import(
  "./assignment/AssignmentDevicesToMember"
);

const renderForm = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AssignmentDevicesToMember />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe("member handover form", () => {
  it("opens on the device step and names who is accountable", async () => {
    renderForm();
    expect(await screen.findByText("Hand over a device")).toBeTruthy();
    expect(screen.getByText("Device and location")).toBeTruthy();
    // An adult member signs for themselves.
    expect(screen.getByText(/signs their own liability contract/)).toBeTruthy();
  });

  it("cannot be submitted before a unit is picked", async () => {
    renderForm();
    await screen.findByText("Hand over a device");
    const submit = screen
      .getByText("Hand over devices")
      .closest("button");
    // The old form let you submit with a serial that matched nothing and did
    // nothing at all in response.
    expect(submit.disabled).toBe(true);
  });

  it("asks where the device will be kept and when it is due back", async () => {
    renderForm();
    await screen.findByText("Hand over a device");
    expect(screen.getByText("Where it will be kept, and until when")).toBeTruthy();
    expect(screen.getByText("Expected return date")).toBeTruthy();
  });

  it("offers the documents section without forcing it on an adult member", async () => {
    renderForm();
    expect(await screen.findByText("Documents to sign")).toBeTruthy();
    expect(screen.getByText("Attach documents")).toBeTruthy();
  });
});
