import { Box, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, message, Select, Table, Tabs, Tooltip } from "antd";
import { useState, useMemo } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../../../../../components/UX/buttons/BlueButton";
import { BorderedCloseIcon } from "../../../../../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../../../../../components/icons/CheckIcon";
import { QuestionIcon } from "../../../../../../../../components/icons/QuestionIcon";
import { BlueButton } from "../../../../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../../../../styles/global/BlueButtonText";
import { GrayButton } from "../../../../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../../../../styles/global/GrayButtonText";
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
  const { user } = useSelector((state) => state.admin);
  const [foldersExisting, setFoldersExisting] = useState(false);
  // Fetch folders first
  const { data: fetchedFolders, isLoading: loadingFolders } = useQuery({
    queryKey: ["folders", user.companyData.id],
    queryFn: () =>
      devitrakApi.post(`/document/folders`, {
        company_id: user.companyData.id,
      }),
    enabled: !!user.companyData.id,
    staleTime: 3 * 60 * 1000,
  });

  // Fetch available documents (fallback)
  const { data: availableDocuments, isLoading: loadingAvailable } = useQuery({
    queryKey: ["available-documents", user.companyData.id],
    queryFn: () =>
      devitrakApi.get(`/document/?company_id=${user.companyData.id}`),
    enabled: !loadingFolders, // Only fetch if folders query is complete
  });

  // Determine which documents to use based on folder availability
  const documentsToUse = useMemo(() => {
    if (loadingFolders || loadingAvailable) {
      return { documents: [], loading: true, source: "loading" };
    }

    // Check if there are folders with trigger_action = "Equipment Staff Assignment"
    const equipmentStaffAssignmentFolders =
      fetchedFolders?.data?.folders?.filter(
        (folder) => folder.trigger_action === "equipment_assignment"
      ) || [];

    // If folders exist and have documents, use folder documents
    if (equipmentStaffAssignmentFolders.length > 0) {
      const folderDocuments = [];
      equipmentStaffAssignmentFolders.forEach((folder) => {
        if (folder.documents && folder.documents.length > 0) {
          folder.documents.forEach((doc) => {
            if (doc.active) {
              // Only include active documents
              folderDocuments.push({
                _id: doc.document_id,
                title: doc.document_name,
                document_url: doc.document_url || "", // Add fallback for URL
              });
            }
          });
        }
      });

      if (folderDocuments.length > 0) {
        setFoldersExisting(true);
        console.log(folderDocuments);
        return {
          documents: folderDocuments,
          loading: false,
          source: "folders",
        };
      }
    }

    // Fallback to all available documents
    return {
      documents: availableDocuments?.data?.documents || [],
      loading: false,
      source: "all_documents",
    };
  }, [fetchedFolders, availableDocuments, loadingFolders, loadingAvailable]);

  const handleAssignDocuments = () => {
    if (selectedDocuments.length === 0) {
      message.warning("Please select at least one document");
      return;
    }

    // Get full document objects for selected IDs
    const newDocuments = selectedDocuments.map((_id) => {
      const doc = documentsToUse.documents.find((d) => d._id === _id);
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

  const buttonContainerStyling = () => {
    let p = {};
    let button = {};
    let fill = null;
    if (addContracts) {
      p = { ...BlueButtonText };
      button = { ...BlueButton };
      fill = "#fff";
    } else {
      p = { ...GrayButtonText };
      button = { ...GrayButton };
      fill = "#000";
    }
    return { p, button, fill };
  };

  const renderingIcon = () => {
    return addContracts ? (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          aspectRatio: "1",
          width: "fit-content",
          height: "auto",
        }}
      >
        <CheckIcon stroke={buttonContainerStyling().fill} />
        &nbsp;
      </div>
    ) : (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          aspectRatio: "1",
          width: "fit-content",
          height: "auto",
        }}
      >
        <BorderedCloseIcon fill={buttonContainerStyling().fill} />
        &nbsp;
      </div>
    );
  };
  return (
    <div key={profile._id} style={{ width: "100%" }} id="legal-document-modal">
      {!foldersExisting && (
        <>
          <Divider />
          <InputLabel
            style={{
              marginBottom: "0.2rem",
              width: "100%",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <p style={Subtitle}>
              Do you want to email a device contract to staff?{" "}
            </p>
            <BlueButtonComponent
              title={"Add legal document"}
              func={() => setAddContracts(!addContracts)}
              styles={buttonContainerStyling().button}
              titleStyles={buttonContainerStyling().p}
              icon={renderingIcon()}
            />
          </InputLabel>
        </>
      )}
      {addContracts && !foldersExisting && (
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
                <Tooltip title="All documents must be uploaded to the company's document library before they can be emailed to staff member.">
                  <Typography variant="subtitle1" sx={{ mb: 2 }}>
                    Select documents to email to staff member <QuestionIcon />
                    {documentsToUse.source === "folders" && (
                      <Typography
                        variant="caption"
                        sx={{
                          display: "block",
                          color: "text.secondary",
                          mt: 0.5,
                        }}
                      >
                        (Documents from Equipment Staff Assignment folders)
                      </Typography>
                    )}
                  </Typography>
                </Tooltip>
                <Select
                  mode="multiple"
                  style={{ width: "100%", marginBottom: "1rem" }}
                  placeholder="Select documents to assign"
                  value={selectedDocuments}
                  onChange={setSelectedDocuments}
                  loading={documentsToUse.loading}
                  options={
                    documentsToUse.documents?.map((doc) => ({
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
    </div>
  );
};

export default LegalDocumentModal;
