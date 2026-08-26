import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SERVER_REQUIRED_PLACEHOLDER } from "../../../../Profile/providers/utils/providerForm";

const post = vi.fn(() => Promise.resolve({ data: { ok: true } }));
vi.mock("../../../../../api/devitrakApi", () => ({
  devitrakApi: { post: (...args) => post(...args) },
}));

/* DocumentUpload reads the admin from Redux; NewSupplier takes it as a prop. */
vi.mock("react-redux", () => ({
  useSelector: (fn) => fn({ admin: { user: { companyData: { id: "co-1" }, uid: "usr-1" } } }),
}));

const { default: NewSupplier } = await import("./NewSupplier");

const user = { companyData: { id: "co-1" }, uid: "usr-1" };
const setSupplierModal = vi.fn();
const invalidateQueries = vi.fn();
const refetchingAfterNewSupplier = vi.fn();

let providerCompanies = [];
const refetch = vi.fn(() =>
  Promise.resolve({ data: { data: { providerCompanies } } })
);

const wrap = () =>
  render(
    <NewSupplier
      supplierModal
      setSupplierModal={setSupplierModal}
      user={user}
      queryClient={{ invalidateQueries }}
      providersList={{ refetch, data: { data: { providerCompanies } } }}
      refetchingAfterNewSupplier={refetchingAfterNewSupplier}
    />
  );

const type = (label, value) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

const fillEverything = () => {
  type("Company name *", "Acme Supplies");
  type("Street *", "1 Main St");
  type("City *", "Austin");
  type("State *", "TX");
  type("ZIP / postal code *", "78701");
  type("Contact name *", "Ada Lovelace");
  type("Phone *", "+15550000000");
  type("Email *", "ada@acme.com");
};

/** The create lands, and whatever the server returns alongside `ok`. */
const lands = (extra = {}) =>
  post.mockImplementation((url) => {
    if (url === "/company/new_provider") {
      return Promise.resolve({ data: { ok: true, ...extra } });
    }
    return Promise.resolve({ data: { ok: true } });
  });

beforeEach(() => {
  providerCompanies = [];
  post.mockClear();
  post.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
  setSupplierModal.mockClear();
  invalidateQueries.mockClear();
  refetch.mockClear();
  refetchingAfterNewSupplier.mockClear();
});

describe("NewSupplier — layout", () => {
  it("groups the form into the three things it actually asks for", () => {
    wrap();
    expect(screen.getByText("The company")).toBeInTheDocument();
    expect(screen.getByText("Where they are")).toBeInTheDocument();
    expect(screen.getByText("Who to contact")).toBeInTheDocument();
  });

  it("gives every field its own label, not one heading over four boxes", () => {
    wrap();
    ["City *", "State *", "ZIP / postal code *", "Contact name *", "Phone *"].forEach(
      (label) => expect(screen.getByLabelText(label)).toBeInTheDocument()
    );
  });

  it("marks the two genuinely optional fields as optional", () => {
    wrap();
    expect(screen.getByLabelText("Country")).toBeInTheDocument();
    expect(screen.getByLabelText("Website")).toBeInTheDocument();
  });

  it("asks nothing about industry or services, which nothing displays", () => {
    wrap();
    expect(screen.queryByLabelText(/Industry/i)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(/Services/i)).not.toBeInTheDocument();
  });

  it("defaults the country instead of leaving it blank", () => {
    wrap();
    expect(screen.getByLabelText("Country")).toHaveValue("USA");
  });
});

describe("NewSupplier — validation", () => {
  it("names every missing field instead of a button that does nothing", async () => {
    wrap();
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() =>
      expect(
        screen.getByText("Enter the supplier's company name.")
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Enter a street address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a city.")).toBeInTheDocument();
    expect(screen.getByText("Enter a state.")).toBeInTheDocument();
    expect(screen.getByText("Enter a ZIP or postal code.")).toBeInTheDocument();
    expect(screen.getByText("Enter the name of your contact there.")).toBeInTheDocument();
    expect(screen.getByText("Enter a contact email address.")).toBeInTheDocument();
    expect(screen.getByText("Enter a contact phone number.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("counts what is left so the reader knows to scroll up", async () => {
    wrap();
    type("Company name *", "Acme Supplies");
    fireEvent.click(screen.getByText("Add supplier"));
    await waitFor(() =>
      expect(screen.getByText("7 fields need filling in above.")).toBeInTheDocument()
    );
  });

  it("says nothing before the first attempt", () => {
    wrap();
    expect(
      screen.queryByText("Enter the supplier's company name.")
    ).not.toBeInTheDocument();
  });

  it("refuses a malformed email that used to save as typed", async () => {
    wrap();
    fillEverything();
    type("Email *", "ada@acme");
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() =>
      expect(screen.getByText("That email address is not valid.")).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalled();
  });
});

describe("NewSupplier — what it sends", () => {
  it("posts the body the endpoint already accepts, placeholders included", async () => {
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0];
    expect(url).toBe("/company/new_provider");
    expect(payload).toMatchObject({
      companyName: "Acme Supplies",
      // Required by the endpoint, displayed nowhere, asked about nowhere.
      industry: SERVER_REQUIRED_PLACEHOLDER,
      services: [SERVER_REQUIRED_PLACEHOLDER],
      address: {
        street: "1 Main St",
        city: "Austin",
        state: "TX",
        postalCode: "78701",
        country: "USA",
      },
      contactInfo: {
        name: "Ada Lovelace",
        email: "ada@acme.com",
        phone: "+15550000000",
        website: "",
      },
      status: "active",
      documents: [],
      creator: "co-1",
    });
    expect(payload.createdAt).toBe(payload.updatedAt);
  });

  it("adds no field outside the contract", async () => {
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(Object.keys(post.mock.calls[0][1]).sort()).toEqual(
      [
        "address",
        "companyName",
        "contactInfo",
        "createdAt",
        "creator",
        "documents",
        "industry",
        "services",
        "status",
        "updatedAt",
      ].sort()
    );
  });

  it("creates one supplier however many times Add is pressed", async () => {
    let release;
    post.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ data: { ok: true } }); })
    );
    wrap();
    fillEverything();
    const button = screen.getByText("Add supplier");
    fireEvent.click(button);
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    release();
  });

  it("refreshes every list that shows suppliers", async () => {
    lands({ provider: { id: "p1" } });
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() => expect(refetchingAfterNewSupplier).toHaveBeenCalled());
    expect(invalidateQueries).toHaveBeenCalledWith([
      "providersCompanyQuery",
      "co-1",
    ]);
    expect(refetch).toHaveBeenCalled();
  });
});

describe("NewSupplier — failures", () => {
  it("reports a refused write with the server's own reason", async () => {
    post.mockImplementation(() =>
      Promise.resolve({ data: { ok: false, msg: "That supplier already exists." } })
    );
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() =>
      expect(screen.getByText("That supplier already exists.")).toBeInTheDocument()
    );
    expect(setSupplierModal).not.toHaveBeenCalledWith(false);
  });

  it("reports a rejected request and keeps what was typed", async () => {
    post.mockImplementation(() => Promise.reject(new Error("Network Error")));
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));

    await waitFor(() => expect(screen.getByText("Network Error")).toBeInTheDocument());
    expect(screen.getByLabelText("Company name *")).toHaveValue("Acme Supplies");
    expect(setSupplierModal).not.toHaveBeenCalledWith(false);
  });
});

describe("NewSupplier — filing its paperwork", () => {
  const pickType = (label) => {
    fireEvent.click(screen.getByPlaceholderText("Receipt, invoice, contract…"));
    fireEvent.click(screen.getByText(label));
  };

  const createIt = async () => {
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));
    await waitFor(() =>
      expect(screen.getByText(/Acme Supplies was added/)).toBeInTheDocument()
    );
  };

  it("stays open on the new supplier's documents instead of just closing", async () => {
    // You are usually adding the supplier because you are holding its first
    // invoice.
    lands({ provider: { id: "p1" } });
    await createIt();
    expect(screen.getByText("File a document")).toBeInTheDocument();
    expect(setSupplierModal).not.toHaveBeenCalledWith(false);
  });

  it("finds the new supplier in the refetched list when the response has no id", async () => {
    providerCompanies = [{ id: "p9", companyName: "Acme Supplies", documents: [] }];
    lands();
    await createIt();
    expect(screen.getByText("File a document")).toBeInTheDocument();
  });

  it("closes and says where to file when the id cannot be determined", async () => {
    // Rather than opening a document list that would upload to `undefined`.
    providerCompanies = [];
    lands();
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add supplier"));
    await waitFor(() => expect(setSupplierModal).toHaveBeenCalledWith(false));
  });

  it("files a document with the multipart body the endpoint accepts", async () => {
    lands({ provider: { id: "p1" } });
    await createIt();
    fireEvent.click(screen.getByText("File a document"));

    const fileInput = screen.getByLabelText("Document file *");
    const file = new File(["x"], "invoice-july.pdf", { type: "application/pdf" });
    fireEvent.change(fileInput, { target: { files: [file] } });
    fireEvent.change(screen.getByLabelText("Title *"), {
      target: { value: "Invoice 4410 — July" },
    });
    pickType("Invoice");
    fireEvent.click(screen.getByText("File document"));

    await waitFor(() =>
      expect(
        post.mock.calls.some(([url]) => url === "/company/provider-upload-document/p1")
      ).toBe(true)
    );
    const [, form] = post.mock.calls.find(
      ([url]) => url === "/company/provider-upload-document/p1"
    );
    const entries = Object.fromEntries(
      Array.from(form.entries()).map(([key, value]) => [
        key,
        value instanceof File ? value.name : value,
      ])
    );
    expect(entries).toMatchObject({
      document: "invoice-july.pdf",
      document_type: "invoice",
      title: "Invoice 4410 — July",
      company_id: "co-1",
      created_by: "usr-1",
    });
  });

  it("names each missing part of the document instead of one corner toast", async () => {
    lands({ provider: { id: "p1" } });
    await createIt();
    fireEvent.click(screen.getByText("File a document"));
    fireEvent.click(screen.getByText("File document"));

    await waitFor(() =>
      expect(
        screen.getByText("Choose the file to file against this supplier.")
      ).toBeInTheDocument()
    );
    expect(screen.getByText("Give it a name you will recognise later.")).toBeInTheDocument();
    expect(screen.getByText("Say what kind of document this is.")).toBeInTheDocument();
    expect(
      post.mock.calls.some(([url]) => String(url).includes("provider-upload-document"))
    ).toBe(false);
  });

  it("confirms which file was chosen, which the old form never did", async () => {
    lands({ provider: { id: "p1" } });
    await createIt();
    fireEvent.click(screen.getByText("File a document"));
    fireEvent.change(screen.getByLabelText("Document file *"), {
      target: { files: [new File(["x"], "receipt.pdf", { type: "application/pdf" })] },
    });
    expect(screen.getByText(/receipt\.pdf/)).toBeInTheDocument();
  });

  it("goes back to the list so another can be filed straight away", async () => {
    lands({ provider: { id: "p1" } });
    await createIt();
    fireEvent.click(screen.getByText("File a document"));
    fireEvent.change(screen.getByLabelText("Document file *"), {
      target: { files: [new File(["x"], "a.pdf", { type: "application/pdf" })] },
    });
    fireEvent.change(screen.getByLabelText("Title *"), { target: { value: "Invoice A" } });
    pickType("Invoice");
    fireEvent.click(screen.getByText("File document"));

    await waitFor(() =>
      expect(screen.getByText(/Acme Supplies was added/)).toBeInTheDocument()
    );
  });

  it("lets the supplier be finished without filing anything", async () => {
    lands({ provider: { id: "p1" } });
    await createIt();
    fireEvent.click(screen.getByText("Close"));
    expect(setSupplierModal).toHaveBeenCalledWith(false);
  });
});
