import { Box, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { message, Table, Tooltip } from "antd";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import DocumentUpload from "../../../../components/documents/DocumentUpload";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import { onAddEventInfoDetail } from "../../../../store/slices/eventSlice";
import DocumentAssignmentBoard from "./DocumentAssignmentBoard";
import { assignDocument, unassignedDocuments } from "./utils/documentAssignment";

const FormDocuments = () => {
  // eslint-disable-next-line no-unused-vars
  const { eventInfoDetail, event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  // const [activeTab, setActiveTab] = useState(1);
  // const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [dataToDisplay, setDataToDisplay] = useState(
    eventInfoDetail.legal_documents_list || []
  );
  const [activeTab, setActiveTab] = useState("1");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch available documents
  const {
    data: availableDocuments,
    isLoading: loadingAvailable,
    refetch,
  } = useQuery({
    queryKey: ["available-documents"],
    queryFn: () =>
      devitrakApi.get(`/document/?company_id=${user.companyData.id}`),
    enabled: !!user.companyData.id,
  });

  // Initialize dataToDisplay with existing documents from store
  useEffect(() => {
    if (eventInfoDetail.legal_documents_list) {
      setDataToDisplay(eventInfoDetail.legal_documents_list);
    }
  }, [eventInfoDetail.legal_documents_list]);

  const unassignedDocs = unassignedDocuments(
    availableDocuments?.data?.documents,
    dataToDisplay
  );

  const handleRemoveDocument = (documentId) => {
    const updatedList = dataToDisplay.filter((doc) => doc.id !== documentId);
    setDataToDisplay(updatedList);
    message.success("Document removed successfully");
  };

  const downloadDocument = async (id) => {
    try {
      const { data } = await devitrakApi.get(
        `/document/download/${id}/${user.uid}`
      );
      if (!data?.ok || !data?.downloadUrl) {
        throw new Error("Invalid or missing download URL");
      }
      window.open(data.downloadUrl, "_blank");
      return message.success("Document displayed successfully");
    } catch (error) {
      message.error("Failed to download document");
      throw new Error(error);
    }
  };

  // Dragging and the Assign button both land here.
  const handleAssign = (doc) => {
    const { list, outcome } = assignDocument(dataToDisplay, doc);
    if (outcome === "missing") return message.error("Document not found");
    if (outcome === "duplicate") return message.info("Document already assigned");
    if (outcome === "expired") return message.warning("That document has expired and cannot be assigned.");
    setDataToDisplay(list);
    message.success(`"${doc.title}" assigned successfully`);
  };

  const assignedColumns = [
    {
      title: "Document Name",
      dataIndex: "title",
      key: "title",
      width: "100%",
    },
    {
      title: "Document ID",
      dataIndex: "id",
      key: "id",
      render: (id) => (
        <span
          style={{
            width: "100%",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            overflow: "hidden",
          }}
        >
          {id}
        </span>
      ),
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
            loadingState={false}
          />
        </div>
      ),
    },
  ];

  const nextStep = async () => {
    // Update the store with all assigned documents
    dispatch(
      onAddEventInfoDetail({
        ...eventInfoDetail,
        legal_documents_list: dataToDisplay,
      })
    );
    // Update the event document list
    if (dataToDisplay.length > 0) {
      await devitrakApi.patch(`/event/edit-event/${event.idNoSQl}`, {
        legal_contract: dataToDisplay.length > 0,
        legal_documents_list: dataToDisplay,
      });
      message.success("Documents updated successfully");
    }
    // Navigate to next step or perform next action
    return navigate(`/create-event-page/device-detail`);
  };

  const uxNavigation = () => {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: "10px",
          marginTop: "1rem",
        }}
      >
        <GrayButtonComponent
          title={`Go to staff detail`}
          styles={{ width: "100%" }}
          func={() => navigate(`/create-event-page/staff-detail`)}
          loadingState={false}
        />
        <BlueButtonComponent
          title={`Next Step`}
          styles={{ width: "100%" }}
          func={nextStep}
          loadingState={false}
        />
      </div>
    );
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Tooltip title="Drag a document from the left and drop it into the right panel, or use Assign. Files from your computer are added with “Upload a new document”.">
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Documents for this event <QuestionIcon />
        </Typography>
      </Tooltip>
      <DocumentAssignmentBoard
        available={unassignedDocs}
        assigned={dataToDisplay}
        loading={loadingAvailable}
        onAssign={handleAssign}
        assignedTable={
          <Table
            size="small"
            columns={assignedColumns}
            dataSource={dataToDisplay || []}
            rowKey="id"
            pagination={false}
          />
        }
      />
      {activeTab === "1" ? (
        <BlueButtonComponent
          title="Upload a new document"
          func={() => setActiveTab("2")}
          styles={{ width: "100%", margin: "1rem 0" }}
        />
      ) : (
        <GrayButtonComponent
          title="Back to assigned documents"
          func={() => setActiveTab("1")}
          styles={{ width: "100%", margin: "1rem 0" }}
        />
      )}{" "}
      {activeTab === "2" && (
        <DocumentUpload activeTab={setActiveTab} refetch={refetch} />
      )}
      {uxNavigation()}
    </Box>
  );
};

export default FormDocuments;
