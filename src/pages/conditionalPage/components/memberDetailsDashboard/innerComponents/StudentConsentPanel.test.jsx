import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentConsentPanel } from "./StudentConsentPanel";
import {
  fetchStudentConsent,
  sendConsentRequest,
} from "../../../utils/guardianConsentApi";
import { fetchSchoolSettings } from "../../../../Profile/school_compliance/utils/schoolComplianceUtils";

vi.mock("../../../utils/guardianConsentApi", () => ({
  fetchStudentConsent: vi.fn(),
  sendConsentRequest: vi.fn(),
}));

vi.mock("../../../../Profile/school_compliance/utils/schoolComplianceUtils", () => ({
  fetchSchoolSettings: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({
      admin: {
        user: {
          sqlInfo: { company_id: 137 },
        },
      },
    }),
}));

const memberWithGuardian = {
  parent_guardian_first_name: "Jane",
  parent_guardian_last_name: "Doe",
  parent_guardian_email: "jane@example.com",
  parent_guardian_phone_number: "555-0124",
};

function renderPanel(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <StudentConsentPanel
        memberId={42}
        memberData={memberWithGuardian}
        requiredPolicyVersion="1"
        {...props}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  fetchSchoolSettings.mockResolvedValue({
    ok: true,
    settings: { required_consent_policy_version: "1" },
  });
});

describe("StudentConsentPanel", () => {
  it("shows loading spinner while fetching consent", async () => {
    let resolveConsent;
    fetchStudentConsent.mockReturnValue(
      new Promise((resolve) => {
        resolveConsent = resolve;
      })
    );
    renderPanel();
    expect(screen.getByLabelText("Loading consent status")).toBeInTheDocument();
    resolveConsent({ data: null });
    expect(await screen.findByText("Missing")).toBeInTheDocument();
  });

  it("shows missing status tag when no consent data exists", async () => {
    fetchStudentConsent.mockResolvedValue({ data: null });
    renderPanel();
    expect(await screen.findByText("Missing")).toBeInTheDocument();
    expect(
      screen.getByText("Consent has not been requested yet.")
    ).toBeInTheDocument();
  });

  it("shows pending status tag when consent is pending", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "pending", policy_version: "1" } },
    });
    renderPanel();
    expect(await screen.findByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Waiting for guardian response.")).toBeInTheDocument();
  });

  it("shows agreed status tag when consent is agreed", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "agreed", policy_version: "1" } },
    });
    renderPanel();
    expect(await screen.findByText("Agreed")).toBeInTheDocument();
  });

  it("shows refused status tag when consent is refused", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "refused", policy_version: "1" } },
    });
    renderPanel();
    expect(await screen.findByText("Refused")).toBeInTheDocument();
    expect(screen.getByText("Guardian refused consent.")).toBeInTheDocument();
  });

  it("shows expired status tag when consent is expired", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "expired", policy_version: "1" } },
    });
    renderPanel();
    expect(await screen.findByText("Expired")).toBeInTheDocument();
    expect(screen.getByText("Consent link expired.")).toBeInTheDocument();
  });

  it("shows stale status tag when policy version mismatches", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "agreed", policy_version: "1" } },
    });
    renderPanel({ requiredPolicyVersion: "2" });
    expect(await screen.findByText("Stale")).toBeInTheDocument();
    expect(
      screen.getByText("A new policy version requires consent again.")
    ).toBeInTheDocument();
  });

  it("shows guardian info when guardian fields exist on member", async () => {
    fetchStudentConsent.mockResolvedValue({ data: null });
    renderPanel();
    expect(await screen.findByText("Jane Doe")).toBeInTheDocument();
    expect(screen.getByText("jane@example.com")).toBeInTheDocument();
    expect(screen.getByText("555-0124")).toBeInTheDocument();
  });

  it("disables send button when guardian email is missing", async () => {
    fetchStudentConsent.mockResolvedValue({ data: null });
    renderPanel({
      memberData: {
        ...memberWithGuardian,
        parent_guardian_email: "",
      },
    });
    const button = await screen.findByRole("button", {
      name: /send consent request/i,
    });
    expect(button).toBeDisabled();
  });

  it("hides send button when status is agreed", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "agreed", policy_version: "1" } },
    });
    renderPanel();
    await screen.findByText("Agreed");
    expect(
      screen.queryByRole("button", { name: /send consent request/i })
    ).not.toBeInTheDocument();
  });

  it("sends the consent request payload from the button", async () => {
    fetchStudentConsent.mockResolvedValue({ data: null });
    sendConsentRequest.mockResolvedValue({ ok: true });
    renderPanel();
    fireEvent.click(
      await screen.findByRole("button", { name: /send consent request/i })
    );
    await waitFor(() => {
      expect(sendConsentRequest).toHaveBeenCalledWith({
        company_id: 137,
        member_id: 42,
        guardian_id: null,
        policy_type: "AUP",
        policy_version: "1",
      });
    });
  });
});
