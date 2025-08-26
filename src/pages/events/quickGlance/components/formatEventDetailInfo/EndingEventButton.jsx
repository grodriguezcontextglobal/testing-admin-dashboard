import { Grid, Typography } from "@mui/material";
import { Button, notification, Popconfirm } from "antd";
import { groupBy } from "lodash";
import { Suspense, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import Loading from "../../../../../components/animation/Loading";
import { formatDate } from "../../../../../components/utils/dateFormat";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import ModalToDisplayFunctionInProgress from "./endEvent/ModalToDisplayFunctionInProgress";

const EndingEventButton = () => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [openEndingEventModal, setOpenEndingEventModal] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const dispatch = useDispatch();
  const [api, contextHolder] = notification.useNotification();
  
  const openNotificationWithIcon = (type, msg) => {
    api[type]({
      description: msg,
    });
  };

  const checkRequestSize = (data) => {
    const size = new Blob([JSON.stringify(data)]).size;
    const maxSize = 10 * 1024 * 1024; // 10MB limit
    
    if (size > maxSize) {
      throw new Error(`Request size (${(size / 1024 / 1024).toFixed(2)}MB) exceeds limit`);
    }
    
    return size;
  };

  const makeRequestWithRetry = async (apiCall, maxRetries = 3) => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (error.response?.status === 413) {
          if (attempt === maxRetries) {
            throw new Error("Request too large. Please contact support.");
          }
          // Wait before retry with exponential backoff
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
          continue;
        }
        throw error; // Re-throw non-413 errors immediately
      }
    }
  };

  const processBatch = async (items, batchSize = 50, processingFunction) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      try {
        checkRequestSize(batch);
        const batchResult = await processingFunction(batch);
        results.push(...(Array.isArray(batchResult) ? batchResult : [batchResult]));
        // Add small delay to prevent overwhelming the server
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }
    return results;
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
        employeesCompany[checkRole] = {
          ...employeesCompany[checkRole],
          active: false,
        };
      }
    }
    
    checkRequestSize({ employees: employeesCompany });
    await devitrakApi.patch(`/company/update-company/${user.companyData.id}`, {
      employees: employeesCompany,
    });
  };

  const inactiveTransactionDocuments = async () => {
    try {
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
    } catch (error) {
      openNotificationWithIcon(
        "error",
        `Failed to update transactions: ${error.message}`
      );
      throw error;
    }
  };

  const disabledEventAfterEndIt = async () => {
    try {
      const resp = await devitrakApi.patch(`/event/edit-event/${event.id}`, {
        active: false,
      });
      if (resp.data.ok) {
        dispatch(onAddEventData({ ...event, active: false }));
        setOpenEndingEventModal(false);
        return openNotificationWithIcon(
          "success",
          "Event is closed. Inventory is updated!"
        );
      }
    } catch (error) {
      openNotificationWithIcon("error", `${error.message}`);
    }
  };

  const retrieveEventInventory = async () => {
    const response = await devitrakApi.post("/receiver/receiver-pool-list", {
      eventSelected: event.eventInfoDetail.eventName,
      company: user.companyData.id,
    });
    if (response.data.ok) {
      return response.data.receiversInventory;
    }
  };

  const processStatusUpdateBatch = async (statusGroup) => {
    const [status, items] = statusGroup;
    const updateTime = formatDate(new Date());
    
    return await devitrakApi.post("/db_event/update-status-item-based-on-event", {
      status: { [status]: items },
      company_id: user.sqlInfo.company_id,
      event_id: event.sql.event_id,
      update_at: updateTime,
    });
  };

  const updateStatusItemsBeforeReturningItemsToInventory = async () => {
    try {
      const dataInventory = await retrieveEventInventory();
      
      // Instead of sending all data, send only essential fields
      const essentialData = dataInventory.map(item => ({
        device: item.device,
        status: item.status
      }));
      
      const sortingAscData = essentialData.sort((a, b) => {
        return a.device.localeCompare(b.device);
      });
      
      const groupingByStatus = groupBy(sortingAscData, "status");
      
      // Process each status group with batch processing
      const statusGroups = Object.entries(groupingByStatus);
      await processBatch(statusGroups, 5, processStatusUpdateBatch);
      
    } catch (error) {
      console.error("Error in updating status items:", error);
      throw error;
    }
  };

  const processInventoryReturnBatch = async (batch) => {
    const updateTime = formatDate(new Date());
    const results = [];
    
    for (let data of batch) {
      const result = await devitrakApi.post("/db_event/returning-item", {
        ...data.itemInfo,
        status: data.status,
        update_at: updateTime,
        company_id: user.sqlInfo.company_id,
      });
      results.push(result);
    }
    
    return results;
  };

  const returningItemsInInventoryAfterEndingEvent = async () => {
    try {
      const dataInventory = await retrieveEventInventory();
      const sortingAscData = dataInventory.sort((a, b) => {
        return a.device.localeCompare(b.device);
      });
      
      if (sortingAscData.length === 0) return;
      
      const sqlDb = await devitrakApi.post("/db_item/consulting-item", {
        company_id: user.sqlInfo.company_id,
        warehouse: 0,
        "serial_number >=": sortingAscData[0].device,
        "serial_number <=": sortingAscData.at(-1).device,
      });
      
      if (sqlDb.data.ok) {
        const groupingBySerialNumber = groupBy(sqlDb.data.items, "serial_number");
        
        // Prepare data for batch processing
        const itemsToProcess = sortingAscData.map(data => ({
          itemInfo: groupingBySerialNumber[data.device][0],
          status: data.status
        }));
        
        // Process in batches to avoid large requests
        await processBatch(itemsToProcess, 25, processInventoryReturnBatch);
      }
    } catch (error) {
      console.error("Error in returning items to inventory:", error);
      throw error;
    }
  };

  const renderingByConditionTypeof = (props) => {
    if (typeof props === "string") {
      return props;
    } else {
      if (props) {
        return "In-Use";
      }
      return "Returned";
    }
  };

  const processRecordBatch = async (batch) => {
    const groupingInventoryByGroupName = groupBy(event.deviceSetup, "group");
    const results = [];
    
    for (let data of batch) {
      const result = await devitrakApi.post("/db_record/inserting-record", {
        email: data.user,
        serial_number: data.device.serialNumber,
        status: renderingByConditionTypeof(data.device.status),
        activity: data.device.status,
        payment_id: data.paymentIntent,
        event: event.eventInfoDetail.eventName,
        item_group: data.device.deviceType,
        category_name:
          groupingInventoryByGroupName[data.device.deviceType].at(-1)
            .category,
      });
      results.push(result);
    }
    
    return results;
  };

  const addingRecordOfActivityInEvent = async () => {
    try {
      const retrieveAssignedDevices = await devitrakApi.post(
        "/receiver/receiver-assigned-list",
        {
          eventSelected: event.eventInfoDetail.eventName,
          company: user.companyData.id,
        }
      );
      
      if (retrieveAssignedDevices.data.ok) {
        const dataToStoreAsRecord = retrieveAssignedDevices.data.listOfReceivers;
        
        // Process records in batches to avoid large requests
        await processBatch(dataToStoreAsRecord, 30, processRecordBatch);
      }
    } catch (error) {
      console.error("Error in adding record of activity:", error);
      return null;
    }
  };

  const updatingItemInDB = async () => {
    setOpenEndingEventModal(true);
    setProgress(0);

    try {
      setCurrentStep("Updating item status...");
      await updateStatusItemsBeforeReturningItemsToInventory();
      setProgress(20);

      setCurrentStep("Returning items to inventory...");
      await returningItemsInInventoryAfterEndingEvent();
      setProgress(40);

      setCurrentStep("Updating transaction documents...");
      await inactiveTransactionDocuments();
      setProgress(60);

      setCurrentStep("Recording activity...");
      await addingRecordOfActivityInEvent();
      setProgress(80);

      setCurrentStep("Removing staff access...");
      await removingAccessFromStaffMemberOnly();
      setProgress(90);

      setCurrentStep("Finalizing event closure...");
      await disabledEventAfterEndIt();
      setProgress(100);

      return window.location.reload();
    } catch (error) {
      openNotificationWithIcon(
        "error",
        `Event closure failed: ${error.message}`
      );
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
          <Popconfirm
            disabled={!event.active}
            title="Are you sure? This action can not be reversed."
            onConfirm={() => updatingItemInDB()}
            overlayInnerStyle={{
              display: openEndingEventModal ? "none" : "flex",
            }}
            className="popconfirm-event-end"
          >
            <Button
              style={{
                ...BlueButton,
                ...CenteringGrid,
                width: "100%",
                background: `${
                  event.active
                    ? "var(--blue-dark-600)"
                    : "var(--disabled-blue-button)"
                }`,
              }}
            >
              <Typography textTransform={"none"} style={BlueButtonText}>
                &nbsp;End event
              </Typography>
            </Button>
          </Popconfirm>
        </Grid>
      </Grid>
      {openEndingEventModal && (
        <ModalToDisplayFunctionInProgress
          openEndingEventModal={openEndingEventModal}
          progress={progress}
          currentStep={currentStep}
        />
      )}
    </Suspense>
  );
};

export default EndingEventButton;
