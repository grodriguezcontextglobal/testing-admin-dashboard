import { Typography } from "@mui/material";
import { Button, message } from "antd";
import { useCallback, useState } from "react";
import { saveAs } from "file-saver";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";
import { TextFontSize14LineHeight20 } from "../../../styles/global/TextFontSize14LineHeight20";
import { BlueButton } from "../../../styles/global/BlueButton";

// Small concurrency limiter (prevents 1000 simultaneous fetches)
async function mapWithConcurrency(items, limit, mapper) {
  const results = new Array(items.length);
  let i = 0;

  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await mapper(items[idx], idx);
    }
  });

  await Promise.all(workers);
  return results;
}

function arrayBufferToBase64(buffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

const DownloadingXlsxFileExcelJS = ({ props = [] }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isExporting, setIsExporting] = useState(false);

  const dictionaryOwnership = {
    Permanent: "Owned",
    Rent: "Rented",
    Sale: "For Resale",
    Resale: "For Resale",
  };

  const getBarcodeUrl = (value) => {
    const data = encodeURIComponent(String(value ?? "").trim());
    if (!data) return "";
    // You can tweak scale/height for readability
    return `https://bwipjs-api.metafloor.com/?bcid=code128&text=${data}&scale=3&height=12&includetext&paddingwidth=8&paddingheight=8`;
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
        { header: "Barcode (Serial)", key: "barcode", width: 50 }, // image goes here
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
        { header: "Rented Equipment Return Date", key: "return_date", width: 24 },
        { header: "Extra Info", key: "extra", width: 40 },
        { header: "Description", key: "description", width: 30 },
        { header: "Image (URL)", key: "image_url", width: 40 },
      ];

      // Header style (simple)
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).alignment = { vertical: "middle", horizontal: "center", wrapText: true };

      // Add rows first (text data)
      props.forEach((item) => {
        const serial = item?.serial_number ?? "";
        const isInStock = item?.warehouse === 1;

        const warehouseLabel = isInStock
          ? `${item?.location ?? ""} (In-Stock)`
          : `${item?.event_name ?? "In-Use"} (In-Use)`;

        const currentLocation = isInStock ? item?.location ?? "" : item?.event_name ?? "";
        const ownershipLabel = dictionaryOwnership[item?.ownership] ?? item?.ownership ?? "";
        const assignableLabel = item?.enableAssignFeature === 1 ? "Assignable" : "No Assignable";
        const rentedReturnDate = item?.ownership === "Rent" ? item?.return_date ?? "" : "";

        ws.addRow({
          item_id: item?.item_id ?? "",
          serial,
          barcode: "", // image will be inserted later
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

      // Make rows taller to fit barcode
      // Row 1 is header. Data starts at row 2.
      for (let r = 2; r <= props.length + 1; r++) {
        ws.getRow(r).height = 54; // adjust as needed
        ws.getRow(r).alignment = { vertical: "middle", wrapText: true };
      }

      // Fetch and embed barcode images with limited concurrency
      const CONCURRENCY = 6; // tune: 4–10 is reasonable
      await mapWithConcurrency(props, CONCURRENCY, async (item, idx) => {
        const serial = item?.serial_number ?? "";
        const url = getBarcodeUrl(serial);
        if (!url) return;

        // Data row number in worksheet
        const rowNumber = idx + 2; // header row is 1
        const targetCellCol = 3; // "Barcode (Serial)" column = C

        // Fetch image
        const res = await fetch(url);
        if (!res.ok) return;

        const buf = await res.arrayBuffer();
        const base64 = arrayBufferToBase64(buf);

        // Add image to workbook
        const imageId = wb.addImage({
          base64: `data:image/png;base64,${base64}`,
          extension: "png",
        });

        // Place image covering cell C(rowNumber)
        ws.addImage(imageId, {
          tl: { col: targetCellCol - 1, row: rowNumber - 1 },
          br: { col: targetCellCol, row: rowNumber },
          editAs: "oneCell",
        });

        // Optional: keep the URL as hyperlink in a note or adjacent column (debug)
        // ws.getCell(rowNumber, targetCellCol).note = url;
      });

      // Optional: freeze header row
      ws.views = [{ state: "frozen", ySplit: 1 }];

      const buffer = await wb.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });

      const fileName = `excel_stock_report_with_barcodes_${Date.now()}.xlsx`;
      saveAs(blob, fileName);

      messageApi.open({ type: "success", content: "Excel file generated with embedded barcodes." });
    } catch (err) {
      console.error(err);
      messageApi.open({
        type: "error",
        content: "Failed to generate Excel file with barcodes. Check console for details.",
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
          <XLSXIcon /> Export record (<span style={{ textDecoration: "underline" }}>.xlsx</span>)
          {isExporting ? " — generating…" : ""}
        </Typography>
      </Button>
    </>
  );
};

export default DownloadingXlsxFileExcelJS;
