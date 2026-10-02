import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import StudentInfoSection from "./StudentInfoSection";
import { devitrakApi } from "../../../../../api/devitrakApi";

vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: vi.fn(),
    patch: vi.fn(),
  },
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

vi.mock("../../../../../components/UX/buttons/DangerButton", () => ({
  default: ({ title, func }) => (
    <button type="button" onClick={func}>
      {title}
    </button>
  ),
}));

const membersData = {
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
  date_of_birth: "",
  image_url: "existing.png",
};

function renderSection(props = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <StudentInfoSection
        membersData={membersData}
        companyId={137}
        industryFields={{ grade: true, homeroom: true, minor: true }}
        onSaved={vi.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  devitrakApi.patch.mockResolvedValue({ data: { ok: true } });
});

describe("StudentInfoSection", () => {
  it("renders student fields but no guardian fields", () => {
    renderSection();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/grade/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.queryByText(/guardian/i)).not.toBeInTheDocument();
  });

  it("saves only student-shaped fields on submit, no parent_guardian_* keys", async () => {
    renderSection();
    fireEvent.change(screen.getByLabelText(/first name/i), {
      target: { value: "Alexis" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save student info/i }));

    await waitFor(() => {
      expect(devitrakApi.patch).toHaveBeenCalledWith(
        "/db_member/update-member-info",
        expect.objectContaining({
          company_id: 137,
          member_id: 42,
          first_name: "Alexis",
        })
      );
    });
    const [, payload] = devitrakApi.patch.mock.calls[0];
    expect(payload).not.toHaveProperty("parent_guardian_first_name");
    expect(payload).not.toHaveProperty("parent_guardian_email");
  });

  it("calls onSaved after a successful update", async () => {
    const onSaved = vi.fn();
    renderSection({ onSaved });
    fireEvent.click(screen.getByRole("button", { name: /save student info/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });

  it("derives minor/under_13 flags from date_of_birth on submit", async () => {
    renderSection();
    fireEvent.change(screen.getByLabelText(/date of birth/i), {
      target: { value: "2014-01-01" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save student info/i }));

    await waitFor(() => {
      expect(devitrakApi.patch).toHaveBeenCalledWith(
        "/db_member/update-member-info",
        expect.objectContaining({
          date_of_birth: "2014-01-01",
          minor: true,
        })
      );
    });
  });
  /* Server rule (feat/member-contact-minors), checked on the whole row. */
  describe("contact rule", () => {
    it("refuses emptying an adult's email, and sends nothing", async () => {
      renderSection();
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: /save student info/i }));

      expect((await screen.findAllByText("Email is required for adults.")).length).toBeGreaterThan(0);
      expect(devitrakApi.patch).not.toHaveBeenCalled();
    });

    it("says live that a minor without own email now needs a guardian email", async () => {
      renderSection({
        membersData: { ...membersData, minor: 1, parent_guardian_email: "" },
        representativeLabel: "Parent",
      });
      expect(screen.queryByText(/Parent email is required/)).not.toBeInTheDocument();

      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "" } });

      expect(await screen.findByText(/Parent email is required/)).toBeInTheDocument();
    });

    it("lets a minor drop their own email when a guardian email is on file", async () => {
      renderSection({
        membersData: { ...membersData, minor: 1, parent_guardian_email: "mom@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/email/i), { target: { value: "" } });
      fireEvent.click(screen.getByRole("button", { name: /save student info/i }));

      await waitFor(() => expect(devitrakApi.patch).toHaveBeenCalled());
    });
  });
  /* 400 { message, missing } from the server (feat/member-contact-minors). */
  describe("server 400 with missing", () => {
    it("marks the field the server named, not a generic failure", async () => {
      devitrakApi.patch.mockRejectedValue({
        message: "Request failed with status code 400",
        response: {
          status: 400,
          data: { ok: false, message: "Adult members require phone_number.", missing: ["phone_number"] },
        },
      });
      renderSection();
      fireEvent.click(screen.getByRole("button", { name: /save student info/i }));

      expect((await screen.findAllByText("Phone is required for adults.")).length).toBeGreaterThan(0);
      expect(screen.queryByText(/Failed to update student/)).not.toBeInTheDocument();
    });

    it("shows the server's `message` when nothing is named", async () => {
      devitrakApi.patch.mockRejectedValue({
        message: "Request failed with status code 500",
        response: { status: 500, data: { ok: false, message: "Database unavailable." } },
      });
      renderSection();
      fireEvent.click(screen.getByRole("button", { name: /save student info/i }));

      expect(
        await screen.findByText("Failed to update student: Database unavailable.")
      ).toBeInTheDocument();
    });
  });
});
