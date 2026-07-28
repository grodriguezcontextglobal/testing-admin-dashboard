import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuardianConsentResponsePage from "./GuardianConsentResponsePage";
import {
  respondPublicConsent,
  retrievePublicConsent,
} from "./guardianConsentPublicApi";
import { notification } from "antd";

vi.mock("./guardianConsentPublicApi", () => ({
  retrievePublicConsent: vi.fn(),
  respondPublicConsent: vi.fn(),
}));

vi.mock("antd", async () => {
  const actual = await vi.importActual("antd");
  return {
    ...actual,
    notification: {
      success: vi.fn(),
      error: vi.fn(),
      warning: vi.fn(),
    },
  };
});

const pendingConsent = {
  consent: {
    status: "pending",
    policy_type: "AUP",
    policy_version: "2",
    consent_text: "Please review and respond to this student policy.",
    signer_email: null,
  },
  company: { name: "Context Global Academy" },
  guardian: { full_name: "Jane Guardian", email: "guardian@example.com" },
  student: { full_name: "Alex Student", grade: "5", homeroom: "5A" },
};

function renderPage(path = "/school/consent/respond?otc=abc123") {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route
            path="/school/consent/respond"
            element={<GuardianConsentResponsePage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("GuardianConsentResponsePage", () => {
  it("shows loading spinner while fetching", () => {
    retrievePublicConsent.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByLabelText("Loading consent details")).toBeInTheDocument();
  });

  it("shows error when OTC is missing", () => {
    renderPage("/school/consent/respond");
    expect(screen.getByText("Invalid Link")).toBeInTheDocument();
    expect(
      screen.getByText("No consent code was provided. Please check the link you received.")
    ).toBeInTheDocument();
  });

  it("shows Invalid Link result on 404 error", async () => {
    retrievePublicConsent.mockRejectedValue({ response: { status: 404 } });
    renderPage();
    expect(await screen.findByText("Invalid Link")).toBeInTheDocument();
    expect(
      screen.getByText("This consent link is invalid. Please contact the school.")
    ).toBeInTheDocument();
  });

  it("shows Link Expired result on 410 error", async () => {
    retrievePublicConsent.mockRejectedValue({ response: { status: 410 } });
    renderPage();
    expect(await screen.findByText("Link Expired")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This consent link has expired. Please contact the school to request a new link."
      )
    ).toBeInTheDocument();
  });

  it("shows a generic error with a Try again button on a non-404/410 failure, and refetches on click", async () => {
    // 403 is a definitive (non-retryable) status, so the error surfaces
    // immediately instead of exhausting the query's own transient-error retries.
    retrievePublicConsent
      .mockRejectedValueOnce({ response: { status: 403 } })
      .mockResolvedValueOnce(pendingConsent);
    renderPage();

    expect(await screen.findByText("Error")).toBeInTheDocument();
    const retryButton = screen.getByRole("button", { name: "Try again" });
    fireEvent.click(retryButton);

    expect(await screen.findByText("AUP version 2")).toBeInTheDocument();
  });

  it("shows student name and policy info when data loads", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    expect((await screen.findAllByText("Alex Student")).length).toBeGreaterThan(0);
    expect(screen.getAllByText("Context Global Academy").length).toBeGreaterThan(0);
    expect(screen.getByText("AUP version 2")).toBeInTheDocument();
    expect(screen.getByText("guardian@example.com")).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("5A")).toBeInTheDocument();
  });

  it("shows an expiry warning when the consent carries expires_at", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, expires_at: "2026-08-04T12:00:00.000Z" },
    });
    renderPage();
    expect(
      await screen.findByText(/This link expires on August 4, 2026\./)
    ).toBeInTheDocument();
  });

  it("shows no expiry warning when expires_at is absent", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    await screen.findByText("AUP version 2");
    expect(screen.queryByText(/This link expires on/)).not.toBeInTheDocument();
  });

  it("caps the consent text in a scrollable, height-limited container", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    const container = await screen.findByTestId("consent-text-scroll");
    expect(container).toHaveTextContent(pendingConsent.consent.consent_text);
    expect(container.style.maxHeight).toBe("240px");
    expect(container.style.overflowY).toBe("auto");
  });

  it("shows already responded result when consent already agreed", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, status: "agreed" },
    });
    renderPage();
    expect(await screen.findByText("Consent Already Provided")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Jane Guardian has already agreed to the consent request for Alex Student."
      )
    ).toBeInTheDocument();
  });

  it("shows already responded result when consent already refused", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, status: "refused" },
    });
    renderPage();
    expect(await screen.findByText("Consent Already Refused")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Jane Guardian has already refused the consent request for Alex Student."
      )
    ).toBeInTheDocument();
  });

  it("treats consent.mutable === false as already-responded even with an unrecognized status", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, status: "revoked", mutable: false },
    });
    renderPage();
    await waitFor(() => {
      expect(screen.queryByRole("button", { name: "Agree" })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole("button", { name: "Refuse" })).not.toBeInTheDocument();
  });

  it("still shows the editable form when mutable is absent and status is pending (legacy fallback)", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    expect(await screen.findByRole("button", { name: "Agree" })).toBeInTheDocument();
  });

  it("shows the editable form when mutable is explicitly true even if an old status lingers", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, status: "pending", mutable: true },
    });
    renderPage();
    expect(await screen.findByRole("button", { name: "Agree" })).toBeInTheDocument();
  });

  it("uses the same guardian-name fallback ('Guardian') in the header and the already-responded message", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      guardian: { ...pendingConsent.guardian, full_name: "" },
      consent: { ...pendingConsent.consent, status: "agreed" },
    });
    renderPage();
    expect(
      await screen.findByText("Guardian has already agreed to the consent request for Alex Student.")
    ).toBeInTheDocument();
  });

  it("calls respondPublicConsent with agreed decision", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    respondPublicConsent.mockResolvedValue({ ok: true });
    renderPage();
    fireEvent.change(await screen.findByLabelText("Full name of guardian signing"), {
      target: { value: "Jane Guardian" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));
    await waitFor(() => {
      expect(respondPublicConsent).toHaveBeenCalledWith(
        "abc123",
        "agreed",
        "Jane Guardian"
      );
    });
  });

  it("calls respondPublicConsent with refused decision", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    respondPublicConsent.mockResolvedValue({ ok: true });
    renderPage();
    fireEvent.change(await screen.findByLabelText("Full name of guardian signing"), {
      target: { value: "Jane Guardian" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Refuse" }));
    await waitFor(() => {
      expect(respondPublicConsent).toHaveBeenCalledWith(
        "abc123",
        "refused",
        "Jane Guardian"
      );
    });
  });

  it("shows an immediate confirmation screen after a successful Agree submit, without re-fetching", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    respondPublicConsent.mockResolvedValue({ ok: true, status: "agreed" });
    renderPage();
    fireEvent.change(await screen.findByLabelText("Full name of guardian signing"), {
      target: { value: "Jane Guardian" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));

    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
    expect(
      screen.getByText(/your response has been recorded/i)
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agree" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Refuse" })).not.toBeInTheDocument();
    // Confirmation renders from the mutation result alone — no second GET.
    expect(retrievePublicConsent).toHaveBeenCalledTimes(1);
  });

  it("shows an immediate confirmation screen after a successful Refuse submit", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    respondPublicConsent.mockResolvedValue({ ok: true, status: "refused" });
    renderPage();
    fireEvent.change(await screen.findByLabelText("Full name of guardian signing"), {
      target: { value: "Jane Guardian" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Refuse" }));

    expect(await screen.findByText("Thank you!")).toBeInTheDocument();
    expect(
      screen.getByText(/your response has been recorded/i)
    ).toBeInTheDocument();
  });

  it("shows warning when signer name is empty", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Agree" }));
    expect(notification.warning).toHaveBeenCalledWith({
      message: "Please enter your name",
      description: "Your full name is required to sign.",
    });
    expect(respondPublicConsent).not.toHaveBeenCalled();
  });
});
