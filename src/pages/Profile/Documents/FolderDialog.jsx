import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import { devitrakApi } from "../../../api/devitrakApi";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import MultiSelectComponent from "../../../components/UX/dropdown/MultiSelectComponent";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import Input from "../../../components/UX/inputs/Input";
import Label from "../../../components/UX/inputs/Label";
import TextArea from "../../../components/UX/inputs/TextArea";
import ModalUX from "../../../components/UX/modal/ModalUX";
import "../../../styles/global/actionForm.css";
import "./folderDialog.css";
import {
  FOLDER_TRIGGER_ACTIONS,
  addDocumentsToFolder,
  availableDocuments,
  buildFolderPayload,
  folderFieldErrors,
  removeDocumentFromFolder,
  resolveFolderDocuments,
  triggerActionOption,
} from "./utils/folderForm";

const MODAL_WIDTH = 640;

const stepClass = (done) =>
  `action-form__step${done ? " action-form__step--done" : ""}`;

/**
 * Creating or editing a document folder.
 *
 * It was 105 lines of JSX inside Documents.jsx — a hand-rolled
 * `.modal-overlay` / `.modal-content` pair rather than ModalUX, so no escape
 * key, no focus handling and its own CSS — with five unrelated form groups
 * stacked in one column and Cancel rendered as a red `DangerButtonComponent`.
 * The three labels carried an asterisk and no `htmlFor`.
 *
 * Behaviour fixed along the way:
 *
 *  - `folder_description` is required by the endpoint (400 without it) and the
 *    label said so, but the Create button only checked the name and the trigger
 *    action. A folder with no description was submitted, rejected, and reported
 *    as "Failed to save folder" with no indication of which field.
 *  - The trigger-action select was handed the stored *string*, but
 *    SelectComponent reads `.label` off its value — so opening an existing
 *    folder showed an empty control even though a trigger action was set.
 *  - No saving state: two clicks on Create made two folders.
 *  - The whole form object was spread into the request, so a folder read back
 *    from the server sent its `_id`, `createdAt` and everything else straight
 *    back with it.
 *  - "Documents in folder (3)" could sit above two chips: an entry whose
 *    document was no longer in the company's list was dropped by a
 *    `.filter(Boolean)` while still being counted.
 */
const FolderDialog = ({
  open,
  onClose,
  folderForm,
  setFolderForm,
  editingFolder,
  documents,
  companyId,
  onSaved,
}) => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [failure, setFailure] = useState("");
  const [added, setAdded] = useState("");

  const isEditing = Boolean(editingFolder);
  const errors = folderFieldErrors(folderForm);
  const errorCount = Object.keys(errors).length;
  const errorFor = (key) => (submitAttempted ? errors[key] : undefined);

  const inFolder = useMemo(
    () => resolveFolderDocuments(folderForm?.documents, documents),
    [folderForm?.documents, documents]
  );
  const options = useMemo(
    () => availableDocuments(documents, folderForm?.documents),
    [documents, folderForm?.documents]
  );

  const update = (key) => (domEvent) =>
    setFolderForm({ ...folderForm, [key]: domEvent.target.value });

  const close = () => {
    setSelectedIds([]);
    setSubmitAttempted(false);
    setFailure("");
    setAdded("");
    onClose();
  };

  const addSelected = () => {
    const result = addDocumentsToFolder({
      entries: folderForm?.documents,
      selectedIds,
      documents,
    });
    setFolderForm({ ...folderForm, documents: result.documents });
    setSelectedIds([]);
    setAdded(
      result.added > 0
        ? `${result.added} document${result.added === 1 ? "" : "s"} added.`
        : "Those are already in this folder."
    );
  };

  const save = async () => {
    setSubmitAttempted(true);
    setFailure("");
    if (errorCount > 0) return;

    setIsSaving(true);
    try {
      const payload = buildFolderPayload({ form: folderForm, companyId });
      if (isEditing) {
        await devitrakApi.put(
          `/document/folder/${editingFolder.folder_id || editingFolder._id}`,
          payload
        );
      } else {
        await devitrakApi.post("/document/new_folder", payload);
      }
      setIsSaving(false);
      onSaved(isEditing ? "updated" : "created", payload.folder_name);
      close();
    } catch (error) {
      // Was one sentence for every failure, with the server's own reason
      // swallowed by the catch.
      setFailure(
        error?.response?.data?.msg ||
          error?.message ||
          "The folder was not saved. Nothing was changed — try again."
      );
      setIsSaving(false);
    }
  };

  const titleRender = () => (
    <div className="action-form__header">
      <h2 className="action-form__title">
        {isEditing ? "Edit folder" : "New folder"}
      </h2>
    </div>
  );

  const bodyModal = () => (
    <div className="action-form">
      <p className="action-form__lead">
        A folder groups documents that are shown together at one point in the
        app.
      </p>

      <section
        className={stepClass(
          !errors.folder_name && !errors.folder_description && !errors.trigger_action
        )}
      >
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">1</span>
            The folder
          </h3>
        </div>
        <div className="action-form__grid">
          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="folder_name" required>Name</Label>
            <Input
              id="folder_name"
              value={folderForm?.folder_name ?? ""}
              onChange={update("folder_name")}
              placeholder="Staff onboarding pack"
              disabled={isSaving}
              error={Boolean(errorFor("folder_name"))}
            />
            {errorFor("folder_name") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("folder_name")}
              </p>
            )}
          </div>

          <div className="action-form__field action-form__field--wide">
            <Label htmlFor="folder_description" required>Description</Label>
            <TextArea
              id="folder_description"
              value={folderForm?.folder_description ?? ""}
              onChange={update("folder_description")}
              placeholder="Everything a new hire has to sign before their first shift."
              disabled={isSaving}
              error={Boolean(errorFor("folder_description"))}
              textAreaProps={{ rows: 3, style: { resize: "none" } }}
            />
            {errorFor("folder_description") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("folder_description")}
              </p>
            )}
          </div>

          <div className="action-form__field action-form__field--wide">
            <SelectComponent
              label="Used at"
              isRequired
              placeholder="Where this folder appears"
              items={FOLDER_TRIGGER_ACTIONS}
              value={triggerActionOption(folderForm?.trigger_action)}
              onSelect={(option) =>
                setFolderForm({ ...folderForm, trigger_action: option?.id ?? "" })
              }
            />
            {errorFor("trigger_action") && (
              <p className="action-form__feedback action-form__feedback--error">
                {errorFor("trigger_action")}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className={stepClass(inFolder.length > 0)}>
        <div className="action-form__step-head">
          <h3 className="action-form__step-title">
            <span className="action-form__step-index">2</span>
            What is in it
          </h3>
          <span className="action-form__step-note">
            {inFolder.length === 0
              ? "Can be filled in later"
              : `${inFolder.length} document${inFolder.length === 1 ? "" : "s"}`}
          </span>
        </div>

        {inFolder.length === 0 ? (
          <p className="action-form__empty">
            Nothing in this folder yet. It can be created empty and filled in
            later.
          </p>
        ) : (
          <ul className="folder-dialog__picked">
            {inFolder.map((doc) => (
              <li key={doc.id}>
                <span className="folder-dialog__picked-label">
                  {doc.label}
                  {doc.missing && (
                    <span className="folder-dialog__missing">
                      no longer in your documents
                    </span>
                  )}
                </span>
                <button
                  type="button"
                  className="action-form__remove"
                  disabled={isSaving}
                  onClick={() =>
                    setFolderForm({
                      ...folderForm,
                      documents: removeDocumentFromFolder(
                        folderForm?.documents,
                        doc.id
                      ),
                    })
                  }
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="action-form__row">
          <div className="action-form__field">
            <MultiSelectComponent
              label="Add documents"
              placeholder={
                options.length === 0
                  ? "Every document is already in this folder"
                  : "Pick documents to add"
              }
              selectedKeys={new Set(selectedIds)}
              onSelectionChange={(next) => setSelectedIds(Array.from(next))}
              items={options}
              disabled={options.length === 0 || isSaving}
            />
          </div>
          <BlueButtonComponent
            title={
              selectedIds.length > 0 ? `Add ${selectedIds.length}` : "Add"
            }
            buttonType="button"
            func={addSelected}
            isDisabled={selectedIds.length === 0 || isSaving}
          />
        </div>
        {added && (
          <p className="action-form__feedback action-form__feedback--ok">{added}</p>
        )}
      </section>

      {failure && <p className="action-form__notice">{failure}</p>}

      {submitAttempted && errorCount > 0 && (
        <p className="action-form__notice">
          {errorCount} field{errorCount === 1 ? " needs" : "s need"} filling in
          above.
        </p>
      )}

      <div className="action-form__footer">
        <p className="action-form__consequence">
          {isEditing
            ? "Changes apply wherever this folder is shown."
            : "The folder appears wherever its Used at step happens."}
        </p>
        <GrayButtonComponent
          title="Cancel"
          buttonType="button"
          func={close}
          isDisabled={isSaving}
        />
        <BlueButtonComponent
          title={isEditing ? "Save folder" : "Create folder"}
          buttonType="button"
          func={save}
          isDisabled={isSaving}
          isLoading={isSaving}
        />
      </div>
    </div>
  );

  return (
    <ModalUX
      title={titleRender()}
      body={bodyModal()}
      openDialog={open}
      closeModal={close}
      width={MODAL_WIDTH}
    />
  );
};

FolderDialog.propTypes = {
  open: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  folderForm: PropTypes.object.isRequired,
  setFolderForm: PropTypes.func.isRequired,
  editingFolder: PropTypes.object,
  documents: PropTypes.array,
  companyId: PropTypes.string,
  onSaved: PropTypes.func.isRequired,
};

export default FolderDialog;
