import { describe, expect, it } from "vitest";
import {
  DOCUMENT_TYPES,
  buildProviderDocumentForm,
  documentTypeCounts,
  filterProviderDocuments,
  normalizeProviderDocument,
  sortProviderDocuments,
} from "./providerDocuments";

const user = { companyData: { id: "co-1" }, uid: "usr-1" };

describe("DOCUMENT_TYPES", () => {
  it("keeps the four values the endpoint already stores", () => {
    expect(DOCUMENT_TYPES.map((type) => type.id)).toEqual([
      "receipt",
      "invoice",
      "contract",
      "other",
    ]);
  });

  it("leads with the two the business actually files", () => {
    expect(DOCUMENT_TYPES[0].label).toBe("Receipt");
    expect(DOCUMENT_TYPES[1].label).toBe("Invoice");
  });
});

describe("buildProviderDocumentForm", () => {
  const file = new File(["x"], "invoice-july.pdf", { type: "application/pdf" });

  const entriesOf = (formData) =>
    Object.fromEntries(
      Array.from(formData.entries()).map(([key, value]) => [
        key,
        value instanceof File ? value.name : value,
      ])
    );

  it("pins the multipart body the endpoint already accepts", () => {
    const form = buildProviderDocumentForm({
      file,
      title: "Invoice July",
      documentType: "invoice",
      user,
      timestamp: "2026-08-26T00:00:00.000Z",
    });
    expect(entriesOf(form)).toEqual({
      // upload.single("document") — the file field name is not negotiable.
      document: "invoice-july.pdf",
      document_type: "invoice",
      title: "Invoice July",
      company_id: "co-1",
      created_by: "usr-1",
      uploadedAt: "2026-08-26T00:00:00.000Z",
    });
  });

  it("adds no field outside the contract", () => {
    const form = buildProviderDocumentForm({
      file,
      title: "t",
      documentType: "receipt",
      user,
      timestamp: "t",
    });
    expect(Array.from(form.keys()).sort()).toEqual([
      "company_id",
      "created_by",
      "document",
      "document_type",
      "title",
      "uploadedAt",
    ]);
  });

  it("trims the title, so the same invoice is not filed twice under two names", () => {
    const form = buildProviderDocumentForm({
      file,
      title: "  Invoice July  ",
      documentType: "invoice",
      user,
      timestamp: "t",
    });
    expect(entriesOf(form).title).toBe("Invoice July");
  });
});

describe("normalizeProviderDocument", () => {
  it("carries the type the list never displayed", () => {
    // The upload has always sent document_type, and the history modal rendered
    // the title, the date and the size — never the one field that separates a
    // receipt from an invoice.
    const doc = normalizeProviderDocument({ title: "Inv 7", document_type: "invoice" }, 0);
    expect(doc.type).toBe("invoice");
    expect(doc.typeLabel).toBe("Invoice");
  });

  it("labels an unrecognised type instead of dropping it", () => {
    expect(normalizeProviderDocument({ document_type: "packing_slip" }, 0).typeLabel)
      .toBe("packing_slip");
    expect(normalizeProviderDocument({}, 0).typeLabel).toBe("Unspecified");
  });

  it("reads the upload date under either name the two sides use", () => {
    // The upload sends `uploadedAt`; the list read `doc.uploadDate`, so every
    // row said "Uploaded: Unknown".
    expect(normalizeProviderDocument({ uploadedAt: "2026-08-26T10:00:00.000Z" }, 0).uploadedAt)
      .toBe("2026-08-26T10:00:00.000Z");
    expect(normalizeProviderDocument({ uploadDate: "2026-08-26T10:00:00.000Z" }, 0).uploadedAt)
      .toBe("2026-08-26T10:00:00.000Z");
    expect(normalizeProviderDocument({ createdAt: "2026-08-26T10:00:00.000Z" }, 0).uploadedAt)
      .toBe("2026-08-26T10:00:00.000Z");
  });

  it("says the date is unknown rather than rendering Invalid Date", () => {
    expect(normalizeProviderDocument({}, 0).uploadedAtLabel).toBe("Date unknown");
    expect(normalizeProviderDocument({ uploadedAt: "nonsense" }, 0).uploadedAtLabel)
      .toBe("Date unknown");
  });

  it("formats a bare date without shifting it a day", () => {
    // A YYYY-MM-DD with no time parses as UTC midnight and renders as the day
    // before for anyone west of UTC.
    expect(normalizeProviderDocument({ uploadedAt: "2026-05-01" }, 0).uploadedAtLabel)
      .toBe("2026-05-01");
  });

  it("takes a title from whichever field carries one", () => {
    expect(normalizeProviderDocument({ title: "Inv 7" }, 0).title).toBe("Inv 7");
    expect(normalizeProviderDocument({ name: "inv7.pdf" }, 0).title).toBe("inv7.pdf");
    expect(normalizeProviderDocument({}, 3).title).toBe("Untitled document");
  });

  it("offers a link only when the record carries a real URL", () => {
    // There is no download endpoint for provider documents. Whether one can be
    // opened depends entirely on the server storing a URL; a bare filename
    // would otherwise become a broken link.
    expect(normalizeProviderDocument({ url: "https://x/inv.pdf" }, 0).url)
      .toBe("https://x/inv.pdf");
    expect(normalizeProviderDocument({ secure_url: "http://x/inv.pdf" }, 0).url)
      .toBe("http://x/inv.pdf");
    expect(normalizeProviderDocument({ document_url: "https://x/a" }, 0).url)
      .toBe("https://x/a");
    expect(normalizeProviderDocument({ url: "inv.pdf" }, 0).url).toBeNull();
    expect(normalizeProviderDocument({ path: "/var/uploads/inv.pdf" }, 0).url).toBeNull();
    expect(normalizeProviderDocument({}, 0).url).toBeNull();
  });

  it("reports a size only when there is one", () => {
    expect(normalizeProviderDocument({ size: 2048 }, 0).sizeLabel).toBe("2.0 KB");
    expect(normalizeProviderDocument({ size: 5 * 1024 * 1024 }, 0).sizeLabel).toBe("5.0 MB");
    expect(normalizeProviderDocument({}, 0).sizeLabel).toBeNull();
  });

  it("keys every row, including one the server gave no id", () => {
    expect(normalizeProviderDocument({ id: "d1" }, 0).key).toBe("d1");
    expect(normalizeProviderDocument({ _id: "d2" }, 0).key).toBe("d2");
    expect(normalizeProviderDocument({}, 4).key).toBe("document-4");
  });
});

describe("filterProviderDocuments", () => {
  const docs = [
    { title: "Invoice July", document_type: "invoice" },
    { title: "Invoice August", document_type: "invoice" },
    { title: "Receipt 4410", document_type: "receipt" },
    { title: "Master agreement", document_type: "contract" },
  ].map(normalizeProviderDocument);

  it("returns everything with no filter", () => {
    expect(filterProviderDocuments(docs, {})).toHaveLength(4);
  });

  it("narrows to one type — the point of filing them by type", () => {
    expect(
      filterProviderDocuments(docs, { type: "invoice" }).map((doc) => doc.title)
    ).toEqual(["Invoice July", "Invoice August"]);
  });

  it("searches the title and the type label", () => {
    expect(filterProviderDocuments(docs, { term: "july" }).map((d) => d.title))
      .toEqual(["Invoice July"]);
    expect(filterProviderDocuments(docs, { term: "contract" }).map((d) => d.title))
      .toEqual(["Master agreement"]);
  });

  it("combines the two", () => {
    expect(filterProviderDocuments(docs, { type: "invoice", term: "august" }))
      .toHaveLength(1);
    expect(filterProviderDocuments(docs, { type: "receipt", term: "august" }))
      .toHaveLength(0);
  });

  it("survives nothing at all", () => {
    expect(filterProviderDocuments(undefined, { type: "invoice" })).toEqual([]);
  });
});

describe("sortProviderDocuments", () => {
  const docs = [
    { title: "Older", uploadedAt: "2026-05-01T00:00:00.000Z" },
    { title: "Newest", uploadedAt: "2026-08-01T00:00:00.000Z" },
    { title: "Undated" },
  ].map(normalizeProviderDocument);

  it("puts the newest first by default", () => {
    expect(sortProviderDocuments(docs, "desc").map((d) => d.title)).toEqual([
      "Newest",
      "Older",
      "Undated",
    ]);
  });

  it("reverses on request, still keeping the undated last", () => {
    // An undated row sorted as epoch zero used to jump to the top of the
    // ascending order and read as the oldest document on file.
    expect(sortProviderDocuments(docs, "asc").map((d) => d.title)).toEqual([
      "Older",
      "Newest",
      "Undated",
    ]);
  });

  it("does not mutate the list it was given", () => {
    const before = docs.map((d) => d.title);
    sortProviderDocuments(docs, "asc");
    expect(docs.map((d) => d.title)).toEqual(before);
  });
});

describe("documentTypeCounts", () => {
  it("counts only the types something is actually filed under", () => {
    const docs = [
      { document_type: "invoice" },
      { document_type: "invoice" },
      { document_type: "receipt" },
    ].map(normalizeProviderDocument);
    expect(documentTypeCounts(docs)).toEqual([
      { id: "receipt", label: "Receipt", count: 1 },
      { id: "invoice", label: "Invoice", count: 2 },
    ]);
  });

  it("carries an unrecognised type through rather than hiding those rows", () => {
    const docs = [{ document_type: "packing_slip" }, {}].map(normalizeProviderDocument);
    expect(documentTypeCounts(docs)).toEqual([
      { id: "packing_slip", label: "packing_slip", count: 1 },
      { id: "", label: "Unspecified", count: 1 },
    ]);
  });

  it("is empty for a supplier with no documents", () => {
    expect(documentTypeCounts([])).toEqual([]);
  });
});
