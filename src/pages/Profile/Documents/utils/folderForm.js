/**
 * A document folder: its shape, its rules, and the body it posts.
 *
 * All of it lived inside Documents.jsx, a 510-line component that also held the
 * document list, the tab bar and the document picker.
 */

/**
 * Where a folder is used.
 *
 * These values are deliberately NOT the same list as the document form's
 * "Uses for". They look like they should be unified — and they are the reason
 * grouping folders and documents by one navigation model is not a pure UI job —
 * but `equipment_assignment` is read by two screens today
 * (ContractDocumentsPicker, LegalDocumentModal), so changing the vocabulary
 * here would silently stop those pickers finding folders.
 */
export const FOLDER_TRIGGER_ACTIONS = [
  {
    id: "equipment_assignment",
    label: "Equipment Assignment to Staff",
    supportingText: "Shown when equipment is handed to a staff member",
  },
  {
    id: "consumer_checkout",
    label: "Consumer Device Checkout",
    supportingText: "Shown when a consumer takes a device",
  },
  {
    id: "event_registration",
    label: "Event Registration",
    supportingText: "Shown when someone registers for an event",
  },
  {
    id: "staff_onboarding",
    label: "Staff Onboarding",
    supportingText: "Shown when a staff member joins",
  },
  { id: "custom", label: "Custom Action", supportingText: "Used somewhere else" },
];

const text = (value) => String(value ?? "").trim();

/** A fresh, complete folder form. */
export const emptyFolderForm = () => ({
  folder_name: "",
  trigger_action: "",
  folder_description: "",
  documents: [],
});

/**
 * An existing folder, in the shape the form holds.
 *
 * Both spellings of each field are in circulation, which is why the fallbacks
 * exist rather than being tidied away.
 */
export const folderFormFromRecord = (folder) => ({
  folder_name: text(folder?.folder_name ?? folder?.name),
  trigger_action: text(folder?.trigger_action ?? folder?.folder_trigger_action),
  folder_description: text(folder?.folder_description ?? folder?.description),
  documents: Array.isArray(folder?.documents) ? folder.documents : [],
});

/**
 * The option to show in the select for a stored value.
 *
 * The select was handed the raw string, but SelectComponent reads `.label` off
 * its value — so opening an existing folder showed an empty control even though
 * a trigger action was set. A value the list does not recognise is shown as
 * itself rather than blanked.
 */
export const triggerActionOption = (value) => {
  const wanted = text(value);
  if (!wanted) return null;
  return (
    FOLDER_TRIGGER_ACTIONS.find((option) => option.id === wanted) ?? {
      id: wanted,
      label: wanted,
    }
  );
};

/**
 * One message per field.
 *
 * `folder_description` is required by POST /api/document/new_folder — 400
 * without it — and the label already carried an asterisk, but the Create button
 * only checked the name and the trigger action. So a folder with no description
 * was submitted, rejected, and reported as "Failed to save folder".
 */
export const folderFieldErrors = (form) => {
  const errors = {};
  if (!text(form?.folder_name)) errors.folder_name = "Give the folder a name.";
  if (!text(form?.folder_description)) {
    errors.folder_description = "Describe what belongs in this folder.";
  }
  if (!text(form?.trigger_action)) {
    errors.trigger_action = "Say where this folder is used.";
  }
  return errors;
};

/** Body for POST /document/new_folder and PUT /document/folder/:id. */
export const buildFolderPayload = ({ form, companyId }) => ({
  folder_name: text(form?.folder_name),
  folder_description: text(form?.folder_description),
  trigger_action: text(form?.trigger_action),
  documents: Array.isArray(form?.documents) ? form.documents : [],
  company_id: companyId,
});

/** An entry as the folder stores it. */
export const folderDocumentEntry = (document) => ({
  document_name: document?.title,
  active: true,
  document_id: document?._id,
});

/**
 * The documents in the folder, resolved against the company's document list.
 *
 * An entry whose document is not in that list — deleted, or not loaded — used
 * to be dropped by `.filter(Boolean)`, so the heading counted it and no chip
 * appeared for it. It is kept, flagged as missing, so the count and the chips
 * agree.
 */
export const resolveFolderDocuments = (entries, documents) =>
  (Array.isArray(entries) ? entries : []).map((entry) => {
    const found = (Array.isArray(documents) ? documents : []).find(
      (document) => document?._id === entry?.document_id
    );
    return {
      id: entry?.document_id,
      label: text(entry?.document_name) || text(found?.title) || "Untitled document",
      active: Boolean(entry?.active),
      missing: !found,
    };
  });

/** The documents not yet in the folder, as picker options. */
export const availableDocuments = (documents, entries) => {
  const inFolder = new Set(
    (Array.isArray(entries) ? entries : []).map((entry) => entry?.document_id)
  );
  return (Array.isArray(documents) ? documents : [])
    .filter((document) => !inFolder.has(document?._id))
    .map((document) => ({
      id: document?._id,
      label: text(document?.title) || "Untitled document",
    }));
};

/**
 * Adding a selection to the folder, skipping anything already in it.
 *
 * Returns the next entry list and how many were actually added, so the caller
 * can say which of the two happened instead of guessing.
 */
export const addDocumentsToFolder = ({ entries, selectedIds, documents }) => {
  const current = Array.isArray(entries) ? entries : [];
  const present = new Set(current.map((entry) => entry?.document_id));
  const added = (Array.isArray(selectedIds) ? selectedIds : [])
    .filter((id) => !present.has(id))
    .map((id) =>
      (Array.isArray(documents) ? documents : []).find((doc) => doc?._id === id)
    )
    .filter(Boolean)
    .map(folderDocumentEntry);

  return { documents: [...current, ...added], added: added.length };
};

/** Removing one entry. */
export const removeDocumentFromFolder = (entries, documentId) =>
  (Array.isArray(entries) ? entries : []).filter(
    (entry) => entry?.document_id !== documentId
  );
