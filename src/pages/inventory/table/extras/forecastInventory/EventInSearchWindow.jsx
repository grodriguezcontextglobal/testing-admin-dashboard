import PropTypes from "prop-types";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import BaseTable from "../../../../../components/UX/tables/BaseTable";
import ForecastSection from "./ForecastSection";
import { formatPeriodLabel } from "./utils/forecastSummary";

/**
 * The events committing inventory inside the searched period.
 *
 * The counts used to be three chips reading "Total Events: 4",
 * "Device Categories: 2" and "Period: 2026-06-01 to 2026-06-30" above a table
 * headed by a `Typography variant="subtitle1"` that said "Event Details" — a
 * second heading inside a card that already had one. The counts now sit in the
 * section's own supporting line, where the rest of the screen keeps them, and
 * the period is formatted the same way as the one in the page header instead of
 * being printed raw.
 */
const EventInSearchWindow = ({
  eventInventory,
  eventDeviceRows,
  uniqueEvents,
  eventDetailsColumns,
}) => {
  const events = Array.isArray(uniqueEvents) ? uniqueEvents : [];
  const categories = Array.isArray(eventDeviceRows) ? eventDeviceRows.length : 0;
  const total = eventInventory?.total_events ?? events.length;
  const period = formatPeriodLabel(eventInventory?.period);

  const hint = [
    `${total} event${total === 1 ? "" : "s"}`,
    categories > 0
      ? `${categories} device categor${categories === 1 ? "y" : "ies"}`
      : null,
    period || null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <ForecastSection title="Events in this period" hint={hint}>
      {events.length === 0 ? (
        <EmptyState
          compact
          icon="tabler:calendar-off"
          title="No events in this period"
          description="No event commits any of the searched items while the window is open."
        />
      ) : (
        <div className="forecast__scroll">
          <BaseTable
            columns={eventDetailsColumns}
            dataSource={events}
            enablePagination={events.length > 10}
            pageSize={10}
            size="small"
          />
        </div>
      )}
    </ForecastSection>
  );
};

EventInSearchWindow.propTypes = {
  eventInventory: PropTypes.object,
  eventDeviceRows: PropTypes.array,
  uniqueEvents: PropTypes.array,
  eventDetailsColumns: PropTypes.array.isRequired,
};

export default EventInSearchWindow;
