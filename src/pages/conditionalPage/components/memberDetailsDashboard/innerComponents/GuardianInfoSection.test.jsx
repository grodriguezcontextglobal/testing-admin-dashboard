import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuardianInfoSection from "./GuardianInfoSection";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { saveGuardian, searchGuardians } from "../../../utils/guardianConsentApi";

vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: { patch: vi.fn() },
}));

vi.mock("../../../utils/guardianConsentApi", () => ({
  saveGuardian: vi.fn(),
  searchGuardians: vi.fn(),
}));

vi.mock("./StudentConsentPanel", () => ({
  StudentConsentPanel: ({ memberId }) => (
    <div data-testid="student-consent-panel">Consent panel for {memberId}</div>
  ),
}));

const initialGuardian = {
  first_name: "",
  last_name: "",
  email: "",
  phone_number: "",
};

function renderSection(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <GuardianInfoSection
        memberId={42}
        companyId={137}
        initialGuardian={initialGuardian}
        memberData={{}}
        representative={{ label: "Guardian" }}
        onSaved={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  devitrakApi.patch.mockResolvedValue({ data: { ok: true } });
  saveGuardian.mockResolvedValue({ ok: true, guardian_id: 7 });
  searchGuardians.mockResolvedValue({ guardians: [] });
});

describe("GuardianInfoSection", () => {
  it("renders guardian fields and the consent panel, no student fields", () => {
    renderSection();
    expect(screen.getByLabelText(/guardian first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/guardian email/i)).toBeInTheDocument();
    expect(screen.getByTestId("student-consent-panel")).toHaveTextContent("42");
    expect(screen.queryByLabelText(/^first name$/i)).not.toBeInTheDocument();
  });

  it("auto-fills name/phone when an existing guardian is found by email on blur", async () => {
    searchGuardians.mockResolvedValue({
      guardians: [
        { id: 9, email: "jane@example.com", first_name: "Jane", last_name: "Doe", phone_number: "555-9999" },
      ],
    });
    renderSection();

    fireEvent.change(screen.getByLabelText(/guardian email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.blur(screen.getByLabelText(/guardian email/i));

    await waitFor(() => {
      expect(searchGuardians).toHaveBeenCalledWith({
        company_id: 137,
        email: "jane@example.com",
      });
    });
    expect(await screen.findByDisplayValue("Jane")).toBeInTheDocument();
    expect(screen.getByDisplayValue("555-9999")).toBeInTheDocument();
  });

  it("links the existing guardian by id on save when a match was found", async () => {
    searchGuardians.mockResolvedValue({
      guardians: [
        { id: 9, email: "jane@example.com", first_name: "Jane", last_name: "Doe", phone_number: "555-9999" },
      ],
    });
    renderSection();

    fireEvent.change(screen.getByLabelText(/guardian email/i), {
      target: { value: "jane@example.com" },
    });
    fireEvent.blur(screen.getByLabelText(/guardian email/i));
    await screen.findByDisplayValue("Jane");

    fireEvent.click(screen.getByRole("button", { name: /save guardian/i }));

    await waitFor(() => {
      expect(saveGuardian).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 137,
          member_id: 42,
          guardian_id: 9,
        })
      );
    });
    expect(devitrakApi.patch).toHaveBeenCalledWith(
      "/db_member/update-member-info",
      expect.objectContaining({
        company_id: 137,
        member_id: 42,
        parent_guardian_first_name: "Jane",
        parent_guardian_email: "jane@example.com",
      })
    );
  });

  it("creates a new guardian on save when no match was found", async () => {
    renderSection();
    fireEvent.change(screen.getByLabelText(/guardian first name/i), {
      target: { value: "Sam" },
    });
    fireEvent.change(screen.getByLabelText(/guardian email/i), {
      target: { value: "sam@example.com" },
    });
    fireEvent.blur(screen.getByLabelText(/guardian email/i));
    await waitFor(() => expect(searchGuardians).toHaveBeenCalled());

    fireEvent.click(screen.getByRole("button", { name: /save guardian/i }));

    await waitFor(() => {
      expect(saveGuardian).toHaveBeenCalledWith(
        expect.objectContaining({
          company_id: 137,
          member_id: 42,
          first_name: "Sam",
          email: "sam@example.com",
        })
      );
    });
    const [payload] = saveGuardian.mock.calls[0];
    expect(payload).not.toHaveProperty("guardian_id");
  });

  it("calls onSaved after a successful save", async () => {
    const onSaved = vi.fn();
    renderSection({ onSaved });
    fireEvent.change(screen.getByLabelText(/guardian email/i), {
      target: { value: "sam@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save guardian/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
