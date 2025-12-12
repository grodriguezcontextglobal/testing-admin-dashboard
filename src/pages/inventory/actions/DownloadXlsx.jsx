import { Typography } from "@mui/material";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import { utils, writeFile } from "xlsx";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import { BlueButton } from "../../../styles/global/BlueButton";

const DownloadingXlslFile = ({ props }) => {
  const [fileName, setFileName] = useState("");

  const [messageApi, contextHolder] = message.useMessage();
  const success = () => {
    messageApi.open({
      type: "success",
      content: "xlsx file generated and downloading.",
    });
  };

  const dictionaryOwnership = {
    Permanent: "Owned",
    Rent: "Rented",
    Sale: "For Sale",
  };

  const generateExcelFile = async () => {
    // Define the header columns for Sheet1
    const headers = [
      "Device ID (database)",
      "Serial Number",
      "Warehouse",
      "Brand",
      "Category Name",
      "Group Name",
      "Ownership",
      "Cost of Replacement (USD)",
      "Condition",
      "Current Location",
      "Tax Location",
      "Assignable",
      "Rented Equipment Return Date",
      "Extra Info",
      "Description",
      "Image (URL)",
    ];
    console.log(props?.slice(0, 5)?.map((item) => item));
//      data structure:
//     [{
//     "key": 57104,
//     "item_id": 57104,
//     "item_group": "Item1",
//     "category_name": "Category1",
//     "brand": "Brand1",
//     "ownership": "Permanent",
//     "main_warehouse": "Plantation, Florida",
//     "warehouse": 0,
//     "location": "Plantation, Florida",
//     "image_url": null,
//     "serial_number": "5000",
//     "enableAssignFeature": 1,
//     "usage": "TEST",
//     "status": "Operational",
//     "condition": "Operational",
//     "assignedToStaffMember": "TEST"
// }]
    // Convert data to worksheet format for Sheet1
    const wsData = [
      headers,
      ...props.map((item) => [
        item?.item_id,
        item?.serial_number,
        item?.warehouse === 1
          ? item?.location + " (In-Stock)"
          : item?.event_name+ "(In-Use)",
        item?.brand,
        item?.category_name,
        item?.item_group,
        dictionaryOwnership[item?.ownership],
        item?.cost,
        item?.status,
        item?.warehouse === 1 ? item?.location : item?.event_name,
        item?.main_warehouse,
        item?.enableAssignFeature === 1 ? "Assignable" : "No Assignable",
        item?.ownership === "Rent" ? item?.return_date : "",
        [
          item?.extra_serial_number?.map(
            (item) => `- ${item.keyObject}: ${item.valueObject}`
          ),
        ].toLocaleString(),
        item?.descript_item,
        item?.image_url,
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
      { width: 30 },
      { width: 20 },
      { width: 20 },
      { width: 10 },
      { width: 20 },
      { width: 40 },
      { width: 40 },
      { width: 20 },
      { width: 30 },
      { width: 50 },
      { width: 50 },
      { width: 50 },
      { width: 50 },
    ];
    // Set styles for Sheet1 headers
    // for (let colTitle of headers) {
    //   const headerCellAddress = utils.encode_cell({
    //     r: 0,
    //     c: headers.indexOf(`${colTitle}`),
    //   });
    //   wsSheet1[headerCellAddress].s = {
    //     fill: { patternType: "solid", fgColor: { rgb: "EE1515" } },
    //     font: {
    //       name: "Inter",
    //       sz: 16,
    //       color: { rgb: "FFFFFF" },
    //       bold: true,
    //       italic: false,
    //       underline: true,
    //     },
    //   };
    // }

    // Set background color for "Warehouse" column cells based on value
    // props.forEach((item, index) => {
    //   const rowIndex = index + 1; // Start from row 1 (since row 0 is headers)
    //   const warehouseCellAddress = utils.encode_cell({ r: rowIndex, c: 1 }); // Column index 1 (Warehouse column)
    //   wsSheet1[warehouseCellAddress].s = {
    //     fill: {
    //       patternType: "solid",
    //       fgColor: { rgb: item?.data?.warehouse === 1 ? "00FF00" : "FF0000" }, // Green for warehouse === 1, otherwise red
    //     },
    //   };
    //   const costCellAddress = utils.encode_cell({ r: rowIndex, c: 6 }); // Column index 6 (Warehouse column)
    //   wsSheet1[costCellAddress].s = {
    //     fill: {
    //       patternType: "solid",
    //       font: {
    //         name: "Inter",
    //         sz: 16,
    //         color: "#000000",
    //         bold: true,
    //         italic: false,
    //         underline: false,
    //       },
    //     },
    //   };
    // });

    utils.book_append_sheet(wb, wsSheet1, "Stock - Report");

    // Generate a random file name (you can customize this logic)
    const newFileName = `excel_stock_report_${Date.now()}.xlsx`;

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
  }, [fileName]);

  return (
    <>
      <Button
        onClick={generateExcelFile}
        style={{
          display: "flex",
          alignItems: "center",
          border: "transparent",
        }}
      >
        <Typography
          style={{
            ...TextFontSize14LineHeight20,
            color: BlueButton.background,
            fontSize: "12px",
            lineHeight: "28px",
          }}
        >
          <XLSXIcon /> Export record (
          <span style={{ textDecoration: "underline" }}>.xlsx</span>)
        </Typography>
      </Button>
      {fileName && (
        <>
          <a href={fileName} download={fileName}>
            Downloading file...
          </a>
          {contextHolder}
        </>
      )}
    </>
  );
};

export default DownloadingXlslFile;
