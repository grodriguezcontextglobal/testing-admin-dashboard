import PropTypes from "prop-types";
import { useMemo } from "react";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { BarChart } from "../../../../../components/UX/chart/LineBar";
import EmptyState from "../../../../../components/UX/emptyState/EmptyState";
import PageHeader from "../../../../../components/UX/pageHeader/PageHeader";
import AdvanceSearchModal from "../AdvanceSearchModal";
import EventInSearchWindow from "./EventInSearchWindow";
import ForecastSection from "./ForecastSection";
import "./forecast.css";
import KpiStrip from "./KPI";
import ProjectionPerLocation from "./ProjectionPerLocation";
import RentalEquipmentInventory from "./RentalEquipmentInventory";
import {
  buildForecastKpis,
  formatDay,
  formatPeriodLabel,
  searchParameterChips,
  summarizeDailyAnalysis,
} from "./utils/forecastSummary";

/**
 * The result of an inventory forecast search, read top to bottom in the order
 * the questions come up:
 *
 *   0. What did I search for, and over what period?
 *   1. How does it come out overall — and does it fall short anywhere?
 *   2. What does availability look like day by day?
 *   3. Where is the stock, and how much of it is free?
 *   4. What comes back from rental, and when?
 *   5. Which events are competing for it?
 *
 * What it replaces: a MUI Grid with the page title missing entirely, the period
 * rendered as an antd info `Alert` (a notification banner carrying the most
 * important context on the screen), one lonely KPI card in a quarter-width
 * column with the rest of the summary commented out, `<Divider />` elements
 * dropped in as direct children of a spacing grid, and a page-wide "no results"
 * message placed *last* — under a screen already full of empty cards.
 */
const UX = ({
  allItems,
  dailyAnalysis,
  eventDetailsColumns,
  eventDeviceRows,
  eventInventory,
  handleReturnNavigation,
  handleUpdatePeriodOnly,
  locationData,
  navigate,
  openAdvanceSearchModal,
  overallSummary,
  ownedInventory,
  period,
  periodUpdateOnly,
  rentalAnalysis,
  rentedInventory,
  searchParameters,
  setOpenAdvanceSearchModal,
  setPeriodUpdateOnly,
  uniqueEvents,
  uniqueItemGroupsCount,
}) => {
  const daily = Array.isArray(dailyAnalysis) ? dailyAnalysis : [];

  const kpis = useMemo(
    () =>
      buildForecastKpis({
        uniqueItemGroupsCount,
        locationData,
        overallSummary,
        dailyAnalysis: daily,
        eventInventory,
      }),
    [uniqueItemGroupsCount, locationData, overallSummary, daily, eventInventory]
  );

  const dailySummary = useMemo(() => summarizeDailyAnalysis(daily), [daily]);
  const filters = useMemo(
    () => searchParameterChips(searchParameters),
    [searchParameters]
  );

  const periodLabel = formatPeriodLabel(period ?? searchParameters);

  const hasResults =
    allItems.length > 0 ||
    (ownedInventory?.total_items ?? 0) > 0 ||
    (rentedInventory?.total_items ?? 0) > 0;

  const openFullSearch = () => {
    setPeriodUpdateOnly?.(false);
    setOpenAdvanceSearchModal(true);
  };

  return (
    <div className="forecast">
      <PageHeader
        title="Inventory forecast"
        supportingText={
          periodLabel || "Availability across the searched period."
        }
        actions={
          <>
            <GrayButtonComponent
              title="Back to inventory"
              buttonType="button"
              func={handleReturnNavigation}
            />
            <GrayButtonComponent
              title="Edit search"
              buttonType="button"
              func={openFullSearch}
            />
            <BlueButtonComponent
              title="Change period"
              buttonType="button"
              func={handleUpdatePeriodOnly}
            />
          </>
        }
      >
        {/* The filters that produced these results were passed to the edit
            modal and never shown, so the page carried no record of them. */}
        {filters.length > 0 && (
          <div className="forecast__filters" style={{ marginTop: "12px" }}>
            <p className="forecast__filters-label">Filters</p>
            {filters.map((filter) => (
              <span className="forecast__filter" key={filter.key}>
                <span>{filter.label}</span>
                {filter.value}
              </span>
            ))}
          </div>
        )}
      </PageHeader>

      {!hasResults ? (
        <EmptyState
          icon="tabler:package-off"
          title="No inventory matches this search"
          description="No owned or rented items were found for these filters and period. Widen the filters or pick another period."
          action={
            <BlueButtonComponent
              title="Edit search"
              buttonType="button"
              func={openFullSearch}
            />
          }
        />
      ) : (
        <>
          <KpiStrip stats={kpis} />

          {/* The one finding that needs acting on, stated rather than left to
              be spotted in the chart. */}
          {dailySummary.shortDays > 0 && (
            <div className="forecast__alert" role="status">
              <p>
                Demand is above availability on {dailySummary.shortDays} day
                {dailySummary.shortDays === 1 ? "" : "s"} of this period.
              </p>
              {dailySummary.firstShortDate && (
                <p>
                  The first shortfall is on {formatDay(dailySummary.firstShortDate)}.
                </p>
              )}
            </div>
          )}

          {daily.length > 0 && (
            <ForecastSection
              title="Daily availability"
              hint="Units free against units committed, day by day. Shaded columns are weekends and US holidays."
            >
              <div className="forecast__chart">
                <BarChart data={daily} />
              </div>
            </ForecastSection>
          )}

          <ProjectionPerLocation locationData={locationData} />

          <RentalEquipmentInventory
            rentalAnalysis={rentalAnalysis}
            navigate={navigate}
          />

          <EventInSearchWindow
            eventInventory={eventInventory}
            eventDeviceRows={eventDeviceRows}
            uniqueEvents={uniqueEvents}
            eventDetailsColumns={eventDetailsColumns}
          />
        </>
      )}

      <AdvanceSearchModal
        openAdvanceSearchModal={openAdvanceSearchModal}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
        existingParameters={searchParameters}
        periodUpdateOnly={periodUpdateOnly}
      />
    </div>
  );
};

UX.propTypes = {
  allItems: PropTypes.array,
  dailyAnalysis: PropTypes.array,
  eventDetailsColumns: PropTypes.array.isRequired,
  eventDeviceRows: PropTypes.array,
  eventInventory: PropTypes.object,
  handleReturnNavigation: PropTypes.func.isRequired,
  handleUpdatePeriodOnly: PropTypes.func.isRequired,
  locationData: PropTypes.array,
  navigate: PropTypes.func.isRequired,
  openAdvanceSearchModal: PropTypes.bool,
  overallSummary: PropTypes.object,
  ownedInventory: PropTypes.object,
  period: PropTypes.object,
  periodUpdateOnly: PropTypes.bool,
  rentalAnalysis: PropTypes.object,
  rentedInventory: PropTypes.object,
  searchParameters: PropTypes.object,
  setOpenAdvanceSearchModal: PropTypes.func.isRequired,
  setPeriodUpdateOnly: PropTypes.func,
  uniqueEvents: PropTypes.array,
  uniqueItemGroupsCount: PropTypes.number,
};

UX.defaultProps = {
  allItems: [],
  dailyAnalysis: [],
  locationData: [],
};

export default UX;
