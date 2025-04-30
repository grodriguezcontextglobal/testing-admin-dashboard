// TreeNode.jsx
import { useState } from "react";
import "../style/viewtree.css";
import { Button } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";
import { Grid, Typography } from "@mui/material";

const TreeNode = ({ nodeName, nodeData }) => {
  const [isOpen, setIsOpen] = useState(false);

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
  };

  return (
    <div key={nodeName} className="tree-card">
      <Grid
        container
        style={{
          cursor: children ? "pointer" : "default",
        }}
      >
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
                fontSize: {
                  xs: "18px",
                  sm: "18px",
                  md: "30px",
                  lg: "30px",
                },
                lineHeight: {
                  xs: "24px",
                  sm: "24px",
                  md: "38px",
                  lg: "38px",
                },
                textWrap: "balance",
              }}
              className="tree-title"
            >
              {nodeName}
            </Typography>
          </Button>{" "}
          <Button
            htmlType="button"
            style={style}
            onClick={() => console.log(nodeName)}
          >
            <RightNarrowInCircle />
          </Button>
        </Grid>
        <Grid className="tree-sub" item xs={12} sm={12} md={12} lg={12}>
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
              />
            ))}
        </div>
      )}
    </div>
  );
};

export default TreeNode;
