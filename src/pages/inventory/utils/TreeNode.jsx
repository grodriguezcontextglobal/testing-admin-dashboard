// TreeNode.jsx
import { Grid, Typography } from "@mui/material";
import { Button, message } from "antd";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import "../style/viewtree.css";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import { useQueryClient } from "@tanstack/react-query";
import clearCacheMemory from "../../../utils/actions/clearCacheMemory";

const TreeNode = ({ nodeName, nodeData, path, onUpdateLocation }) => {
  const { user } = useSelector((state) => state.admin);
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
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
      await clearCacheMemory(`company_id=${user.sqlInfo.company_id}`);
      queryClient.invalidateQueries("structuredCompanyInventory");
      queryClient.invalidateQueries("listOfItemsInStock");
      queryClient.invalidateQueries("ItemsInInventoryCheckingQuery");
      queryClient.invalidateQueries("RefactoredListInventoryCompany");
      setIsEditing(false);
      return message.success(
        `Location/Sub locations updated successfully. Total: ${
          response.data.affectedRows ?? 0
        }`
      );
    }
    } catch (error) {
      console.error("Error updating location:", error);
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
    if (location.length === 1) {
      return navigate(`/inventory/location?${encodeURI(location[0])}&search=`);
    } else {
      const subLocationPath = encodeURIComponent(location.slice(1).join(","));
      return navigate(`/inventory/location?${encodeURI(location[0])}&search=`, {
        state: {
          sub_location: subLocationPath,
        },
      });
    }
  };

  return (
    <div key={nodeName} className="tree-card">
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
                fontSize: { xs: "24px", md: "30px" },
                lineHeight: { xs: "32px", md: "38px" },
                textWrap: "balance",
              }}
              className="tree-title"
            >
              {children && (isOpen ? <UpNarrowIcon /> : <DownNarrow />)}{" "}
              {isEditing ? (
                <input
                  type="text"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  style={{
                    fontSize: "inherit",
                    lineHeight: "inherit",
                    width: "auto",
                    minWidth: "100px",
                  }}
                  autoFocus
                />
              ) : (
                editedName
              )}
              {isEditing ? (
                <>
                  <Button htmlType="button" onClick={handleSave}>
                    Save
                  </Button>&nbsp;
                  <Button htmlType="button" onClick={handleCancel}>
                    Cancel
                  </Button>
                </>
              ) : (
                <Button htmlType="button" onClick={handleEdit} style={{marginLeft: "5px"}}>
                  Edit
                </Button>
              )}
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
    </div>
  );
};

export default TreeNode;
