import { describe, expect, it } from "vitest";
import {
  LANGUAGES,
  SCHOOL_CONSENT,
  buildDocumentUploadForm,
  buildUsesForOptions,
  documentFieldErrors,
  readJobStatus,
  readUploadResponse,
} from "./documentUploadForm";

const user = { companyData: { id: "co-1" }, uid: "usr-1" };
const file = new File(["x"], "policy.pdf", { type: "application/pdf" });

const entriesOf = (form) =>
  Object.fromEntries(
    Array.from(form.entries()).map(([key, value]) => [
      key,
      value instanceof File ? value.name : value,
    ])
  );

describe("buildUsesForOptions", () => {
  it("always offers the three paths every company has", () => {
    expect(buildUsesForOptions("Rental").map((option) => option.id)).toContain("onboarding");
    expect(buildUsesForOptions("Rental").map((option) => option.id)).toContain("event");
    expect(buildUsesForOptions("Rental").map((option) => option.id)).toContain("consumer");
  });

  it("offers school consent only to an Education company", () => {
    expect(buildUsesForOptions("Education").map((o) => o.id)).toContain(SCHOOL_CONSENT);
    expect(buildUsesForOptions("Rental").map((o) => o.id)).not.toContain(SCHOOL_CONSENT);
  });

  it("never offers an option labelled undefined", () => {
    // `String(user?.companyData?.industry)` is the string "undefined" for a
    // company with no industry, and that became a selectable option.
    const labels = buildUsesForOptions(undefined).map((option) => option.label);
    expect(labels).not.toContain("undefined");
    expect(labels).not.toContain("null");
    expect(buildUsesForOptions("").map((o) => o.label)).not.toContain("");
  });

  it("does not offer the same value twice", () => {
    const ids = buildUsesForOptions("Education").map((option) => option.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("says what each option means, which the bare Select did not", () => {
    expect(
      buildUsesForOptions("Education").find((o) => o.id === SCHOOL_CONSENT).note
    ).toMatch(/without a login/);
  });
});

describe("LANGUAGES", () => {
  it("keeps the two values the form has always stored", () => {
    expect(LANGUAGES.map((language) => language.id)).toEqual(["en", "es"]);
  });
});

describe("documentFieldErrors", () => {
  const complete = { file, title: "Rental policy", usesFor: { id: "event" } };

  it("names each missing field", () => {
    expect(documentFieldErrors({})).toEqual({
      file: "Choose the PDF to upload.",
      title: "Give the document a title.",
      usesFor: "Say where this document is used.",
    });
  });

  it("requires the field that decides whether the document is public", () => {
    // `trigger_action` had no rule, yet it drives `public_document` and is what
    // the documents list is grouped by.
    expect(documentFieldErrors({ ...complete, usesFor: null }).usesFor).toBe(
      "Say where this document is used."
    );
  });

  it("returns nothing for a complete document", () => {
    expect(documentFieldErrors(complete)).toEqual({});
  });

  it("treats a whitespace title as missing", () => {
    expect(documentFieldErrors({ ...complete, title: "   " }).title).toBe(
      "Give the document a title."
    );
  });

  it("refuses an expiration date already in the past", () => {
    expect(
      documentFieldErrors({
        ...complete,
        expirationDate: "2026-08-01T00:00:00.000Z",
        now: "2026-08-26T12:00:00.000Z",
      }).expirationDate
    ).toBe("The expiration date is in the past.");
  });

  it("accepts today and any date after it", () => {
    expect(
      documentFieldErrors({
        ...complete,
        expirationDate: "2026-08-26T09:00:00.000Z",
        now: "2026-08-26T12:00:00.000Z",
      })
    ).toEqual({});
    expect(
      documentFieldErrors({
        ...complete,
        expirationDate: "2027-01-01T00:00:00.000Z",
        now: "2026-08-26T12:00:00.000Z",
      })
    ).toEqual({});
  });

  it("says nothing about an expiration date that was left out", () => {
    expect(documentFieldErrors({ ...complete, now: "2026-08-26T12:00:00.000Z" }))
      .toEqual({});
  });
});

describe("buildDocumentUploadForm", () => {
  it("pins the multipart body the endpoint already accepts", () => {
    const form = buildDocumentUploadForm({
      file,
      values: {
        title: "Rental policy",
        trigger_action: "event",
        language: "es",
        description: "What renters agree to.",
        expiration_date: "2027-01-01T00:00:00.000Z",
      },
      user,
      timestamp: "2026-08-26T00:00:00.000Z",
    });
    expect(entriesOf(form)).toEqual({
      document: "policy.pdf",
      company_id: "co-1",
      created_by: "usr-1",
      at_: "2026-08-26T00:00:00.000Z",
      requires_signature: "false",
      document_type: "document",
      public_document: "false",
      title: "Rental policy",
      trigger_action: "event",
      language: "es",
      description: "What renters agree to.",
      expiration_date: "2027-01-01T00:00:00.000Z",
    });
  });

  it("marks only a school-consent document as public", () => {
    const publicFor = (triggerAction) =>
      entriesOf(
        buildDocumentUploadForm({
          file,
          values: { title: "t", trigger_action: triggerAction },
          user,
          timestamp: "t",
        })
      ).public_document;
    expect(publicFor(SCHOOL_CONSENT)).toBe("true");
    expect(publicFor("event")).toBe("false");
    expect(publicFor("consumer")).toBe("false");
    expect(publicFor("onboarding")).toBe("false");
  });

  it("omits a description and an expiration date that were left out", () => {
    const keys = Array.from(
      buildDocumentUploadForm({
        file,
        values: { title: "t", trigger_action: "event" },
        user,
        timestamp: "t",
      }).keys()
    );
    expect(keys).not.toContain("description");
    expect(keys).not.toContain("expiration_date");
  });

  it("defaults the language rather than sending nothing", () => {
    expect(
      entriesOf(
        buildDocumentUploadForm({
          file,
          values: { title: "t", trigger_action: "event" },
          user,
          timestamp: "t",
        })
      ).language
    ).toBe("en");
  });

  it("adds no field outside the contract", () => {
    // Six keys were special-cased in the old loop — applicable_locations,
    // applicable_items, applicable_events, tags, metadata, document_config —
    // and no control on the form has ever set one.
    const keys = Array.from(
      buildDocumentUploadForm({
        file,
        values: { title: "t", trigger_action: "event", description: "d" },
        user,
        timestamp: "t",
      }).keys()
    ).sort();
    expect(keys).toEqual(
      [
        "at_",
        "company_id",
        "created_by",
        "description",
        "document",
        "document_type",
        "language",
        "public_document",
        "requires_signature",
        "title",
        "trigger_action",
      ].sort()
    );
  });

  it("trims the title", () => {
    expect(
      entriesOf(
        buildDocumentUploadForm({
          file,
          values: { title: "  Rental policy  ", trigger_action: "event" },
          user,
          timestamp: "t",
        })
      ).title
    ).toBe("Rental policy");
  });
});

describe("readUploadResponse", () => {
  it("recognises the 202 job the endpoint returns now", () => {
    expect(readUploadResponse({ jobId: "j1" })).toEqual({ kind: "job", jobId: "j1" });
  });

  it("still recognises a deployment that resolves the upload inline", () => {
    expect(readUploadResponse({ ok: true })).toEqual({ kind: "done" });
  });

  it("carries the server's own reason for a refusal", () => {
    expect(readUploadResponse({ ok: false, msg: "File too large." })).toEqual({
      kind: "error",
      message: "File too large.",
    });
  });

  it("has something to say about a response it cannot read", () => {
    expect(readUploadResponse(undefined).kind).toBe("error");
    expect(readUploadResponse({}).message).toBe(
      "The document was not uploaded. Try again."
    );
  });
});

describe("readJobStatus", () => {
  it("hands back the produced document when the job finishes", () => {
    expect(readJobStatus({ status: "done", result: { document: { id: "d1" } } })).toEqual({
      kind: "done",
      document: { id: "d1" },
    });
  });

  it("reports a dead or failed job with the error it carried", () => {
    expect(readJobStatus({ status: "dead", lastError: "Bad PDF." })).toEqual({
      kind: "error",
      message: "Bad PDF.",
    });
    expect(readJobStatus({ status: "failed" }).message).toBe(
      "The document could not be processed."
    );
  });

  it("treats anything else as still running", () => {
    expect(readJobStatus({ status: "queued" })).toEqual({ kind: "pending" });
    expect(readJobStatus({ status: "active" })).toEqual({ kind: "pending" });
    expect(readJobStatus({})).toEqual({ kind: "pending" });
  });
});
