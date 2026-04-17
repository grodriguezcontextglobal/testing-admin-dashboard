import { message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useQueryClient } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";
import DocumentCard from "./DocumentCard";
import DocumentUpload from "../../../components/documents/DocumentUpload";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import Header from "../components/Header";
import MultiSelectComponent from "../../../components/UX/dropdown/MultiSelectComponent";
import SelectComponent from "../../../components/UX/dropdown/SelectComponent";
import "./Documents.css";
import Chip from "../../../components/UX/Chip/Chip";

const Documents = () => {
  const [activeTab, setActiveTab] = useState("1");
  const [documents, setDocuments] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openFolderDialog, setOpenFolderDialog] = useState(false);
  const [editingFolder, setEditingFolder] = useState(null);
  const [folderForm, setFolderForm] = useState({
    folder_name: "",
    trigger_action: "",
    folder_description: "",
    documents: [],
  });
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const { user } = useSelector((state) => state.admin);
  const queryClient = useQueryClient();
  const triggerActions = [
    { value: "equipment_assignment", label: "Equipment Assignment to Staff" },
    { value: "consumer_checkout", label: "Consumer Device Checkout" },
    { value: "event_registration", label: "Event Registration" },
    { value: "staff_onboarding", label: "Staff Onboarding" },
    { value: "custom", label: "Custom Action" },
  ];

  const fetchDocuments = async () => {
    try {
      const response = await devitrakApi.get(
        `/document/?company_id=${user.companyData.id}`
      );
      setDocuments(response.data.documents);
    } catch (error) {
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchFolders = async () => {
    try {
      const response = await devitrakApi.post(`/document/folders`, {
        company_id: user.companyData.id,
      });
      setFolders(response.data.folders || []);
    } catch (error) {
      setFolders([]);
    }
  };

  useEffect(() => {
    fetchDocuments();
    fetchFolders();
  }, []);

  const handleCreateFolder = () => {
    setEditingFolder(null);
    setFolderForm({
      folder_name: "",
      trigger_action: "",
      folder_description: "",
      documents: [],
    });
    setSelectedDocuments([]);
    setOpenFolderDialog(true);
  };

  const handleEditFolder = (folder) => {
    setEditingFolder(folder);
    setFolderForm({
      folder_name: folder.folder_name || folder.name || "",
      trigger_action: folder.trigger_action,
      folder_description: folder.folder_description || folder.description || "",
      documents: folder.documents || [],
    });
    setSelectedDocuments([]);
    setOpenFolderDialog(true);
  };

  const handleSaveFolder = async () => {
    if (!folderForm.folder_name || !folderForm.trigger_action) {
      return message.error("Please fill all required fields.");
    }
    try {
      const folderData = {
        ...folderForm,
        company_id: user.companyData.id,
      };

      if (editingFolder) {
        await devitrakApi.put(
          `/document/folder/${editingFolder.folder_id}`,
          folderData
        );
        message.success("Folder updated successfully");
      } else {
        await devitrakApi.post("/document/new_folder", folderData);
        queryClient.invalidateQueries(["folders", user.companyData.id]);
        message.success("Folder created successfully");
      }

      setOpenFolderDialog(false);
      setSelectedDocuments([]);
      fetchFolders();
    } catch (error) {
      message.error("Failed to save folder");
    }
  };

  const handleDeleteFolder = async (folderId) => {
    try {
      await devitrakApi.delete(`/document/folder/${folderId}`);
      message.success("Folder deleted successfully");
      queryClient.invalidateQueries(["folders", user.companyData.id]);
      fetchFolders();
    } catch (error) {
      message.error("Failed to delete folder");
    }
  };

  const handleRemoveDocumentFromFolder = (documentId) => {
    setFolderForm({
      ...folderForm,
      documents: folderForm.documents.filter(
        (doc) => doc.document_id !== documentId
      ),
    });
  };

  const onChangeDocuments = (selectedValues) => {
    setSelectedDocuments(selectedValues);
  };

  const handleAddSelectedDocuments = () => {
    const newDocuments = selectedDocuments
      .filter(
        (docId) =>
          !folderForm.documents.some((doc) => doc.document_id === docId)
      )
      .map((docId) => {
        const document = documents.find((doc) => doc._id === docId);
        return {
          document_name: document.title,
          active: true,
          document_id: docId,
        };
      });

    if (newDocuments.length > 0) {
      setFolderForm({
        ...folderForm,
        documents: [...folderForm.documents, ...newDocuments],
      });
      setSelectedDocuments([]);
      message.success(`Added ${newDocuments.length} document(s) to folder`);
    } else {
      message.info("Selected documents are already in the folder");
    }
  };

  const getFolderDocuments = () => {
    return folderForm.documents
      .map((folderDoc) => {
        const doc = documents.find((d) => d._id === folderDoc.document_id);
        return doc
          ? {
            ...doc,
            active: folderDoc.active,
            document_name: folderDoc.document_name,
          }
          : null;
      })
      .filter(Boolean);
  };

  const getAvailableDocuments = () => {
    return documents.filter(
      (doc) =>
        !folderForm.documents.some(
          (folderDoc) => folderDoc.document_id === doc._id
        )
    );
  };

  const renderDocumentContent = () => {
    if (loading) {
      return <p>Loading documents...</p>;
    }

    if (documents.length === 0) {
      return <p>No documents found</p>;
    }

    return (
      <div className="document-grid">
        {documents.map((doc) => (
          <DocumentCard doc={doc} key={doc._id} />
        ))}
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

        <div className="folder-grid">
          {folders.map((folder) => (
            <div className="folder-card" key={folder.folder_id}>
              <div className="folder-card-main">
                <h3>{folder.folder_name || folder.name}</h3>
                <p>{folder.folder_description || folder.description}</p>
                <p>
                  Trigger:{" "}
                  {triggerActions.find(
                    (t) => t.value === folder.folder_trigger_action
                  )?.label || folder.folder_trigger_action}
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
                        return doc ? (
                          <span
                            key={folderDoc.document_id}
                            className={`tag ${folderDoc.active ? "active" : ""
                              }`}
                          >
                            {folderDoc.document_name || doc.title}
                          </span>
                        ) : null;
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
                  func={() => handleDeleteFolder(folder.folder_id)}
                  confirmationTitle="Are you sure you want to delete this folder?. This action cannot be undone."
                />
              </div>
            </div>
          ))}
        </div>
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

  const availableOptionsForMultiSelect = getAvailableDocuments().map((doc) => ({
    id: doc._id,
    label: doc.title,
  }));

  const selectedDocumentsSet = new Set(selectedDocuments);

  const handleSelectionChange = (newSelection) => {
    onChangeDocuments(Array.from(newSelection));
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
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>
                {editingFolder ? "Edit Folder" : "Create New Folder"}
              </h3>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Folder Name*</label>
                <input
                  type="text"
                  className="form-input"
                  value={folderForm.folder_name}
                  onChange={(e) =>
                    setFolderForm({
                      ...folderForm,
                      folder_name: e.target.value,
                    })
                  }
                  placeholder="Folder Name"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Folder description*</label>
                <textarea
                  className="form-textarea"
                  placeholder="Description"
                  value={folderForm.folder_description}
                  onChange={(e) =>
                    setFolderForm({
                      ...folderForm,
                      folder_description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="form-group">
                <label className="form-label">Trigger Action*</label>
                <SelectComponent
                  placeholder="Where to use this folder"
                  value={folderForm.trigger_action}
                  onSelect={(item) => {
                    console.log(item)
                    return setFolderForm({
                      ...folderForm,
                      trigger_action: item.value,
                    })
                  }
                  }
                  items={triggerActions}
                />
              </div>

              <div>
                <div className="form-group">
                  <label className="form-label">
                    Documents in folder ({folderForm.documents.length})
                  </label>
                  <div className="documents-in-folder">
                    {folderForm.documents.length === 0 ? (
                      <p>No documents in folder</p>
                    ) : (
                      getFolderDocuments().map((doc) => (
                        <Chip
                          key={doc._id}
                          label={doc.document_name || doc.title}
                          color={doc.active ? "success" : "default"}
                          onDelete={() => handleRemoveDocumentFromFolder(doc._id)}
                        />
                      ))
                    )}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">
                    Add Documents to Folder
                  </label>
                  <div className="document-selection-container">
                    <MultiSelectComponent
                      placeholder="Select documents to add"
                      selectedKeys={selectedDocumentsSet}
                      onSelectionChange={handleSelectionChange}
                      items={availableOptionsForMultiSelect}
                      disabled={availableOptionsForMultiSelect.length === 0}
                    />
                    <BlueButtonComponent
                      title={`Add (${selectedDocuments.length})`}
                      func={handleAddSelectedDocuments}
                      disabled={selectedDocuments.length === 0}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <DangerButtonComponent
                title={"Cancel"}
                func={() => {
                  setOpenFolderDialog(false);
                  setSelectedDocuments([]);
                }}
              />
              <BlueButtonComponent
                title={editingFolder ? "Update" : "Create"}
                func={handleSaveFolder}
                disabled={!folderForm.folder_name || !folderForm.trigger_action}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Documents;
