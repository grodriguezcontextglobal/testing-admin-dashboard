import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { SimpleTable } from "../ux/forecastInventory/SimpleTable";

const EventInSearchWindow = ({
  eventInventory,
  eventDeviceRows,
  uniqueEvents,
  // eventDeviceColumns,
  eventDetailsColumns,
  // SimpleTable,
}) => {
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography variant="h6" gutterBottom>
          On Going Events in Current Search{" "}
        </Typography>

        {/* Event Summary */}
        <Stack direction="row" spacing={2} mb={2} useFlexGap flexWrap="wrap">
          <Chip
            color="primary"
            label={`Total Events: ${eventInventory?.total_events ?? 0}`}
          />
          {/* <Chip
            color="secondary"
            label={`Total Items: ${eventInventory?.total_devices ?? 0}`}
          /> */}
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

        {/* Device Counts Table */}
        {/* <Box mb={3}>
          <Typography variant="subtitle1" gutterBottom>
            Device Requirements by Category
          </Typography>
          <SimpleTable
            columns={eventDeviceColumns}
            rows={eventDeviceRows}
            emptyText="No device requirements"
            collapsible={true}
          />
        </Box> */}

        {/* Event Details Table */}
        <Box mb={2}>
          <Typography variant="subtitle1" gutterBottom>
            Event Details
          </Typography>
          <SimpleTable
            columns={eventDetailsColumns}
            rows={uniqueEvents}
            emptyText="No events found"
            collapsible={false}
          />
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventInSearchWindow;
