import {
  Box,
  Chip,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  InputLabel,
  OutlinedInput,
  Paper,
  Typography,
} from "@mui/material";
import { message, Modal, Select, Tabs } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import DocumentUpload from "../../../components/documents/DocumentUpload";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../components/UX/buttons/DangerButton";
import DangerButtonConfirmationComponent from "../../../components/UX/buttons/DangerButtonConfirmation";
import { OutlinedInputStyle } from "../../../styles/global/OutlinedInputStyle";
import Header from "../components/Header";
import { useQueryClient } from "@tanstack/react-query";

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

  // New function to handle document selection changes
  const onChangeDocuments = (selectedValues) => {
    setSelectedDocuments(selectedValues);
  };

  // New function to add selected documents to folder
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

  // Function to get documents that are in the folder
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

  // Function to get available documents (not in folder)
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
      return <Typography>Loading documents...</Typography>;
    }

    if (documents.length === 0) {
      return <Typography>No documents found</Typography>;
    }

    return (
      <Grid container spacing={2}>
        {documents.map((doc) => (
          <Grid item xs={12} sm={6} md={4} key={doc._id}>
            <Paper
              sx={{
                borderRadius: "12px",
                border: "1px solid var(--gray-200)",
                background: "var(--basewhite)",
                boxShadow:
                  "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
                textAlign: "left",
                padding: 0,
                display: "flex",
                flexDirection: "column",
                gap: 1,
              }}
            >
              <Box sx={{ p: 2 }}>
                <Typography variant="h6" noWrap>
                  {doc.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {doc.description}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  When displayed: {doc.trigger_action}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Type: {doc.document_type}
                </Typography>
              </Box>
              <Box
                sx={{
                  borderTop: "1px solid var(--gray-200)",
                  p: 2,
                  mt: "auto",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <Link
                  to={`/profile/documents/view/${doc._id}`}
                  style={{
                    color: "#004EEB",
                    textDecoration: "none",
                    fontFamily: "Inter",
                    fontSize: "14px",
                    fontWeight: 600,
                    lineHeight: "20px",
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  Document details
                </Link>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
    );
  };

  const renderFolderContent = () => {
    return (
      <Box>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Typography variant="h6">Document Folders</Typography>
          <BlueButtonComponent
            title={"Create Folder"}
            func={handleCreateFolder}
          />
        </Box>

        <Grid container spacing={2}>
          {folders.map((folder) => (
            <Grid item xs={12} sm={6} md={4} lg={4} key={folder.folder_id}>
              <Paper
                sx={{
                  borderRadius: "12px",
                  border: "1px solid var(--gray-200)",
                  background: "var(--basewhite)",
                  boxShadow:
                    "0px 1px 2px 0px rgba(16, 24, 40, 0.06), 0px 1px 3px 0px rgba(16, 24, 40, 0.10)",
                  textAlign: "left",
                  padding: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 1,
                }}
              >
                <Box sx={{ p: 2 }}>
                  <Typography variant="h6" noWrap>
                    {folder.folder_name || folder.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" noWrap>
                    {folder.folder_description || folder.description}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 1 }}
                  >
                    Trigger:{" "}
                    {triggerActions.find(
                      (t) => t.value === folder.folder_trigger_action
                    )?.label || folder.folder_trigger_action}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Documents: {folder.documents?.length || 0}
                  </Typography>

                  {/* Display documents in folder */}
                  {folder.documents && folder.documents.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ fontWeight: "bold" }}
                      >
                        Documents in folder:
                      </Typography>
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 0.5,
                          mt: 0.5,
                        }}
                      >
                        {folder.documents.slice(0, 3).map((folderDoc) => {
                          const doc = documents.find(
                            (d) => d._id === folderDoc.document_id
                          );
                          return doc ? (
                            <Chip
                              key={folderDoc.document_id}
                              label={folderDoc.document_name || doc.title}
                              size="small"
                              variant="outlined"
                              color={folderDoc.active ? "primary" : "default"}
                              sx={{
                                fontSize: "0.7rem",
                                height: "20px",
                                opacity: folderDoc.active ? 1 : 0.6,
                              }}
                            />
                          ) : null;
                        })}
                        {folder.documents.length > 3 && (
                          <Chip
                            label={`+${folder.documents.length - 3} more`}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: "0.7rem", height: "20px" }}
                          />
                        )}
                      </Box>
                    </Box>
                  )}
                </Box>
                <Box
                  sx={{
                    borderTop: "1px solid var(--gray-200)",
                    p: 2,
                    mt: "auto",
                    display: "flex",
                    justifyContent: "flex-end",
                    gap: 1,
                  }}
                >
                  <BlueButtonComponent
                    title={`View`}
                    func={() => handleEditFolder(folder)}
                    loadingState={false}
                  />
                  <DangerButtonConfirmationComponent
                    title={`Delete`}
                    func={() => handleDeleteFolder(folder.folder_id)}
                    confirmationTitle="Are you sure you want to delete this folder?. This action cannot be undone."
                    loadingState={false}
                  />
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

  const items = [
    {
      key: "1",
      label: "All Documents",
      children: <Paper sx={{ p: 2 }}>{renderDocumentContent()}</Paper>,
    },
    {
      key: "2",
      label: "Upload Document",
      children: (
        <DocumentUpload activeTab={setActiveTab} refetch={fetchDocuments} />
      ),
    },
    {
      key: "3",
      label: "Document Folders",
      children: <Paper sx={{ p: 2 }}>{renderFolderContent()}</Paper>,
    },
  ];

  const availableOptions = getAvailableDocuments().map((doc) => ({
    label: doc.title,
    value: doc._id,
  }));

  return (
    <>
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Header
            title={"Documents"}
            description={"Upload and manage documents and folders."}
          />
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(key);
              if (key === "1") {
                fetchDocuments();
              } else if (key === "3") {
                fetchFolders();
              }
            }}
            items={items}
          />
        </Grid>
      </Grid>

      {/* Folder Dialog */}
      <Modal
        open={openFolderDialog}
        onCancel={() => {
          setOpenFolderDialog(false);
          setSelectedDocuments([]);
        }}
        onOk={() => setOpenFolderDialog(false)}
        footer={null}
        width={1000}
      >
        <DialogTitle>
          {editingFolder ? "Edit Folder" : "Create New Folder"}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <InputLabel
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
              }}
            >
              Folder Name
              <OutlinedInput
                value={folderForm.folder_name}
                onChange={(e) =>
                  setFolderForm({ ...folderForm, folder_name: e.target.value })
                }
                fullWidth
                placeholder="Folder Name"
                style={{ ...OutlinedInputStyle }}
              />
            </InputLabel>

            <InputLabel
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
              }}
            >
              Folder description
              <OutlinedInput
                placeholder="Description"
                value={folderForm.folder_description}
                onChange={(e) =>
                  setFolderForm({
                    ...folderForm,
                    folder_description: e.target.value,
                  })
                }
                fullWidth
                multiline
                maxRows={5}
                style={{ ...OutlinedInputStyle }}
              />
            </InputLabel>

            <InputLabel
              style={{
                width: "100%",
                textAlign: "left",
                display: "flex",
                flexDirection: "column",
              }}
            >
              Trigger Action
              <Select
                style={{ width: "100%", marginBottom: "1rem" }}
                placeholder="Where to use this folder"
                value={folderForm.trigger_action}
                onChange={(value) =>
                  setFolderForm({
                    ...folderForm,
                    trigger_action: value,
                  })
                }
                allowClear
                options={triggerActions}
              />
            </InputLabel>

            <Box>
              {/* Documents currently in folder */}
              <InputLabel
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                Documents in folder ({folderForm.documents.length})
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mb: 2,
                    minHeight: "40px",
                    border: "1px solid #d9d9d9",
                    borderRadius: "6px",
                    p: 1,
                  }}
                >
                  {folderForm.documents.length === 0 ? (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ alignSelf: "center" }}
                    >
                      No documents in folder
                    </Typography>
                  ) : (
                    getFolderDocuments().map((doc) => (
                      <Box
                        key={doc._id}
                        sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
                      >
                        <Chip
                          label={doc.document_name || doc.title}
                          onDelete={() =>
                            handleRemoveDocumentFromFolder(doc._id)
                          }
                          color={doc.active ? "primary" : "default"}
                          variant="outlined"
                          sx={{ opacity: doc.active ? 1 : 0.6 }}
                        />
                      </Box>
                    ))
                  )}
                </Box>
              </InputLabel>

              {/* Add documents to folder */}
              <InputLabel
                style={{
                  width: "100%",
                  textAlign: "left",
                  display: "flex",
                  flexDirection: "column",
                }}
              >
                Add Documents to Folder
                <Box
                  sx={{
                    display: "flex",
                    gap: 1,
                    alignItems: "flex-start",
                  }}
                >
                  <Select
                    mode="multiple"
                    style={{ width: "100%", marginBottom: "1rem" }}
                    placeholder="Select documents to add"
                    value={selectedDocuments}
                    onChange={onChangeDocuments}
                    options={availableOptions}
                    optionFilterProp="label"
                    optionLabelProp="label"
                    virtual={true}
                    allowClear
                    disabled={availableOptions.length === 0}
                    notFoundContent={
                      availableOptions.length === 0
                        ? "All documents are already in folder"
                        : "No documents found"
                    }
                  />
                  <BlueButtonComponent
                    title={`Add (${selectedDocuments.length})`}
                    func={handleAddSelectedDocuments}
                    loadingState={false}
                    disabled={selectedDocuments.length === 0}
                  />
                </Box>
              </InputLabel>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <DangerButtonComponent
            title={"Cancel"}
            func={() => {
              setOpenFolderDialog(false);
              setSelectedDocuments([]);
            }}
            loadingState={false}
          />
          <BlueButtonComponent
            title={editingFolder ? "Update" : "Create"}
            func={handleSaveFolder}
            loadingState={false}
            disabled={!folderForm.folder_name || !folderForm.trigger_action}
          />
        </DialogActions>
      </Modal>
    </>
  );
};

export default Documents;
