import {
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    Stack,
    Typography
} from "@mui/material";

const ProjectionPerLocation = ({locationData, SimpleTable}) => {
  return (
          <Card variant="outlined">
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Per-Location Current Inventory Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={2}>
                {locationData.map((loc, idx) => (
                  <Grid item xs={12} md={6} key={`${loc.location}-${idx}`}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1">
                          Current Inventory at <strong>{loc.location}</strong>
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
                          <SimpleTable
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
                                render: (row) => {
                                  if (row.owned_count === row.total_available) {
                                    return 0;
                                  } else {
                                    return (
                                      row.total_available - row.owned_count
                                    );
                                  }
                                },
                              },
                              {
                                key: "total_available",
                                title: "Current Inv",
                                dataIndex: "total_available",
                              },
                            ]}
                            rows={loc.items || []}
                            emptyText="No items"
                          />
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
  )
}

export default ProjectionPerLocation
