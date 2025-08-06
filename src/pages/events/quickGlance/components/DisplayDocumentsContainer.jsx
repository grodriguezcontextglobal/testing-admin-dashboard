import { Box, Typography } from "@mui/material";
import { Tabs, Table, Button, Select, message, Modal, Tooltip } from "antd";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { onAddEventData } from "../../../../store/slices/eventSlice";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";

const DisplayDocumentsContainer = ({
  setOpenDisplayDocumentsContainer,
  openDisplayDocumentsContainer,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();

  // Fetch available documents
  const { data: availableDocuments, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-documents"],
    queryFn: () =>
      devitrakApi.get(`/document/?company_id=${user.companyData.id}`),
  });

  // Mutation for updating event documents
  const updateEventDocumentsMutation = useMutation({
    mutationFn: (documentsList) =>
      devitrakApi.patch(`/event/edit-event/${event.id}`, {
        legal_contract: documentsList.length > 0,
        legal_documents_list: documentsList,
      }),
    onSuccess: (response) => {
      dispatch(
        onAddEventData({
          ...event,
          legal_documents_list: response.data.event.legal_documents_list,
        })
      );
      clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );

      message.success("Documents updated successfully");
      setSelectedDocuments([]);
      setActiveTab(0);
    },
    onError: () => {
      message.error("Failed to update documents");
    },
  });

  const handleRemoveDocument = (documentId) => {
    const updatedList = event.legal_documents_list.filter(
      (doc) => doc.id !== documentId
    );
    updateEventDocumentsMutation.mutate(updatedList);
  };

  const handleAssignDocuments = () => {
    if (selectedDocuments.length === 0) {
      message.warning("Please select at least one document");
      return;
    }

    // Get full document objects for selected IDs
    const newDocuments = selectedDocuments.map((_id) => {
      const doc = availableDocuments.data.documents.find((d) => d._id === _id);
      return {
        id: doc._id,
        title: doc.title,
        view_url: doc.document_url,
      };
    });

    // Combine existing and new documents, avoiding duplicates
    const updatedList = [
      ...event.legal_documents_list,
      ...newDocuments.filter(
        (newDoc) =>
          !event.legal_documents_list.some(
            (existingDoc) => existingDoc._id === newDoc._id
          )
      ),
    ];

    updateEventDocumentsMutation.mutate(updatedList);
  };

  const downloadDocument = async (id) => {
    try {
      const { data } = await devitrakApi.get(
        `/document/download/${id}/${user.uid}`
      );
      window.open(data.downloadUrl, "_blank");
      if (!data?.ok || !data?.downloadUrl) {
        throw new Error("Invalid or missing download URL");
      }
      return message.success("Document displayed successfully");
    } catch (error) {
      message.error("Failed to download document");
      throw new Error(error);
    }
  };

  const assignedColumns = [
    {
      title: "Document ID",
      dataIndex: "id",
      key: "id",
    },
    {
      title: "Document Name",
      dataIndex: "title",
      key: "title",
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <div style={{ display: "flex", gap: "10px" }}>
          <BlueButtonComponent
            title={`View`}
            func={() => downloadDocument(record.id)}
            loadingState={false}
          />
          <DangerButtonComponent
            title={`Remove`}
            func={() => handleRemoveDocument(record.id)}
            loadingState={updateEventDocumentsMutation.isLoading}
          />
        </div>
      ),
    },
  ];

  const closeModal = () => {
    setOpenDisplayDocumentsContainer(false);
    setSelectedDocuments([]);
    setActiveTab(0);
  };

  const items = [
    {
      label: "Assigned Documents",
      key: "0",
    },
    {
      label: "Assign Documents",
      key: "1",
    },
  ];

  return (
    <Modal
      open={openDisplayDocumentsContainer}
      title="Documents"
      footer={null}
      centered
      width={1000}
      onCancel={closeModal}
      destroyOnClose
      maskClosable={false}
      onClose={closeModal}
    >
      <Box sx={{ width: "100%" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs
            activeKey={activeTab}
            onChange={(key) => {
              setActiveTab(Number(key));
            }}
            items={items}
          />
        </Box>

        {activeTab === 0 ? (
          // Assigned Documents Tab
          <Table
            columns={assignedColumns}
            dataSource={event.legal_documents_list || []}
            rowKey="id"
          />
        ) : (
          <Box>
            <Tooltip title="All documents must be uploaded to the company's document library before they can be assigned to an event.">
              <Typography variant="subtitle1" sx={{ mb: 2 }}>
                Select documents to assign to this event: <QuestionIcon />
              </Typography>
            </Tooltip>
            <Select
              mode="multiple"
              style={{ width: "100%", marginBottom: "1rem" }}
              placeholder="Select documents to assign"
              value={selectedDocuments}
              onChange={setSelectedDocuments}
              loading={loadingAvailable}
              options={
                availableDocuments?.data?.documents
                  ?.filter(
                    (doc) =>
                      !event.legal_documents_list.some(
                        (assigned) => assigned._id === doc._id
                      )
                  )
                  .map((doc) => ({
                    label: doc.title,
                    value: doc._id,
                  })) || []
              }
            />
            <Button
              type="primary"
              onClick={handleAssignDocuments}
              loading={updateEventDocumentsMutation.isLoading}
            >
              Assign Selected Documents
            </Button>
          </Box>
        )}
      </Box>
    </Modal>
  );
};

export default DisplayDocumentsContainer;
