import { message } from "antd";
import { OWNERSHIP_LABELS } from "./utils/ownershipUtils";
import { useCallback, useState } from "react";
import { saveAs } from "file-saver";
import { XLSXIcon } from "../../../components/icons/XLSXIcon";
import TextLink from "../../../components/UX/buttons/TextLink";

/**
 * @param {{props?: Array, fetchRows?: () => Promise<Array>}} params
 *   `props` is the dataset the page already holds. `fetchRows` is for the
 *   screens that no longer hold one: with the server paginating, the inventory
 *   table has ten rows, so the export asks for the whole inventory here, on the
 *   click, rather than exporting the page that happens to be on screen.
 */
const DownloadingXlsxFileExcelJS = ({ props = [], fetchRows }) => {
  const [messageApi, contextHolder] = message.useMessage();
  const [isExporting, setIsExporting] = useState(false);


  const formatExtraInfo = (extra) => {
    if (!Array.isArray(extra) || extra.length === 0) return "";
    return extra
      .map((x) => `- ${x?.keyObject ?? ""}: ${x?.valueObject ?? ""}`.trim())
      .filter(Boolean)
      .join("\n");
  };

  const generateExcelFile = useCallback(async () => {
    try {
      setIsExporting(true);

      // The fetch comes first so the button can say it is working while the
      // whole inventory is on its way. A screen that already holds its rows
      // passes none and nothing is fetched.
      const rows = fetchRows ? await fetchRows() : props;

      if (!Array.isArray(rows) || rows.length === 0) {
        messageApi.open({ type: "warning", content: "No data to export." });
        return;
      }

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
      rows.forEach((item) => {
        const serial = item?.serial_number ?? "";
        const isInStock = item?.warehouse === 1;

        const warehouseLabel = isInStock
          ? `${item?.location ?? ""} (In-Stock)`
          : `${item?.event_name ?? "In-Use"} (In-Use)`;

        const currentLocation = isInStock
          ? (item?.location ?? "")
          : (item?.event_name ?? "");
        const ownershipLabel =
          OWNERSHIP_LABELS[item?.ownership] ?? item?.ownership ?? "";
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
        content: `Excel file generated with ${rows.length} records.`,
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
  }, [props, fetchRows, messageApi]);

  return (
    <>
      {contextHolder}
      <TextLink
        onClick={generateExcelFile}
        disabled={isExporting}
        iconLeading={<XLSXIcon />}
        style={{ opacity: isExporting ? 0.6 : 1 }}
      >
        Export record (
        <span style={{ textDecoration: "underline" }}>.xlsx</span>)
        {isExporting ? " — generating…" : ""}
      </TextLink>
    </>
  );
};

export default DownloadingXlsxFileExcelJS;
