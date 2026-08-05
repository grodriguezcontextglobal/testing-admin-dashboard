import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import UpdateMemberInformation from "./UpdateMemberInformation";
import { devitrakApi } from "../../../../../api/devitrakApi";

vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: { post: vi.fn() },
}));

const navigateMock = vi.fn();
vi.mock("react-router-dom", () => ({
  useNavigate: () => navigateMock,
  useParams: () => ({ id: "42" }),
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

vi.mock("../../../../../config/industryProfiles", () => ({
  getIndustryProfile: () => ({
    fields: { grade: true, homeroom: true, minor: true },
    representative: { label: "Guardian" },
  }),
}));

vi.mock("./StudentInfoSection", () => ({
  default: ({ membersData }) => (
    <div data-testid="student-info-section">Student section for {membersData?.member_id}</div>
  ),
}));

vi.mock("./GuardianInfoSection", () => ({
  default: ({ memberId }) => (
    <div data-testid="guardian-info-section">Guardian section for {memberId}</div>
  ),
}));

const baseMember = {
  member_id: 42,
  first_name: "Alex",
  last_name: "Student",
  date_of_birth: "",
  parent_guardian_first_name: "",
  parent_guardian_last_name: "",
  parent_guardian_email: "",
  parent_guardian_phone_number: "",
};

let memberResponse;

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <UpdateMemberInformation />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  memberResponse = { ...baseMember };
  devitrakApi.post.mockImplementation((url) => {
    if (url === "/db_member/consulting-member") {
      return Promise.resolve({ data: { members: [memberResponse] } });
    }
    return Promise.resolve({ data: {} });
  });
});

describe("UpdateMemberInformation", () => {
  it("always renders the student info section", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("student-info-section")).toHaveTextContent("42")
    );
  });

  it("does not render the guardian section for a non-minor student", async () => {
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("student-info-section")).toHaveTextContent("42")
    );
    expect(screen.queryByTestId("guardian-info-section")).not.toBeInTheDocument();
  });

  it("renders the guardian section for a minor student", async () => {
    memberResponse = { ...baseMember, date_of_birth: "2014-01-01" };
    renderPage();
    expect(await screen.findByTestId("guardian-info-section")).toHaveTextContent("42");
  });

  it("renders the guardian section when the record is flagged minor with no date of birth", async () => {
    // Exactly what the school demo seeder produces: minor = 1 written
    // directly, date_of_birth never set. Without the fallback these students
    // show a guardian in the profile header and no way to edit them.
    memberResponse = { ...baseMember, date_of_birth: null, minor: 1 };
    renderPage();
    expect(await screen.findByTestId("guardian-info-section")).toHaveTextContent("42");
  });

  it("still hides the guardian section for an adult with no date of birth", async () => {
    memberResponse = { ...baseMember, date_of_birth: null, minor: 0 };
    renderPage();
    await waitFor(() =>
      expect(screen.getByTestId("student-info-section")).toHaveTextContent("42")
    );
    expect(screen.queryByTestId("guardian-info-section")).not.toBeInTheDocument();
  });

  it("keys the member query by id so the profile header shares the cache entry", async () => {
    renderPage();
    await screen.findByTestId("student-info-section");
    expect(devitrakApi.post).toHaveBeenCalledWith("/db_member/consulting-member", {
      member_id: 42,
      company_id: 137,
    });
  });

  it("navigates back to the member page on Cancel", async () => {
    renderPage();
    await screen.findByTestId("student-info-section");
    fireEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(navigateMock).toHaveBeenCalledWith("/member/42/main");
  });
});
