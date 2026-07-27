import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UpdateMemberInformation from "./UpdateMemberInformation";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { saveGuardian } from "../../../utils/guardianConsentApi";

vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: vi.fn(),
    patch: vi.fn(),
  },
}));

vi.mock("../../../utils/guardianConsentApi", () => ({
  saveGuardian: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({
      admin: {
        user: {
          companyData: { industry: "school" },
          sqlInfo: { company_id: 137 },
        },
      },
      member: {
        memberInfo: { member_id: 42, image_url: "existing.png" },
      },
    }),
}));

vi.mock("react-router-dom", () => ({
  useLocation: () => ({ pathname: "/member/42/update" }),
  useNavigate: () => vi.fn(),
}));

vi.mock("../../../../../config/industryProfiles", () => ({
  getIndustryProfile: () => ({
    fields: { grade: true, homeroom: true, minor: true },
    representative: { label: "Guardian" },
  }),
}));

vi.mock("./StudentConsentPanel", () => ({
  StudentConsentPanel: ({ memberId }) => (
    <div data-testid="student-consent-panel">Consent panel for {memberId}</div>
  ),
}));

vi.mock("../../../../../components/utils/UX/ImageUploaderUX", () => ({
  default: () => <div>Image uploader</div>,
}));

vi.mock("../../../../../components/UX/buttons/BlueButton", () => ({
  default: ({ title, buttonType = "button", func, disabled, loadingState }) => (
    <button type={buttonType} onClick={func} disabled={disabled || loadingState}>
      {title}
    </button>
  ),
}));

vi.mock("../../../../../components/UX/buttons/GrayButton", () => ({
  default: ({ title, func }) => (
    <button type="button" onClick={func}>
      {title}
    </button>
  ),
}));

vi.mock("../../../../../components/UX/buttons/DangerButton", () => ({
  default: ({ title, func }) => (
    <button type="button" onClick={func}>
      {title}
    </button>
  ),
}));

const member = {
  member_id: 42,
  first_name: "Alex",
  last_name: "Student",
  email: "alex@example.com",
  phone_number: "555-1111",
  address_street: "1 Main St",
  address_city: "Austin",
  address_state: "TX",
  address_zip: "78701",
  grade: "7",
  homeroom: "A",
  minor: 0,
  date_of_birth: "",
  parent_guardian_first_name: "",
  parent_guardian_last_name: "",
  parent_guardian_email: "",
  parent_guardian_phone_number: "",
};

let memberResponse;

function renderForm() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <UpdateMemberInformation />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  memberResponse = { ...member };
  devitrakApi.post.mockImplementation((url) => {
    if (url === "/db_member/consulting-member") {
      return Promise.resolve({ data: { members: [memberResponse] } });
    }
    return Promise.resolve({ data: {} });
  });
  devitrakApi.patch.mockResolvedValue({ data: { ok: true } });
  saveGuardian.mockResolvedValue({ ok: true });
});

describe("UpdateMemberInformation", () => {
  it("uses DOB to derive minor status and show guardian consent controls", async () => {
    memberResponse = { ...member, date_of_birth: "2014-01-01" };
    renderForm();

    await screen.findByLabelText(/date of birth/i);
    expect(screen.queryByText(/is the member a minor/i)).not.toBeInTheDocument();

    expect(await screen.findByText(/guardian information and consent are required/i)).toBeInTheDocument();
    expect(screen.getByText("Guardian first name")).toBeInTheDocument();
    expect(screen.getByTestId("student-consent-panel")).toHaveTextContent("42");
  });

  it("saves guardian after member update succeeds for a minor", async () => {
    memberResponse = { ...member, date_of_birth: "2010-01-01" };
    renderForm();

    await screen.findByText(/guardian information and consent are required/i);
    fireEvent.change(document.querySelector('[name="parent_guardian_first_name"]'), {
      target: { value: "Jane" },
    });
    fireEvent.change(document.querySelector('[name="parent_guardian_last_name"]'), {
      target: { value: "Doe" },
    });
    fireEvent.change(document.querySelector('[name="parent_guardian_email"]'), {
      target: { value: "jane@example.com" },
    });
    fireEvent.change(document.querySelector('[name="parent_guardian_phone_number"]'), {
      target: { value: "555-0124" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Update" }));

    await waitFor(() => {
      expect(devitrakApi.patch).toHaveBeenCalledWith(
        "/db_member/update-member-info",
        expect.objectContaining({
          company_id: 137,
          member_id: 42,
          date_of_birth: "2010-01-01",
          minor: true,
          under_13: false,
        })
      );
    });
    expect(saveGuardian).toHaveBeenCalledWith({
      member_id: 42,
      company_id: 137,
      first_name: "Jane",
      last_name: "Doe",
      email: "jane@example.com",
      phone_number: "555-0124",
    });
  });
});
