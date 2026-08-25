import { useQuery } from "@tanstack/react-query";
import { Select } from "antd";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../../components/notification/alerts/useStatusNotification";
import GrayButtonComponent from "../../../../../../../components/UX/buttons/GrayButton";
import TextLink from "../../../../../../../components/UX/buttons/TextLink";
import Label from "../../../../../../../components/UX/inputs/Label";
import { ProfileSkeleton } from "../../../../../../../components/UX/profile";
import "../../../../../../../styles/global/actionForm.css";

/**
 * The contracts emailed with a handover.
 *
 * Renamed from `LegalDocumentModal` in `DocumentsLoadedAsContracts.jsx`: it is
 * a section of a form, not a modal, and it had three different names for one
 * thing.
 *
 * Three real defects went with the rewrite:
 *
 *   - The recipient field read `value={setValue("emailContract", profile.email)}`.
 *     `setValue` returns undefined, so the input was uncontrolled — and calling
 *     it during render is a state update during render. The recipient is not an
 *     input at all now: it is decided by who is responsible for the member, and
 *     is shown.
 *   - "Assign Selected Documents" mapped `selectedDocuments` (objects) as if
 *     they were ids and then read `doc._id` off the `undefined` that came back,
 *     so pressing it threw a TypeError. The multi-select already writes the
 *     right shape, so the button is gone rather than fixed.
 *   - `activeKey` was a number against string tab keys, so the highlighted tab
 *     was wrong until the first click. There are no tabs any more: the picked
 *     list and the picker are one column.
 */
const ContractDocumentsPicker = ({
  addContracts,
  setAddContracts,
  loadingStatus,
  selectedDocuments,
  setSelectedDocuments,
  recipientEmail,
  recipientLabel,
  emailRequired,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { notify, contextHolder } = useStatusNotification();
  const [autoAssigned, setAutoAssigned] = useState(false);

  const foldersQuery = useQuery({
    queryKey: ["folders", user.companyData.id],
    queryFn: () =>
      devitrakApi.post(`/document/folders`, { company_id: user.companyData.id }),
    enabled: !!user.companyData.id,
  });

  const documentsQuery = useQuery({
    queryKey: ["available-documents", user.companyData.id],
    queryFn: () =>
      devitrakApi.get(`/document/?company_id=${user.companyData.id}`),
    enabled: !!user.companyData.id,
  });

  const isLoading = foldersQuery.isLoading || documentsQuery.isLoading;

  /**
   * A company can pin the documents for this action to a folder. When it has,
   * those are the documents — the library picker is not offered, because
   * choosing something else would not be honoured.
   */
  const source = useMemo(() => {
    if (isLoading) return { documents: [], fromFolder: false };

    const folders = (foldersQuery.data?.data?.folders ?? []).filter(
      (folder) => folder.folder_trigger_action === "equipment_assignment"
    );
    const fromFolders = folders.flatMap((folder) =>
      (folder.documents ?? []).map((doc) => ({
        id: doc.document_id,
        title: doc.document_title,
        view_url: doc.document_url ?? "",
      }))
    );

    if (fromFolders.length > 0) {
      return { documents: fromFolders, fromFolder: true };
    }

    return {
      documents: (documentsQuery.data?.data?.documents ?? []).map((doc) => ({
        id: doc._id,
        title: doc.title,
        view_url: doc.document_url ?? "",
      })),
      fromFolder: false,
    };
  }, [foldersQuery.data, documentsQuery.data, isLoading]);

  // Pinned documents are applied once, silently — it used to announce itself
  // with a success toast for something nobody had done. In an effect because
  // these are the parent's setters: a component may adjust its own state during
  // render, but never somebody else's.
  useEffect(() => {
    if (
      !source.fromFolder ||
      autoAssigned ||
      selectedDocuments.length > 0 ||
      source.documents.length === 0
    ) {
      return;
    }
    setAutoAssigned(true);
    setSelectedDocuments(source.documents);
    setAddContracts(true);
  }, [
    source,
    autoAssigned,
    selectedDocuments.length,
    setSelectedDocuments,
    setAddContracts,
  ]);

  const openDocument = async (id) => {
    try {
      const { data } = await devitrakApi.get(
        `/document/download/${id}/${user.uid}`
      );
      // Validate before opening: the old handler called window.open first and
      // threw afterwards, so a failed lookup still opened a blank tab.
      if (!data?.ok || !data?.downloadUrl) {
        throw new Error("no url");
      }
      window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
    } catch {
      notify("error", "That document could not be opened.");
    }
  };

  const isOpen = addContracts || source.fromFolder || emailRequired;

  return (
    <div className="action-form__step">
      {contextHolder}

      <div className="action-form__step-head">
        <h3 className="action-form__step-title">Documents to sign</h3>
        {!source.fromFolder && !emailRequired && (
          <GrayButtonComponent
            size="sm"
            title={addContracts ? "Don't attach documents" : "Attach documents"}
            buttonType="button"
            disabled={loadingStatus}
            func={() => setAddContracts(!addContracts)}
          />
        )}
      </div>

      {emailRequired && (
        <p className="action-form__banner action-form__banner--warning">
          <strong>This notice cannot be turned off.</strong> The member is under
          13, so their {recipientLabel} is emailed a copy of this handover.
          Anything attached below is included.
        </p>
      )}

      {source.fromFolder && (
        <p className="action-form__step-note">
          Using the documents pinned to this company&apos;s
          equipment-assignment folder.
        </p>
      )}

      {!isOpen && (
        <p className="action-form__step-note">
          No documents will be sent with this handover.
        </p>
      )}

      {isOpen && (
        <>
          <dl className="action-form__summary">
            <div>
              <dt>Contract goes to</dt>
              <dd>{recipientEmail || "No email on file"}</dd>
            </div>
            <div>
              <dt>Attached</dt>
              <dd>{selectedDocuments.length}</dd>
            </div>
          </dl>

          {isLoading ? (
            <ProfileSkeleton lines={2} />
          ) : (
            <>
              {!source.fromFolder && (
                <div className="action-form__field">
                  <Label>Pick from the company library</Label>
                  <Select
                    mode="multiple"
                    style={{ width: "100%" }}
                    placeholder="Search documents"
                    disabled={loadingStatus}
                    optionFilterProp="label"
                    value={selectedDocuments.map((doc) => doc.id)}
                    onChange={(ids) =>
                      setSelectedDocuments(
                        ids
                          .map((id) =>
                            source.documents.find((doc) => doc.id === id)
                          )
                          .filter(Boolean)
                      )
                    }
                    options={source.documents.map((doc) => ({
                      label: doc.title,
                      value: doc.id,
                    }))}
                  />
                  <p className="action-form__step-note">
                    Only documents already uploaded to the company library can be
                    emailed.
                  </p>
                </div>
              )}

              {selectedDocuments.length === 0 ? (
                <p className="action-form__empty">
                  Nothing attached yet.
                </p>
              ) : (
                <ul className="action-form__picked">
                  {selectedDocuments.map((doc) => (
                    <li key={doc.id}>
                      <span>{doc.title}</span>
                      <TextLink onClick={() => openDocument(doc.id)}>
                        Preview
                      </TextLink>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
};

ContractDocumentsPicker.propTypes = {
  addContracts: PropTypes.bool,
  setAddContracts: PropTypes.func.isRequired,
  loadingStatus: PropTypes.bool,
  selectedDocuments: PropTypes.array.isRequired,
  setSelectedDocuments: PropTypes.func.isRequired,
  /** Who signs — the member, or their representative when they are a minor. */
  recipientEmail: PropTypes.string,
  recipientLabel: PropTypes.string,
  /** Under 13: the email is sent regardless, so no toggle is offered. */
  emailRequired: PropTypes.bool,
};

export default ContractDocumentsPicker;
