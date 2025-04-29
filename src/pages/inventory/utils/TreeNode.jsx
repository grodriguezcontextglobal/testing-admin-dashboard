// TreeNode.jsx
import { useState } from "react";
import "../style/viewtree.css";
import { Button } from "antd";
import { RightNarrowInCircle } from "../../../components/icons/RightNarrowInCircle";

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
  };

  return (
    <div key={nodeName} className="tree-card">
      <div
        style={{
          cursor: children ? "pointer" : "default",
        }}
      >
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Button className="tree-title" style={style} onClick={toggleOpen}>
            {nodeName}
          </Button>{" "}
          <Button style={style} onClick={() => console.log(nodeName)}>
            <RightNarrowInCircle />
          </Button>
        </div>
        <div className="tree-sub">
          Total: {total}, Available: {available}
        </div>
      </div>

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
