import PropTypes from "prop-types";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { Subtitle } from "../../../../../styles/global/Subtitle";

/**
 * Previous / Next for a keyset-paginated table.
 *
 * antd's pager is built on a total and a page count, and keyset pagination has
 * neither: the server hands back a cursor and says whether more exists. So the
 * table runs with `pagination={false}` and this sits underneath it.
 *
 * BaseTable is left alone on purpose — twenty-odd screens render it, and none
 * of the others paginate this way. If a second screen ever needs cursor paging,
 * that is the moment to move this into the shared component, not before.
 *
 * `matchedTotal` is what the filtered set actually holds; it comes from
 * inventory-facets, and is null while that answer is still in flight rather
 * than 0, which would read as "nothing matches".
 */
const CursorPager = ({
  pageNumber,
  hasPrevious,
  hasMore,
  onPrevious,
  onNext,
  isFetching = false,
  matchedTotal = null,
}) => (
  <div
    style={{
      width: "100%",
      display: "flex",
      flexWrap: "wrap",
      gap: "12px",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 0",
    }}
  >
    <p
      style={{
        ...Subtitle,
        margin: 0,
        color: "var(--gray-600, #475467)",
        fontVariantNumeric: "tabular-nums",
      }}
    >
      Page {pageNumber}
      {typeof matchedTotal === "number"
        ? ` · ${matchedTotal.toLocaleString()} items`
        : ""}
    </p>
    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
      <GrayButtonComponent
        title="Previous"
        size="sm"
        func={onPrevious}
        isDisabled={!hasPrevious || isFetching}
      />
      <GrayButtonComponent
        title="Next"
        size="sm"
        func={onNext}
        isDisabled={!hasMore || isFetching}
      />
    </div>
  </div>
);

CursorPager.propTypes = {
  pageNumber: PropTypes.number.isRequired,
  hasPrevious: PropTypes.bool.isRequired,
  hasMore: PropTypes.bool.isRequired,
  onPrevious: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  isFetching: PropTypes.bool,
  matchedTotal: PropTypes.number,
};

export default CursorPager;
