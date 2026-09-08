import { useMutation, useQuery } from "@tanstack/react-query";
import { Spin } from "antd";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import BlueButtonComponent from "../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../components/UX/buttons/GrayButton";
import { DevitrakLogo } from "../../components/icons/DevitrakLogo";
import Input from "../../components/UX/inputs/Input";
import {
  consentFormErrors,
  describeConsentPrompt,
  formatConsentExpiryMessage,
  isConsentSettled,
  readRespondError,
  shouldRetryTransientError,
} from "./consentPageUtils";
import {
  fetchPublicConsentDocument,
  respondPublicConsent,
  retrievePublicConsent,
} from "./guardianConsentPublicApi";
import "../authentication/publicLanding.css";

/**
 * The page a guardian lands on from a consent email. No session, no login: a
 * one-time code in the URL is the whole of the authentication, so everything
 * rendered comes from the server's answer to it.
 *
 * The redesign, none of it on the wire — the same three calls, in the same
 * order, with the same arguments:
 *
 *  - **The document was fourth.** The order was title, greeting, six fact rows,
 *    expiry warning, *then* the thing being agreed to. Three of those rows
 *    (guardian, student, school) repeated the greeting immediately above them,
 *    and on a phone a guardian scrolled past their child's homeroom to reach
 *    the policy. The document is now the second thing on the page, and the
 *    facts are the three that identify what is being asked.
 *  - **Agree could be pressed without the document being opened.** For a
 *    signature that is a weak place to be. There is a read acknowledgement now,
 *    and it appears only when there is something to read.
 *  - **"Please enter your name as shown above: {name}" implied a match that is
 *    not checked.** The server accepts any name. It now says what it is for.
 *  - **Refuse was styled `danger`.** Refusing consent is a legitimate answer,
 *    not a destructive act, and colouring it as one pressures the reader.
 *  - **A spent link left the form live.** 404/410/409/422 raised a corner toast
 *    and changed nothing, so Agree could be pressed against a link that will
 *    never accept it. Those four end the page and say what was recorded.
 *  - **Validation was a corner toast**, so the field that was wrong was never
 *    marked.
 */
const GuardianConsentResponsePage = () => {
  const [searchParams] = useSearchParams();
  const otc = searchParams.get("otc");

  const [signerName, setSignerName] = useState("");
  const [acknowledged, setAcknowledged] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [decision, setDecision] = useState(null);
  const [submittedStatus, setSubmittedStatus] = useState(null);
  const [failure, setFailure] = useState(null);
  /* Owned here rather than read off the mutation: this project is on React
     Query v4, where a mutation reports `isLoading` and has no `isPending` —
     which is what the buttons were reading. */
  const [busy, setBusy] = useState(false);

  const {
    data: consentData,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ["publicConsent", otc],
    queryFn: () => retrievePublicConsent(otc),
    enabled: Boolean(otc),
    retry: shouldRetryTransientError,
  });

  const consentDocumentId = consentData?.company?.consent_document_id ?? null;
  // Not currently validated server-side (any identifying value works) — see
  // fetchPublicConsentDocument's doc comment for the security follow-up.
  const documentViewerId =
    consentData?.guardian?.id ?? consentData?.student?.id ?? "guardian";

  const { data: documentData } = useQuery({
    queryKey: ["publicConsentDocument", consentDocumentId],
    queryFn: () =>
      fetchPublicConsentDocument(consentDocumentId, documentViewerId),
    enabled: Boolean(consentDocumentId),
  });

  const submitMutation = useMutation({
    mutationFn: ({ otc: consentOtc, decision: consentDecision, signerName: name }) =>
      respondPublicConsent(consentOtc, consentDecision, name),
    // The respond endpoint is idempotent-safe for a resubmit (backend
    // returns "already <status>" on a repeat), so retrying transient
    // failures here can't cause a double-write.
    retry: shouldRetryTransientError,
    onSuccess: (data, variables) => {
      // Render the confirmation from the mutation result itself — no need
      // to re-fetch retrievePublicConsent just to learn what we already know.
      setBusy(false);
      setSubmittedStatus(data?.status || variables?.decision);
    },
    onError: (err) => {
      setBusy(false);
      setFailure(readRespondError(err));
    },
  });

  const shell = (children, wide = false) => (
    <div className="public-landing">
      <div className={`public-landing__card${wide ? " public-landing__card--wide" : ""}`}>
        <div className="public-landing__brand">
          <DevitrakLogo />
        </div>
        {children}
      </div>
    </div>
  );

  const ended = ({ tone = "warn", title, message, extra = null }) =>
    shell(
      <>
        <p
          className={`public-landing__eyebrow public-landing__eyebrow--${
            tone === "ok" ? "ok" : "warn"
          }`}
        >
          {tone === "ok" ? "Done" : "Nothing to do here"}
        </p>
        <h1 className="public-landing__title">{title}</h1>
        <p className="public-landing__lead">{message}</p>
        {extra}
      </>
    );

  if (!otc) {
    return ended({
      title: "This link is incomplete",
      message:
        "It carries no consent code, so there is nothing to respond to. Check the link in the email, or ask the school to send it again.",
    });
  }

  if (isLoading) {
    return shell(
      <div style={{ display: "flex", justifyContent: "center", padding: "32px 0" }}>
        <Spin aria-label="Loading consent details" size="large" />
      </div>
    );
  }

  if (error) {
    const status = error?.response?.status;

    if (status === 404) {
      return ended({
        title: "This link is not valid",
        message:
          "The consent request behind it could not be found. Contact the school and they can send a new one.",
      });
    }

    if (status === 410) {
      return ended({
        title: "This link has expired",
        message:
          "Nothing was recorded. Contact the school and they can send a new request.",
      });
    }

    return ended({
      title: "The request could not be loaded",
      message:
        "Nothing was recorded. This is usually temporary — try again in a moment.",
      extra: (
        <div className="public-landing__actions" style={{ marginTop: 20 }}>
          <BlueButtonComponent
            title="Try again"
            func={() => refetch()}
            styles={{ width: "100%" }}
          />
        </div>
      ),
    });
  }

  const consent = consentData?.consent;
  const prompt = describeConsentPrompt(consentData);
  const expiryMessage = formatConsentExpiryMessage(consent?.expires_at);
  const alreadyAnswered = isConsentSettled(consent);
  const finalStatus = submittedStatus || consent?.status;

  // A spent link cannot take another answer, so the form does not exist.
  if (failure?.terminal) {
    return ended(failure);
  }

  if (submittedStatus || alreadyAnswered) {
    const agreed = finalStatus === "agreed";
    return ended({
      tone: submittedStatus || agreed ? "ok" : "warn",
      title: submittedStatus
        ? agreed
          ? "Consent recorded"
          : "Your refusal was recorded"
        : agreed
        ? "Consent is already on file"
        : "This request was already refused",
      message: submittedStatus
        ? `${prompt.companyName} has your answer for ${prompt.studentName}. Nothing else is needed — you can close this page.`
        : `${prompt.guardianName || "The guardian"} has already ${
            agreed ? "agreed to" : "refused"
          } this request for ${prompt.studentName}. Nothing was recorded twice.`,
      extra: (
        <p className="public-landing__note">
          To change this answer, contact {prompt.companyName} — this link cannot.
        </p>
      ),
    });
  }

  const hasDocument = Boolean(documentData?.viewUrl);
  const hasText = Boolean(consent?.consent_text);
  const needsAcknowledgement = hasDocument || hasText;

  const errors = consentFormErrors({
    signerName,
    acknowledged,
    needsAcknowledgement,
  });
  const errorFor = (key) => (submitAttempted ? errors[key] : undefined);

  const handleSubmit = (nextDecision) => {
    setSubmitAttempted(true);
    setFailure(null);
    if (Object.keys(errors).length > 0) return;

    setDecision(nextDecision);
    setBusy(true);
    submitMutation.mutate({
      otc,
      decision: nextDecision,
      signerName: signerName.trim(),
    });
  };

  return shell(
    <>
      <p className="public-landing__eyebrow">{prompt.companyName}</p>
      <h1 className="public-landing__title">Consent request</h1>
      <p className="public-landing__lead">
        {prompt.companyName} is asking for your consent for{" "}
        <strong>{prompt.studentName}</strong>. Read the policy below, then agree
        or refuse.
      </p>

      <dl className="public-landing__facts">
        <div>
          <dt>Student</dt>
          <dd>
            {prompt.studentName}
            {prompt.studentIdentifiers && (
              <span className="public-landing__facts-sub">
                {prompt.studentIdentifiers}
              </span>
            )}
          </dd>
        </div>
        <div>
          <dt>Policy</dt>
          <dd>{prompt.policyLabel}</dd>
        </div>
        {expiryMessage && (
          <div>
            <dt>Expires</dt>
            <dd>
              <span className="public-landing__facts-sub">{expiryMessage}</span>
            </dd>
          </div>
        )}
      </dl>

      {/* What is being agreed to, before what is being typed. */}
      {hasDocument ? (
        <>
          <h2 className="public-landing__section-title">
            {documentData.title || "Consent document"}
          </h2>
          <iframe
            className="public-landing__doc"
            src={documentData.viewUrl}
            title={documentData.title || "Consent document"}
          />
          <a
            className="public-landing__doc-link"
            href={documentData.viewUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open in a new tab
          </a>
        </>
      ) : (
        hasText && (
          <>
            <h2 className="public-landing__section-title">Consent details</h2>
            <div
              data-testid="consent-text-scroll"
              className="public-landing__doc-text"
            >
              {consent.consent_text}
            </div>
          </>
        )
      )}

      {needsAcknowledgement && (
        <>
          <label className="public-landing__check" htmlFor="consent-acknowledged">
            <input
              id="consent-acknowledged"
              type="checkbox"
              checked={acknowledged}
              disabled={busy}
              onChange={(event) => setAcknowledged(event.target.checked)}
            />
            <span>
              I have read the {prompt.policyType} policy above and I am
              authorised to answer for {prompt.studentName}.
            </span>
          </label>
          {errorFor("acknowledged") && (
            <p className="public-landing__field-error" role="alert">
              {errorFor("acknowledged")}
            </p>
          )}
        </>
      )}

      <div className="public-landing__field">
        <label htmlFor="guardian-consent-signer-name">
          Your full name{prompt.guardianName ? "" : ""}
        </label>
        <Input
          id="guardian-consent-signer-name"
          value={signerName}
          onChange={(event) => setSignerName(event.target.value)}
          placeholder={prompt.guardianName || "Enter your full name"}
          autoComplete="name"
          disabled={busy}
          error={Boolean(errorFor("signerName"))}
          fullWidth
        />
        {errorFor("signerName") ? (
          <p className="public-landing__field-error" role="alert">
            {errorFor("signerName")}
          </p>
        ) : (
          <p className="public-landing__field-hint">
            Typed here, this is your signature. Sent to{" "}
            {prompt.guardianEmail || "your email"}.
          </p>
        )}
      </div>

      {failure && !failure.terminal && (
        <p className="public-landing__error" role="alert" style={{ marginTop: 16 }}>
          {failure.message}
        </p>
      )}

      <div
        className="public-landing__actions public-landing__actions--pair"
        style={{ marginTop: 20 }}
      >
        <BlueButtonComponent
          title="Agree"
          buttonType="button"
          func={() => handleSubmit("agreed")}
          isLoading={busy && decision === "agreed"}
          isDisabled={busy}
        />
        {/* A legitimate answer, so it is secondary — not destructive. */}
        <GrayButtonComponent
          title="Refuse"
          buttonType="button"
          func={() => handleSubmit("refused")}
          isLoading={busy && decision === "refused"}
          isDisabled={busy}
        />
      </div>

      <p className="public-landing__note">
        Either answer is recorded with {prompt.companyName} and cannot be changed
        from this link afterwards.
      </p>
    </>,
    hasDocument
  );
};

export default GuardianConsentResponsePage;
