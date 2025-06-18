// TreeNode.jsx
import { useState } from "react";
import "../style/viewtree.css";
import { Button } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { Grid, Typography } from "@mui/material";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../components/icons/UpNarrowIcon";
import { useNavigate } from "react-router-dom";

const TreeNode = ({ nodeName, nodeData, path }) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  if (!nodeData) return null;

  const { total, available, children } = nodeData;

  const toggleOpen = () => {
    if (children) setIsOpen(!isOpen);
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
    if(location.length === 1){
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
              {nodeName}
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
                path={[...path, childName]} // extend path
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;