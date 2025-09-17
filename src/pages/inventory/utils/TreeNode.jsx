// TreeNode.jsx
import { Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, message, Modal, Table } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { EditIcon } from "../../../components/icons/EditIcon";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "../style/viewtree.css";
import ViewIcon from "../../../components/icons/ViewIcon";

const TreeNode = ({ nodeName, nodeData, path, onUpdateLocation }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useSelector((state) => state.admin);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedName, setEditedName] = useState(nodeName);
  const [openDetails, setOpenDetails] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  if (!nodeData) return null;

  const { total, available, children, types } = nodeData;

  const toggleOpen = () => {
    if (children) setIsOpen(!isOpen);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditedName(nodeName);
  };
  const handleSave = async () => {
    try {
      if (editedName === nodeName) {
        setIsEditing(false);
        return;
      }
      setIsLoading(true);
      messageApi.open({
        type: "loading",
        content: "Updating location path...",
        duration: 0,
        key: "updateLocationPath",
      });
      const locationData = {
        newName: editedName,
        path: path,
        currentIndex: path.length - 1,
        company_id: user.sqlInfo.company_id,
      };

      const response = await devitrakApi.post(
        "/db_inventory/update-location-sub-location",
        locationData
      );
      if (response?.data?.ok) {
        queryClient.invalidateQueries("structuredCompanyInventory");
        queryClient.invalidateQueries("listOfItemsInStock");
        queryClient.invalidateQueries("ItemsInInventoryCheckingQuery");
        queryClient.invalidateQueries("RefactoredListInventoryCompany");
        await clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
        setIsEditing(false);
        setIsLoading(false);
        messageApi.destroy("updateLocationPath");
        return messageApi.open({
          type: "success",
          content: `Location/Sub locations updated successfully. Total: ${
            response.data.affectedRows ?? 0
          }`,
          duration: 2.5,
        });
      }
    } catch (error) {
      console.error("Error updating location:", error);
      setIsLoading(false);
      setEditedName(nodeName);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditedName(nodeName);
    setIsEditing(false);
  };

  const style = {
    backgroundColor: "transparent",
    border: "none",
    outline: "none",
    margin: 0,
    padding: 0,
    width: "fit-content",
    boxShadow: "none",
  };

  const navigateToLocation = (location) => {
    const check = checkUpdatedPath(location);
    if (check) {
      if (location.length === 1) {
        return navigate(
          `/inventory/location?${encodeURI(location[0])}&search=`
        );
      } else {
        const subLocationPath = encodeURIComponent(location.slice(1).join(","));
        return navigate(
          `/inventory/location?${encodeURI(location[0])}&search=`,
          {
            state: {
              sub_location: subLocationPath,
            },
          }
        );
      }
    } else {
      return message.warning("Please wait while the path is being updated.");
    }
  };

  const checkUpdatedPath = (path) => {
    const checking = path.some((item) => item === editedName);
    return checking;
  };

  // Modal component for displaying types
  const TypesModal = () => {
    const closeModal = () => {
      setOpenDetails(false);
    };

    // Prepare data for the table
    const tableData = types ? types.map((type, index) => ({
      key: index,
      type: type,
      index: index + 1
    })) : [];

    const columns = [
      {
        title: "#",
        dataIndex: "index",
        key: "index",
        width: 60,
      },
      {
        title: "Item Type",
        dataIndex: "type",
        key: "type",
      },
    ];

    return (
      <Modal
        open={openDetails}
        onCancel={closeModal}
        footer={null}
        width={600}
        maskClosable={false}
        title={`Item Types in ${nodeName} (${types?.length || 0} types)`}
        style={{ zIndex: 30 }}
      >
        <Table
          columns={columns}
          dataSource={tableData}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => 
              `${range[0]}-${range[1]} of ${total} items`,
          }}
          scroll={{ y: 400 }}
          size="small"
        />
      </Modal>
    );
  };

  return (
    <div key={nodeName} className="tree-card">
      {contextHolder}
      <Grid container style={{ cursor: children ? "pointer" : "default" }}>
        <Grid
          sx={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <Button htmlType="button" style={style} onClick={toggleOpen}>
            <Typography
              sx={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: { xs: "24px", md: "30px" },
                lineHeight: { xs: "32px", md: "38px" },
                textWrap: "balance",
              }}
              className="tree-title"
            >
              {children && (isOpen ? <UpNarrowIcon /> : <DownNarrow />)}{" "}
              <span>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    style={{
                      fontSize: "20px",
                      lineHeight: "24px",
                      width: "auto",
                      minWidth: "100px",
                    }}
                    autoFocus
                  />
                ) : (
                  editedName
                )}
              </span>
              <div
                style={{ display: "flex", gap: "5px", width: "fit-content" }}
              >
                {isEditing ? (
                  <>
                    {" "}
                    <BlueButtonComponent
                      buttonType="button"
                      func={handleSave}
                      title={"Save"}
                      loadingState={isLoading}
                    />
                    &nbsp;
                    <GrayButtonComponent
                      buttonType="button"
                      func={handleCancel}
                      title={"Cancel"}
                      disabled={isLoading}
                    />
                  </>
                ) : (
                    <Button
                      style={{
                        borderRadius: "25px",
                        width: "fit-content",
                        aspectRatio: "1/1",
                        marginLeft: "5px",
                      }}
                      onClick={handleEdit}
                      disabled={Number(user.role) > 0}
                    >
                      <EditIcon />
                    </Button>
                )}
                <GrayButtonComponent styles={{ padding:'2.5px !important', borderRadius:"50% !important"}} icon={<ViewIcon />} func={() => setOpenDetails(true)} />
              </div>
            </Typography>
          </Button>
          <Button
            htmlType="button"
            style={style}
            onClick={() => navigateToLocation(path)}
          >
            <RightNarrowInCircle />
          </Button>
        </Grid>
        <Grid className="tree-sub" item xs={12}>
          Total: {total}, Available: {available}
        </Grid>
      </Grid>

      {isOpen && children && (
        <div className="tree-children">
          {Object.entries(children)
            .filter(([key]) => key !== "null")
            .map(([childName, childData]) => (
              <TreeNode
                key={childName}
                nodeName={childName}
                nodeData={childData}
                path={[...path, childName]}
                onUpdateLocation={onUpdateLocation}
              />
            ))}
        </div>
      )}
      
      {/* Render the Types Modal */}
      <TypesModal />
    </div>
  );
};

export default TreeNode;
