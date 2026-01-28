import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import TableHeader from "../../../../../components/UX/TableHeader";
import BaseTable from "../../../../../components/UX/tables/BaseTable";

const ProjectionPerLocation = ({ locationData }) => {
  return (
    <Grid container>
      <TableHeader title="Total Inventory Per-Location" />
      <Grid
        item
        xs={12}
        sx={{
          border: "1px solid var(--gray-200, #eaecf0)",
          borderTop: "none",
          borderRadius: "0 0 12px 12px",
          padding: 2,
          backgroundColor: "var(--base-white, #FFF)",
        }}
      >
        <Grid container spacing={2}>
          {locationData.map((loc, idx) => (
            <Grid item xs={12} md={6} key={`${loc.location}-${idx}`}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1">
                    Total Inventory at <strong>{loc.location}</strong>
                  </Typography>
                  <Stack
                    direction="row"
                    spacing={1}
                    mt={1}
                    useFlexGap
                    flexWrap="wrap"
                  >
                    <Chip
                      label={`Item Types: ${
                        loc.location_summary?.total_items ?? 0
                      }`}
                    />
                  </Stack>
                  {/* Small table of items in this location */}
                  <Box mt={2}>
                    <BaseTable
                      columns={[
                        {
                          key: "category",
                          title: "Category",
                          dataIndex: "category",
                        },
                        {
                          key: "group",
                          title: "Item",
                          dataIndex: "group",
                        },
                        {
                          key: "owned_count",
                          title: "Current Owned",
                          dataIndex: "owned_count",
                        },
                        {
                          key: "rental_no_return_date",
                          title: "Current Rental",
                          dataIndex: "rental_no_return_date",
                          render: (_, row) => {
                            if (row.owned_count === row.total_available) {
                              return 0;
                            } else {
                              return row.total_available - row.owned_count;
                            }
                          },
                        },
                        {
                          key: "total_available",
                          title: "Current Inv",
                          dataIndex: "total_available",
                        },
                      ]}
                      dataSource={loc.items || []}
                      locale={{ emptyText: "No items" }}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Grid>
    </Grid>
  );
};

export default ProjectionPerLocation;
