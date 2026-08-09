import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AssignDeviceDrawer from "./AssignDeviceDrawer";
import { devitrakApi } from "../../../../../api/devitrakApi";

vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn(), get: vi.fn(), patch: vi.fn(), delete: vi.fn() },
}));

vi.mock("../../../../Profile/school_compliance/utils/schoolComplianceUtils", () => ({
  fetchSchoolSettings: vi.fn(async () => ({
    settings: { enforce_member_consent: true, enforce_under_13: true },
  })),
}));

vi.mock("../../../../conditionalPage/utils/guardianConsentApi", () => ({
  fetchStudentConsent: vi.fn(async () => ({ status: "pending" })),
}));

const ITEM = {
  item_id: 7,
  serial_number: "HSP-6001",
  item_group: "MiFi Hotspot X2",
  category_name: "Connectivity",
  warehouse: 1,
  location: "Central Warehouse",
};

const ADULT = {
  member_id: 4,
  first_name: "Marcus",
  last_name: "Webb",
  minor: 0,
  email: "marcus@school.org",
};

// A minor with no guardian on file — the case the gate exists for.
const UNREPRESENTED_MINOR = {
  member_id: 5,
  first_name: "Aisha",
  last_name: "Bello",
  minor: 1,
  parent_guardian_first_name: "",
  parent_guardian_email: "",
};

const store = configureStore({
  reducer: {
    admin: () => ({
      user: {
        sqlInfo: { company_id: 137 },
        sqlMemberInfo: { staff_id: 1 },
        companyData: { id: "abc", industry: "Education" },
        company: "Summit Unified",
      },
    }),
    member: () => ({ memberInfo: null }),
    staffDetail: () => ({ profile: null }),
  },
});

const respond = (url) => {
  if (url === "/db_member/consulting-member") {
    return Promise.resolve({
      data: { members: [ADULT, UNREPRESENTED_MINOR] },
    });
  }
  if (url === "/company/search-company") {
    return Promise.resolve({
      data: {
        company: [
          { employees: [{ user: "dana@school.org", firstName: "Dana", lastName: "Ruiz" }] },
        ],
      },
    });
  }
  return Promise.resolve({ data: { ok: true } });
};

function renderDrawer() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <AssignDeviceDrawer open onClose={() => {}} item={ITEM} />
        </MemoryRouter>
      </QueryClientProvider>
    </Provider>
  );
}

describe("AssignDeviceDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    devitrakApi.post.mockImplementation((url) => respond(url));
  });

  it("searches people of every kind from one field", async () => {
    renderDrawer();
    await screen.findByText("Marcus Webb");
    expect(screen.getByText("Aisha Bello")).toBeTruthy();
    expect(screen.getByText("Dana Ruiz")).toBeTruthy();
    // The record type is a result, not a decision made first.
    expect(screen.getByText("Staff")).toBeTruthy();
  });

  it("filters across names and emails as you type", async () => {
    renderDrawer();
    await screen.findByText("Marcus Webb");
    fireEvent.change(screen.getByPlaceholderText(/Search students/i), {
      target: { value: "aisha" },
    });
    await waitFor(() => expect(screen.queryByText("Marcus Webb")).toBeNull());
    expect(screen.getByText("Aisha Bello")).toBeTruthy();
  });

  it("blocks assignment to a minor with no representative on file", async () => {
    renderDrawer();
    fireEvent.click(await screen.findByText("Aisha Bello"));

    await screen.findByText(/Representative required/i);
    const confirm = screen.getByText("Assign to Aisha Bello").closest("button");
    expect(confirm.disabled).toBe(true);

    fireEvent.click(confirm);
    // Nothing may be written — in particular the device must not be marked
    // out of the warehouse behind a blocked assignment.
    expect(
      devitrakApi.post.mock.calls.some(([url]) => url === "/db_item/item-out-warehouse")
    ).toBe(false);
  });

  it("lets an adult member through and asks for a due date", async () => {
    renderDrawer();
    fireEvent.click(await screen.findByText("Marcus Webb"));

    expect(screen.getByLabelText(/Due back/i)).toBeTruthy();
    const confirm = screen.getByText("Assign to Marcus Webb").closest("button");
    expect(confirm.disabled).toBe(false);
  });

  it("hands staff off to the staff flow instead of half-assigning", async () => {
    renderDrawer();
    fireEvent.click(await screen.findByText("Dana Ruiz"));
    expect(screen.getByText(/Staff assignments run through the staff profile/i)).toBeTruthy();
    expect(screen.queryByText(/^Assign to /)).toBeNull();
  });
});
