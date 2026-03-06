import { Typography } from "@mui/material";
import { Button, message } from "antd";
import { useCallback, useState } from "react";
import { saveAs } from "file-saver";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import { BlueButton } from "../../../styles/global/BlueButton";

const DownloadingXlsxFileExcelJS = ({ props = [] }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isExporting, setIsExporting] = useState(false);

  const dictionaryOwnership = {
    Permanent: "Owned",
    Rent: "Rented",
    Sale: "For Resale",
    Resale: "For Resale",
  };

  const formatExtraInfo = (extra) => {
    if (!Array.isArray(extra) || extra.length === 0) return "";
    return extra
      .map((x) => `- ${x?.keyObject ?? ""}: ${x?.valueObject ?? ""}`.trim())
      .filter(Boolean)
      .join("\n");
  };

  const generateExcelFile = useCallback(async () => {
    try {
      if (!Array.isArray(props) || props.length === 0) {
        messageApi.open({ type: "warning", content: "No data to export." });
        return;
      }

      setIsExporting(true);

      // Dynamic import to reduce initial bundle cost
      const ExcelJS = (await import("exceljs")).default;

      const wb = new ExcelJS.Workbook();
      wb.creator = "Devitrak";
      wb.created = new Date();

      const ws = wb.addWorksheet("Stock - Report", {
        properties: { defaultRowHeight: 18 },
        pageSetup: { fitToPage: true, fitToWidth: 1, fitToHeight: 0 },
      });

      // Columns
      ws.columns = [
        { header: "Device ID (database)", key: "item_id", width: 18 },
        { header: "Serial Number", key: "serial", width: 18 },
        { header: "Warehouse", key: "warehouse", width: 28 },
        { header: "Brand", key: "brand", width: 18 },
        { header: "Category Name", key: "category", width: 18 },
        { header: "Group Name", key: "group", width: 22 },
        { header: "Ownership", key: "ownership", width: 14 },
        { header: "Cost of Replacement (USD)", key: "cost", width: 22 },
        { header: "Condition", key: "condition", width: 14 },
        { header: "Current Location", key: "current_location", width: 24 },
        { header: "Tax Location", key: "tax_location", width: 20 },
        { header: "Assignable", key: "assignable", width: 14 },
        {
          header: "Rented Equipment Return Date",
          key: "return_date",
          width: 24,
        },
        { header: "Extra Info", key: "extra", width: 40 },
        { header: "Description", key: "description", width: 30 },
        { header: "Image (URL)", key: "image_url", width: 40 },
      ];

      // Header style (simple)
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).alignment = {
        vertical: "middle",
        horizontal: "center",
        wrapText: true,
      };

      // Add rows first (text data)
      props.forEach((item) => {
        const serial = item?.serial_number ?? "";
        const isInStock = item?.warehouse === 1;

        const warehouseLabel = isInStock
          ? `${item?.location ?? ""} (In-Stock)`
          : `${item?.event_name ?? "In-Use"} (In-Use)`;

        const currentLocation = isInStock
          ? (item?.location ?? "")
          : (item?.event_name ?? "");
        const ownershipLabel =
          dictionaryOwnership[item?.ownership] ?? item?.ownership ?? "";
        const assignableLabel =
          item?.enableAssignFeature === 1 ? "Assignable" : "No Assignable";
        const rentedReturnDate =
          item?.ownership === "Rent" ? (item?.return_date ?? "") : "";

        ws.addRow({
          item_id: item?.item_id ?? "",
          serial,
          warehouse: warehouseLabel,
          brand: item?.brand ?? "",
          category: item?.category_name ?? "",
          group: item?.item_group ?? "",
          ownership: ownershipLabel,
          cost: item?.cost ?? "",
          condition: item?.status ?? item?.condition ?? "",
          current_location: currentLocation,
          tax_location: item?.main_warehouse ?? "",
          assignable: assignableLabel,
          return_date: rentedReturnDate,
          extra: formatExtraInfo(item?.extra_serial_number),
          description: item?.descript_item ?? "",
          image_url: item?.image_url ?? "",
        });
      });

      // Optional: freeze header row
      ws.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `excel_stock_report_${Date.now()}.xlsx`;
      saveAs(blob, fileName);

      messageApi.open({
        type: "success",
        content: "Excel file generated successfully.",
      });
    } catch (err) {
      console.error(err);
      messageApi.open({
        type: "error",
        content: "Failed to generate Excel file. Check console for details.",
      });
    } finally {
      setIsExporting(false);
    }
  }, [props, messageApi]);

  return (
    <>
      {contextHolder}
      <Button
        onClick={generateExcelFile}
        disabled={isExporting}
        style={{ display: "flex", alignItems: "center", border: "transparent" }}
      >
        <Typography
          style={{
            ...TextFontSize14LineHeight20,
            color: BlueButton.background,
            fontSize: "12px",
            lineHeight: "28px",
            opacity: isExporting ? 0.6 : 1,
          }}
        >
          <XLSXIcon /> Export record (
          <span style={{ textDecoration: "underline" }}>.xlsx</span>)
          {isExporting ? " — generating…" : ""}
        </Typography>
      </Button>
    </>
  );
};

export default DownloadingXlsxFileExcelJS;
