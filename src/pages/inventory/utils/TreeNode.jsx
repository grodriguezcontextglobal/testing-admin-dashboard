// TreeNode.jsx
import { Grid, Typography } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { Button, message } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../api/devitrakApi";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../components/UX/buttons/GrayButton";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";
import "../style/viewtree.css";

const TreeNode = ({ nodeName, nodeData, path, onUpdateLocation }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const { user } = useSelector((state) => state.admin);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedName, setEditedName] = useState(nodeName);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  if (!nodeData) return null;

  const { total, available, children } = nodeData;

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
    console.log("location", location);
    console.log("editedName", editedName);
    const check = checkUpdatedPath(location);
    console.log("check", check);
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
                  <BlueButtonComponent
                    buttonType="button"
                    func={handleEdit}
                    styles={{ marginLeft: "5px" }}
                    title={"Edit"}
                  />
                )}
              </div>
            </Typography>
          </Button>
          <Button
            // disabled={!checkUpdatedPath(path)}
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
    </div>
  );
};

export default TreeNode;
