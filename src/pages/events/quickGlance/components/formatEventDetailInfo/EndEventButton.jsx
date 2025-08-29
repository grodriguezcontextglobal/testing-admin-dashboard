import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { notification } from "antd";
import { groupBy } from "lodash";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import checkTypeFetchResponse from "../../../../../components/utils/checkTypeFetchResponse";
import { formatDate } from "../../../../../components/utils/dateFormat";
import BlueButtonConfirmationComponent from "../../../../../components/UX/buttons/BlueButtonConfirmation";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";

const ModalToDisplayFunctionInProgress = lazy(() =>
  import("./endEvent/ModalToDisplayFunctionInProgress")
);

const EndEventButton = () => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [openEndingEventModal, setOpenEndingEventModal] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: "" });
  const dispatch = useDispatch();
  const staffRemoveAccessRef = useRef([]);

  // Batch processing utilities - Updated to 30MB limit
  const checkRequestSize = (data) => {
    const size = new Blob([JSON.stringify(data)]).size;
    const maxSize = 30 * 1024 * 1024; // 30MB limit (increased from 10MB)
    
    if (size > maxSize) {
      throw new Error(`Request size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds 30MB limit`);
    }
    
    return size;
  };

  const calculateOptimalBatchSize = (sampleItem, maxSizeBytes = 30 * 1024 * 1024) => {
    if (!sampleItem) return 150; // Increased default batch size from 50 to 150
    
    const sampleSize = new Blob([JSON.stringify(sampleItem)]).size;
    const estimatedBatchSize = Math.floor(maxSizeBytes * 0.8 / sampleSize); // Use 80% of limit for safety
    return Math.max(1, Math.min(estimatedBatchSize, 300)); // Increased max from 100 to 300 items per batch
  };

  const makeRequestWithRetry = async (apiCall, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 413) {
          if (attempt === maxRetries) {
            throw new Error("Request too large after retries. Please contact support.");
          }
          // Wait before retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw error; // Re-throw non-413 errors immediately
      }
    }
  };

  const processBatch = async (items, initialBatchSize = 150, processingFunction, progressCallback) => {
    if (!items || items.length === 0) return [];
    
    let batchSize = initialBatchSize; // Increased from 50 to 150
    const results = [];
    
    // Calculate optimal batch size based on first item
    if (items.length > 0) {
      batchSize = calculateOptimalBatchSize(items[0]);
    }
    
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      let currentBatchSize = batch.length;
      
      while (currentBatchSize > 0) {
        const currentBatch = batch.slice(0, currentBatchSize);
        
        try {
          checkRequestSize(currentBatch);
          const batchResult = await makeRequestWithRetry(() => processingFunction(currentBatch));
          results.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]));
          
          // Update progress if callback provided
          if (progressCallback) {
            progressCallback(i + currentBatchSize, items.length);
          }
          
          // Add small delay to prevent overwhelming the server
          await new Promise((resolve) => setTimeout(resolve, 100));
          break; // Success, move to next batch
          
        } catch (error) {
          if (error.message.includes('exceeds 30MB limit') && currentBatchSize > 1) {
            // Reduce batch size and try again
            currentBatchSize = Math.floor(currentBatchSize / 2);
            console.warn(`Reducing batch size to ${currentBatchSize} due to size limit`);
            continue;
          }
          
          console.error(`Error processing batch ${Math.floor(i / batchSize) + 1}:`, error);
          throw error;
        }
      }
    }
    return results;
  };

  // Query definitions with pagination support
  const listOfInventoryQuery = useQuery({
    queryKey: ["listOfInventory"],
    queryFn: () => devitrakApi.get("/inventory/list-inventories"),
    refetchOnMount: false,
  });

  const listOfItemsInInventoryQuery = useQuery({
    queryKey: ["listOfItemsInInventory"],
    queryFn: () =>
      devitrakApi.get("/item/list-items", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
    refetchOnMount: false,
  });

  const itemsInPoolQuery = useQuery({
    queryKey: ["listOfItemsInInventoryPOST"],
    queryFn: () =>
      devitrakApi.post("/item/list-items", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
    refetchOnMount: false,
  });

  const eventInventoryQuery = useQuery({
    queryKey: ["inventoryInEventList"],
    queryFn: () =>
      devitrakApi.get(
        `/receiver/receiver-pool-list?eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      ),
    refetchOnMount: false,
  });

  const transactionsRecordQuery = useQuery({
    queryKey: ["transactionList"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const sqlDBCompanyStockQuery = useQuery({
    queryKey: ["allDevicesOutOfCompanyStock"],
    queryFn: () =>
      devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        warehouse: false,
      }),
    refetchOnMount: false,
  });

  const sqlDBInventoryEventQuery = useQuery({
    queryKey: ["allInventoryOfSpecificEvent"],
    queryFn: () =>
      devitrakApi.post(`/db_event/event-inventory/${event.sql.event_id}`, {
        company: user.companyData.company_name,
        warehouse: false,
      }),
    refetchOnMount: false,
  });

  let trigger = false;

  useEffect(() => {
    const controller = new AbortController();
    listOfInventoryQuery.refetch();
    listOfItemsInInventoryQuery.refetch();
    itemsInPoolQuery.refetch();
    eventInventoryQuery.refetch();
    transactionsRecordQuery.refetch();
    sqlDBCompanyStockQuery.refetch();
    sqlDBInventoryEventQuery.refetch();
    return () => {
      controller.abort();
    };
  }, [trigger === true]);

  const [api, contextHolder] = notification.useNotification();
  const openNotificationWithIcon = (type, msg) => {
    api.open({
      message: msg,
    });
  };

  const removingAccessFromStaffMemberOnly = async () => {
    const checkCompanyUserSet = user.companyData.employees;
    let employeesCompany = [...checkCompanyUserSet];
    const adminStaff = event.staff.adminUser ?? [];
    const headsetStaff = event.staff.headsetAttendees ?? [];
    const employeesEvent = [...adminStaff, ...headsetStaff];
    
    for (let data of employeesEvent) {
      const checkRole = employeesCompany.findIndex(
        (element) => element.user === data.email
      );
      if (
        Number(employeesCompany[checkRole].role) > 3 &&
        employeesCompany[checkRole].active
      ) {
        staffRemoveAccessRef.current = [
          ...staffRemoveAccessRef.current,
          data.email,
        ];
        employeesCompany[checkRole] = {
          ...employeesCompany[checkRole],
          active: false,
        };
      }
    }
    
    const requestData = { employees: employeesCompany };
    
    try {
      checkRequestSize(requestData);
      await makeRequestWithRetry(() => 
        devitrakApi.patch(`/company/update-company/${user.companyData.id}`, requestData)
      );
    } catch (error) {
      if (error.message.includes('exceeds 30MB limit')) {
        // Process employees in batches if the payload is too large
        const batchSize = calculateOptimalBatchSize(employeesCompany[0] || {});
        
        for (let i = 0; i < employeesCompany.length; i += batchSize) {
          const batch = employeesCompany.slice(i, i + batchSize);
          await makeRequestWithRetry(() => 
            devitrakApi.patch(`/company/update-company/${user.companyData.id}`, {
              employees: batch,
              batchUpdate: true,
              batchIndex: Math.floor(i / batchSize)
            })
          );
        }
      } else {
        throw error;
      }
    }
    
    setOpenEndingEventModal(false);
    // return window.location.reload();
    return alert("Event is closed. Inventory is updated!");
  };

  // const groupingByCompany = groupBy(
  //   listOfInventoryQuery?.data?.data?.listOfItems,
  //   "company"
  // );

  // const findInventoryStored = () => {
  //   if (groupingByCompany[user.company]) {
  //     const groupingByEvent = groupBy(groupingByCompany[user.company], "event");
  //     if (groupingByEvent[event.eventInfoDetail.eventName]) {
  //       return groupingByEvent[event.eventInfoDetail.eventName];
  //     }
  //   }
  //   return [];
  // };

  const findItemsInPoolEvent = () => {
    const listOfItemsInPoolQuery =
      itemsInPoolQuery?.data?.data?.receiversInventory;
    if (listOfItemsInPoolQuery?.length > 0) {
      return listOfItemsInPoolQuery;
    }
    return [];
  };

  const sqlDeviceFinalStatusAtEventFinished = async () => {
    setProgress(prev => ({ ...prev, step: "Processing device status updates..." }));
    
    const listOfDevicesInEvent = await eventInventoryQuery?.data?.data?.receiversInventory;
    const dataToIterate = checkTypeFetchResponse(listOfDevicesInEvent);
    const groupingDevicesFromNoSQL = groupBy(dataToIterate, "device");
    const allInventoryOfEvent = sqlDBInventoryEventQuery?.data?.data?.result;
    const eventId = event.sql.event_id;
    const companyId = user.sqlInfo.company_id;
    const update_at = formatDate(new Date());

    // Process device status updates in batches
    const deviceEntries = Object.entries(groupingDevicesFromNoSQL);
    const inventoryEntries = Array.isArray(allInventoryOfEvent) ? allInventoryOfEvent : [];
    
    // Split large datasets into manageable chunks - increased inventory batch size
    const processDeviceStatusBatch = async (batch) => {
      const batchGrouping = {};
      batch.forEach(([key, value]) => {
        batchGrouping[key] = value;
      });
      
      return await makeRequestWithRetry(() => 
        devitrakApi.post("/db_event/device-final-status-refactored", {
          groupingDevicesFromNoSQL: JSON.stringify(batchGrouping),
          allInventoryOfEvent: JSON.stringify(inventoryEntries.slice(0, 300)), // Increased from 100 to 300
          eventId: eventId,
          update_at: update_at,
        })
      );
    };

    const processReturningItemBatch = async (batch) => {
      const batchGrouping = {};
      batch.forEach(([key, value]) => {
        batchGrouping[key] = value;
      });
      
      return await makeRequestWithRetry(() => 
        devitrakApi.post("/db_event/returning-item-refactored", {
          groupingDevicesFromNoSQL: JSON.stringify(batchGrouping),
          allInventoryOfEvent: JSON.stringify(inventoryEntries.slice(0, 300)), // Increased from 100 to 300
          companyId: companyId,
          update_at: update_at,
        })
      );
    };

    // Process device status updates
    await processBatch(
      deviceEntries, 
      calculateOptimalBatchSize(deviceEntries[0]), 
      processDeviceStatusBatch,
      (current, total) => setProgress(prev => ({ ...prev, current, total }))
    );

    // Process returning items
    await processBatch(
      deviceEntries, 
      calculateOptimalBatchSize(deviceEntries[0]), 
      processReturningItemBatch,
      (current, total) => setProgress(prev => ({ ...prev, current, total }))
    );
  };

  const groupingItemsByCompany = groupBy(
    listOfItemsInInventoryQuery?.data?.data?.listOfItems,
    "company"
  );

  const itemsPerCompany = () => {
    if (groupingItemsByCompany[user.company]) {
      const groupingByGroup = groupBy(
        groupingItemsByCompany[user.company],
        "group"
      );
      return groupingByGroup;
    }
    return [];
  };

  const checkItemsInUseToUpdateInventory = () => {
    const result = {};
    for (let data of findItemsInPoolEvent()) {
      if (data.activity || `${data.status}`.toLowerCase() === "lost") {
        if (!result[data.type]) {
          result[data.type] = 1;
        } else {
          result[data.type]++;
        }
      }
    }
    return Object.entries(result);
  };

  const returningItemsInInventoryAfterEndingEvent = () => {
    const totalResult = new Set();
    for (let device of event.deviceSetup) {
      if (checkItemsInUseToUpdateInventory()?.length > 0) {
        for (let data of checkItemsInUseToUpdateInventory()) {
          if (device.group === data[0]) {
            const quantityResult = Number(device.quantity) - data[1];
            const profile = {
              ...device,
              quantity: quantityResult,
            };
            totalResult.add(profile);
          } else {
            totalResult.add(device);
          }
        }
      } else {
        totalResult.add(device);
      }
    }
    return Array.from(totalResult);
  };

  const inactiveEventAfterEndIt = async () => {
    try {
      setProgress(prev => ({ ...prev, step: "Deactivating event..." }));
      
      const removingTemporalStaff = [...staffRemoveAccessRef.current];
      const allStaffEvent = [...event.staff.headsetAttendees];
      const result = new Set();
      
      for (const data of allStaffEvent) {
        if (!removingTemporalStaff.includes(data.email)) {
          result.add(data);
        }
      }
      
      const requestData = {
        active: false,
        "staff.headsetAttendees": Array.from(result),
      };
      
      checkRequestSize(requestData);
      
      const resp = await makeRequestWithRetry(() => 
        devitrakApi.patch(`/event/edit-event/${event.id}`, requestData)
      );
      
      if (resp.data.ok) {
        dispatch(onAddEventData({ ...event, active: false }));
        return openNotificationWithIcon(
          "success",
          "Event is closed. Inventory is updated!"
        );
      }
    } catch (error) {
      openNotificationWithIcon("error", `${error.message}`);
    }
  };

  const addingRecordOfActivityInEvent = async () => {
    try {
      setProgress(prev => ({ ...prev, step: "Adding activity records..." }));
      
      const groupingInventoryByGroupName = groupBy(event.deviceSetup, "group");
      const dataToStoreAsRecord = transactionsRecordQuery?.data?.data?.listOfReceivers;
      const eventName = event.eventInfoDetail.eventName;
      
      // Check if the combined data exceeds size limit
      const requestData = {
        groupingInventoryByGroupName,
        dataToStoreAsRecord,
        event: eventName,
      };
      
      try {
        checkRequestSize(requestData);
        await makeRequestWithRetry(() => 
          devitrakApi.post("/db_record/inserting-record-refactored", requestData)
        );
      } catch (error) {
        if (error.message.includes('exceeds 30MB limit')) {
          // Process records in batches
          const processRecordBatch = async (batch) => {
            return await makeRequestWithRetry(() => 
              devitrakApi.post("/db_record/inserting-record-refactored", {
                groupingInventoryByGroupName,
                dataToStoreAsRecord: batch,
                event: eventName,
              })
            );
          };
          
          await processBatch(
            dataToStoreAsRecord || [], 
            calculateOptimalBatchSize(dataToStoreAsRecord?.[0]), 
            processRecordBatch,
            (current, total) => setProgress(prev => ({ ...prev, current, total }))
          );
        } else {
          throw error;
        }
      }
    } catch (error) {
      console.error("Error in adding record of activity:", error);
      return null;
    }
  };

  const inactiveTransactionDocuments = async () => {
    setProgress(prev => ({ ...prev, step: "Updating transaction documents..." }));
    
    const requestData = {
      find: {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      },
      update: {
        active: false,
      },
    };
    
    checkRequestSize(requestData);
    
    const updatingTransactionDocuments = await makeRequestWithRetry(() => 
      devitrakApi.post("/transaction/update-multiple-documents", requestData)
    );
    
    if (updatingTransactionDocuments.data.ok) {
      return updatingTransactionDocuments.data.list;
    }
  };

  const updateInventoryItemsBatch = async (items) => {
    const processItemBatch = async (batch) => {
      const results = [];
      for (let data of batch) {
        if (itemsPerCompany()[data.group]) {
          const newQty = `${
            Number(itemsPerCompany()[data.group].at(-1).quantity) +
            Number(data.quantity)
          }`;
          
          const result = await makeRequestWithRetry(() => 
            devitrakApi.patch(
              `/item/edit-item/${itemsPerCompany()[data.group].at(-1)._id}`,
              { quantity: newQty }
            )
          );
          results.push(result);
        }
      }
      return results;
    };
    
    await processBatch(
      items, 
      calculateOptimalBatchSize(items[0]), 
      processItemBatch,
      (current, total) => setProgress(prev => ({ ...prev, current, total }))
    );
  };

  const updatingItemInDB = async () => {
    setOpenEndingEventModal(true);
    setProgress({ current: 0, total: 0, step: "Starting event closure..." });

    try {
      // Update inventory items in batches
      const itemsToUpdate = returningItemsInInventoryAfterEndingEvent();
      if (itemsToUpdate?.length > 0) {
        setProgress(prev => ({ ...prev, step: "Updating inventory quantities..." }));
        await updateInventoryItemsBatch(itemsToUpdate);
      }

      // Process SQL device status updates
      await sqlDeviceFinalStatusAtEventFinished();

      // Add activity records
      await addingRecordOfActivityInEvent();

      // Deactivate event
      await inactiveEventAfterEndIt();

      // Update transaction documents
      await inactiveTransactionDocuments();

      // Remove staff access
      setProgress(prev => ({ ...prev, step: "Removing staff access..." }));
      return await removingAccessFromStaffMemberOnly();
      
    } catch (error) {
      openNotificationWithIcon("error", `Event closure failed: ${error.message}`);
      setOpenEndingEventModal(false);
    }
  };

  return (
    <Suspense
      fallback={
        <div style={CenteringGrid}>
          <Loading />
        </div>
      }
    >
      {contextHolder}
      <Grid
        display={"flex"}
        justifyContent={"space-around"}
        alignSelf={"stretch"}
        alignItems={"center"}
        container
      >
        <Grid
          display={"flex"}
          justifyContent={"left"}
          alignItems={"center"}
          textAlign={"left"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <BlueButtonConfirmationComponent 
            title={"End event"}
            func={updatingItemInDB}
            confirmationTitle="Are you sure? This action can not be reversed."
            styles={{ width:"100%"}}
          />
        </Grid>
      </Grid>
      {openEndingEventModal && (
        <ModalToDisplayFunctionInProgress
          openEndingEventModal={openEndingEventModal}
          progress={progress}
        />
      )}
    </Suspense>
  );
};

export default EndEventButton;