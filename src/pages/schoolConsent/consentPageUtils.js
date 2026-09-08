/**
 * React Query retry predicate for the public consent page. Retries
 * transient/network failures (no response, or 5xx) up to 2 extra attempts,
 * but never retries a definitive application error (404/409/410/422) —
 * those reflect real state (invalid link, already responded, expired)
 * that a retry cannot fix.
 *
 * @param {number} failureCount
 * @param {object} error
 * @returns {boolean}
 */
export function shouldRetryTransientError(failureCount, error) {
  const status = error?.response?.status;
  if (status && status < 500) return false;
  return failureCount < 2;
}

/**
 * Human-readable expiry warning for a pending consent link, or null when
 * there's nothing to show (missing/invalid date).
 *
 * @param {string|null|undefined} expiresAt - ISO date string
 * @returns {string|null}
 */
export function formatConsentExpiryMessage(expiresAt) {
  if (!expiresAt) return null;
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return null;
  const formatted = date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return `This link expires on ${formatted}.`;
}

/* ------------------------------------------------- The response page's UI --- */

const text = (value) => String(value ?? "").trim();

/**
 * Who and what the request is about.
 *
 * The page listed Guardian, Student, School, Policy, Grade and Homeroom as six
 * separate rows, three of which the greeting sentence above them had already
 * said. A guardian on a phone scrolled past their child's homeroom to reach the
 * document they were being asked to agree to.
 */
export function describeConsentPrompt(consentData) {
  const consent = consentData?.consent ?? {};
  const student = consentData?.student ?? {};
  const guardian = consentData?.guardian ?? {};

  const identifiers = [
    text(student.grade) && `Grade ${text(student.grade)}`,
    text(student.homeroom),
  ].filter(Boolean);

  return {
    companyName: text(consentData?.company?.name) || "the school",
    guardianName: text(guardian.full_name),
    guardianEmail: text(guardian.email) || text(consent.signer_email),
    studentName: text(student.full_name) || "the student",
    /** One identifying line, not a row each. */
    studentIdentifiers: identifiers.join(" · "),
    policyLabel: `${text(consent.policy_type) || "AUP"} version ${
      text(consent.policy_version) || "1"
    }`,
    policyType: text(consent.policy_type) || "school",
  };
}

/**
 * Whether the guardian has already answered, and so must not be shown a form.
 *
 * `mutable` is the authoritative signal; the status allowlist is the fallback
 * for older records that do not carry the field.
 */
export function isConsentSettled(consent) {
  if (typeof consent?.mutable === "boolean") return consent.mutable === false;
  return consent?.status === "agreed" || consent?.status === "refused";
}

/**
 * What is stopping the form being submitted.
 *
 * Both used to be corner toasts fired from the submit handler, so the field
 * that was wrong was never marked.
 */
export function consentFormErrors({
  signerName,
  acknowledged,
  needsAcknowledgement,
} = {}) {
  const errors = {};
  if (!text(signerName)) {
    errors.signerName = "Type your full name to sign.";
  }
  if (needsAcknowledgement && !acknowledged) {
    errors.acknowledged = "Confirm you have read the document before agreeing.";
  }
  return errors;
}

/**
 * What a failed response means for the page.
 *
 * `terminal` is the point of this. A spent link — already answered, expired, no
 * longer changeable — used to raise a corner toast and leave the form exactly
 * as it was, so the guardian could press Agree again indefinitely against a
 * link that will never accept it.
 */
export function readRespondError(error) {
  const status = error?.response?.status;
  const msg = text(error?.response?.data?.msg);

  if (status === 404) {
    return {
      terminal: true,
      tone: "warn",
      title: "This link is not valid",
      message:
        "The consent request behind it could not be found. Contact the school for a new link.",
    };
  }

  if (status === 410) {
    return {
      terminal: true,
      tone: "warn",
      title: "This link has expired",
      message:
        "Nothing was recorded. Contact the school and they can send a new request.",
    };
  }

  if (status === 409) {
    return {
      terminal: true,
      tone: "ok",
      title: "This request was already answered",
      message: "Your earlier response stands — nothing was recorded twice.",
    };
  }

  if (status === 422) {
    return {
      terminal: true,
      tone: "warn",
      title: "This response can no longer be changed",
      message: "Contact the school if the answer on file needs to be different.",
    };
  }

  return {
    terminal: false,
    tone: "warn",
    title: "That did not go through",
    message: msg || "Nothing was recorded. Please try again.",
  };
}
