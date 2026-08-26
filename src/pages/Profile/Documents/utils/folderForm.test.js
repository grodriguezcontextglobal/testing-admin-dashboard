import { describe, expect, it } from "vitest";
import {
  FOLDER_TRIGGER_ACTIONS,
  addDocumentsToFolder,
  availableDocuments,
  buildFolderPayload,
  emptyFolderForm,
  folderDocumentEntry,
  folderFieldErrors,
  folderFormFromRecord,
  removeDocumentFromFolder,
  resolveFolderDocuments,
  triggerActionOption,
} from "./folderForm";

const documents = [
  { _id: "d1", title: "Rental agreement" },
  { _id: "d2", title: "Waiver" },
  { _id: "d3", title: "Policy" },
];

describe("FOLDER_TRIGGER_ACTIONS", () => {
  it("keeps the values already stored, unchanged", () => {
    // `equipment_assignment` is read by ContractDocumentsPicker and
    // LegalDocumentModal. Renaming it would silently stop both finding folders.
    expect(FOLDER_TRIGGER_ACTIONS.map((option) => option.id)).toEqual([
      "equipment_assignment",
      "consumer_checkout",
      "event_registration",
      "staff_onboarding",
      "custom",
    ]);
  });

  it("says what each one means", () => {
    FOLDER_TRIGGER_ACTIONS.forEach((option) => {
      expect(option.supportingText.length).toBeGreaterThan(0);
    });
  });
});

describe("emptyFolderForm", () => {
  it("carries every field, all blank", () => {
    expect(emptyFolderForm()).toEqual({
      folder_name: "",
      trigger_action: "",
      folder_description: "",
      documents: [],
    });
  });

  it("is a fresh object per call", () => {
    const first = emptyFolderForm();
    first.documents.push("x");
    expect(emptyFolderForm().documents).toEqual([]);
  });
});

describe("folderFormFromRecord", () => {
  it("reads a folder saved under either spelling of each field", () => {
    expect(
      folderFormFromRecord({
        folder_name: "Onboarding",
        trigger_action: "staff_onboarding",
        folder_description: "For new staff",
        documents: [{ document_id: "d1" }],
      })
    ).toEqual({
      folder_name: "Onboarding",
      trigger_action: "staff_onboarding",
      folder_description: "For new staff",
      documents: [{ document_id: "d1" }],
    });

    expect(
      folderFormFromRecord({
        name: "Onboarding",
        folder_trigger_action: "staff_onboarding",
        description: "For new staff",
      })
    ).toEqual({
      folder_name: "Onboarding",
      trigger_action: "staff_onboarding",
      folder_description: "For new staff",
      documents: [],
    });
  });

  it("does not throw on nothing", () => {
    expect(folderFormFromRecord(undefined)).toEqual(emptyFolderForm());
  });
});

describe("triggerActionOption", () => {
  it("resolves a stored value to its option, so an edit shows what is set", () => {
    // SelectComponent reads `.label` off its value; it was handed the raw
    // string, so opening an existing folder showed an empty control.
    expect(triggerActionOption("staff_onboarding")).toMatchObject({
      id: "staff_onboarding",
      label: "Staff Onboarding",
    });
  });

  it("shows an unrecognised stored value as itself rather than blanking it", () => {
    expect(triggerActionOption("legacy_thing")).toEqual({
      id: "legacy_thing",
      label: "legacy_thing",
    });
  });

  it("is null for nothing set", () => {
    expect(triggerActionOption("")).toBeNull();
    expect(triggerActionOption(undefined)).toBeNull();
  });
});

describe("folderFieldErrors", () => {
  it("names all three required fields", () => {
    expect(folderFieldErrors(emptyFolderForm())).toEqual({
      folder_name: "Give the folder a name.",
      folder_description: "Describe what belongs in this folder.",
      trigger_action: "Say where this folder is used.",
    });
  });

  it("requires the description the endpoint requires", () => {
    // POST /document/new_folder answers 400 without folder_description, but the
    // Create button only checked the name and the trigger action — so it was
    // submitted, rejected, and reported as "Failed to save folder".
    const errors = folderFieldErrors({
      folder_name: "Onboarding",
      trigger_action: "staff_onboarding",
      folder_description: "",
    });
    expect(errors).toEqual({
      folder_description: "Describe what belongs in this folder.",
    });
  });

  it("returns nothing for a complete folder, documents or not", () => {
    // A folder is allowed to start empty: the endpoint requires the key, not
    // entries in it.
    expect(
      folderFieldErrors({
        folder_name: "Onboarding",
        trigger_action: "staff_onboarding",
        folder_description: "For new staff",
        documents: [],
      })
    ).toEqual({});
  });

  it("treats whitespace as empty", () => {
    expect(folderFieldErrors({ folder_name: " ", folder_description: " ", trigger_action: " " }))
      .toEqual(folderFieldErrors(emptyFolderForm()));
  });
});

describe("buildFolderPayload", () => {
  it("pins the body both endpoints already accept", () => {
    expect(
      buildFolderPayload({
        form: {
          folder_name: "  Onboarding  ",
          folder_description: "  For new staff  ",
          trigger_action: "staff_onboarding",
          documents: [{ document_id: "d1", document_name: "Waiver", active: true }],
        },
        companyId: "co-1",
      })
    ).toEqual({
      folder_name: "Onboarding",
      folder_description: "For new staff",
      trigger_action: "staff_onboarding",
      documents: [{ document_id: "d1", document_name: "Waiver", active: true }],
      company_id: "co-1",
    });
  });

  it("adds no field outside the contract", () => {
    const payload = buildFolderPayload({
      // A folder record read back from the server carries extra keys; spreading
      // it used to send them all straight back.
      form: { folder_name: "n", folder_description: "d", trigger_action: "custom", _id: "x", createdAt: "y" },
      companyId: "co-1",
    });
    expect(Object.keys(payload).sort()).toEqual([
      "company_id",
      "documents",
      "folder_description",
      "folder_name",
      "trigger_action",
    ]);
  });

  it("always sends the documents key, which the endpoint requires", () => {
    expect(buildFolderPayload({ form: {}, companyId: "co-1" }).documents).toEqual([]);
  });
});

describe("resolveFolderDocuments", () => {
  it("resolves each entry against the company's documents", () => {
    expect(
      resolveFolderDocuments([{ document_id: "d1", document_name: "Rental agreement", active: true }], documents)
    ).toEqual([
      { id: "d1", label: "Rental agreement", active: true, missing: false },
    ]);
  });

  it("keeps an entry whose document is gone, so the count and the chips agree", () => {
    // `.filter(Boolean)` used to drop it: the heading read "Documents in folder
    // (2)" above a single chip.
    const rows = resolveFolderDocuments(
      [{ document_id: "d1", document_name: "Rental agreement" }, { document_id: "gone", document_name: "Deleted one" }],
      documents
    );
    expect(rows).toHaveLength(2);
    expect(rows[1]).toMatchObject({ id: "gone", label: "Deleted one", missing: true });
  });

  it("falls back to the document's own title, then to a placeholder", () => {
    expect(resolveFolderDocuments([{ document_id: "d2" }], documents)[0].label).toBe("Waiver");
    expect(resolveFolderDocuments([{ document_id: "gone" }], documents)[0].label).toBe(
      "Untitled document"
    );
  });

  it("survives nothing", () => {
    expect(resolveFolderDocuments(undefined, documents)).toEqual([]);
  });
});

describe("availableDocuments", () => {
  it("offers only what is not already in the folder", () => {
    expect(
      availableDocuments(documents, [{ document_id: "d2" }]).map((option) => option.id)
    ).toEqual(["d1", "d3"]);
  });

  it("offers everything for an empty folder", () => {
    expect(availableDocuments(documents, [])).toHaveLength(3);
  });

  it("survives nothing", () => {
    expect(availableDocuments(undefined, undefined)).toEqual([]);
  });
});

describe("addDocumentsToFolder", () => {
  it("adds the selection as the entries the folder stores", () => {
    const result = addDocumentsToFolder({
      entries: [],
      selectedIds: ["d1", "d3"],
      documents,
    });
    expect(result.added).toBe(2);
    expect(result.documents).toEqual([
      { document_id: "d1", document_name: "Rental agreement", active: true },
      { document_id: "d3", document_name: "Policy", active: true },
    ]);
  });

  it("skips what is already in the folder and reports that nothing was added", () => {
    const result = addDocumentsToFolder({
      entries: [{ document_id: "d1", document_name: "Rental agreement", active: true }],
      selectedIds: ["d1"],
      documents,
    });
    expect(result.added).toBe(0);
    expect(result.documents).toHaveLength(1);
  });

  it("ignores an id with no document behind it", () => {
    expect(addDocumentsToFolder({ entries: [], selectedIds: ["ghost"], documents }).added)
      .toBe(0);
  });
});

describe("removeDocumentFromFolder", () => {
  it("removes the one entry", () => {
    expect(
      removeDocumentFromFolder(
        [{ document_id: "d1" }, { document_id: "d2" }],
        "d1"
      )
    ).toEqual([{ document_id: "d2" }]);
  });

  it("leaves the list alone for an id that is not in it", () => {
    expect(removeDocumentFromFolder([{ document_id: "d1" }], "d9")).toHaveLength(1);
  });
});

describe("folderDocumentEntry", () => {
  it("is the shape the folder stores", () => {
    expect(folderDocumentEntry(documents[0])).toEqual({
      document_id: "d1",
      document_name: "Rental agreement",
      active: true,
    });
  });
});
