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
