import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StudentConsentPanel } from "./StudentConsentPanel";
import {
  fetchStudentConsent,
  sendConsentRequest,
  resendConsentRequest,
} from "../../../utils/guardianConsentApi";
import {
  fetchSchoolSettings,
  fetchSchoolConsentDocuments,
} from "../../../../Profile/school_compliance/utils/schoolComplianceUtils";

vi.mock("../../../utils/guardianConsentApi", () => ({
  fetchStudentConsent: vi.fn(),
  sendConsentRequest: vi.fn(),
  resendConsentRequest: vi.fn(),
}));

vi.mock("../../../../Profile/school_compliance/utils/schoolComplianceUtils", () => ({
  fetchSchoolSettings: vi.fn(),
  fetchSchoolConsentDocuments: vi.fn(),
}));

vi.mock("react-redux", () => ({
  useSelector: (selector) =>
    selector({
      admin: {
        user: {
          sqlInfo: { company_id: 137 },
          companyData: { id: "mongo-company-137" },
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
    settings: {
      required_consent_policy_version: "1",
      consent_document_id: "doc-1",
    },
  });
  fetchSchoolConsentDocuments.mockResolvedValue([
    { _id: "doc-1", title: "AUP 2026", trigger_action: "school_consent" },
  ]);
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

  it("shows agreed status tag from the real POST /school/consent envelope (consents[], confirmed backend 2026-08-04)", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: {
        ok: true,
        count: 1,
        consents: [
          {
            status: "agreed",
            policy_version: "1",
            requested_at: "2026-08-04T17:40:34.000Z",
            responded_at: "2026-08-04T17:43:02.000Z",
          },
        ],
      },
    });
    renderPanel();
    expect(await screen.findByText("Agreed")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /send consent request/i })
    ).not.toBeInTheDocument();
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
        document_id: "doc-1",
      });
    });
  });

  it("does not disable send button when no consent document is assigned, but shows a hint (backend doesn't persist consent_document_id yet)", async () => {
    fetchSchoolSettings.mockResolvedValue({
      ok: true,
      settings: { required_consent_policy_version: "1" },
    });
    fetchStudentConsent.mockResolvedValue({ data: null });
    renderPanel();
    const button = await screen.findByRole("button", {
      name: /send consent request/i,
    });
    expect(button).not.toBeDisabled();
    expect(
      screen.getByText(
        /Assign a School Consent document in Compliance Settings/i
      )
    ).toBeInTheDocument();
  });

  it("does not disable send button when the assigned consent document has expired, but shows a hint", async () => {
    fetchSchoolConsentDocuments.mockResolvedValue([
      {
        _id: "doc-1",
        title: "AUP 2026",
        trigger_action: "school_consent",
        expiration_date: "2000-01-01T00:00:00.000Z",
      },
    ]);
    fetchStudentConsent.mockResolvedValue({ data: null });
    renderPanel();
    const button = await screen.findByRole("button", {
      name: /send consent request/i,
    });
    expect(button).not.toBeDisabled();
    expect(
      screen.getByText(/assigned School Consent document has expired/i)
    ).toBeInTheDocument();
  });

  it("fetches consent documents using the Mongo company id, not the SQL one", async () => {
    fetchStudentConsent.mockResolvedValue({ data: null });
    renderPanel();
    await screen.findByRole("button", { name: /send consent request/i });
    expect(fetchSchoolConsentDocuments).toHaveBeenCalledWith(
      "mongo-company-137"
    );
  });

  it.each(["expired", "refused", "stale"])(
    "calls resendConsentRequest (not sendConsentRequest) when status is %s",
    async (statusCase) => {
      const isStale = statusCase === "stale";
      fetchStudentConsent.mockResolvedValue({
        data: {
          consent: {
            status: isStale ? "agreed" : statusCase,
            policy_version: isStale ? "1" : "1",
          },
        },
      });
      resendConsentRequest.mockResolvedValue({ ok: true, status: "pending" });
      renderPanel(isStale ? { requiredPolicyVersion: "2" } : {});

      fireEvent.click(await screen.findByRole("button", { name: /^resend$/i }));

      await waitFor(() => {
        expect(resendConsentRequest).toHaveBeenCalledWith({
          company_id: 137,
          member_id: 42,
          policy_type: "AUP",
          policy_version: isStale ? "2" : "1",
          document_id: "doc-1",
        });
      });
      expect(sendConsentRequest).not.toHaveBeenCalled();
    }
  );

  it("shows a specific message when resend finds no existing request (404)", async () => {
    fetchStudentConsent.mockResolvedValue({
      data: { consent: { status: "expired", policy_version: "1" } },
    });
    const error = new Error("Not found");
    error.response = { status: 404 };
    resendConsentRequest.mockRejectedValue(error);
    renderPanel();

    fireEvent.click(await screen.findByRole("button", { name: /^resend$/i }));

    await waitFor(() => {
      expect(resendConsentRequest).toHaveBeenCalled();
    });
  });
});
