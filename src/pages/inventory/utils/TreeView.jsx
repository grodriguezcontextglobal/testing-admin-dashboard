// TreeView.jsx
import TreeNode from "./TreeNode";
import "../style/viewtree.css";

const TreeView = ({ data }) => {
  return (
    <div className="tree-container">
      {Object.entries(data).map(([location, details]) => (
        <TreeNode key={location} nodeName={location} nodeData={details} />
      ))}
    </div>
  );
};

export default TreeView;
