import { useMemo, useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
// import { FixedSizeList as List } from "react-window";
import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Stack,
  Box,
  IconButton,
  Collapse,
  TablePagination,
  List,
} from "@mui/material";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { Alert } from "antd";
import { onAddAdvanceSearch } from "../../../../store/slices/searchBarResultSlice";

// import Bars from "../../charts/Bars";
// import BarAnimation from "../../charts/BarAnimation";
// import InventoryItemCard from "./ux/InventoryItemCard";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
// import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../components/icons/UpNarrowIcon";

const KPI = ({ label, value, color = "default" }) => (
  <Card variant="outlined" sx={{ height: "100%" }}>
    <CardContent>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="h5">
        <Chip label={String(value ?? 0)} color={color} sx={{ fontSize: 16 }} />
      </Typography>
    </CardContent>
  </Card>
);
const VirtualizedTable = ({
  rows,
  columns,
  emptyText = "No data",
  itemHeight = 53,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expanded, setExpanded] = useState(false);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const paginatedRows = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const TableRow = ({ index, style }) => {
    const row = paginatedRows[index];
    if (!row) return null;

    return (
      <div style={style}>
        <Table size="small">
          <TableBody>
            <TableRow hover>
              {columns.map((column) => (
                <TableCell key={column.key} sx={{ py: 1 }}>
                  {typeof column.render === "function"
                    ? column.render(row)
                    : row[column.dataIndex]}
                </TableCell>
              ))}
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  };

  if (rows.length === 0) {
    return (
      <Card variant="outlined">
        <CardContent>
          <Typography variant="body2" color="text.secondary" align="center">
            {emptyText}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        {/* Header with collapse/expand */}
        <Box
          sx={{
            p: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="subtitle2">{rows.length} items</Typography>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            aria-label={expanded ? "collapse" : "expand"}
          >
            {expanded ? <DownNarrow /> : <UpNarrowIcon />}
          </IconButton>
        </Box>

        <Collapse in={expanded}>
          {/* Table Header */}
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: "bold" }}>
                    {column.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
          </Table>

          {/* Virtualized Table Body */}
          {paginatedRows.length > 0 && (
            <List
              height={Math.min(400, paginatedRows.length * itemHeight)}
              itemCount={paginatedRows.length}
              itemSize={itemHeight}
              width="100%"
            >
              {TableRow}
            </List>
          )}

          {/* Pagination */}
          <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
            <TablePagination
              component="div"
              count={rows.length}
              page={page}
              onPageChange={handleChangePage}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              rowsPerPageOptions={[5, 10, 25, 50, 100]}
              showFirstButton
              showLastButton
            />
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};
const SimpleTable = ({
  rows,
  columns,
  emptyText = "No data",
  virtualized = false,
  collapsible = true,
}) => {
  const [expanded, setExpanded] = useState(!collapsible);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const paginatedRows = useMemo(() => {
    if (rows.length <= 10) return rows; // No pagination for small datasets
    const startIndex = page * rowsPerPage;
    return rows.slice(startIndex, startIndex + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  // Use virtualized table for large datasets
  if (virtualized || rows.length > 50) {
    return (
      <VirtualizedTable rows={rows} columns={columns} emptyText={emptyText} />
    );
  }

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Card variant="outlined">
      <CardContent sx={{ p: 0 }}>
        {collapsible && (
          <Box
            sx={{
              p: 2,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography variant="subtitle2">{rows.length} items</Typography>
            <IconButton
              onClick={() => setExpanded(!expanded)}
              size="small"
              aria-label={expanded ? "collapse" : "expand"}
            >
              {expanded ? <DownNarrow /> : <UpNarrowIcon />}
            </IconButton>
          </Box>
        )}

        <Collapse in={expanded}>
          <Table size="small">
            <TableHead>
              <TableRow>
                {columns.map((column) => (
                  <TableCell key={column.key} sx={{ fontWeight: "bold" }}>
                    {column.title}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {emptyText}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRows.map((row, index) => (
                  <TableRow key={index} hover>
                    {columns.map((column) => (
                      <TableCell key={column.key}>
                        {typeof column.render === "function"
                          ? column.render(row)
                          : row[column.dataIndex]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination for larger datasets */}
          {rows.length > 10 && (
            <Box sx={{ p: 2, borderTop: 1, borderColor: "divider" }}>
              <TablePagination
                component="div"
                count={rows.length}
                page={page}
                onPageChange={handleChangePage}
                rowsPerPage={rowsPerPage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 25, 50]}
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </Collapse>
      </CardContent>
    </Card>
  );
};

const RentedInventoryTable = ({
  rows,
  emptyText = "No rented items",
  collapsible = true,
}) => {
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [expanded, setExpanded] = useState(false);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleToggleExpanded = () => {
    setExpanded(!expanded);
  };

  const paginatedRows = rows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!rows || rows.length === 0) {
    return (
      <Box p={2} textAlign="center">
        <Typography variant="body2" color="textSecondary">
          {emptyText}
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {collapsible && (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          p={1}
          sx={{
            backgroundColor: "rgba(0, 0, 0, 0.04)",
            borderRadius: 1,
            cursor: "pointer",
            "&:hover": {
              backgroundColor: "rgba(0, 0, 0, 0.08)",
            },
          }}
          onClick={handleToggleExpanded}
        >
          <Typography variant="subtitle2" fontWeight="medium">
            Rented Inventory Details ({rows.length} items)
          </Typography>
          <IconButton size="small">
            {expanded ? <UpNarrowIcon /> : <DownNarrow />}
          </IconButton>
        </Box>
      )}

      <Collapse in={!collapsible || expanded}>
        <Box mt={collapsible ? 1 : 0}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Group</TableCell>
                <TableCell>Serial</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedRows.map((row, index) => (
                <TableRow key={row.serial_number || index}>
                  <TableCell>{row.category_name || "N/A"}</TableCell>
                  <TableCell>{row.item_group || "N/A"}</TableCell>
                  <TableCell>{row.serial_number || "N/A"}</TableCell>
                  <TableCell>{row.location || "N/A"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Box>
      </Collapse>
    </Box>
  );
};
const AdvanceSearchResultPage = () => {
  const { advanceSearch } = useSelector((state) => state.searchResult);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleReturnNavigation = useCallback(() => {
    dispatch(onAddAdvanceSearch(null));
    return navigate("/inventory");
  }, [dispatch, navigate]);

  // ===== Extract payload pieces safely =====
  const availabilityProjection =
    advanceSearch?.availabilityProjection ??
    advanceSearch?.advanceSearchResult?.availabilityProjection ??
    null;

  const period =
    availabilityProjection?.period ??
    advanceSearch?.advanceSearchResult?.period ??
    null;

  const overallSummary =
    availabilityProjection?.overall_summary ??
    advanceSearch?.advanceSearchResult?.overall_summary ??
    null;

  const ownedInventory = advanceSearch?.ownedInventory ?? {
    total_items: 0,
    locations: [],
    raw_results: [],
  };
  const rentedInventory = advanceSearch?.rentedInventory ?? {
    total_items: 0,
    locations: [],
    raw_results: [],
  };

  const rentalAnalysis = advanceSearch?.rentalAnalysis ?? null;
  const eventInventory = advanceSearch?.eventInventory ?? null;

  // ===== Locations list from projection =====
  const locationData = useMemo(() => {
    return availabilityProjection?.locations ?? [];
  }, [availabilityProjection?.locations]);

  // ===== Flatten projected items for list/cards =====
  const allItems = useMemo(() => {
    const rows = [];
    for (const loc of locationData) {
      const locName = loc.location;
      for (const it of loc.items || []) {
        rows.push({
          ...it,
          category_name: it.category ?? it.category_name,
          group: it.group ?? it.item_group,
          locationName: locName,
          available_full: it.total_available,
          available_partial: it.net_availability,
          availability_status: it.availability_status,
          restock_needed: !!it.restock_needed,
        });
      }
    }
    return rows;
  }, [locationData]);

  // Calculate unique item groups count
  const uniqueItemGroupsCount = useMemo(() => {
    const uniqueGroups = new Set();

    // Add groups from allItems (projected data)
    allItems.forEach((item) => {
      if (item.group) {
        uniqueGroups.add(item.group);
      }
    });

    // Add groups from owned inventory
    ownedInventory?.raw_results?.forEach((item) => {
      if (item.item_group) {
        uniqueGroups.add(item.item_group);
      }
    });

    // Add groups from rented inventory
    rentedInventory?.raw_results?.forEach((item) => {
      if (item.item_group) {
        uniqueGroups.add(item.item_group);
      }
    });

    return uniqueGroups.size;
  }, [allItems, ownedInventory?.raw_results, rentedInventory?.raw_results]);

  // ===== CHARTS =====
  // const chartAvailabilityByLocation = useMemo(() => {
  //   const src = advanceSearch?.comprehensiveAnalysis?.location_summary ?? [];
  //   return src.map((d) => ({
  //     group: d.location,
  //     available: Number(d.permanent_count ?? 0),
  //     notAvailable: Number(d.rental_count ?? 0),
  //     availabilityPercentage: Number(d.availability_percentage ?? 0),
  //   }));
  // }, [advanceSearch?.comprehensiveAnalysis?.location_summary]);

  // Updated event columns to match new data structure
  const eventDeviceColumns = [
    { key: "category", title: "Category", dataIndex: "category" },
    { key: "group", title: "Group", dataIndex: "group" },
    { key: "count", title: "Device Count", dataIndex: "count" },
    {
      key: "events_count",
      title: "Events",
      render: (row) => (
        <Chip size="small" color="primary" label={row.events?.length || 0} />
      ),
    },
    {
      key: "event_names",
      title: "Event Names",
      render: (row) => (
        <Box>
          {row.events?.map((event, idx) => (
            <Chip
              key={idx}
              size="small"
              variant="outlined"
              label={event.event_name}
              sx={{ mr: 0.5, mb: 0.5 }}
            />
          )) || "No events"}
        </Box>
      ),
    },
  ];

  const eventDetailsColumns = [
    { key: "event_name", title: "Event Name", dataIndex: "event_name" },
    { key: "event_id", title: "Event ID", dataIndex: "event_id" },
    {
      key: "date_begin",
      title: "Start Date",
      render: (row) => new Date(row.date_begin).toLocaleDateString(),
    },
    {
      key: "date_end",
      title: "End Date",
      render: (row) => new Date(row.date_end).toLocaleDateString(),
    },
    {
      key: "duration",
      title: "Duration",
      render: (row) => {
        const start = new Date(row.date_begin);
        const end = new Date(row.date_end);
        const hours = Math.round((end - start) / (1000 * 60 * 60));
        return `${hours}h`;
      },
    },
  ];

  // Process event inventory data
  const eventDeviceRows = useMemo(() => {
    if (!eventInventory?.device_counts) return [];
    return eventInventory.device_counts;
  }, [eventInventory]);

  // Flatten all events from all device categories
  const allEventDetails = useMemo(() => {
    if (!eventInventory?.device_counts) return [];
    const events = [];
    eventInventory.device_counts.forEach((device) => {
      device.events?.forEach((event) => {
        events.push({
          ...event,
          device_category: device.category,
          device_group: device.group,
          device_brand: device.brand,
          device_count: device.count,
        });
      });
    });
    return events;
  }, [eventInventory]);

  // Get unique events for summary
  const uniqueEvents = useMemo(() => {
    if (!allEventDetails.length) return [];
    const eventMap = new Map();
    allEventDetails.forEach((event) => {
      if (!eventMap.has(event.event_id)) {
        eventMap.set(event.event_id, event);
      }
    });
    return Array.from(eventMap.values());
  }, [allEventDetails]);

  // ===== RENDER =====
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
        {/* <BlueButtonComponent
          title={"Export CSV"}
          func={handleExport}
          buttonType="button"
          titleStyles={{ textTransform: "none", width: "100%", gap: "2px" }}
        /> */}
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
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Per-Location Projection Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {locationData.map((loc, idx) => (
                <Grid item xs={12} md={6} key={`${loc.location}-${idx}`}>
                  <Card variant="outlined">
                    <CardContent>
                      <Typography variant="subtitle1">
                        {loc.location}
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
                        <Chip
                          color="success"
                          label={`Available Types: ${
                            loc.location_summary?.available_items ?? 0
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
                              title: "Group",
                              dataIndex: "group",
                            },
                            {
                              key: "owned_count",
                              title: "Owned",
                              dataIndex: "owned_count",
                            },
                            {
                              key: "rental_no_return_date",
                              title: "Rent (no return)",
                              dataIndex: "rental_no_return_date",
                              render: (row) => {
                                if (row.owned_count === row.total_available) {
                                  return 0;
                                } else {
                                  return row.total_available - row.owned_count;
                                }
                              },
                            },
                            {
                              key: "total_available",
                              title: "Total Avail",
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
      </Grid>

      {/* Charts: Availability by Location */}
      {/* {chartAvailabilityByLocation.length > 0 && (
        <Grid item xs={12}>
          <Bars
            dataToRender={chartAvailabilityByLocation}
            title="Availability by Location"
          />
        </Grid>
      )} */}

      {/* Owned vs Rented Raw Inventory */}
      <Grid item xs={12} md={6}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<DownNarrow />}>
            <Typography variant="subtitle1">Owned Inventory (raw)</Typography>
            <Chip
              sx={{ ml: 1 }}
              size="small"
              label={ownedInventory?.total_items ?? 0}
            />
          </AccordionSummary>
          <AccordionDetails>
            <RentedInventoryTable
              rows={ownedInventory?.raw_results ?? []}
              emptyText="No owned items"
              collapsible={true}
            />
            {/* <SimpleTable
              columns={ownedColumns}
              rows={ownedInventory?.raw_results ?? []}
              emptyText="No owned items"
            /> */}
          </AccordionDetails>
        </Accordion>
      </Grid>

      <Grid item xs={12} md={6}>
        <Accordion defaultExpanded>
          <AccordionSummary expandIcon={<DownNarrow />}>
            <Typography variant="subtitle1">Rented Inventory (raw)</Typography>
            <Chip
              sx={{ ml: 1 }}
              size="small"
              label={rentedInventory?.total_items ?? 0}
            />
          </AccordionSummary>
          <AccordionDetails>
            <RentedInventoryTable
              rows={rentedInventory?.raw_results ?? []}
              emptyText="No rented items"
              collapsible={true}
            />
          </AccordionDetails>
        </Accordion>
      </Grid>

      {/* Rental Analysis Buckets */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Rental Analysis
            </Typography>
            {rentalAnalysis?.summary && (
              <Stack
                direction="row"
                spacing={2}
                mb={2}
                useFlexGap
                flexWrap="wrap"
              >
                <Chip
                  color="default"
                  label={`Before: ${rentalAnalysis.summary.before_count}`}
                />
                <Chip
                  color="warning"
                  label={`Within: ${rentalAnalysis.summary.within_count}`}
                />
                <Chip
                  color="success"
                  label={`After: ${rentalAnalysis.summary.after_count}`}
                />
                <Chip
                  color="primary"
                  label={`Total: ${rentalAnalysis.summary.total_analyzed}`}
                />
              </Stack>
            )}

            {/* <Box mb={2}>
              <Typography variant="subtitle2">No Return Date</Typography>
              <RentedInventoryTable
                rows={rentalAnalysis?.no_return_date ?? []}
                emptyText="—"
                collapsible={true}
              /> */}
            {/* <SimpleTable
                columns={rentalAnalysisColumns}
                rows={rentalAnalysis?.no_return_date ?? []}
                emptyText="—"
              /> */}
            {/* </Box> */}

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">
                  Returned Before Period
                </Typography>
                <RentedInventoryTable
                  rows={rentalAnalysis?.before_period ?? []}
                  emptyText="—"
                  collapsible={true}
                />
                {/* <SimpleTable
                  columns={rentalAnalysisColumns}
                  rows={rentalAnalysis?.before_period ?? []}
                  emptyText="—"
                /> */}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">
                  Returning Within Period
                </Typography>
                <RentedInventoryTable
                  rows={rentalAnalysis?.within_period ?? []}
                  emptyText="—"
                  collapsible={true}
                />
                {/* <SimpleTable
                  columns={rentalAnalysisColumns}
                  rows={rentalAnalysis?.within_period ?? []}
                  emptyText="—"
                /> */}
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2">
                  Returning After Period
                </Typography>
                <RentedInventoryTable
                  rows={rentalAnalysis?.after_period ?? []}
                  emptyText="—"
                  collapsible={true}
                />
                {/* <SimpleTable
                  columns={rentalAnalysisColumns}
                  rows={rentalAnalysis?.after_period ?? []}
                  emptyText="—"
                /> */}
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>

      {/* Event Inventory - Enhanced */}
      <Grid item xs={12}>
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Events in Window
            </Typography>

            {/* Event Summary */}
            <Stack
              direction="row"
              spacing={2}
              mb={2}
              useFlexGap
              flexWrap="wrap"
            >
              <Chip
                color="primary"
                label={`Total Events: ${eventInventory?.total_events ?? 0}`}
              />
              <Chip
                color="secondary"
                label={`Total Devices: ${eventInventory?.total_devices ?? 0}`}
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

            {/* Device Counts Table */}
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Device Requirements by Category
              </Typography>
              <SimpleTable
                columns={eventDeviceColumns}
                rows={eventDeviceRows}
                emptyText="No device requirements"
                collapsible={true}
              />
            </Box>

            {/* Event Details Table */}
            <Box mb={2}>
              <Typography variant="subtitle1" gutterBottom>
                Event Details
              </Typography>
              <SimpleTable
                columns={eventDetailsColumns}
                rows={uniqueEvents}
                emptyText="No events found"
                collapsible={true}
              />
            </Box>
          </CardContent>
        </Card>
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
    </Grid>
  );
};

export default AdvanceSearchResultPage;