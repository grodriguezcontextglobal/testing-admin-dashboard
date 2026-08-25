import PropTypes from "prop-types";
import { useMemo } from "react";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import ForecastSection from "./ForecastSection";
import { availabilityTone, locationRows } from "./utils/forecastSummary";

/**
 * Availability per item, per location — one table instead of a grid of cards.
 *
 * The projection used to render a two-column grid of cards, one per location,
 * each holding a chip ("Item Types: 4") and its own small table. Comparing one
 * item across two locations meant reading two tables at once, and the whole
 * grid sat inside a bordered box whose top border was removed because the
 * header it belonged to had been commented out.
 *
 * The same rows in one sortable, location-filterable table answer "where is it"
 * and "how much is left" in a single pass. The three counts the old table
 * showed are kept, and the two the projection already carried but never
 * displayed — net availability and the restock flag — are shown at last.
 */
const ProjectionPerLocation = ({ locationData }) => {
  const rows = useMemo(() => locationRows(locationData), [locationData]);

  const locationFilters = useMemo(
    () =>
      Array.from(new Set(rows.map((row) => row.location))).map((location) => ({
        text: location,
        value: location,
      })),
    [rows]
  );

  const columns = [
    {
      key: "location",
      title: "Location",
      dataIndex: "location",
      // The per-location cards become a filter, so one location can still be
      // read on its own — without splitting the page into cards to do it.
      filters: locationFilters,
      onFilter: (value, row) => row.location === value,
      sorter: (a, b) => a.location.localeCompare(b.location),
      defaultSortOrder: "ascend",
    },
    {
      key: "category",
      title: "Category",
      dataIndex: "category",
      render: (value) =>
        value || <span className="forecast__cell-muted">—</span>,
    },
    {
      key: "group",
      title: "Item",
      dataIndex: "group",
      render: (value, row) => (
        <>
          {value || <span className="forecast__cell-muted">—</span>}
          {row.restockNeeded && (
            <span className="forecast__flag">Restock</span>
          )}
        </>
      ),
    },
    {
      key: "owned",
      title: "Owned",
      dataIndex: "owned",
      align: "right",
      sorter: (a, b) => a.owned - b.owned,
    },
    {
      key: "onRental",
      title: "On rental",
      dataIndex: "onRental",
      align: "right",
      sorter: (a, b) => a.onRental - b.onRental,
    },
    {
      key: "inStock",
      title: "In stock",
      dataIndex: "inStock",
      align: "right",
      sorter: (a, b) => a.inStock - b.inStock,
    },
    {
      key: "netAvailable",
      title: "Net available",
      dataIndex: "netAvailable",
      align: "right",
      sorter: (a, b) => a.netAvailable - b.netAvailable,
    },
    {
      key: "status",
      title: "Status",
      dataIndex: "status",
      render: (value) =>
        value ? (
          <span className={`forecast__pill forecast__pill--${availabilityTone(value)}`}>
            {value}
          </span>
        ) : (
          <span className="forecast__cell-muted">—</span>
        ),
    },
  ];

  const locationCount = new Set(rows.map((row) => row.location)).size;
  const restockCount = rows.filter((row) => row.restockNeeded).length;

  return (
    <ForecastSection
      title="Availability by location"
      hint={
        rows.length > 0
          ? `${rows.length} item${rows.length === 1 ? "" : "s"} across ${locationCount} location${
              locationCount === 1 ? "" : "s"
            }${restockCount > 0 ? ` · ${restockCount} flagged for restock` : ""}`
          : undefined
      }
    >
      {rows.length === 0 ? (
        <EmptyState
          compact
          icon="tabler:building-warehouse"
          title="No projected inventory"
          description="The search returned no items held at any location for this period."
        />
      ) : (
        <div className="forecast__scroll">
          <BaseTable
            columns={columns}
            dataSource={rows}
            enablePagination={rows.length > 10}
            pageSize={10}
            size="small"
          />
        </div>
      )}
    </ForecastSection>
  );
};

ProjectionPerLocation.propTypes = {
  locationData: PropTypes.array,
};

export default ProjectionPerLocation;
