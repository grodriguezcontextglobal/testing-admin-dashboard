import { Grid, Stack } from "@mui/material";
import Chip from "../../../../../components/UX/Chip/Chip";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import BaseTable from "../../../../../components/UX/tables/BaseTable";

const columns = [
  { title: "Category", dataIndex: "category_name", key: "category_name" },
  { title: "Item", dataIndex: "item_group", key: "item_group" },
  { title: "Serial", dataIndex: "serial_number", key: "serial_number" },
  { title: "Location", dataIndex: "location", key: "location" },
];

const RentalEquipmentInventory = ({ rentalAnalysis }) => {
  return (
    <ReusableCardWithHeaderAndFooter
      style={{ width: "-webkit-fill-available" }}
      title="Rental Equipment Inventory"
    >
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
      <Grid container spacing={1} alignItems="flex-start">
        <Grid item xs={12} md={4} lg={4}>
          <ReusableCardWithHeaderAndFooter
            id="returned-before-search-period"
            title={`Returned Before search Period (${rentalAnalysis?.before_period?.length ?? 0})`}
          >
            <BaseTable
              columns={columns}
              dataSource={rentalAnalysis?.before_period ?? []}
              locale={{ emptyText: "—" }}
              enablePagination={true}
            />
          </ReusableCardWithHeaderAndFooter>
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <ReusableCardWithHeaderAndFooter
            id="returning-within-search-period"
            title={`Returning Within search Period (${rentalAnalysis?.within_period?.length ?? 0})`}
          >
            <BaseTable
              columns={columns}
              dataSource={rentalAnalysis?.within_period ?? []}
              enablePagination={true}
              locale={{ emptyText: "—" }}
            />
          </ReusableCardWithHeaderAndFooter>
        </Grid>
        <Grid item xs={12} md={4} lg={4}>
          <ReusableCardWithHeaderAndFooter
            id="returning-after-search-period"
            title={`Returning After search Period (${rentalAnalysis?.after_period?.length ?? 0})`}
          >
            <BaseTable
              columns={columns}
              dataSource={rentalAnalysis?.after_period ?? []}
              enablePagination={true}
              locale={{ emptyText: "—" }}
            />
          </ReusableCardWithHeaderAndFooter>
        </Grid>
      </Grid>
    </ReusableCardWithHeaderAndFooter>
  );
};

export default RentalEquipmentInventory;
