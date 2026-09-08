import { utils, write } from "xlsx";

/**
 * The attachment is the record of the return: the item rows are deleted right
 * after it goes out, so anything not in here is gone.
 *
 * It used to carry three columns off the item and a "Return Date" computed here
 * with `new Date()` — not the date anything was actually stored under. The
 * supplier, who returned them and the real timestamp are the provenance the
 * item row was trying to hold in `returnedRentedInfo`, which the bulk update
 * refuses and the delete would have destroyed anyway.
 */
const generateOptimizedXLSXFile = ({
  itemsDataResult,
  supplierName = "",
  returnedBy = "",
  returnedAt = "",
}) => {
  const headers = [
    "Item ID",
    "Serial Number",
    "Item Group",
    "Supplier",
    "Returned By",
    "Returned At",
  ];

  const stamp = String(returnedAt || new Date().toISOString());

  // Limit data to essential fields to reduce file size
  const wsData = [
    headers,
    ...itemsDataResult.map((item) => [
      item?.item_id || "",
      item?.serial_number || "",
      item?.item_group || "",
      supplierName || "",
      returnedBy || "",
      stamp,
    ]),
  ];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);

  // Optimize column widths
  ws["!cols"] = [
    { width: 15 },
    { width: 20 },
    { width: 20 },
    { width: 24 },
    { width: 18 },
    { width: 26 },
  ];

  utils.book_append_sheet(wb, ws, "Returned Items");

  // Generate with compression
  const fileArrayBuffer = write(wb, {
    type: "array",
    bookType: "xlsx",
    compression: true,
  });

  const uint8Array = new Uint8Array(fileArrayBuffer);
  let binaryString = "";

  // Process in chunks to avoid memory issues with large files
  const chunkSize = 8192;
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      binaryString += String.fromCharCode(chunk[j]);
    }
  }

  const base64File = btoa(binaryString);

  // Check file size
  const fileSizeMB = (base64File.length * 0.75) / (1024 * 1024); // Approximate size

  if (fileSizeMB > 90) {
    // Most email services limit to 90MB
    console.warn(`Large XLSX file: ${fileSizeMB.toFixed(2)} MB`);
  }

  return {
    filename: `returned_items_${new Date().toISOString().split("T")[0]}.xlsx`,
    content: base64File,
    contentType:
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    size: fileSizeMB,
  };
};

export default generateOptimizedXLSXFile;
