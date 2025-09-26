import {
  Box,
  Card,
  CardContent,
  Chip,
  Collapse,
  IconButton,
  List,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  Typography
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import { DownNarrow } from "../../../../components/icons/DownNarrow";
import { UpNarrowIcon } from "../../../../components/icons/UpNarrowIcon";
import {
  onAddAdvanceSearch,
  onAddSearchParameters,
} from "../../../../store/slices/searchBarResultSlice";
import UX from "./forecastInventory/UX";
import { AdvanceSearchContext } from "./RenderingFilters";
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
  collapsible = false,
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
  type,
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
            {type === 1 ? "Owned" : "Rented"} Inventory Details ({rows.length}{" "}
            items)
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
                <TableCell>Item</TableCell>
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
  const { advanceSearch, searchParameters } = useSelector(
    (state) => state.searchResult
  );
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [openAdvanceSearchModal, setOpenAdvanceSearchModal] = useState(false);
  const [periodUpdateOnly, setPeriodUpdateOnly] = useState(false); // New state

  // Get filter options for the search modal
  const structuredCompanyInventory = useQuery({
    queryKey: ["structuredCompanyInventory"],
    queryFn: () =>
      devitrakApi.post(`/db_company/company-inventory-structure`, {
        company_id: user.sqlInfo.company_id,
      }),
    enabled: !!user.sqlInfo.company_id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  // Prepare filter options for AdvanceSearchContext
  const filterOptions = useMemo(() => {
    if (!structuredCompanyInventory.data?.data?.inventory)
      return {
        category: [],
        group: [],
        brand: [],
        location: [],
      };

    const inventory = structuredCompanyInventory.data.data.inventory;
    const categories = [
      ...new Set(inventory.map((item) => item.category_name)),
    ].map((key) => ({ key }));
    const groups = [...new Set(inventory.map((item) => item.item_group))].map(
      (key) => ({ key })
    );
    const brands = [...new Set(inventory.map((item) => item.brand))].map(
      (key) => ({ key })
    );
    const locations = [...new Set(inventory.map((item) => item.location))].map(
      (key) => ({ key })
    );

    return {
      category: categories,
      group: groups,
      brand: brands,
      location: locations,
    };
  }, [structuredCompanyInventory.data]);

  const handleReturnNavigation = useCallback(() => {
    dispatch(onAddAdvanceSearch(null));
    dispatch(onAddSearchParameters(null));
    return navigate("/inventory");
  }, [dispatch, navigate]);

  const handleUpdatePeriodOnly = () => {
    setPeriodUpdateOnly(true);
    setOpenAdvanceSearchModal(true);
  };

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
  const dailyAnalysis = advanceSearch?.inventoryView ?? [];
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

  // Updated event columns to match new data structure
  const eventDeviceColumns = [
    { key: "category", title: "Category", dataIndex: "category" },
    { key: "group", title: "Item", dataIndex: "group" },
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
    // { key: "event_id", title: "Event ID", dataIndex: "event_id" },
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
    <AdvanceSearchContext.Provider value={filterOptions}>
      <UX
        allItems={allItems}
        dailyAnalysis={dailyAnalysis}
        eventDetailsColumns={eventDetailsColumns}
        eventDeviceColumns={eventDeviceColumns}
        eventDeviceRows={eventDeviceRows}
        eventInventory={eventInventory}
        handleReturnNavigation={handleReturnNavigation}
        handleUpdatePeriodOnly={handleUpdatePeriodOnly}
        locationData={locationData}
        openAdvanceSearchModal={openAdvanceSearchModal}
        overallSummary={overallSummary}
        ownedInventory={ownedInventory}
        period={period}
        periodUpdateOnly={periodUpdateOnly}
        rentalAnalysis={rentalAnalysis}
        rentedInventory={rentedInventory}
        RentedInventoryTable={RentedInventoryTable}
        searchParameters={searchParameters}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
        SimpleTable={SimpleTable}
        uniqueEvents={uniqueEvents}
        uniqueItemGroupsCount={uniqueItemGroupsCount}
      />
    </AdvanceSearchContext.Provider>
  );
};
export default AdvanceSearchResultPage;
