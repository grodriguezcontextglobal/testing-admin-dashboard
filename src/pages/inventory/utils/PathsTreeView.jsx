import PathsTreeNode from "./PathsTreeNode";
import "../style/viewtree.css";

/**
 * Renders the location-paths-tree response as a read-only tree.
 * Top-level keys are location names (with location_id); their children are
 * the registered path segments with inventory counts.
 */
const PathsTreeView = ({ data }) => {
  if (!data || Object.keys(data).length === 0) {
    return (
      <div
        style={{
          padding: "24px 16px",
          textAlign: "center",
          color: "#667085",
          fontSize: "14px",
          background: "var(--gray-50, #f9fafb)",
          borderRadius: "8px",
          border: "1px dashed var(--gray-300, #d0d5dd)",
        }}
      >
        No sub-location paths registered yet.
      </div>
    );
  }

  return (
    <div className="tree-list">
      {Object.entries(data).map(([locationName, locationData]) => (
        <PathsTreeNode
          key={locationName}
          nodeName={locationName}
          nodeData={locationData}
          depth={0}
        />
      ))}
    </div>
  );
};

export default PathsTreeView;
