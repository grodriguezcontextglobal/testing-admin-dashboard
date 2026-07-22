// TreeView.jsx
import TreeNode from "./TreeNode";
import "../style/viewtree.css";

const TreeView = ({
  data,
  setTypePerLocationInfoModal,
  setOpenDetails,
}) => {
  return (
    <div className="tree-list">
      {Object.entries(data).map(([location, details]) => (
        <TreeNode
          key={location}
          nodeName={location}
          nodeData={details}
          path={[location]}
          depth={0}
          setTypePerLocationInfoModal={setTypePerLocationInfoModal}
          setOpenDetails={setOpenDetails}
        />
      ))}
    </div>
  );
};

export default TreeView;
