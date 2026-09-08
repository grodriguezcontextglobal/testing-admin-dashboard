import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GuardianConsentResponsePage from "./GuardianConsentResponsePage";
import {
  fetchPublicConsentDocument,
  respondPublicConsent,
  retrievePublicConsent,
} from "./guardianConsentPublicApi";

vi.mock("./guardianConsentPublicApi", () => ({
  retrievePublicConsent: vi.fn(),
  respondPublicConsent: vi.fn(),
  fetchPublicConsentDocument: vi.fn(),
}));

const mockNotify = vi.fn();
vi.mock("../../components/notification/alerts/useStatusNotification", () => ({
  useStatusNotification: () => ({
    notify: mockNotify,
    contextHolder: null,
    api: { destroy: vi.fn() },
  }),
}));

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

/** Fills the signature and ticks the read acknowledgement. */
async function signAs(name = "Jane Guardian") {
  fireEvent.change(await screen.findByLabelText("Your full name"), {
    target: { value: name },
  });
  const ack = screen.queryByLabelText(/I have read the/i);
  if (ack) fireEvent.click(ack);
}

describe("GuardianConsentResponsePage", () => {
  it("shows loading spinner while fetching", () => {
    retrievePublicConsent.mockReturnValue(new Promise(() => {}));
    renderPage();
    expect(screen.getByLabelText("Loading consent details")).toBeInTheDocument();
  });

  it("shows error when OTC is missing", () => {
    renderPage("/school/consent/respond");
    expect(screen.getByText("This link is incomplete")).toBeInTheDocument();
    expect(
      screen.getByText(/carries no consent code/)
    ).toBeInTheDocument();
  });

  it("shows Invalid Link result on 404 error", async () => {
    retrievePublicConsent.mockRejectedValue({ response: { status: 404 } });
    renderPage();
    expect(await screen.findByText("This link is not valid")).toBeInTheDocument();
    expect(
      screen.getByText(/could not be found/)
    ).toBeInTheDocument();
  });

  it("shows Link Expired result on 410 error", async () => {
    retrievePublicConsent.mockRejectedValue({ response: { status: 410 } });
    renderPage();
    expect(await screen.findByText("This link has expired")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Nothing was recorded\. Contact the school/
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

    expect(
      await screen.findByText("The request could not be loaded")
    ).toBeInTheDocument();
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
    // The address the request was sent to, and the student's identifiers,
    // are each one line now rather than a row of their own.
    expect(screen.getByText(/guardian@example\.com/)).toBeInTheDocument();
    expect(screen.getByText(/Grade 5/)).toBeInTheDocument();
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
    // The height cap and the scroll live in publicLanding.css now, which
    // happy-dom does not apply — the class is what this can assert.
    expect(container.className).toContain("public-landing__doc-text");
  });

  it("renders the consent document iframe when the company has an assigned consent_document_id", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      company: { ...pendingConsent.company, consent_document_id: "doc-1" },
    });
    fetchPublicConsentDocument.mockResolvedValue({
      title: "School Consent",
      viewUrl: "https://s3.example.com/signed-school-consent.pdf",
    });
    renderPage();

    const iframe = await screen.findByTitle("School Consent");
    expect(iframe.tagName).toBe("IFRAME");
    expect(iframe).toHaveAttribute(
      "src",
      "https://s3.example.com/signed-school-consent.pdf"
    );
    // pendingConsent's guardian/student fixtures carry no `id` — confirms
    // the "guardian" literal fallback is used rather than crashing/passing undefined.
    expect(fetchPublicConsentDocument).toHaveBeenCalledWith("doc-1", "guardian");
  });

  it("does not fetch a document, and falls back to consent_text, when no consent_document_id is assigned", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    await screen.findByTestId("consent-text-scroll");
    expect(fetchPublicConsentDocument).not.toHaveBeenCalled();
    expect(screen.queryByTitle(/consent document/i)).not.toBeInTheDocument();
  });

  it("prefers the document over consent_text when both are present", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      company: { ...pendingConsent.company, consent_document_id: "doc-1" },
    });
    fetchPublicConsentDocument.mockResolvedValue({
      title: "School Consent",
      viewUrl: "https://s3.example.com/signed-school-consent.pdf",
    });
    renderPage();
    await screen.findByTitle("School Consent");
    expect(screen.queryByTestId("consent-text-scroll")).not.toBeInTheDocument();
  });

  it("renders neither block, without crashing, when a document is assigned but has no viewUrl yet", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, consent_text: undefined },
      company: { ...pendingConsent.company, consent_document_id: "doc-1" },
    });
    fetchPublicConsentDocument.mockResolvedValue({ title: null, viewUrl: null });
    renderPage();
    expect(await screen.findByRole("button", { name: "Agree" })).toBeInTheDocument();
    expect(screen.queryByTestId("consent-text-scroll")).not.toBeInTheDocument();
  });

  it("shows already responded result when consent already agreed", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, status: "agreed" },
    });
    renderPage();
    expect(
      await screen.findByText("Consent is already on file")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Jane Guardian has already agreed to this request for Alex Student/
      )
    ).toBeInTheDocument();
  });

  it("shows already responded result when consent already refused", async () => {
    retrievePublicConsent.mockResolvedValue({
      ...pendingConsent,
      consent: { ...pendingConsent.consent, status: "refused" },
    });
    renderPage();
    expect(
      await screen.findByText("This request was already refused")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Jane Guardian has already refused this request for Alex Student/
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
      await screen.findByText(
        /The guardian has already agreed to this request for Alex Student/
      )
    ).toBeInTheDocument();
  });

  it("calls respondPublicConsent with agreed decision", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    respondPublicConsent.mockResolvedValue({ ok: true });
    renderPage();
    await signAs();
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
    await signAs();
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
    await signAs();
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));

    expect(await screen.findByText("Consent recorded")).toBeInTheDocument();
    expect(
      screen.getByText(/has your answer for Alex Student/i)
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
    await signAs();
    fireEvent.click(screen.getByRole("button", { name: "Refuse" }));

    expect(
      await screen.findByText("Your refusal was recorded")
    ).toBeInTheDocument();
  });

  it("marks the signature field when it is empty, rather than a toast", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "Agree" }));

    expect(
      await screen.findByText("Type your full name to sign.")
    ).toBeInTheDocument();
    expect(respondPublicConsent).not.toHaveBeenCalled();
  });

  it("will not record an agreement until the policy is acknowledged", async () => {
    // Agree used to be pressable without the document having been opened.
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    renderPage();
    fireEvent.change(await screen.findByLabelText("Your full name"), {
      target: { value: "Jane Guardian" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));

    expect(
      await screen.findByText(
        "Confirm you have read the document before agreeing."
      )
    ).toBeInTheDocument();
    expect(respondPublicConsent).not.toHaveBeenCalled();
  });

  it("ends the page when the link is spent, instead of leaving Agree live", async () => {
    /* A 410 raised a corner toast and changed nothing, so the guardian
       could press Agree against a link that will never accept it. */
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    respondPublicConsent.mockRejectedValue({ response: { status: 410 } });
    renderPage();
    await signAs();
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));

    expect(await screen.findByText("This link has expired")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Agree" })).not.toBeInTheDocument();
  });

  it("keeps the form open for a failure worth retrying", async () => {
    retrievePublicConsent.mockResolvedValue(pendingConsent);
    // A 4xx that is not one of the four terminal ones: not retried, and the
    // form has to stay open.
    respondPublicConsent.mockRejectedValue({
      response: { status: 400, data: { msg: "Signature was rejected" } },
    });
    renderPage();
    await signAs();
    fireEvent.click(screen.getByRole("button", { name: "Agree" }));

    expect(
      await screen.findByText("Signature was rejected")
    ).toBeInTheDocument();
    // The form is still there to answer with — asserted on the field rather
    // than on the button, whose accessible name carries antd's spinner while
    // its loading icon animates out.
    expect(screen.getByLabelText("Your full name")).toBeInTheDocument();
    expect(screen.queryByText("This link has expired")).not.toBeInTheDocument();
  });
});
