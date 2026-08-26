import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

let industry = "Rental";

vi.mock("react-redux", () => ({
  useSelector: (fn) =>
    fn({
      admin: {
        user: { companyData: { id: "co-1", industry }, uid: "usr-1" },
      },
    }),
}));

const post = vi.fn(() => Promise.resolve({ data: { ok: true } }));
const get = vi.fn(() => Promise.resolve({ data: { status: "done" } }));
vi.mock("../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...args) => post(...args),
    get: (...args) => get(...args),
  },
}));

vi.mock("../../utils/actions/generateIdempotencyKey", () => ({
  default: () => "idem-1",
}));

const { default: DocumentUpload } = await import("./DocumentUpload");

const activeTab = vi.fn();
const refetch = vi.fn();

const wrap = () => render(<DocumentUpload activeTab={activeTab} refetch={refetch} />);

const pdf = () => new File(["x"], "policy.pdf", { type: "application/pdf" });

const pick = (placeholder, label) => {
  fireEvent.click(screen.getByPlaceholderText(placeholder));
  fireEvent.click(screen.getByText(label));
};

const fillEverything = () => {
  fireEvent.change(screen.getByLabelText("PDF file *"), {
    target: { files: [pdf()] },
  });
  fireEvent.change(screen.getByLabelText("Title *"), {
    target: { value: "Rental agreement" },
  });
  pick("Where it is used", "Event");
};

beforeEach(() => {
  industry = "Rental";
  post.mockClear();
  post.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
  get.mockClear();
  get.mockImplementation(() => Promise.resolve({ data: { status: "done" } }));
  activeTab.mockClear();
  refetch.mockClear();
});

describe("DocumentUpload — layout", () => {
  it("states its three steps rather than six divider-separated rows", () => {
    wrap();
    expect(screen.getByText("The file")).toBeInTheDocument();
    expect(screen.getByText("What it is")).toBeInTheDocument();
    expect(screen.getByText("Details")).toBeInTheDocument();
  });

  it("renders one set of actions, not one above the form and one below", () => {
    wrap();
    expect(screen.getAllByText("Add document")).toHaveLength(1);
    expect(screen.getAllByText("Clear")).toHaveLength(1);
  });

  it("associates each label with its field", () => {
    wrap();
    expect(screen.getByLabelText("PDF file *")).toBeInTheDocument();
    expect(screen.getByLabelText("Title *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description")).toBeInTheDocument();
    expect(screen.getByLabelText("Expires on")).toBeInTheDocument();
  });

  it("confirms which file was chosen, which the old form never did", () => {
    // It used `Form.Item`'s `help` prop, which antd does not render.
    wrap();
    fireEvent.change(screen.getByLabelText("PDF file *"), {
      target: { files: [pdf()] },
    });
    expect(screen.getByText(/policy\.pdf/)).toBeInTheDocument();
  });

  it("says an empty expiration date means it never expires", () => {
    wrap();
    expect(
      screen.getByText("Leave it empty and the document never expires.")
    ).toBeInTheDocument();
  });
});

describe("DocumentUpload — the uses-for options", () => {
  it("offers school consent only to an Education company", () => {
    industry = "Education";
    wrap();
    fireEvent.click(screen.getByPlaceholderText("Where it is used"));
    expect(screen.getByText("School consent")).toBeInTheDocument();
  });

  it("never offers an option labelled undefined", () => {
    // `String(user?.companyData?.industry)` produced the string "undefined".
    industry = undefined;
    wrap();
    fireEvent.click(screen.getByPlaceholderText("Where it is used"));
    expect(screen.queryByText("undefined")).not.toBeInTheDocument();
  });

  it("warns that a school-consent document is served without a login", () => {
    industry = "Education";
    wrap();
    pick("Where it is used", "School consent");
    expect(screen.getByText(/without a login/)).toBeInTheDocument();
  });
});

describe("DocumentUpload — validation", () => {
  it("names each missing field and sends nothing", async () => {
    wrap();
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() =>
      expect(screen.getByText("Choose the PDF to upload.")).toBeInTheDocument()
    );
    expect(screen.getByText("Give the document a title.")).toBeInTheDocument();
    expect(screen.getByText("Say where this document is used.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("requires the field that decides whether the document is public", async () => {
    // "Uses for" had no rule at all.
    wrap();
    fireEvent.change(screen.getByLabelText("PDF file *"), {
      target: { files: [pdf()] },
    });
    fireEvent.change(screen.getByLabelText("Title *"), {
      target: { value: "Rental agreement" },
    });
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() =>
      expect(screen.getByText("Say where this document is used.")).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("refuses an expiration date in the past", async () => {
    wrap();
    fillEverything();
    fireEvent.change(screen.getByLabelText("Expires on"), {
      target: { value: "2020-01-01" },
    });
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() =>
      expect(screen.getByText("The expiration date is in the past.")).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("says nothing before the first attempt", () => {
    wrap();
    expect(screen.queryByText("Choose the PDF to upload.")).not.toBeInTheDocument();
  });
});

describe("DocumentUpload — what it sends", () => {
  const entriesOf = (form) =>
    Object.fromEntries(
      Array.from(form.entries()).map(([key, value]) => [
        key,
        value instanceof File ? value.name : value,
      ])
    );

  it("posts the multipart body the endpoint already accepts", async () => {
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, form, config] = post.mock.calls[0];
    expect(url).toBe("/document/upload");
    expect(config.headers["Idempotency-Key"]).toBe("idem-1");
    expect(entriesOf(form)).toMatchObject({
      document: "policy.pdf",
      company_id: "co-1",
      created_by: "usr-1",
      requires_signature: "false",
      document_type: "document",
      public_document: "false",
      title: "Rental agreement",
      trigger_action: "event",
      language: "en",
    });
  });

  it("marks a school-consent document public", async () => {
    industry = "Education";
    wrap();
    fireEvent.change(screen.getByLabelText("PDF file *"), {
      target: { files: [pdf()] },
    });
    fireEvent.change(screen.getByLabelText("Title *"), {
      target: { value: "Consent form" },
    });
    pick("Where it is used", "School consent");
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    expect(entriesOf(post.mock.calls[0][1]).public_document).toBe("true");
  });

  it("uploads once however many times the button is pressed", async () => {
    let release;
    post.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ data: { ok: true } }); })
    );
    wrap();
    fillEverything();
    const button = screen.getByText("Add document");
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    release();
  });
});

describe("DocumentUpload — the job queue", () => {
  it("polls the job the endpoint hands back and finishes on it", async () => {
    post.mockImplementation(() => Promise.resolve({ data: { jobId: "job-1" } }));
    get.mockImplementation(() =>
      Promise.resolve({ data: { status: "done", result: { document: { id: "d1" } } } })
    );
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() => expect(get).toHaveBeenCalledWith("/jobs/owned/job-1"));
    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(activeTab).toHaveBeenCalledWith("1");
  });

  it("reports a dead job with the error it carried", async () => {
    post.mockImplementation(() => Promise.resolve({ data: { jobId: "job-1" } }));
    get.mockImplementation(() =>
      Promise.resolve({ data: { status: "dead", lastError: "That PDF is corrupt." } })
    );
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() =>
      expect(screen.getByText("That PDF is corrupt.")).toBeInTheDocument()
    );
    expect(refetch).not.toHaveBeenCalled();
  });

  it("still handles a deployment that resolves the upload inline", async () => {
    post.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() => expect(refetch).toHaveBeenCalled());
    expect(get).not.toHaveBeenCalled();
  });

  it("reports a refusal on the form instead of a corner toast", async () => {
    post.mockImplementation(() =>
      Promise.resolve({ data: { ok: false, msg: "File too large." } })
    );
    wrap();
    fillEverything();
    fireEvent.click(screen.getByText("Add document"));

    await waitFor(() => expect(screen.getByText("File too large.")).toBeInTheDocument());
    expect(refetch).not.toHaveBeenCalled();
    expect(screen.getByLabelText("Title *")).toHaveValue("Rental agreement");
  });
});
