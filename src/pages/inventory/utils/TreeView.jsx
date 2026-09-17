// TreeView.jsx
import { Pagination } from "antd";
import PropTypes from "prop-types";
import { useEffect, useMemo, useState } from "react";
import TreeNode from "./TreeNode";
import { TREE_PAGE_SIZE, paginateTree } from "./paginateTree";
import "../style/viewtree.css";

const TreeView = ({
  data,
  setTypePerLocationInfoModal,
  setOpenDetails,
}) => {
  const [page, setPage] = useState(1);
  const { entries, pageCount, total } = paginateTree(data, { page });

  // Back to the first page when the tree itself changes — a filter, a new
  // location, a company switch. Keyed on the location names rather than on the
  // object, which the parent rebuilds on every render: depending on its
  // identity would reset the page under the operator's fingers.
  const names = useMemo(
    () => (data && typeof data === "object" ? Object.keys(data).join("|") : ""),
    [data],
  );
  useEffect(() => setPage(1), [names]);

  return (
    <div style={{ width: "100%" }}>
      <div className="tree-list">
        {entries.map(([location, details]) => (
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

      {/* A pager over a single page is a control that does nothing. */}
      {pageCount > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "12px 4px 4px",
          }}
        >
          <Pagination
            size="small"
            current={page}
            total={total}
            pageSize={TREE_PAGE_SIZE}
            onChange={setPage}
            showSizeChanger={false}
            // Sub-locations live inside the row that opens them, so the count
            // names what is being paged rather than leaving "10 of 47" to be
            // read as ten of forty-seven units.
            showTotal={(count, [from, to]) =>
              `${from}-${to} of ${count} locations`
            }
          />
        </div>
      )}
    </div>
  );
};

TreeView.propTypes = {
  data: PropTypes.object,
  setTypePerLocationInfoModal: PropTypes.func,
  setOpenDetails: PropTypes.func,
};

export default TreeView;
