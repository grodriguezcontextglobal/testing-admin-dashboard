import { Box, Chip } from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../../api/devitrakApi";
import {
  onAddAdvanceSearch,
  onAddSearchParameters,
} from "../../../../store/slices/searchBarResultSlice";
import UX from "./forecastInventory/UX";
import { AdvanceSearchContext } from "./RenderingFilters";
import { RightNarrowInCircle } from "../../../../components/icons/RightNarrowInCircle";
import {
  onAddEventData,
  onAddExtraServiceListSetup,
  onAddExtraServiceNeeded,
  onAddQRCodeLink,
  onSelectCompany,
  onSelectEvent,
} from "../../../../store/slices/eventSlice";
import { onAddSubscription } from "../../../../store/slices/subscriptionSlice";
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

  const navigateToEvent = async (row) => {
    try {
      // Fetch event information
      const eventResponse = await devitrakApi.post(`/event/event-list`, {
        _id: row.event_id,
      });

      if (!eventResponse.data.ok) {
        console.error("Failed to fetch event information");
        return;
      }

      const selectedEventInfo = eventResponse.data.list?.at(-1);
      if (!selectedEventInfo) {
        console.error("No event information found");
        return;
      }

      // Fetch additional event information for SQL data
      const sqpFetchInfo = await devitrakApi.post(
        "/db_event/events_information",
        {
          zip_address: selectedEventInfo.eventInfoDetail.address
            .split(" ")
            .at(-1),
          event_name: selectedEventInfo.eventInfoDetail.eventName,
        }
      );

      // Dispatch Redux actions to store event information
      dispatch(onSelectEvent(selectedEventInfo.eventInfoDetail.eventName));
      dispatch(onSelectCompany(selectedEventInfo.company));

      if (sqpFetchInfo.data.ok) {
        dispatch(
          onAddEventData({
            ...selectedEventInfo,
            sql: sqpFetchInfo.data.events.at(-1),
          })
        );
      } else {
        dispatch(onAddEventData(selectedEventInfo));
      }

      dispatch(onAddSubscription(selectedEventInfo.subscription));
      dispatch(
        onAddQRCodeLink(
          selectedEventInfo.qrCodeLink ??
            `https://app.devitrak.net/?event=${encodeURI(
              selectedEventInfo.eventInfoDetail.eventName
            )}&company=${encodeURI(selectedEventInfo.company)}`
        )
      );
      dispatch(
        onAddExtraServiceListSetup(selectedEventInfo.extraServiceListSetup)
      );
      dispatch(onAddExtraServiceNeeded(selectedEventInfo.extraServiceNeeded));

      // Navigate to event quickglance
      navigate("/events/event-quickglance");
    } catch (error) {
      console.error("Error navigating to event:", error);
    }
  };

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
      key: "device_count",
      title: "Device Count",
      render: (row) => {
        // Calculate device quantity for this specific event from raw_events
        let totalQuantity = 0;

        if (eventInventory?.raw_events) {
          // Find the event that matches the current row's event_id
          const matchingEvent = eventInventory.raw_events.find(
            event => event._id === row.event_id
          );
          
          if (matchingEvent && matchingEvent.deviceSetup) {
            // Iterate through deviceSetup array to sum quantities for matching devices
            matchingEvent.deviceSetup.forEach((device) => {
              // Check if device matches search parameters
              const matchesCategory = !searchParameters?.category?.length || 
                searchParameters.category.includes(device.category);
              const matchesGroup = !searchParameters?.group?.length || 
                searchParameters.group.includes(device.group);
              // Note: brand matching would need to be added if brand info is available in deviceSetup
              
              // If device matches search criteria, add its quantity
              if (matchesCategory && matchesGroup) {
                totalQuantity += device.quantity || 0;
              }
            });
          }
        }
        
        return (
          <Chip 
            size="small" 
            color={totalQuantity > 0 ? "primary" : "default"} 
            label={totalQuantity} 
          />
        );
      },
    },
    {
      key: "",
      title: "Go to event",
      width: "5%",
      align:"right",
      render: (row) => {
        return (
          <button style={{outline: "none", backgroundColor: "transparent", margin:0, padding:0, border:"none"}} onClick={() => navigateToEvent(row)}>
            <RightNarrowInCircle />
          </button>
        );
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
        // RentedInventoryTable={RentedInventoryTable}
        searchParameters={searchParameters}
        setOpenAdvanceSearchModal={setOpenAdvanceSearchModal}
        // SimpleTable={SimpleTable}
        uniqueEvents={uniqueEvents}
        uniqueItemGroupsCount={uniqueItemGroupsCount}
      />
    </AdvanceSearchContext.Provider>
  );
};
export default AdvanceSearchResultPage;
