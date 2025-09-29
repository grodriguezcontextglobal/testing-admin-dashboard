import { Card, Grid, Typography } from "@mui/material";
import { Alert, Divider as DivAnt } from "antd";
import { DailyAnalysisChart } from "./chart";
import { KPI } from "./KPI";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import { EditIcon } from "../../../../../components/icons/EditIcon";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import AdvanceSearchModal from "../AdvanceSearchModal";
import ProjectionPerLocation from "./ProjectionPerLocation";
import RentalEquipmentInventory from "./RentalEquipmentInventory";
import EventInSearchWindow from "./EventInSearchWindow";

const UX = ({
  allItems,
  dailyAnalysis,
  eventDetailsColumns,
  eventDeviceColumns,
  eventDeviceRows,
  eventInventory,
  handleReturnNavigation,
  handleUpdatePeriodOnly,
  locationData,
  openAdvanceSearchModal,
  overallSummary,
  ownedInventory,
  period,
  periodUpdateOnly,
  rentalAnalysis,
  rentedInventory,
  // RentedInventoryTable,
  searchParameters,
  setOpenAdvanceSearchModal,
  // SimpleTable,
  uniqueEvents,
  uniqueItemGroupsCount,
}) => {
  return (
    <Grid
      container
      display="flex"
      justifyContent="flex-start"
      alignItems="stretch"
      spacing={2}
    >
      {/* Header */}
      <Grid
        item
        xs={12}
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <GrayButtonComponent
          title={"Go back"}
          func={handleReturnNavigation}
          buttonType="button"
          titleStyles={{ textTransform: "none", width: "100%", gap: "2px" }}
        />
        <div style={{ display: "flex", gap: "8px" }}>
          <BlueButtonComponent
            title={"Update Period"}
            func={handleUpdatePeriodOnly}
            buttonType="button"
            titleStyles={{ textTransform: "none", width: "100%", gap: "2px" }}
            icon={<EditIcon stroke="#fff" hoverStroke="#1890ff" />}
          />
        </div>
      </Grid>
      {/* Period */}
      {period && (
        <Grid item xs={12}>
          <Alert
            message={`Search Period: ${period.start} to ${period.end}`}
            type="info"
            showIcon
            style={{ marginBottom: 8 }}
          />
        </Grid>
      )}
      {/* Daily Analysis Chart Section */}
      {dailyAnalysis && dailyAnalysis.length > 0 && (
        <>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Daily Inventory Analysis
            </Typography>
            <DailyAnalysisChart dailyData={dailyAnalysis} />
          </Grid>
          <DivAnt />
        </>
      )}
      {/* KPI Summary */}
      <Grid item xs={12} md={3}>
        <KPI
          label="Total Locations"
          value={overallSummary?.total_locations}
          color="primary"
        />
      </Grid>
      <Grid item xs={12} md={3}>
        <KPI label="Item Types" value={uniqueItemGroupsCount} color="primary" />
      </Grid>
      {/* Per-location projection summary pulled from projection.locations[].location_summary */}
      <Grid item xs={12}>
        <ProjectionPerLocation
          locationData={locationData}
          // SimpleTable={SimpleTable}
        />
      </Grid>
      <DivAnt />
      {/* Rental Analysis Buckets */}
      {rentedInventory.total_items > 0 && (
        <Grid item xs={12}>
          <Card variant="outlined">
            <RentalEquipmentInventory
              rentalAnalysis={rentalAnalysis}
              // RentedInventoryTable={RentedInventoryTable}
            />
          </Card>
        </Grid>
      )}{" "}
      <DivAnt />
      {/* Event Inventory - Enhanced */}
      <Grid item xs={12}>
        <EventInSearchWindow
          eventInventory={eventInventory}
          eventDeviceRows={eventDeviceRows}
          uniqueEvents={uniqueEvents}
          eventDeviceColumns={eventDeviceColumns}
          eventDetailsColumns={eventDetailsColumns}
          // SimpleTable={SimpleTable}
        />
      </Grid>
      {/* Empty state fallback for the whole page */}
      {allItems.length === 0 &&
        (ownedInventory?.total_items ?? 0) === 0 &&
        (rentedInventory?.total_items ?? 0) === 0 && (
          <Grid item xs={12}>
            <Alert
              message="No inventory items found for the specified criteria."
              type="info"
              showIcon
            />
          </Grid>
        )}
      {/* Search Modal */}
      <AdvanceSearchModal
        openAdvanceSearchModal={openAdvanceSearchModal}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
        existingParameters={searchParameters}
        periodUpdateOnly={periodUpdateOnly}
      />
    </Grid>
  );
};

export default UX;
