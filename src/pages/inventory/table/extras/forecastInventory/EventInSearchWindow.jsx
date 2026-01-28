import { Box, Stack, Typography } from "@mui/material";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import Chip from "../../../../../components/UX/Chip/Chip";
import BaseTable from "../../../../../components/UX/tables/BaseTable";

const EventInSearchWindow = ({
  eventInventory,
  eventDeviceRows,
  uniqueEvents,
  eventDetailsColumns,
}) => {
  return (
    <ReusableCardWithHeaderAndFooter title="On Going Events in Current Search">
      {/* Event Summary */}
      <Stack direction="row" spacing={2} mb={2} useFlexGap flexWrap="wrap">
        <Chip
          color="primary"
          label={`Total Events: ${eventInventory?.total_events ?? 0}`}
        />
        <Chip
          color="info"
          label={`Device Categories: ${eventDeviceRows.length}`}
        />
        {eventInventory?.period && (
          <Chip
            color="default"
            label={`Period: ${eventInventory.period.date_start} to ${eventInventory.period.date_end}`}
          />
        )}
      </Stack>

      {/* Event Details Table */}
      <Box mb={2}>
        <Typography variant="subtitle1" gutterBottom>
          Event Details
        </Typography>
        <BaseTable
          columns={eventDetailsColumns}
          dataSource={uniqueEvents}
          locale={{ emptyText: "No events found" }}
        />
      </Box>
    </ReusableCardWithHeaderAndFooter>
  );
};

export default EventInSearchWindow;
