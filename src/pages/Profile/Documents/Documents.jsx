import { message, Spin } from "antd";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";
import DocumentCard from "./DocumentCard";
import DocumentUpload from "../../../components/documents/DocumentUpload";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import Header from "../components/Header";
import "./Documents.css";
import EmptyState from "../../../components/UX/emptyState/EmptyState";
import FolderDialog from "./FolderDialog";
import FilterBar from "../../../components/UX/filterBar/FilterBar";
import { buildUsesForOptions } from "../../../components/documents/utils/documentUploadForm";
import {
  FOLDER_TRIGGER_ACTIONS,
  emptyFolderForm,
  folderFormFromRecord,
  triggerActionOption,
} from "./utils/folderForm";
import {
  documentUseCounts,
  filterDocuments,
  groupDocumentsByUse,
  groupFoldersByTrigger,
  isExpiredDocument,
} from "./utils/documentLibrary";

const Documents = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFolderDialog, setOpenFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState(emptyFolderForm());
  // "all", "expired", "other" or a use id — see documentLibrary.js.
  const [documentFilter, setDocumentFilter] = useState("all");
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();

  /* useCallback so the mount effect can declare them as dependencies. The
     `[]` deps were a pre-existing lint failure in this file. */
  const fetchDocuments = useCallback(async () => {
    try {
      const response = await devitrakApi.get(
        `/document/?company_id=${user?.companyData?.id}`
      );
      setDocuments(response?.data?.documents ?? []);
    } catch (error) {
      setDocuments([]);
      message.error("Failed to load documents. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, [user?.companyData?.id]);

  const fetchFolders = useCallback(async () => {
    try {
      const response = await devitrakApi.post(`/document/folders`, {
        company_id: user?.companyData?.id,
      });
      setFolders(response?.data?.folders ?? []);
    } catch (error) {
      setFolders([]);
      // A company with no folders yet isn't a failure — the backend
      // returns 404 for "none exist", not an empty 200 list. Only
      // surface a notification for genuine failures (network/5xx).
      if (error?.response?.status !== 404) {
        message.error("Failed to load document folders. Please try again later.");
      }
    }
  }, [user?.companyData?.id]);

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, [fetchDocuments, fetchFolders]);

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderForm(emptyFolderForm());
    setOpenFolderDialog(true);
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm(folderFormFromRecord(folder));
    setOpenFolderDialog(true);
  };

  /* The write lives in FolderDialog now, which is also where the validation
     and the per-field messages are. This is only what happens afterwards. */
  const handleFolderSaved = (outcome, folderName) => {
    message.success(`${folderName} was ${outcome}.`);
    queryClient.invalidateQueries({ queryKey: ["folders", user?.companyData?.id] });
    fetchFolders();
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await devitrakApi.delete(`/document/folder/${folderId}`);
      message.success("Folder deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["folders", user?.companyData?.id] });
      fetchFolders();
    } catch (error) {
      message.error("Failed to delete folder");
    }
  };

  const renderDocumentContent = () => {
    if (loading) {
      return (
        <div style={{ display: "flex", justifyContent: "center", padding: "48px 0" }}>
          <Spin size="large" />
        </div>
      );
    }

    if (documents.length === 0) {
      return (
        <EmptyState
          icon="tabler:file-text"
          title="No documents yet"
          description="Upload your first document to share policies, waivers and agreements with staff and consumers."
          action={
            <BlueButtonComponent
              title="Upload document"
              func={() => handleTabChange("2")}
            />
          }
        />
      );
    }

    // By what each document is for (D1 + D2). `trigger_action` was always on
    // the record; the list ignored it and showed everything flat.
    const uses = buildUsesForOptions(user?.companyData?.industry);
    const counts = documentUseCounts(documents, uses);
    const tabs = [
      { key: "all", label: `All (${counts.all})` },
      ...uses
        .filter((use) => counts[use.id] > 0)
        .map((use) => ({ key: use.id, label: `${use.label} (${counts[use.id]})` })),
      counts.other > 0 && { key: "other", label: `Other (${counts.other})` },
      counts.expired > 0 && { key: "expired", label: `Expired (${counts.expired})` },
    ].filter(Boolean);
    const filter = tabs.some((tab) => tab.key === documentFilter) ? documentFilter : "all";

    const grid = (list) => (
      <div className="document-grid">
        {list.map((doc) => (
          <DocumentCard doc={doc} key={doc._id} />
        ))}
      </div>
    );

    return (
      <div className="document-library">
        <FilterBar tabs={tabs} activeTab={filter} onTabChange={setDocumentFilter} />
        {filter === "all"
          ? groupDocumentsByUse(documents, uses).map((group) => (
              <section className="document-group" key={group.id}>
                <h3 className="document-group__title">
                  {group.label}
                  <span className="document-group__count">
                    {group.documents.length}
                    {group.expiredCount > 0 ? ` · ${group.expiredCount} expired` : ""}
                  </span>
                </h3>
                {grid(group.documents)}
              </section>
            ))
          : grid(filterDocuments(documents, filter, new Date(), uses))}
      </div>
    );
  };

  const renderFolderContent = () => {
    return (
      <div className="folders-section">
        <div className="folders-header">
          <h3>Document Folders</h3>
          <BlueButtonComponent
            title={"Create Folder"}
            func={handleCreateFolder}
          />
        </div>

        {folders.length === 0 && (
          <EmptyState
            icon="tabler:folder"
            title="No folders yet"
            description="Group documents into folders and attach them to actions like staff onboarding or consumer checkout."
            action={
              <BlueButtonComponent
                title="Create folder"
                func={handleCreateFolder}
              />
            }
          />
        )}

        {/* By the action each folder is shown at (D2). */}
        {groupFoldersByTrigger(folders, FOLDER_TRIGGER_ACTIONS).map((group) => (
        <section className="document-group" key={group.id}>
        <h3 className="document-group__title">
          {group.label}
          <span className="document-group__count">{group.folders.length}</span>
        </h3>
        <div className="folder-grid">
          {group.folders.map((folder) => (
            <div
              className="folder-card"
              key={folder.folder_id || folder._id || folder.folder_name}
            >
              <div className="folder-card-main">
                <h3>{folder.folder_name || folder.name}</h3>
                <p>{folder.folder_description || folder.description}</p>
                <p>
                  Used at:{" "}
                  {triggerActionOption(
                    folder.trigger_action || folder.folder_trigger_action
                  )?.label ?? "Not set"}
                </p>
                <p>Documents: {folder.documents?.length || 0}</p>

                {folder.documents && folder.documents.length > 0 && (
                  <div className="folder-card-docs">
                    <strong>Documents in folder:</strong>
                    <div className="tags-container">
                      {folder.documents.slice(0, 3).map((folderDoc) => {
                        const doc = documents.find(
                          (d) => d._id === folderDoc.document_id
                        );
                        if (!doc) return null;
                        // Kept in the folder, but no screen hands it out (2b.8).
                        const expired = isExpiredDocument(doc);
                        return (
                          <span
                            key={folderDoc.document_id}
                            className={`tag ${folderDoc.active && !expired ? "active" : ""} ${
                              expired ? "expired" : ""
                            }`}
                          >
                            {folderDoc.document_name || doc.title}
                            {expired ? " · Expired" : ""}
                          </span>
                        );
                      })}
                      {folder.documents.length > 3 && (
                        <span className="tag">
                          +{folder.documents.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="folder-card-footer">
                <BlueButtonComponent
                  title={`View`}
                  func={() => handleEditFolder(folder)}
                />
                <DangerButtonConfirmationComponent
                  title={`Delete`}
                  func={() => handleDeleteFolder(folder.folder_id || folder._id)}
                  confirmationTitle="Are you sure you want to delete this folder?. This action cannot be undone."
                />
              </div>
            </div>
          ))}
        </div>
        </section>
        ))}
      </div>
    );
  };

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === "1") {
      fetchDocuments();
    } else if (key === "3") {
      fetchFolders();
    }
  };


  return (
    <div className="documents-container">
      <Header
        title={"Documents"}
        description={"Upload and manage documents and folders."}
      />
      <div className="tabs-container">
        <div className="tabs-header">
          <div
            className={`tab-item ${activeTab === "1" ? "active" : ""}`}
            onClick={() => handleTabChange("1")}
          >
            All Documents
          </div>
          <div
            className={`tab-item ${activeTab === "2" ? "active" : ""}`}
            onClick={() => handleTabChange("2")}
          >
            Upload Document
          </div>
          <div
            className={`tab-item ${activeTab === "3" ? "active" : ""}`}
            onClick={() => handleTabChange("3")}
          >
            Document Folders
          </div>
        </div>
        <div className="tab-content">
          {activeTab === "1" && renderDocumentContent()}
          {activeTab === "2" && (
            <DocumentUpload activeTab={setActiveTab} refetch={fetchDocuments} />
          )}
          {activeTab === "3" && renderFolderContent()}
        </div>
      </div>

      {openFolderDialog && (
        <FolderDialog
          open={openFolderDialog}
          onClose={() => setOpenFolderDialog(false)}
          folderForm={folderForm}
          setFolderForm={setFolderForm}
          editingFolder={editingFolder}
          documents={documents}
          companyId={user?.companyData?.id}
          onSaved={handleFolderSaved}
        />
      )}
    </div>
  );
};

export default Documents;
