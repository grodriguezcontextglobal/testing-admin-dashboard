// TreeNode.jsx
import { useState } from "react";
import "../style/viewtree.css";

const TreeNode = ({ nodeName, nodeData }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!nodeData) return null;

  const { total, available, children } = nodeData;

  const toggleOpen = () => {
    if (children) setIsOpen(!isOpen);
  };

  return (
    <div key={nodeName} className="tree-card">
      <div onClick={toggleOpen} style={{ cursor: children ? "pointer" : "default" }}>
        <div className="tree-title">{nodeName}</div>
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