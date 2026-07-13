import { useState } from "react";
import { DownNarrow } from "../../../components/icons/DownNarrow";
import { RightChevronIcon } from "../../../components/icons/RightChevronIcon";
import "../style/viewtree.css";

const LOW_STOCK_RATIO = 0.25;

/**
 * Read-only tree node for the location-paths-tree endpoint response.
 * Each node exposes: existing, available, children.
 * Root-level nodes also carry location_id (not used here for display).
 */
const PathsTreeNode = ({ nodeName, nodeData, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(false);
  const { existing = 0, available = 0, children = {} } = nodeData;

  const childNames = Object.keys(children);
  const hasChildren = childNames.length > 0;
  const hasDevices = existing > 0;
  const availabilityRatio = hasDevices ? available / existing : null;
  const barColor =
    hasDevices && available === 0
      ? "var(--error-500, #F04438)"
      : hasDevices && availabilityRatio <= LOW_STOCK_RATIO
      ? "var(--warning-500, #F79009)"
      : "var(--success-500, #12B76A)";

  return (
    <div className="tree-node">
      <div
        className={`tree-row${depth > 0 ? " tree-row--child" : ""}`}
        style={{ paddingLeft: `${16 + depth * 28}px` }}
      >
        {hasChildren ? (
          <button
            type="button"
            className="tree-row__chevron"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Collapse sub-locations" : "Expand sub-locations"}
            aria-expanded={isOpen}
          >
            {isOpen ? <DownNarrow /> : <RightChevronIcon />}
          </button>
        ) : (
          <span className="tree-row__chevron" aria-hidden="true" />
        )}

        <span
          className={[
            "tree-row__name",
            hasChildren ? "tree-row__name--clickable" : "",
            !hasDevices ? "tree-row__name--muted" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={() => hasChildren && setIsOpen(!isOpen)}
        >
          {nodeName}
        </span>

        {!hasDevices && (
          <span className="tree-row__chip tree-row__chip--empty">Empty</span>
        )}

        <div className="tree-row__meta">
          <span className="tree-row__avail">
            {hasDevices
              ? `${Number(available).toLocaleString()} of ${Number(existing).toLocaleString()} available`
              : "No devices"}
          </span>
          <div className="tree-row__track">
            {hasDevices && (
              <div
                className="tree-row__fill"
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(0, Math.round((availabilityRatio ?? 0) * 100))
                  )}%`,
                  background: barColor,
                }}
              />
            )}
          </div>
        </div>
      </div>

      {isOpen && hasChildren && (
        <div className="tree-children">
          {childNames.map((childName) => (
            <PathsTreeNode
              key={childName}
              nodeName={childName}
              nodeData={children[childName]}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default PathsTreeNode;
