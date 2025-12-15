import { DndContext, useDraggable, useDroppable } from "@dnd-kit/core";
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

const FormDocuments = () => {
  // eslint-disable-next-line no-unused-vars
  const { eventInfoDetail } = useSelector((state) => state.event);
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

  // Helper: docs not yet assigned
  const unassignedDocs =
    availableDocuments?.data?.documents?.filter(
      (doc) => !dataToDisplay.some((assigned) => assigned.id === doc._id)
    ) || [];

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

  // Drag-and-drop item: available document
  const DraggableDocument = ({ doc }) => {
    const { attributes, listeners, setNodeRef, transform, isDragging } =
      useDraggable({
        id: doc._id,
      });

    const style = {
      transform: transform
        ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
        : undefined,
      background: isDragging ? "#e0f2fe" : "#f9fafb",
      border: "1px solid #e5e7eb",
      borderRadius: "6px",
      padding: "10px",
      cursor: "grab",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        title="Drag to assign"
      >
        <span style={{ marginRight: "8px" }}>{doc.title}</span>
        <span style={{ fontSize: "12px", color: "#6b7280" }}>{doc._id}</span>
      </div>
    );
  };

  // Drop zone: assigned list
  const AssignedDropZone = ({ children }) => {
    const { isOver, setNodeRef } = useDroppable({
      id: "assigned-dropzone",
    });
    return (
      <Box
        ref={setNodeRef}
        sx={{
          border: `2px dashed ${isOver ? "#2563eb" : "#cbd5e1"}`,
          backgroundColor: isOver ? "#eff6ff" : "#fafafa",
          transition: "all 160ms ease",
          borderRadius: "8px",
          padding: "12px",
          minHeight: "260px",
        }}
      >
        {children}
      </Box>
    );
  };

  // Handle drop to assign
  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || over.id !== "assigned-dropzone") return;

    const droppedId = active.id;
    const doc = availableDocuments?.data?.documents?.find(
      (d) => d._id === droppedId
    );
    if (!doc) {
      message.error("Document not found");
      return;
    }
    const alreadyAssigned = dataToDisplay.some((d) => d.id === doc._id);
    if (alreadyAssigned) {
      message.info("Document already assigned");
      return;
    }
    const newDoc = {
      id: doc._id,
      title: doc.title,
      view_url: doc.document_url,
    };
    setDataToDisplay((prev) => [...prev, newDoc]);
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

  const nextStep = () => {
    // Update the store with all assigned documents
    dispatch(
      onAddEventInfoDetail({
        ...eventInfoDetail,
        legal_documents_list: dataToDisplay,
      })
    );
    if (dataToDisplay.length > 0) {
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
      <Tooltip title="Drag a document from the left and drop it into the right panel to assign it to this event.">
        <Typography variant="subtitle1" sx={{ mb: 2 }}>
          Available documents (drag) → Assigned/added documents (drop):{" "}
          <QuestionIcon />
        </Typography>
      </Tooltip>
      <DndContext onDragEnd={handleDragEnd}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 2,
            alignItems: "start",
          }}
        >
          {/* Available documents (draggable list) */}
          <Box
            sx={{
              border: "1px solid #e5e7eb",
              borderRadius: "8px",
              padding: "12px",
              minHeight: "260px",
              backgroundColor: "#fff",
            }}
          >
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Available documents ({unassignedDocs.length})
            </Typography>
            <Box sx={{ display: "grid", gap: 1 }}>
              {loadingAvailable ? (
                <Typography>Loading...</Typography>
              ) : unassignedDocs.length === 0 ? (
                <Typography>No documents available</Typography>
              ) : (
                unassignedDocs.map((doc) => (
                  <DraggableDocument key={doc._id} doc={doc} />
                ))
              )}
            </Box>
          </Box>

          {/* Drop zone + assigned preview */}
          <AssignedDropZone>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>
              Drop here to assign ({dataToDisplay.length})
            </Typography>
            <Table
              size="small"
              columns={assignedColumns}
              dataSource={dataToDisplay || []}
              rowKey="id"
              pagination={false}
            />
          </AssignedDropZone>
        </Box>
      </DndContext>
      {activeTab === "1" ? (
        <BlueButtonComponent
          title="Add new Document"
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
