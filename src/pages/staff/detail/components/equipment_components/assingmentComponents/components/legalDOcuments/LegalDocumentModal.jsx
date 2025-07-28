import {
  Box,
  InputLabel,
  OutlinedInput,
  Switch,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, message, Select, Table, Tabs, Tooltip } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../../../components/UX/buttons/BlueButton";
import { QuestionIcon } from "../../../../../../../../components/icons/QuestionIcon";
import { OutlinedInputStyle } from "../../../../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../../../../styles/global/Subtitle";

const LegalDocumentModal = ({
  addContracts,
  setAddContracts,
  setValue,
  register,
  loadingStatus,
  profile,
  selectedDocuments,
  setSelectedDocuments,
}) => {
  const [activeTab, setActiveTab] = useState(0);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);

  // Fetch available documents
  const { data: availableDocuments, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-documents"],
    queryFn: () =>
      devitrakApi.get(`/document/?company_id=${user.companyData.id}`),
  });

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
    setSelectedDocuments(newDocuments);
    return setActiveTab(0);
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
            title={"Download"}
            func={() => downloadDocument(record.id)}
            styles={{
              width: "fit-content",
              justifyContent: "center",
              alignItems: "center",
              gap: "5px",
            }}
            titleStyles={{
              textTransform: "none",
            }}
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

  return (
    <>
      <Divider />
      <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
        <p style={Subtitle}>
          Do you want to email a device liability contract to staff?{" "}
          <Switch onChange={() => setAddContracts(!addContracts)} />
        </p>
      </InputLabel>
      {addContracts && (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
            <p style={Subtitle}>Email address</p>
          </InputLabel>
          <OutlinedInput
            {...register("emailContract")}
            disabled={loadingStatus}
            value={setValue("emailContract", `${profile.email}`)}
            style={{
              ...OutlinedInputStyle,
              width: "100%",
            }}
            placeholder="e.g. john@example.com"
            fullWidth
          />

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
                dataSource={selectedDocuments}
                rowKey="id"
              />
            ) : (
              <Box>
                <Tooltip title="All documents must be uploaded to the company's document library before they can be emaile to staff member.">
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Select documents to email to staff member <QuestionIcon />
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
                <BlueButtonComponent
                  title={"Assign Selected Documents"}
                  func={handleAssignDocuments}
                />
              </Box>
            )}
          </Box>
        </div>
      )}
    </>
  );
};

export default LegalDocumentModal;
