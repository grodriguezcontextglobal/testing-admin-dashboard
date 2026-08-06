import { Pagination } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import CardInventoryFound from "../utils/CardInventoryFound";
import CardInventoryGroupFound from "../utils/CardInventoryGroupFound";
import SearchSection from "./SearchSection";
import {
  SUBSECTION_LABEL,
  cardGrid,
  sectionFooter,
  SECTION_NOTE,
} from "../utils/sectionLayout";

const PAGE_SIZE = 12;


/**
 * Company inventory results (MySQL item_inv). Shows the category/group/brand
 * rollup first — that is what answers "do we have Chromebooks, and how many" —
 * then the individual units. Both land on the existing group detail page, which
 * expects `/inventory/group?<group>&search=<serial>`.
 */
const SearchInventoryRef = ({
  data,
  searchParams,
  elsewhereLabel = "Devices",
}) => {
  const navigate = useNavigate();
  const [currentPage, setCurrentPage] = useState(1);
  const items = data?.items ?? [];
  const groups = data?.groups ?? [];
  // `total` is what this section lists; `matchedTotal` is every matching unit.
  // The difference is showing under the Assigned/Devices section, so the two
  // sections partition the units and add up to the header count.
  const total = Number(data?.total ?? items.length);
  const matchedTotal = Number(data?.matchedTotal ?? total);
  const elsewhere = Number(data?.elsewhereTotal ?? 0);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchParams, data]);

  const pageItems = items.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToGroup = (group, serialNumber = "") =>
    navigate(
      `/inventory/group?${encodeURI(group ?? "")}&search=${encodeURI(
        serialNumber
      )}`
    );

  return (
    <SearchSection
      title="Inventory"
      subtitle={
        elsewhere > 0
          ? `${total} of ${matchedTotal} matching units are on the shelf — the other ${elsewhere} are out, listed under ${elsewhereLabel}.`
          : `${total} ${
              total === 1 ? "unit" : "units"
            } in your company inventory match your search.`
      }
    >
      {groups.length > 0 && (
        <div style={{ width: "100%" }}>
          <p style={SUBSECTION_LABEL}>Matching groups</p>
          <div style={cardGrid(300)}>
            {groups.map((group) => (
              <CardInventoryGroupFound
                key={`${group.category_name}-${group.item_group}-${group.brand}`}
                props={group}
                fn={(record) => goToGroup(record.item_group)}
              />
            ))}
          </div>
        </div>
      )}

      {pageItems.length > 0 && (
        <div style={{ width: "100%" }}>
          <p style={SUBSECTION_LABEL}>
            {elsewhere > 0 ? "On the shelf" : "Matching units"}
          </p>
          <div style={cardGrid(300)}>
            {pageItems.map((item) => (
              <CardInventoryFound
                key={item.item_id}
                props={item}
                fn={(record) =>
                  goToGroup(record.item_group, record.serial_number)
                }
              />
            ))}
          </div>
        </div>
      )}

      {items.length > PAGE_SIZE && (
        <div style={sectionFooter}>
          <Pagination
            current={currentPage}
            pageSize={PAGE_SIZE}
            total={items.length}
            onChange={setCurrentPage}
            showSizeChanger={false}
            showTotal={(count, range) => `${range[0]}–${range[1]} of ${count}`}
          />
        </div>
      )}

      {data?.hasMore && (
        <p style={SECTION_NOTE}>
          Showing the first {items.length} of {total}. Open a group above to
          browse the rest.
        </p>
      )}
    </SearchSection>
  );
};

export default SearchInventoryRef;

SearchInventoryRef.propTypes = {
  data: PropTypes.object,
  searchParams: PropTypes.string,
  elsewhereLabel: PropTypes.string,
};
