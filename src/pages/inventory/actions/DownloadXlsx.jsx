import { Typography } from "@mui/material";
import { Button, message } from "antd";
import { useEffect, useState } from "react";
import { utils, writeFile } from "xlsx";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";

const DownloadingXlslFile = ({ props, selectedColumns }) => {
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
      "Image (URL)",
      "Updated At",
      "Created At",
    ];

    // Filter headers based on selectedColumns
    const filteredHeaders = headers.filter((header) =>
      selectedColumns.includes(header)
    );

    // Convert data to worksheet format for Sheet1
    const wsData = [
      filteredHeaders,
      ...props.map((item) =>
        [
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
          item?.data?.enableAssignFeature === 1
            ? "Assignable"
            : "No Assignable",
          item?.data?.ownership === "Rent" ? item?.data?.return_date : "",
          [
            item?.data?.extra_serial_number?.map(
              (item) => `- ${item.keyObject}: ${item.valueObject}`
            ),
          ].toLocaleString(),
          item?.data?.descript_item,
          item?.data?.image_url,
          item?.data?.update_at,
          item?.data?.create_at,
        ].filter((_, index) => selectedColumns.includes(headers[index]))
      ),
    ];

    // Create a new workbook
    const wb = utils.book_new();

    // Add Sheet1 to the workbook
    const wsSheet1 = utils.aoa_to_sheet(wsData);
    // Set cell styles for Sheet1
    wsSheet1["!cols"] = filteredHeaders.map(() => ({ width: 20 }));

    utils.book_append_sheet(wb, wsSheet1, "Stock - Report");

    // Generate a random file name
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
