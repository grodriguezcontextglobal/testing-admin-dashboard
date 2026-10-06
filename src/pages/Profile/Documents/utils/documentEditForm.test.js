import { describe, expect, it } from "vitest";
import {
  buildDocumentEditPayload,
  describeDocumentStatus,
  editableUsesForOptions,
  expirationToISO,
  toDateInputValue,
} from "./documentEditForm";

/**
 * Editing a document (2026-10-05). Fredrik asked, meeting 2026-09-29
 * `37:36`–`38:18`, that an expired document stay in the library so it can be
 * changed "or change it back to active". Edit document had no expiration date
 * and no status at all, so the one field that decides whether a document can
 * still be handed out was the one field it could not change.
 */
const NOW = new Date("2026-10-05T12:00:00");

describe("describeDocumentStatus", () => {
  it("is active while the date is ahead, and says when it runs out", () => {
    const status = describeDocumentStatus({ expiration_date: "2026-12-31T23:59:59.999Z" }, NOW);
    expect(status).toMatchObject({ key: "active", tone: "success" });
    expect(status.expiresOn).toBe("2026-12-31");
  });

  it("is expired once the date has passed", () => {
    expect(describeDocumentStatus({ expiration_date: "2026-09-01" }, NOW)).toMatchObject({
      key: "expired",
      tone: "warning",
    });
  });

  /* No date is not a missing value: it is a document that never runs out. */
  it("is active with no end when there is no date", () => {
    expect(describeDocumentStatus({}, NOW)).toMatchObject({ key: "active", expiresOn: null });
    expect(describeDocumentStatus(undefined, NOW).key).toBe("active");
  });

  it("ignores a date it cannot read rather than calling it expired", () => {
    expect(describeDocumentStatus({ expiration_date: "not a date" }, NOW).key).toBe("active");
  });
});

describe("toDateInputValue", () => {
  it("trims a stored timestamp down to what a date input accepts", () => {
    expect(toDateInputValue("2026-12-31T23:59:59.999Z")).toBe("2026-12-31");
    expect(toDateInputValue("2026-12-31")).toBe("2026-12-31");
  });

  it("is empty for no date or an unreadable one", () => {
    expect(toDateInputValue(null)).toBe("");
    expect(toDateInputValue("not a date")).toBe("");
  });

  /**
   * The day a timestamp belongs to is the reader's day, not UTC's. End of 31
   * December in New York is already 1 January in UTC: slicing the ISO string
   * would show the day after, and saving that would push the date forward one
   * day on every edit.
   */
  it("survives a round trip without moving the date", () => {
    expect(toDateInputValue(expirationToISO("2026-12-31"))).toBe("2026-12-31");
    expect(toDateInputValue(expirationToISO("2026-01-01"))).toBe("2026-01-01");
  });
});

/**
 * A date input hands over a bare `YYYY-MM-DD`, and `new Date("2026-12-31")`
 * is UTC midnight — which, west of UTC, is the evening of the 30th. A
 * document set to expire on the 31st would stop working a day early. It
 * expires at the end of the chosen day, in the reader's own timezone.
 */
describe("expirationToISO", () => {
  it("expires at the end of the chosen day, not at its start", () => {
    const iso = expirationToISO("2026-12-31");
    const asDate = new Date(iso);
    expect(asDate.getFullYear()).toBe(2026);
    expect(asDate.getMonth()).toBe(11);
    expect(asDate.getDate()).toBe(31);
    expect(asDate.getHours()).toBe(23);
  });

  it("is still valid at noon on its own day", () => {
    const iso = expirationToISO("2026-10-05");
    expect(new Date(iso).getTime()).toBeGreaterThan(NOW.getTime());
  });

  it("is null when the field is left empty, which means no expiration", () => {
    expect(expirationToISO("")).toBeNull();
    expect(expirationToISO(null)).toBeNull();
  });
});

describe("buildDocumentEditPayload", () => {
  const document = {
    _id: "d1",
    title: "Waiver",
    trigger_action: "consumer",
    public_document: false,
  };

  it("sends the edited fields, with the expiration as a timestamp", () => {
    const payload = buildDocumentEditPayload({
      document,
      values: {
        title: "Waiver v2",
        description: "Signed by the guardian",
        document_type: "form",
        trigger_action: "consumer",
        expiration_date: "2027-01-31",
      },
    });
    expect(payload).toMatchObject({
      title: "Waiver v2",
      description: "Signed by the guardian",
      document_type: "form",
      trigger_action: "consumer",
      public_document: false,
    });
    // Stored as a timestamp, so the date it reads back as is the local one.
    expect(toDateInputValue(payload.expiration_date)).toBe("2027-01-31");
  });

  /* Clearing the field is the other way back to active, and `null` is what
     tells the server to drop the date rather than leave it as it was. */
  it("sends null when the date is cleared, so the document stops expiring", () => {
    const payload = buildDocumentEditPayload({
      document: { ...document, expiration_date: "2026-09-01" },
      values: { title: "Waiver", trigger_action: "consumer", expiration_date: "" },
    });
    expect(payload.expiration_date).toBeNull();
  });

  /**
   * `public_document` is what makes a document reachable by a guardian with no
   * login, and the upload sets it from the use. An edit that changes the use
   * has to move it too, or a document edited into School consent would never
   * reach the guardian — and one edited out of it would stay public.
   */
  it("follows the use when deciding whether the document is public", () => {
    expect(
      buildDocumentEditPayload({
        document,
        values: { title: "Waiver", trigger_action: "school_consent", expiration_date: "" },
      }).public_document
    ).toBe(true);

    expect(
      buildDocumentEditPayload({
        document: { ...document, trigger_action: "school_consent", public_document: true },
        values: { title: "Waiver", trigger_action: "event", expiration_date: "" },
      }).public_document
    ).toBe(false);
  });

  it("leaves out a description that was never filled in", () => {
    const payload = buildDocumentEditPayload({
      document,
      values: { title: "Waiver", trigger_action: "consumer", description: "  " },
    });
    expect(payload).not.toHaveProperty("description");
  });
});

/**
 * The edit form offers the same uses as the upload form, so a document cannot
 * be edited into a use the company does not have. Older documents carry values
 * no longer offered (`on_login`, `scheduled`): theirs is kept, so saving an
 * unrelated field does not silently move the document to another path.
 */
describe("editableUsesForOptions", () => {
  it("offers the company's own uses", () => {
    const ids = editableUsesForOptions("Education", "consumer").map((option) => option.id);
    expect(ids).toContain("event");
    expect(ids).toContain("onboarding");
    expect(ids).toContain("school_consent");
    expect(ids).toContain("Students");
  });

  it("keeps the document's current value when it is no longer offered", () => {
    const options = editableUsesForOptions("Education", "on_login");
    expect(options.at(-1)).toMatchObject({ id: "on_login" });
  });

  it("does not repeat a current value that is already offered", () => {
    const ids = editableUsesForOptions("Education", "event").map((option) => option.id);
    expect(ids.filter((id) => id === "event")).toHaveLength(1);
  });
});
