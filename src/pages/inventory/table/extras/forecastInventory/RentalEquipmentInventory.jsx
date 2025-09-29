import { CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { RentedInventoryTable } from "../ux/forecastInventory/RentedInventoryTable";

const RentalEquipmentInventory = ({ rentalAnalysis }) => { //RentedInventoryTable
  return (
    <CardContent>
      <Typography variant="h6" gutterBottom>
        Rental Equipment Inventory
      </Typography>
      {rentalAnalysis?.summary && (
        <Stack direction="row" spacing={2} mb={2} useFlexGap flexWrap="wrap">
          <Chip
            color="default"
            label={`Before: ${rentalAnalysis.summary.before_count ?? 0}`}
          />
          <Chip
            color="warning"
            label={`Within: ${rentalAnalysis.summary.within_count ?? 0}`}
          />
          <Chip
            color="success"
            label={`After: ${rentalAnalysis.summary.after_count ?? 0}`}
          />
          <Chip
            color="primary"
            label={`Total: ${rentalAnalysis.summary.total_analyzed ?? 0}`}
          />
        </Stack>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2">
            Returned Before search Period
          </Typography>
          <RentedInventoryTable
            type={2}
            rows={rentalAnalysis?.before_period ?? []}
            emptyText="—"
            collapsible={true}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2">
            Returning Within search Period
          </Typography>
          <RentedInventoryTable
            type={2}
            rows={rentalAnalysis?.within_period ?? []}
            emptyText="—"
            collapsible={true}
          />
        </Grid>
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle2">
            Returning After search Period
          </Typography>
          <RentedInventoryTable
            type={2}
            rows={rentalAnalysis?.after_period ?? []}
            emptyText="—"
            collapsible={true}
          />
        </Grid>
      </Grid>
    </CardContent>
  );
};

export default RentalEquipmentInventory;
