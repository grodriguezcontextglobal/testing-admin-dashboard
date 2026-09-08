import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { default: HistoryDocumentProvider } = await import("./HistoryDocumentProvider");

const setOpen = vi.fn();
const onUploadDocument = vi.fn();

const provider = (documents) => ({ companyName: "Acme Supplies", documents });

const wrap = (documents, extra = {}) =>
  render(
    <HistoryDocumentProvider
      openDocumentHistory
      setOpenDocumentHistory={setOpen}
      selectedProvider={provider(documents)}
      onUploadDocument={onUploadDocument}
      {...extra}
    />
  );

const docs = [
  {
    id: "d1",
    title: "Invoice 4410",
    document_type: "invoice",
    uploadedAt: "2026-07-02T10:00:00.000Z",
    url: "https://files/inv4410.pdf",
    size: 2048,
  },
  {
    id: "d2",
    title: "Receipt 88",
    document_type: "receipt",
    uploadedAt: "2026-08-15T10:00:00.000Z",
  },
  { id: "d3", title: "Master agreement", document_type: "contract" },
];

beforeEach(() => {
  setOpen.mockClear();
  onUploadDocument.mockClear();
});

describe("HistoryDocumentProvider", () => {
  it("shows the type of each document, which the list never displayed", () => {
    // A receipt and an invoice used to look identical — the one distinction the
    // upload form actually asks about.
    wrap(docs);
    expect(screen.getByText("Invoice 4410")).toBeInTheDocument();
    expect(screen.getAllByText("Invoice").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Receipt").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Contract").length).toBeGreaterThan(0);
  });

  it("shows a real date instead of 'Unknown' on every row", () => {
    // The upload sends `uploadedAt`; this read `doc.uploadDate`.
    wrap(docs);
    expect(screen.queryByText(/Uploaded: Unknown/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/Date unknown/)).toHaveLength(1); // only d3, which has none
  });

  it("offers a link for a document the record carries a URL for", () => {
    wrap(docs);
    const link = screen.getByText("Open");
    expect(link).toHaveAttribute("href", "https://files/inv4410.pdf");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("says a document is stored rather than offering a broken link", () => {
    // There is no download route for a provider document.
    wrap(docs);
    expect(screen.getAllByText("Stored")).toHaveLength(2);
  });

  it("counts how many of each type there are", () => {
    wrap(docs);
    expect(screen.getByText("All")).toBeInTheDocument();
    // One receipt, one invoice, one contract.
    expect(screen.getAllByText("1").length).toBeGreaterThanOrEqual(3);
  });

  it("narrows to one type, which is the point of filing them by type", () => {
    wrap(docs);
    // The chip, not the type pill on the row — both read "Receipt".
    fireEvent.click(screen.getByRole("button", { name: "Receipt 1" }));
    expect(screen.getByText("Receipt 88")).toBeInTheDocument();
    expect(screen.queryByText("Invoice 4410")).not.toBeInTheDocument();
    expect(screen.getByText("Showing 1 of 3.")).toBeInTheDocument();
  });

  it("searches by title", () => {
    wrap(docs);
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "agreement" },
    });
    expect(screen.getByText("Master agreement")).toBeInTheDocument();
    expect(screen.queryByText("Receipt 88")).not.toBeInTheDocument();
  });

  it("says so when the filter matches nothing", () => {
    wrap(docs);
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "zzz" },
    });
    expect(screen.getByText("Nothing matches that")).toBeInTheDocument();
  });

  it("flips the order on request", () => {
    wrap(docs);
    expect(screen.getByText("Newest first")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Newest first"));
    expect(screen.getByText("Oldest first")).toBeInTheDocument();
  });

  it("states the count so the reader knows what they are looking at", () => {
    wrap(docs);
    expect(screen.getByText("3 documents on record.")).toBeInTheDocument();
  });

  it("offers to file the first one when nothing is on record", () => {
    wrap([]);
    expect(screen.getByText("No documents filed yet")).toBeInTheDocument();
    expect(screen.getByText("File a document")).toBeInTheDocument();
    fireEvent.click(screen.getByText("File a document"));
    expect(onUploadDocument).toHaveBeenCalled();
  });

  it("offers to file another when some already are", () => {
    wrap(docs);
    fireEvent.click(screen.getByText("File another"));
    expect(onUploadDocument).toHaveBeenCalled();
  });

  it("takes a caller's own lead sentence, for the just-created supplier", () => {
    wrap([], { lead: "Acme Supplies was added." });
    expect(screen.getByText("Acme Supplies was added.")).toBeInTheDocument();
  });

  it("does not throw on a supplier whose documents field is missing", () => {
    render(
      <HistoryDocumentProvider
        openDocumentHistory
        setOpenDocumentHistory={setOpen}
        selectedProvider={{ companyName: "Acme Supplies" }}
      />
    );
    expect(screen.getByText("No documents filed yet")).toBeInTheDocument();
  });
});
