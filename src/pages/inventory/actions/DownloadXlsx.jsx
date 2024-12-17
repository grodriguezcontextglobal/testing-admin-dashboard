import { Typography } from "@mui/material";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import { utils, writeFile } from "xlsx";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";

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
    ];

    // Convert data to worksheet format for Sheet1
    const wsData = [
      headers,
      ...props.map((item) => [
        item?.data?.serial_number,
        item?.data?.warehouse === 1 ? "In-Stock" : "In-Use",
        item?.data?.brand,
        item?.data?.category_name,
        item?.data?.item_group,
        dictionaryOwnership[item?.data?.ownership],
        item?.data?.cost,
        item?.data?.status,
        item?.data?.warehouse === 1 ? item?.data?.location : item?.event_name,
        item?.data?.main_warehouse,
        item?.data?.enableAssignFeature === 1 ? "Assignable" : "No Assignable",
        item?.data?.ownership === "Rent" ? item?.data?.return_date : "",
        [
          item?.data?.extra_serial_number?.map(
            (item) => `- ${item.keyObject}: ${item.valueObject}`
          ),
        ].toLocaleString(),
        item?.data?.descript_item,
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
    ];
    // Set styles for Sheet1 headers
    for (let colTitle of headers) {
      const headerCellAddress = utils.encode_cell({
        r: 0,
        c: headers.indexOf(`${colTitle}`),
      });
      wsSheet1[headerCellAddress].s = {
        fill: { patternType: "solid", fgColor: { rgb: "EE1515" } },
        font: {
          name: "Inter",
          sz: 16,
          color: { rgb: "FFFFFF" },
          bold: true,
          italic: false,
          underline: true,
        },
      };
    }

    // Set background color for "Warehouse" column cells based on value
    props.forEach((item, index) => {
      const rowIndex = index + 1; // Start from row 1 (since row 0 is headers)
      const warehouseCellAddress = utils.encode_cell({ r: rowIndex, c: 1 }); // Column index 1 (Warehouse column)
      wsSheet1[warehouseCellAddress].s = {
        fill: {
          patternType: "solid",
          fgColor: { rgb: item.data.warehouse === 1 ? "00FF00" : "FF0000" }, // Green for warehouse === 1, otherwise red
        },
      };
      const costCellAddress = utils.encode_cell({ r: rowIndex, c: 6 }); // Column index 6 (Warehouse column)
      wsSheet1[costCellAddress].s = {
        fill: {
          patternType: "solid",
          font: {
            name: "Inter",
            sz: 16,
            color: "#000000",
            bold: true,
            italic: false,
            underline: false,
          },
        },
      };
    });

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
          borderTop: "transparent",
          borderRight: "transparent",
          borderBottom: "transparent",
          borderRadius: "8px 8px 0 0",
        }}
      >
        <Typography
          textTransform={"none"}
          textAlign={"left"}
          fontWeight={500}
          fontSize={"12px"}
          fontFamily={"Inter"}
          lineHeight={"28px"}
          color={"var(--blue-dark--700, #004EEB)"}
          padding={"0px"}
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
