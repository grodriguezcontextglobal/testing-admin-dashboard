import { useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { groupBy } from "lodash";
import { useCallback, useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { utils, writeFile } from "xlsx";
import { devitrakApi } from "../../../../api/devitrakApi";
import checkTypeFetchResponse from "../../../../components/utils/checkTypeFetchResponse";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
const NO_ROWS = [];

// Every query key carries the event, so one event's cached rows are never
// exported for another. The four queries the old mount effect refetched by
// hand use refetchOnMount: "always" instead.
const SpreadSheet = () => {
  const [fileName, setFileName] = useState("");
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const eventName = event.eventInfoDetail.eventName;
  const companyId = user.companyData.id;
  const inventoryEventStatus = useQuery({
    queryKey: ["event_inventory_query", event.sql?.event_id],
    queryFn: () =>
      devitrakApi.get(`/db_event/event-inventory/${event.sql.event_id}`),
    refetchOnMount: "always",
  });

  const transactionDeviceRecordInEvent = useQuery({
    queryKey: ["transactionAndDeviceRecord", eventName, companyId],
    queryFn: () =>
      devitrakApi.get(
        `/receiver/receiver-pool-list?eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
      ),
    refetchOnMount: "always",
  });

  const transactionPlusUserInfo = useQuery({
    queryKey: ["transactionPlusUserInfo", eventName, companyId],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    refetchOnMount: "always",
  });

  const transactionInfo = useQuery({
    queryKey: ["transactionInfo", eventName, event.company],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        "device.deviceNeeded": 0,
      }),
    refetchOnMount: false,
  });

  const cashReportQuery = useQuery({
    queryKey: ["cashReportPerEvent", event.id, companyId],
    queryFn: () =>
      devitrakApi.post("/cash-report/cash-reports", {
        event: event.id,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const consumersDataQuery = useQuery({
    queryKey: ["consumersDataQuery", event.id, companyId],
    queryFn: () =>
      devitrakApi.get(
        `/auth/user-query?event_providers=${event.id}&company_providers=${user.companyData.id}`,
      ),
    refetchOnMount: "always",
  });

  // The rows stay empty until every source has answered.
  const reportReady = Boolean(
    transactionDeviceRecordInEvent.data &&
      transactionPlusUserInfo.data &&
      transactionInfo.data &&
      cashReportQuery.data &&
      inventoryEventStatus.data,
  );
  const allTransaction = reportReady
    ? transactionPlusUserInfo.data.data.listOfReceivers
    : NO_ROWS;
  const itemsUsers = allTransaction;
  const defectedItems = reportReady
    ? transactionDeviceRecordInEvent.data.data.receiversInventory
    : NO_ROWS;
  const allServiceTransaction = reportReady
    ? transactionInfo.data.data.list
    : NO_ROWS;
  const reportCash = reportReady ? cashReportQuery.data.data.report : NO_ROWS;
  const eventInventory = reportReady
    ? inventoryEventStatus.data.data.result
    : NO_ROWS;

  const [messageApi, contextHolder] = message.useMessage();
  const success = useCallback(() => {
    messageApi.open({
      type: "success",
      content: "xlsx file generated and downloading.",
    });
  }, [messageApi]);

  const defectedDevicesInfo = () => {
    const result = new Set();
    const dataToIterate = checkTypeFetchResponse(defectedItems);
    for (const data of dataToIterate) {
      if (data.status !== "Operational") {
        result.add(data);
      }
    }
    return Array.from(result);
  };

  const generateExcelFile = async () => {
    // Create a new workbook
    const wb = utils.book_new();

    // Your data array
    const data = itemsUsers;

    // Sheet2 config (Details)
    const headers2 = [
      "User - First name",
      "User - Last name",
      "User - Email",
      "User - Phone number",
      "Device - Serial number",
      "Device - Device type",
      "Status",
      "Event",
      "Date - Assigned device",
    ];

    // Convert data to worksheet format for Sheet2 (all data in detail)
    const wsDataDetail = [
      headers2,
      ...data.map((item) => [
        item?.userInfo?.name,
        item?.userInfo?.lastName,
        item?.user,
        item?.userInfo?.phoneNumber,
        item?.device?.serialNumber,
        item?.device?.deviceType,
        item?.device?.status ? "in-Use" : "in-Stock",
        item?.eventSelected.join(", "), // Convert array to comma-separated string
        Date(item.timeStamp).toString(),
      ]),
    ];

    // Add Sheet2 to the workbook
    const wsSheet2 = utils.aoa_to_sheet(wsDataDetail);

    // Set cell styles for Sheet1
    wsSheet2["!cols"] = [
      { width: 25 },
      { width: 25 },
      { width: 30 },
      { width: 25 },
      { width: 30 },
      { width: 25 },
      { width: 30 },
      { width: 25 },
      { width: 30 },
    ];
    // Add filters to the header (first row)
    wsSheet2["!autofilter"] = { ref: "A1:I1" };

    utils.book_append_sheet(wb, wsSheet2, "Details");
    const headers3 = ["Device", "Device type", "Device Status", "Comment"];
    const data2 = defectedDevicesInfo();

    // Convert data to worksheet format for Sheet3 (all data in detail)
    const wsDataDefected = [
      headers3,
      ...data2.map((item) => [
        item.device,
        item.type,
        item.status,
        item.comment,
      ]),
    ];

    // Add Sheet3 to the workbook
    const wsSheet3 = utils.aoa_to_sheet(wsDataDefected);

    // Set cell styles for Sheet1
    wsSheet3["!cols"] = [
      { width: 25 },
      { width: 25 },
      { width: 30 },
      { width: 25 },
      { width: 30 },
    ];
    // Add filters to the header (first row)
    wsSheet3["!autofilter"] = { ref: "A1:E1" };

    utils.book_append_sheet(wb, wsSheet3, "Defective_and_Lost devices");

    //all transaction and device check out during the event
    // Your data array
    const data4 = allTransaction;

    // Sheet2 config (Details)
    const headers4 = [
      "User - First name",
      "User - Last name",
      "User - Email",
      "User - Phone number",
      "User - Group name",
      "Transaction Reference ID",
      "Payment ID",
      "Device - Serial number",
      "Device - Device type",
      "Device returned",
      "Device checked out",
    ];
    //grouping consumer
    const groupingByConsumer = groupBy(
      consumersDataQuery.data.data.users,
      "email",
    );
    // Convert data to worksheet format for Sheet4 (all data in detail)
    const wsDataDetail4 = [
      headers4,
      ...data4.map((item) => [
        item?.userInfo?.name,
        item?.userInfo?.lastName,
        item?.user,
        item?.userInfo?.phoneNumber,
        groupingByConsumer[item?.user]?.at(-1)?.groupName?.at(-1),
        item?._id,
        item?.paymentIntent,
        item?.device?.serialNumber,
        item?.device?.deviceType,
        item?.device?.status ? "No" : "Yes",
        Date(item?.timeStamp).toString(),
      ]),
    ];

    // Add Sheet4 to the workbook
    const wsSheet4 = utils.aoa_to_sheet(wsDataDetail4);

    // Set cell styles for Sheet1
    wsSheet4["!cols"] = [
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
    ];
    // Add filters to the header (first row)
    wsSheet4["!autofilter"] = { ref: "A1:K1" };

    utils.book_append_sheet(wb, wsSheet4, "All device transactions");

    // Your data array
    const data5 = allServiceTransaction;

    // Sheet2 config (Details)
    const headers5 = [
      "User - First name",
      "User - Last name",
      "User - Email",
      "User - Phone number",
      "User - Group name",
      "Transaction Reference ID",
      "Payment ID",
      "Device - Service",
      "Device - Amount ($)",
    ];
    // Convert data to worksheet format for Sheet4 (all data in detail)
    const wsDataDetail5 = [
      headers5,
      ...data5.map((item) => [
        item.consumerInfo.name,
        item.consumerInfo.lastName,
        item.consumerInfo.email,
        item.consumerInfo.phoneNumber,
        item.consumerInfo.groupName.at(-1),
        item._id,
        item.paymentIntent,
        item.device[0].deviceType,
        item.device[0].deviceValue,
      ]),
    ];

    // Add Sheet4 to the workbook
    const wsSheet5 = utils.aoa_to_sheet(wsDataDetail5);

    // Set cell styles for Sheet1
    wsSheet5["!cols"] = [
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
    ];
    // Add filters to the header (first row)
    wsSheet5["!autofilter"] = { ref: "A1:I1" };

    utils.book_append_sheet(wb, wsSheet5, "All service transactions");

    // Your data array
    const data6 = reportCash;

    // Sheet2 config (Details)
    const headers6 = [
      "User - First name",
      "User - Last name",
      "User - Email",
      "User - Phone number",
      "User - Group name",
      "Device - Serial Number",
      "Device - Type",
      "Staff collected amount",
      "Amount collected ($)",
      "Transaction type",
    ];
    // Convert data to worksheet format for Sheet4 (all data in detail)
    const wsDataDetail6 = [
      headers6,
      ...data6.map((item) => [
        groupingByConsumer[item.attendee].at(-1).name,
        groupingByConsumer[item.attendee].at(-1).lastName,
        groupingByConsumer[item.attendee].at(-1).email,
        groupingByConsumer[item.attendee].at(-1).phoneNumber,
        groupingByConsumer[item.attendee].at(-1).groupName.at(-1),
        item.deviceLost[0].label,
        item.deviceLost[0].deviceType,
        item.admin,
        item.amount,
        item.typeCollection,
      ]),
    ];

    // Add Sheet4 to the workbook
    const wsSheet6 = utils.aoa_to_sheet(wsDataDetail6);

    // Set cell styles for Sheet1
    wsSheet6["!cols"] = [
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
    ];
    // Add filters to the header (first row)
    wsSheet6["!autofilter"] = { ref: "A1:J1" };

    utils.book_append_sheet(wb, wsSheet6, "Cash report");
    //report ll inventory in event
    const data7 = eventInventory;

    // Sheet2 config (Details)
    const headers7 = [
      "Category name",
      "Group name",
      "Brand",
      "Serial number",
      "Ownership",
    ];
    // Convert data to worksheet format for Sheet4 (all data in detail)
    const wsDataDetail7 = [
      headers7,
      ...data7.map((item) => [
        item?.category_name,
        item?.item_group,
        item?.brand,
        item?.serial_number,
        item?.ownership === "Rent" ? "Rented" : item?.ownership,
      ]),
    ];

    // Add Sheet4 to the workbook
    const wsSheet7 = utils.aoa_to_sheet(wsDataDetail7);

    // Set cell styles for Sheet1
    wsSheet7["!cols"] = [
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
      { width: 30 },
    ];
    // Add filters to the header (first row)
    wsSheet7["!autofilter"] = { ref: "A1:E1" };

    utils.book_append_sheet(wb, wsSheet7, "All inventory of event");

    // Device Summary sheet
    const inventoryByGroup = groupBy(eventInventory, "item_group");
    const deviceSummary = Object.keys(inventoryByGroup).map((groupName) => {
      const totalAllocated = inventoryByGroup[groupName].length;
      const transactionsForGroup = allTransaction.filter(
        (t) => t.device?.deviceType === groupName,
      );
      const totalInUse = transactionsForGroup.filter(
        (t) => t.device?.status,
      ).length;
      const totalReturned = transactionsForGroup.filter(
        (t) => !t.device?.status,
      ).length;
      return {
        typeName: groupName,
        totalAllocated: totalAllocated,
        totalReturned: totalReturned,
        totalInUse: totalInUse,
      };
    });

    const headers8 = [
      "Type Name",
      "Total Allocated to Event",
      "Total Returned",
      "Total In Use",
    ];
    const wsDataDetail8 = [
      headers8,
      ...deviceSummary.map((summary) => [
        summary.typeName,
        summary.totalAllocated,
        summary.totalReturned,
        summary.totalInUse,
      ]),
    ];
    const wsSheet8 = utils.aoa_to_sheet(wsDataDetail8);
    wsSheet8["!cols"] = [
      { width: 30 },
      { width: 25 },
      { width: 20 },
      { width: 20 },
    ];
    wsSheet8["!autofilter"] = { ref: "A1:D1" };
    utils.book_append_sheet(wb, wsSheet8, "Device Summary");

    // Generate a random file name (you can customize this logic)
    const newFileName = `excel_${Date.now()}.xlsx`;

    // Write the workbook to a file
    await writeFile(wb, newFileName);

    // Set the generated file name to state
    setFileName(newFileName);
  };

  useEffect(() => {
    if (fileName === "") return undefined;
    success();
    const timer = setTimeout(() => {
      setFileName("");
    }, 3000);
    return () => clearTimeout(timer);
  }, [fileName, success]);

  return (
    <div style={{ margin: "0 0 0.5rem" }}>
      <GrayButtonComponent
        title={"Export record (xlsx format)"}
        func={generateExcelFile}
        styles={{ width: "100%" }}
        titleStyles={{
          textTransform: "none",
          textAlign: "left",
        }}
      />
      {/* <button
        onClick={generateExcelFile}
        style={{ ...GrayButton, width: "100%" }}
      >
        <p
          style={{
            ...GrayButtonText,
            margin: "auto",
            textTransform: "none",
            textAlign: "left",
          }}
        >
          <XLSXIcon /> Export record (
          <span style={{ textDecoration: "underline" }}>xlsx format</span>)
        </p>
      </button> */}
      {fileName && (
        <>
          <a href={fileName} download={fileName}>
            Downloading Excel File
          </a>
          {contextHolder}
        </>
      )}
    </div>
  );
};

export default SpreadSheet;
