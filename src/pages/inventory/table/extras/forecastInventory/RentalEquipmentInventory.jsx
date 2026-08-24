import { Segmented } from "antd";
import PropTypes from "prop-types";
import { useMemo, useState } from "react";
import TextLink from "../../../../../components/UX/buttons/TextLink";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import ForecastSection from "./ForecastSection";
import {
  RETURN_WINDOWS,
  rentalReturnCounts,
  rentalReturnRows,
} from "./utils/forecastSummary";

const WINDOW_BY_KEY = Object.fromEntries(
  RETURN_WINDOWS.map((window) => [window.key, window])
);

/**
 * Rented-in units, grouped by when they come back.
 *
 * This was three tables side by side at a third of the page width each — three
 * columns of data squeezed into ~380px on a laptop, each independently
 * paginated at ten rows, each headed by an `InputLabel` (a form control) rather
 * than a heading. Reading "what comes back during my window" meant scanning the
 * middle table and remembering it while looking at the other two.
 *
 * One table, one pagination, and the bucket as a column you filter on. The
 * order and the colours now follow what the buckets mean for availability:
 * back before the period is the good case, back after it is the bad one — the
 * old chips had that exactly inverted.
 */
const RentalEquipmentInventory = ({ rentalAnalysis, navigate }) => {
  const [selectedWindow, setSelectedWindow] = useState("all");

  const rows = useMemo(() => rentalReturnRows(rentalAnalysis), [rentalAnalysis]);
  const counts = useMemo(() => rentalReturnCounts(rentalAnalysis), [rentalAnalysis]);

  const visibleRows = useMemo(
    () =>
      selectedWindow === "all"
        ? rows
        : rows.filter((row) => row.window === selectedWindow),
    [rows, selectedWindow]
  );

  const columns = [
    {
      key: "item_group",
      title: "Item",
      dataIndex: "item_group",
      sorter: (a, b) =>
        String(a.item_group ?? "").localeCompare(String(b.item_group ?? "")),
      render: (value) => value || <span className="forecast__cell-muted">—</span>,
    },
    {
      key: "serial_number",
      title: "Serial",
      dataIndex: "serial_number",
      render: (value, row) =>
        row.item_id ? (
          <TextLink onClick={() => navigate(`/inventory/item?id=${row.item_id}`)}>
            {value}
          </TextLink>
        ) : (
          value || <span className="forecast__cell-muted">—</span>
        ),
    },
    {
      key: "location",
      title: "Location",
      dataIndex: "location",
      render: (value) => value || <span className="forecast__cell-muted">—</span>,
    },
    {
      key: "window",
      title: "Returns",
      dataIndex: "window",
      render: (value) => {
        const window = WINDOW_BY_KEY[value];
        if (!window) return <span className="forecast__cell-muted">—</span>;
        return (
          <span className={`forecast__pill forecast__pill--${window.tone}`}>
            {window.label}
          </span>
        );
      },
    },
  ];

  const options = [
    { label: `All (${counts.total})`, value: "all" },
    ...RETURN_WINDOWS.map((window) => ({
      label: `${window.label} (${counts[window.key]})`,
      value: window.key,
    })),
  ];

  const hint =
    selectedWindow === "all"
      ? `${counts.total} rented unit${counts.total === 1 ? "" : "s"} analysed${
          counts.analyzed !== counts.total ? ` of ${counts.analyzed}` : ""
        }.`
      : WINDOW_BY_KEY[selectedWindow]?.hint;

  return (
    <ForecastSection
      title="Rented equipment returns"
      hint={hint}
      actions={
        counts.total > 0 ? (
          <Segmented
            options={options}
            value={selectedWindow}
            onChange={setSelectedWindow}
            size="small"
          />
        ) : undefined
      }
    >
      {counts.total === 0 ? (
        <EmptyState
          compact
          icon="tabler:truck-return"
          title="No rented equipment in this search"
          description="Nothing was rented in for the items and period you searched for."
        />
      ) : (
        <div className="forecast__scroll">
          <BaseTable
            columns={columns}
            dataSource={visibleRows}
            enablePagination={visibleRows.length > 10}
            pageSize={10}
            size="small"
            locale={{ emptyText: "Nothing returns in this window" }}
          />
        </div>
      )}
    </ForecastSection>
  );
};

RentalEquipmentInventory.propTypes = {
  rentalAnalysis: PropTypes.object,
  navigate: PropTypes.func.isRequired,
};

export default RentalEquipmentInventory;
