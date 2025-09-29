import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { message, Select, Table, Tooltip, Tabs } from "antd";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import { Box, Typography } from "@mui/material";
import {
  onAddEventInfoDetail,
} from "../../../../store/slices/eventSlice";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import { useNavigate } from "react-router-dom";

const FormDocuments = () => {
  // eslint-disable-next-line no-unused-vars
  const { eventInfoDetail, eventSettingUpProcess } = useSelector((state) => state.event);
  // console.log(eventSettingUpProcess);
  const { user } = useSelector((state) => state.admin);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [dataToDisplay, setDataToDisplay] = useState(
    eventInfoDetail.legal_documents_list || []
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // Fetch available documents
  const { data: availableDocuments, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-documents"],
    queryFn: () =>
      devitrakApi.get(`/document/?company_id=${user.companyData.id}`),
  });

  // Initialize dataToDisplay with existing documents from store
  useEffect(() => {
    if (eventInfoDetail.legal_documents_list) {
      setDataToDisplay(eventInfoDetail.legal_documents_list);
    }
  }, [eventInfoDetail.legal_documents_list]);

  const handleRemoveDocument = (documentId) => {
    const updatedList = dataToDisplay.filter((doc) => doc.id !== documentId);
    setDataToDisplay(updatedList);
    message.success("Document removed successfully");
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
      ...dataToDisplay,
      ...newDocuments.filter(
        (newDoc) =>
          !dataToDisplay.some(
            (existingDoc) => existingDoc.id === newDoc.id
          )
      ),
    ];

    setDataToDisplay(updatedList);
    setSelectedDocuments([]); // Clear selection after assignment
    setActiveTab(0); // Switch to assigned documents tab
    message.success(`${newDocuments.length} document(s) assigned successfully`);
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
            loadingState={false}
          />
        </div>
      ),
    },
  ];

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

  // Filter out already assigned documents from the select options
  const availableOptions = availableDocuments?.data?.documents
    ?.filter(
      (doc) => !dataToDisplay.some((assigned) => assigned.id === doc._id)
    )
    ?.map((doc) => ({
      label: doc.title,
      value: doc._id,
    })) || [];

  const nextStep = () => {
    // Update the store with all assigned documents
    dispatch(
      onAddEventInfoDetail({
        ...eventInfoDetail,
        legal_documents_list: dataToDisplay,
      })
    );
    
    message.success("Documents updated successfully");
    // Navigate to next step or perform next action
    return navigate(`/create-event-page/device-detail`);
  };

  return (
    <Box sx={{ width: "100%" }}>
      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
        <Tabs
          activeKey={activeTab.toString()}
          onChange={(key) => {
            setActiveTab(Number(key));
          }}
          items={items}
        />
      </Box>

      {activeTab === 0 ? (
        // Assigned Documents Tab
        <Box>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Assigned Documents ({dataToDisplay.length})
          </Typography>
          <Table
            columns={assignedColumns}
            dataSource={dataToDisplay || []}
            rowKey="id"
            pagination={false}
          />
        </Box>
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
            options={availableOptions}
          />
          <BlueButtonComponent
            title={`Assign Selected Documents (${selectedDocuments.length})`}
            styles={{ width: "100%", marginBottom: "1rem" }}
            func={handleAssignDocuments}
            loadingState={false}
            disabled={selectedDocuments.length === 0}
          />
        </Box>
      )}
      
      <div
        style={{
          display: activeTab === 1 ? "none" : "flex",
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
    </Box>
  );
};

export default FormDocuments;
