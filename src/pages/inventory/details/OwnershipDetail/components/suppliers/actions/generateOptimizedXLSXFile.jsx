import { utils, write } from "xlsx";

const generateOptimizedXLSXFile = ({ itemsDataResult }) => {
  const headers = ["Item ID", "Serial Number", "Item Group", "Return Date"];

  // Limit data to essential fields to reduce file size
  const wsData = [
    headers,
    ...itemsDataResult.map((item) => [
      item?.item_id || "",
      item?.serial_number || "",
      item?.item_group || "",
      new Date().toISOString().split("T")[0],
    ]),
  ];

  const wb = utils.book_new();
  const ws = utils.aoa_to_sheet(wsData);

  // Optimize column widths
  ws["!cols"] = [{ width: 15 }, { width: 20 }, { width: 20 }, { width: 15 }];

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
