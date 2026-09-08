import { describe, expect, it } from "vitest";
import {
  consentFormErrors,
  describeConsentPrompt,
  formatConsentExpiryMessage,
  isConsentSettled,
  readRespondError,
  shouldRetryTransientError,
} from "./consentPageUtils";

describe("shouldRetryTransientError", () => {
  it("does not retry a 404 (invalid link)", () => {
    expect(shouldRetryTransientError(0, { response: { status: 404 } })).toBe(false);
  });

  it("does not retry a 410 (expired link)", () => {
    expect(shouldRetryTransientError(0, { response: { status: 410 } })).toBe(false);
  });

  it("does not retry a 409/422 application error", () => {
    expect(shouldRetryTransientError(0, { response: { status: 409 } })).toBe(false);
    expect(shouldRetryTransientError(0, { response: { status: 422 } })).toBe(false);
  });

  it("retries a network error with no response up to 2 times", () => {
    expect(shouldRetryTransientError(0, { message: "Network Error" })).toBe(true);
    expect(shouldRetryTransientError(1, { message: "Network Error" })).toBe(true);
    expect(shouldRetryTransientError(2, { message: "Network Error" })).toBe(false);
  });

  it("retries a 500-level server error up to 2 times", () => {
    expect(shouldRetryTransientError(0, { response: { status: 500 } })).toBe(true);
    expect(shouldRetryTransientError(1, { response: { status: 503 } })).toBe(true);
    expect(shouldRetryTransientError(2, { response: { status: 500 } })).toBe(false);
  });
});

describe("formatConsentExpiryMessage", () => {
  it("returns null when expiresAt is missing", () => {
    expect(formatConsentExpiryMessage(null)).toBeNull();
    expect(formatConsentExpiryMessage(undefined)).toBeNull();
    expect(formatConsentExpiryMessage("")).toBeNull();
  });

  it("returns null for an invalid date string", () => {
    expect(formatConsentExpiryMessage("not-a-date")).toBeNull();
  });

  it("formats a valid ISO date into a human-readable expiry message", () => {
    // Noon UTC keeps this stable across CI/container timezones.
    expect(formatConsentExpiryMessage("2026-08-04T12:00:00.000Z")).toMatch(
      /This link expires on August 4, 2026\./
    );
  });
});

describe("describeConsentPrompt", () => {
  const data = {
    company: { name: "Summit Unified" },
    guardian: { full_name: "Mary Guardian", email: "mary@x.com" },
    student: { full_name: "Alex Student", grade: "5", homeroom: "5A" },
    consent: { policy_type: "AUP", policy_version: "2" },
  };

  it("folds the grade and homeroom into one identifying line", () => {
    // They were two of six separate rows, above the document being agreed to.
    expect(describeConsentPrompt(data).studentIdentifiers).toContain("Grade 5");
    expect(describeConsentPrompt(data).studentIdentifiers).toContain("5A");
  });

  it("drops an identifier that is absent rather than leaving a separator", () => {
    expect(
      describeConsentPrompt({ ...data, student: { full_name: "Alex", grade: "5" } })
        .studentIdentifiers
    ).toBe("Grade 5");
    expect(
      describeConsentPrompt({ ...data, student: { full_name: "Alex" } })
        .studentIdentifiers
    ).toBe("");
  });

  it("labels the policy in one string", () => {
    expect(describeConsentPrompt(data).policyLabel).toBe("AUP version 2");
    expect(describeConsentPrompt({}).policyLabel).toBe("AUP version 1");
  });

  it("falls back to the signer email when the guardian record has none", () => {
    expect(
      describeConsentPrompt({
        ...data,
        guardian: {},
        consent: { signer_email: "s@x.com" },
      }).guardianEmail
    ).toBe("s@x.com");
  });

  it("does not throw on nothing", () => {
    expect(describeConsentPrompt(undefined).studentName).toBe("the student");
    expect(describeConsentPrompt(undefined).companyName).toBe("the school");
  });
});

describe("isConsentSettled", () => {
  it("trusts mutable over the status", () => {
    expect(isConsentSettled({ mutable: false, status: "pending" })).toBe(true);
    expect(isConsentSettled({ mutable: true, status: "agreed" })).toBe(false);
  });

  it("falls back to the status allowlist for records with no mutable", () => {
    expect(isConsentSettled({ status: "agreed" })).toBe(true);
    expect(isConsentSettled({ status: "refused" })).toBe(true);
    expect(isConsentSettled({ status: "pending" })).toBe(false);
    expect(isConsentSettled(undefined)).toBe(false);
  });
});

describe("consentFormErrors", () => {
  it("asks for a name", () => {
    expect(consentFormErrors({ signerName: "  " }).signerName).toBe(
      "Type your full name to sign."
    );
  });

  it("asks for the document to be acknowledged, when there is one", () => {
    expect(
      consentFormErrors({
        signerName: "Mary",
        acknowledged: false,
        needsAcknowledgement: true,
      }).acknowledged
    ).toBe("Confirm you have read the document before agreeing.");
  });

  it("does not ask when there is nothing to read", () => {
    expect(
      consentFormErrors({ signerName: "Mary", needsAcknowledgement: false })
    ).toEqual({});
  });

  it("returns nothing for a complete form", () => {
    expect(
      consentFormErrors({
        signerName: "Mary",
        acknowledged: true,
        needsAcknowledgement: true,
      })
    ).toEqual({});
  });

  it("does not throw on nothing", () => {
    expect(consentFormErrors().signerName).toBeTruthy();
  });
});

describe("readRespondError", () => {
  const at = (status, msg) =>
    readRespondError({ response: { status, data: { msg } } });

  it("ends the page for a link that will never accept a response", () => {
    // A spent link used to raise a corner toast and leave the form live, so the
    // guardian could press Agree indefinitely.
    [404, 410, 409, 422].forEach((status) => {
      expect(at(status).terminal).toBe(true);
    });
  });

  it("says nothing was recorded for an expired link", () => {
    expect(at(410).message).toMatch(/Nothing was recorded/);
  });

  it("reassures rather than alarms when the answer was already given", () => {
    expect(at(409).tone).toBe("ok");
    expect(at(409).message).toMatch(/nothing was recorded twice/);
  });

  it("keeps the form open for a failure worth retrying, with the reason", () => {
    const outcome = at(500, "Upstream timeout");
    expect(outcome.terminal).toBe(false);
    expect(outcome.message).toBe("Upstream timeout");
  });

  it("has a sentence of its own when the server gave no reason", () => {
    expect(readRespondError(new Error("Network Error")).message).toBe(
      "Nothing was recorded. Please try again."
    );
  });
});
