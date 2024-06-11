import { useQuery } from "@tanstack/react-query";
import { message } from "antd";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { utils, writeFile } from "xlsx";
import { devitrakApi } from "../../../../api/devitrakApi";
import { XLSXIcon } from "../../../../components/icons/Icons";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
const SpreadSheet = () => {
  const [fileName, setFileName] = useState("");
  const [itemsUsers, setItemsUsers] = useState([]);
  const [defectedItems, setDefectedItems] = useState([]);
  const { event } = useSelector((state) => state.event);
  const transactionDeviceRecordInEvent = useQuery({
    queryKey: ["transactionAndDeviceRecord"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      }),
    // enabled: false,
    refetchOnMount: false,
  });
  const transactionPlusUserInfo = useQuery({
    queryKey: ["transactionPlusUserInfo"],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-users-list", {
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
        "device.status": true,
      }),
    // enabled: false,
    refetchOnMount: false,
  });

  useEffect(() => {
    const controller = new AbortController();
    transactionDeviceRecordInEvent.refetch();
    transactionPlusUserInfo.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    if (transactionDeviceRecordInEvent.data && transactionPlusUserInfo.data) {
      setItemsUsers(transactionPlusUserInfo.data.data.listOfReceivers);
      setDefectedItems(
        transactionDeviceRecordInEvent.data.data.receiversInventory
      );
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

  const sortAndGroupData = () => {
    const result = new Map();
    for (let data of itemsUsers) {
      if (!result.has(data.user)) {
        result.set(data.user, [data]);
      } else {
        result.set(data.user, [...result.get(data.user), data]);
      }
    }

    const sortedResult = new Set();
    for (const [user, receivers] of result) {
      sortedResult.add({
        firstName: receivers[0].userInfo.name,
        lastName: receivers[0].userInfo.lastName,
        email: user,
        phoneNumber: receivers[0].userInfo.phoneNumber,
        pendingDevices: receivers.length,
      });
    }
    return Array.from(sortedResult);
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
    // Define the header columns for Sheet1
    const headers = [
      "User - First name",
      "User - Last name",
      "User - Email",
      "User - Phone number",
      "Pending devices to return",
    ];

    // Convert data to worksheet format for Sheet1
    const wsData = [
      headers,
      ...sortAndGroupData().map((item) => [
        item.firstName,
        item.lastName,
        item.email,
        item.phoneNumber,
        item.pendingDevices,
      ]),
    ];

    // Create a new workbook
    const wb = utils.book_new();

    // Add Sheet1 to the workbook
    const wsSheet1 = utils.aoa_to_sheet(wsData);

    // Set cell styles for Sheet1
    wsSheet1["!cols"] = [
      { width: 20 },
      { width: 20 },
      { width: 30 },
      { width: 20 },
      { width: 30 },
    ];
    wsSheet1["E1"].l = { Target: "#Details!A1" };
    for (let colTitle of headers) {
      const headerCellAddress = utils.encode_cell({
        r: 0,
        c: headers.indexOf(`${colTitle}`),
      });
      wsSheet1[headerCellAddress].s = {
        fill: { patternType: "solid", bgColor: { rgb: "#ee1515" } },
        font: {
          name: "Inter",
          sz: 16,
          color: { rgb: "#fff" },
          bold: true,
          italic: false,
          underline: true,
        },
      };
    }

    // Set background color for "Pending devices" cell if value > 5
    const pendingDevicesIndex = headers.indexOf("Pending devices to return");
    if (pendingDevicesIndex !== -1) {
      // Iterate through data rows to check and set background color
      sortAndGroupData().forEach((item, rowIndex) => {
        const cellValue = item.pendingDevices;
        if (!isNaN(cellValue) && cellValue >= 5) {
          const cellAddress = utils.encode_cell({
            r: rowIndex + 1,
            c: pendingDevicesIndex,
          });
          wsSheet1[`${cellAddress}`].s = {
            fill: { patternType: "solid", bgColor: { rgb: "#ee1515" } },
            font: {
              name: "Inter",
              sz: 16,
              color: { rgb: "#fff" },
              bold: true,
              italic: false,
              underline: true,
            },
          };
        }
      });
    }

    utils.book_append_sheet(wb, wsSheet1, "Report");

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
        item.active ? "in-Use" : "in-Stock",
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

    utils.book_append_sheet(wb, wsSheet3, "Defected_and_Lost devices");

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
