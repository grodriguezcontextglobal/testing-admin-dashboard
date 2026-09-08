import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { emptyFolderForm } from "./utils/folderForm";

const post = vi.fn(() => Promise.resolve({ data: { ok: true } }));
const put = vi.fn(() => Promise.resolve({ data: { ok: true } }));
vi.mock("../../../api/devitrakApi", () => ({
  devitrakApi: {
    post: (...args) => post(...args),
    put: (...args) => put(...args),
  },
}));

const { default: FolderDialog } = await import("./FolderDialog");

const documents = [
  { _id: "d1", title: "Rental agreement" },
  { _id: "d2", title: "Waiver" },
];

const onClose = vi.fn();
const onSaved = vi.fn();

/* The form is lifted state, so the harness holds it the way the page does. */
const Harness = ({ initial, editingFolder }) => {
  const [folderForm, setFolderForm] = useState(initial);
  return (
    <FolderDialog
      open
      onClose={onClose}
      folderForm={folderForm}
      setFolderForm={setFolderForm}
      editingFolder={editingFolder}
      documents={documents}
      companyId="co-1"
      onSaved={onSaved}
    />
  );
};

const wrap = (initial = emptyFolderForm(), editingFolder = null) =>
  render(<Harness initial={initial} editingFolder={editingFolder} />);

const complete = () => ({
  ...emptyFolderForm(),
  folder_name: "Onboarding pack",
  folder_description: "Everything a new hire signs.",
  trigger_action: "staff_onboarding",
});

beforeEach(() => {
  post.mockClear();
  post.mockImplementation(() => Promise.resolve({ data: { ok: true } }));
  put.mockClear();
  onClose.mockClear();
  onSaved.mockClear();
});

describe("FolderDialog — layout", () => {
  it("splits the five stacked groups into two labelled steps", () => {
    wrap();
    expect(screen.getByText("The folder")).toBeInTheDocument();
    expect(screen.getByText("What is in it")).toBeInTheDocument();
  });

  it("associates each label with its field", () => {
    wrap();
    expect(screen.getByLabelText("Name *")).toBeInTheDocument();
    expect(screen.getByLabelText("Description *")).toBeInTheDocument();
  });

  it("offers Cancel as a neutral action, not a destructive one", () => {
    wrap();
    const cancel = screen.getByText("Cancel");
    expect(cancel).toBeInTheDocument();
    fireEvent.click(cancel);
    expect(onClose).toHaveBeenCalled();
  });

  it("says a folder can be created empty", () => {
    wrap();
    expect(
      screen.getByText(/Nothing in this folder yet/)
    ).toBeInTheDocument();
  });

  it("names the action for what it is when editing", () => {
    wrap(complete(), { _id: "f1" });
    expect(screen.getByText("Edit folder")).toBeInTheDocument();
    expect(screen.getByText("Save folder")).toBeInTheDocument();
  });
});

describe("FolderDialog — the used-at select", () => {
  it("shows the stored value when an existing folder is opened", () => {
    // SelectComponent reads `.label` off its value and was handed the raw
    // string, so this control opened empty on every edit.
    wrap(complete(), { _id: "f1" });
    expect(screen.getByDisplayValue("Staff Onboarding")).toBeInTheDocument();
  });

  it("shows a value the list does not recognise rather than blanking it", () => {
    wrap({ ...complete(), trigger_action: "legacy_thing" }, { _id: "f1" });
    expect(screen.getByDisplayValue("legacy_thing")).toBeInTheDocument();
  });
});

describe("FolderDialog — validation", () => {
  it("names all three required fields and sends nothing", async () => {
    wrap();
    fireEvent.click(screen.getByText("Create folder"));

    await waitFor(() =>
      expect(screen.getByText("Give the folder a name.")).toBeInTheDocument()
    );
    expect(
      screen.getByText("Describe what belongs in this folder.")
    ).toBeInTheDocument();
    expect(screen.getByText("Say where this folder is used.")).toBeInTheDocument();
    expect(post).not.toHaveBeenCalled();
  });

  it("requires the description the endpoint requires", async () => {
    // POST /document/new_folder answers 400 without it, and the button used to
    // let it through — the failure came back as "Failed to save folder".
    wrap({ ...complete(), folder_description: "" });
    fireEvent.click(screen.getByText("Create folder"));

    await waitFor(() =>
      expect(
        screen.getByText("Describe what belongs in this folder.")
      ).toBeInTheDocument()
    );
    expect(post).not.toHaveBeenCalled();
  });

  it("says nothing before the first attempt", () => {
    wrap();
    expect(screen.queryByText("Give the folder a name.")).not.toBeInTheDocument();
  });
});

describe("FolderDialog — what it sends", () => {
  it("posts only the five fields the endpoint accepts", async () => {
    // A folder read back from the server carries extra keys; the whole form
    // object used to be spread into the request.
    wrap({ ...complete(), _id: "f1", createdAt: "yesterday" });
    fireEvent.click(screen.getByText("Create folder"));

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    const [url, payload] = post.mock.calls[0];
    expect(url).toBe("/document/new_folder");
    expect(Object.keys(payload).sort()).toEqual([
      "company_id",
      "documents",
      "folder_description",
      "folder_name",
      "trigger_action",
    ]);
    expect(payload).toMatchObject({
      folder_name: "Onboarding pack",
      trigger_action: "staff_onboarding",
      company_id: "co-1",
      documents: [],
    });
  });

  it("puts to the folder being edited", async () => {
    wrap(complete(), { folder_id: "f7" });
    fireEvent.click(screen.getByText("Save folder"));

    await waitFor(() => expect(put).toHaveBeenCalledTimes(1));
    expect(put.mock.calls[0][0]).toBe("/document/folder/f7");
    expect(post).not.toHaveBeenCalled();
  });

  it("creates one folder however many times Create is pressed", async () => {
    let release;
    post.mockImplementation(
      () => new Promise((resolve) => { release = () => resolve({ data: { ok: true } }); })
    );
    wrap(complete());
    const button = screen.getByText("Create folder");
    fireEvent.click(button);
    fireEvent.click(button);

    await waitFor(() => expect(post).toHaveBeenCalledTimes(1));
    release();
  });

  it("tells the page what happened", async () => {
    wrap(complete());
    fireEvent.click(screen.getByText("Create folder"));
    await waitFor(() =>
      expect(onSaved).toHaveBeenCalledWith("created", "Onboarding pack")
    );
  });

  it("reports the server's own reason for a refusal", async () => {
    post.mockImplementation(() =>
      Promise.reject({ response: { data: { msg: "That folder name is taken." } } })
    );
    wrap(complete());
    fireEvent.click(screen.getByText("Create folder"));

    await waitFor(() =>
      expect(screen.getByText("That folder name is taken.")).toBeInTheDocument()
    );
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("FolderDialog — the documents in it", () => {
  it("lists what is already in the folder", () => {
    wrap({
      ...complete(),
      documents: [{ document_id: "d1", document_name: "Rental agreement", active: true }],
    });
    expect(screen.getByText("Rental agreement")).toBeInTheDocument();
    expect(screen.getByText("1 document")).toBeInTheDocument();
  });

  it("shows an entry whose document is gone, so the count and the list agree", () => {
    // `.filter(Boolean)` used to drop it while the heading still counted it.
    wrap({
      ...complete(),
      documents: [
        { document_id: "d1", document_name: "Rental agreement" },
        { document_id: "gone", document_name: "Deleted one" },
      ],
    });
    expect(screen.getByText("2 documents")).toBeInTheDocument();
    expect(screen.getByText("Deleted one")).toBeInTheDocument();
    expect(screen.getByText("no longer in your documents")).toBeInTheDocument();
  });

  it("removes one on request", () => {
    wrap({
      ...complete(),
      documents: [{ document_id: "d1", document_name: "Rental agreement" }],
    });
    fireEvent.click(screen.getByText("Remove"));
    expect(screen.queryByText("Rental agreement")).not.toBeInTheDocument();
    expect(screen.getByText(/Nothing in this folder yet/)).toBeInTheDocument();
  });

  it("says when every document is already in the folder", () => {
    wrap({
      ...complete(),
      documents: documents.map((doc) => ({
        document_id: doc._id,
        document_name: doc.title,
      })),
    });
    expect(
      screen.getByPlaceholderText("Every document is already in this folder")
    ).toBeInTheDocument();
  });
});
