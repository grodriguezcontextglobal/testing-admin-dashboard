// TreeView.jsx
import TreeNode from "./TreeNode";
import "../style/viewtree.css";

const TreeView = ({
  data,
  setTypePerLocationInfoModal,
  setOpenDetails,
  selectedLocations,
  onSelectLocation,
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
          selectedLocations={selectedLocations}
          onSelectLocation={onSelectLocation}
        />
      ))}
    </div>
  );
};

export default TreeView;
