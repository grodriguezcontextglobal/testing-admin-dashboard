import { useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { utils, writeFile } from "xlsx";
import { devitrakApi } from "../../../../api/devitrakApi";
import { XLSXIcon } from "../../../../components/icons/XLSXIcon";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import { groupBy } from "lodash";
const SpreadSheet = () => {
  const [fileName, setFileName] = useState("");
  const [itemsUsers, setItemsUsers] = useState([]);
  const [allTransaction, setAllTransaction] = useState([]);
  const [allServiceTransaction, setAllServiceTransaction] = useState([]);
  const [defectedItems, setDefectedItems] = useState([]);
  const [reportCash, setReportCash] = useState([]);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const transactionDeviceRecordInEvent = useQuery({
    queryKey: ["transactionAndDeviceRecord"],
    queryFn: () =>
      devitrakApi.get(`/receiver/receiver-pool-list?eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`),
    refetchOnMount: false,
  });
  const transactionPlusUserInfo = useQuery({
    queryKey: ["transactionPlusUserInfo"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });
  const transactionInfo = useQuery({
    queryKey: ["transactionInfo"],
    queryFn: () =>
      devitrakApi.post("/transaction/transaction", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        "device.deviceNeeded": 0,
      }),
    refetchOnMount: false,
  });

  const cashReportQuery = useQuery({
    queryKey: ["cashReportPerEvent"],
    queryFn: () =>
      devitrakApi.post("/cash-report/cash-reports", {
        event: event.id,
        company: user.companyData.id,
      }),
    refetchOnMount: false,
  });

  const consumersDataQuery = useQuery({
    queryKey: ["consumersDataQuery"],
    queryFn: () =>
      devitrakApi.get(
        `/auth/user-query?event_providers=${event.id}&company_providers=${user.companyData.id}`
      ),
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    transactionDeviceRecordInEvent.refetch();
    transactionPlusUserInfo.refetch();
    consumersDataQuery.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (
      transactionDeviceRecordInEvent.data &&
      transactionPlusUserInfo.data &&
      transactionInfo.data &&
      cashReportQuery.data
    ) {
      setAllTransaction(transactionPlusUserInfo.data.data.listOfReceivers);
      setItemsUsers(transactionPlusUserInfo.data.data.listOfReceivers);
      setDefectedItems(
        transactionDeviceRecordInEvent.data.data.receiversInventory
      );
      setAllServiceTransaction(transactionInfo.data.data.list);
      setReportCash(cashReportQuery.data.data.report)
    }
    return () => {
      controller.abort();
    };
  }, [transactionPlusUserInfo.data, transactionDeviceRecordInEvent.data]);
  
  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "xlsx file generated and downloading.",
    });
  };

  const defectedDevicesInfo = () => {
    const result = new Set();
    for (const data of defectedItems) {
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
        item.userInfo.name,
        item.userInfo.lastName,
        item.user,
        item.userInfo.phoneNumber,
        item.device.serialNumber,
        item.device.deviceType,
        item.device.status ? "in-Use" : "in-Stock",
        item.eventSelected.join(", "), // Convert array to comma-separated string
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
      "email"
    );
    // Convert data to worksheet format for Sheet4 (all data in detail)
    const wsDataDetail4 = [
      headers4,
      ...data4.map((item) => [
        item.userInfo.name,
        item.userInfo.lastName,
        item.user,
        item.userInfo.phoneNumber,
        groupingByConsumer[item.user].at(-1).groupName.at(-1),
        item._id,
        item.paymentIntent,
        item.device.serialNumber,
        item.device.deviceType,
        item.device.status ? "No" : "Yes",
        Date(item.timeStamp).toString(),
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
    

    // Generate a random file name (you can customize this logic)
    const newFileName = `excel_${Date.now()}.xlsx`;

    // Write the workbook to a file
    await writeFile(wb, newFileName);

    // Set the generated file name to state
    setFileName(newFileName);
  };

  useEffect(() => {
    const controller = new AbortController();
    if (fileName !== "") {
      setTimeout(() => {
        setFileName("");
      }, 3000);
    }
    success();
    return () => {
      controller.abort();
    };
  }, [transactionDeviceRecordInEvent.data, fileName]);

  return (
    <div style={{ margin: "0 0 0.5rem" }}>
      <button
        onClick={generateExcelFile}
        style={{ ...BlueButton, width: "100%" }}
      >
        <p
          style={{
            ...BlueButtonText,
            margin: "auto",
            textTransform: "none",
            textAlign: "left",
          }}
        >
          <XLSXIcon /> Export record (
          <span style={{ textDecoration: "underline" }}>xlsx format</span>)
        </p>
      </button>
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
