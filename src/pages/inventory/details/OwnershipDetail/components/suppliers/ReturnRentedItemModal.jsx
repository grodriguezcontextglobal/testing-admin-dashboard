import { Box, Grid, Paper, Typography } from "@mui/material";
import {
  Checkbox,
  Input,
  Modal,
  Pagination,
  Space,
  Table,
  Tabs,
  message,
} from "antd";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import BlueButtonConfirmationComponent from "../../../../../../components/UX/buttons/BlueButtonConfirmation";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";
// import { utils, write } from "xlsx";
import { Progress } from "antd";
import { useQueryClient } from "@tanstack/react-query";

const { Search } = Input;

const ReturnRentedItemModal = ({
  handleClose,
  open,
  supplier_id,
  data = null,
}) => {
  const [activeTab, setActiveTab] = useState("1");
  const [renterItemList, setRenterItemList] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalItems, setTotalItems] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0, step: "" });
  const [isUsingProvidedData, setIsUsingProvidedData] = useState(false);
  const { user } = useSelector((state) => state.admin);

  const queryClient = useQueryClient();
  const invalidatingQueriesForRefresh = () => {
    queryClient.invalidateQueries({
      queryKey: ["currentStateDevicePerGroupName"],
    });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerGroup"] });
    queryClient.invalidateQueries({
      queryKey: ["currentStateDevicePerCategory"],
    });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerGroup"] });
    queryClient.invalidateQueries({
      queryKey: ["currentStateDevicePerCategory"],
    });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerBrand"] });
    queryClient.invalidateQueries({ queryKey: ["currentStateDevicePerBrand"] });
    queryClient.invalidateQueries({ queryKey: ["deviceInInventoryPerGroup"] });
    return null;
  };
  // Request size validation helper
  const checkRequestSize = (data) => {
    const jsonString = JSON.stringify(data);
    const sizeInBytes = new Blob([jsonString]).size;
    const sizeInMB = sizeInBytes / (1024 * 1024);
    // Warn if approaching 10MB limit (most servers have 10-50MB limits)
    if (sizeInMB > 8) {
      console.warn(`Large request detected: ${sizeInMB.toFixed(2)} MB`);
      return { isLarge: true, size: sizeInMB };
    }

    return { isLarge: false, size: sizeInMB };
  };

  // Filtered data when using provided data prop
  const filteredProvidedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    if (!searchText) return data;

    const searchLower = searchText.toLowerCase();
    return data.filter(
      (item) =>
        String(item.item_id).toLowerCase().includes(searchLower) ||
        (item.serial_number &&
          item.serial_number.toLowerCase().includes(searchLower)) ||
        (item.item_group && item.item_group.toLowerCase().includes(searchLower))
    );
  }, [data, searchText]);

  // Paginated data for provided data
  const paginatedProvidedData = useMemo(() => {
    if (!isUsingProvidedData) return [];

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredProvidedData.slice(startIndex, endIndex);
  }, [filteredProvidedData, currentPage, pageSize, isUsingProvidedData]);

  // Initialize data based on prop availability
  const initializeData = useCallback(() => {
    if (data && Array.isArray(data) && data.length > 0) {
      // Use provided data
      setIsUsingProvidedData(true);
      setRenterItemList(data);
      setTotalItems(data.length);
      setLoading(false);
    } else {
      // Fetch data as before
      setIsUsingProvidedData(false);
      fetchItemsForRenter(1, "");
    }
  }, [data]);

  // Fetch items with pagination and search (existing function)
  const fetchItemsForRenter = useCallback(
    async (page = 1, search = "") => {
      if (isUsingProvidedData) return; // Don't fetch if using provided data

      setLoading(true);
      try {
        let query = "";
        let countQuery = "";
        let values = [];
        let countValues = [];

        const offset = (page - 1) * pageSize;

        if (supplier_id) {
          if (search) {
            query = `
            SELECT item_id, serial_number, item_group
            FROM item_inv 
            WHERE ownership = ? AND company_id = ? AND supplier_info = ? 
            AND (CAST(item_id AS CHAR) LIKE ? OR serial_number LIKE ?)
            LIMIT ? OFFSET ?
          `;
            countQuery = `
            SELECT COUNT(*) as total 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ? AND supplier_info = ? 
            AND (CAST(item_id AS CHAR) LIKE ? OR serial_number LIKE ?)
          `;
            const searchPattern = `%${search}%`;
            values = [
              "Rent",
              user.sqlInfo.company_id,
              supplier_id,
              searchPattern,
              searchPattern,
              pageSize,
              offset,
            ];
            countValues = [
              "Rent",
              user.sqlInfo.company_id,
              supplier_id,
              searchPattern,
              searchPattern,
            ];
          } else {
            query = `
            SELECT item_id, serial_number, item_group 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ? AND supplier_info = ?
            LIMIT ? OFFSET ?
          `;
            countQuery = `
            SELECT COUNT(*) as total 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ? AND supplier_info = ?
          `;
            values = [
              "Rent",
              user.sqlInfo.company_id,
              supplier_id,
              pageSize,
              offset,
            ];
            countValues = ["Rent", user.sqlInfo.company_id, supplier_id];
          }
        } else {
          if (search) {
            query = `
            SELECT item_id, serial_number, item_group 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ? 
            AND (CAST(item_id AS CHAR) LIKE ? OR serial_number LIKE ?)
            LIMIT ? OFFSET ?
          `;
            countQuery = `
            SELECT COUNT(*) as total 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ? 
            AND (CAST(item_id AS CHAR) LIKE ? OR serial_number LIKE ?)
          `;
            const searchPattern = `%${search}%`;
            values = [
              "Rent",
              user.sqlInfo.company_id,
              searchPattern,
              searchPattern,
              pageSize,
              offset,
            ];
            countValues = [
              "Rent",
              user.sqlInfo.company_id,
              searchPattern,
              searchPattern,
            ];
          } else {
            query = `
            SELECT item_id, serial_number, item_group 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ?
            LIMIT ? OFFSET ?
          `;
            countQuery = `
            SELECT COUNT(*) as total 
            FROM item_inv 
            WHERE ownership = ? AND company_id = ?
          `;
            values = ["Rent", user.sqlInfo.company_id, pageSize, offset];
            countValues = ["Rent", user.sqlInfo.company_id];
          }
        }

        // Fetch both data and count in parallel
        const [dataResult, countResult] = await Promise.all([
          devitrakApi.post(
            "/db_company/inventory-based-on-submitted-parameters",
            {
              query: query,
              values: values,
            }
          ),
          devitrakApi.post(
            "/db_company/inventory-based-on-submitted-parameters",
            {
              query: countQuery,
              values: countValues,
            }
          ),
        ]);

        if (dataResult.data && countResult.data) {
          setRenterItemList(dataResult.data.result || []);
          setTotalItems(countResult.data.result[0]?.total || 0);
        }
      } catch (error) {
        console.error("Error fetching items:", error);
        message.error("Failed to fetch items");
      } finally {
        setLoading(false);
      }
    },
    [supplier_id, pageSize, user.sqlInfo.company_id, isUsingProvidedData]
  );

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      setSelectedItems(new Set());
      setSearchText("");
      initializeData();
    }
  }, [open, initializeData]);

  // Handle search for provided data
  useEffect(() => {
    if (isUsingProvidedData) {
      // For provided data, just update pagination
      setCurrentPage(1);
      setTotalItems(filteredProvidedData.length);
    } else {
      // For fetched data, use debounced search
      const timeoutId = setTimeout(() => {
        setCurrentPage(1);
        fetchItemsForRenter(1, searchText);
      }, 300);

      return () => clearTimeout(timeoutId);
    }
  }, [
    searchText,
    isUsingProvidedData,
    filteredProvidedData.length,
    fetchItemsForRenter,
  ]);

  // Update displayed data when using provided data
  useEffect(() => {
    if (isUsingProvidedData) {
      setRenterItemList(paginatedProvidedData);
    }
  }, [paginatedProvidedData, isUsingProvidedData]);

  // Handle page change
  const handlePageChange = useCallback(
    (page, size) => {
      setCurrentPage(page);
      if (size !== pageSize) {
        setPageSize(size);
      }

      if (!isUsingProvidedData) {
        fetchItemsForRenter(page, searchText);
      }
    },
    [fetchItemsForRenter, searchText, pageSize, isUsingProvidedData]
  );

  // Improved batch processing with dynamic sizing and progress tracking
  const processBatchedItems = async (
    itemIds,
    batchProcessor,
    initialBatchSize = 200, // Reduced from 500
    stepName = "Processing items"
  ) => {
    const results = [];
    let currentBatchSize = initialBatchSize;

    setProgress({ current: 0, total: itemIds.length, step: stepName });

    for (let i = 0; i < itemIds.length; i += currentBatchSize) {
      const batch = itemIds.slice(i, i + currentBatchSize);

      try {
        // Check batch size before processing
        const sizeCheck = checkRequestSize({ batch });

        // If batch is too large, reduce size and retry
        if (sizeCheck.isLarge && currentBatchSize > 50) {
          currentBatchSize = Math.max(50, Math.floor(currentBatchSize * 0.7));
          console.log(
            `Reducing batch size to ${currentBatchSize} due to large payload`
          );
          i -= currentBatchSize; // Retry with smaller batch
          continue;
        }

        const result = await batchProcessor(batch);
        results.push(result);

        // Update progress
        setProgress({
          current: Math.min(i + currentBatchSize, itemIds.length),
          total: itemIds.length,
          step: stepName,
        });

        // Add delay between batches
        if (i + currentBatchSize < itemIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 150));
        }
      } catch (error) {
        console.error(
          `Error processing batch ${Math.floor(i / currentBatchSize) + 1}:`,
          error
        );

        // If error is due to payload size, reduce batch size and retry
        if (error.response?.status === 413 && currentBatchSize > 50) {
          currentBatchSize = Math.max(50, Math.floor(currentBatchSize * 0.5));
          console.log(
            `HTTP 413 error: Reducing batch size to ${currentBatchSize}`
          );
          i -= currentBatchSize; // Retry with smaller batch
          continue;
        }

        throw error;
      }
    }

    return results;
  };

  // Step 1: Return items to renter with improved error handling
  const returnItemsToRenter = async (itemIds) => {
    const returnDate = new Date().toISOString();
    const moreInfo = {
      supplier_id: supplier_id || null,
      company_id: user.sqlInfo.company_id,
      returned_by: user.name,
      return_timestamp: returnDate,
    };

    const batchProcessor = async (batch) => {
      const payload = {
        item_ids: batch,
        warehouse: 1,
        enableAssignFeature: 0,
        returnedRentedInfo: JSON.stringify(moreInfo),
        return_date: returnDate,
      };

      // Validate payload size
      const sizeCheck = checkRequestSize(payload);
      if (sizeCheck.isLarge) {
        console.warn(
          `Large payload for returnItemsToRenter: ${sizeCheck.size.toFixed(
            2
          )} MB`
        );
      }

      return await devitrakApi.post("/db_inventory/update-large-data", payload);
    };

    return await processBatchedItems(
      itemIds,
      batchProcessor,
      200,
      "Returning items to renter"
    );
  };

  // Step 2: Delete items from records with improved batching
  const deleteItemsFromRecords = async (itemIds) => {
    const batchProcessor = async (batch) => {
      const placeholders = batch.map(() => "?").join(",");
      const deleteQuery = `DELETE FROM item_inv WHERE item_id IN (${placeholders}) AND company_id = ?`;
      const deleteValues = [...batch, user.sqlInfo.company_id];

      const payload = {
        query: deleteQuery,
        values: deleteValues,
      };

      // Validate payload size
      const sizeCheck = checkRequestSize(payload);
      if (sizeCheck.isLarge) {
        console.warn(
          `Large payload for deleteItemsFromRecords: ${sizeCheck.size.toFixed(
            2
          )} MB`
        );
      }

      return await devitrakApi.post(
        "/db_company/inventory-based-on-submitted-parameters",
        payload
      );
    };

    return await processBatchedItems(
      itemIds,
      batchProcessor,
      300,
      "Deleting item records"
    );
  };

  // Step 3: Improved email notification with complete data fetching
  // const emailNotification = async ({ items }) => {
  //   try {
  //     setProgress({
  //       current: 0,
  //       total: 1,
  //       step: "Preparing email notification",
  //     });

  //     const supplierInfo = await devitrakApi.post(
  //       `/company/provider-company/${supplier_id}`,
  //       {
  //         creator: user?.companyData?.id,
  //         provider_id: supplier_id,
  //       }
  //     );

  //     // Get items data in batches to avoid memory issues
  //     const itemsArray = Array.from(items);
  //     let itemsData = [];

  //     // First, try to get data from existing renterItemList or provided data
  //     if (isUsingProvidedData && data && Array.isArray(data)) {
  //       // Use provided data directly
  //       itemsData = data.filter(item => itemsArray.includes(item.item_id));
  //     } else if (renterItemList && renterItemList.length > 0) {
  //       // Use existing renterItemList data
  //       itemsData = renterItemList.filter(item => itemsArray.includes(item.item_id));
  //     }

  //     // If we don't have enough data from existing sources, fetch from database
  //     if (itemsData.length < itemsArray.length) {
  //       const missingItemIds = itemsArray.filter(
  //         itemId => !itemsData.find(item => item.item_id === itemId)
  //       );

  //       if (missingItemIds.length > 0) {
  //         // Fetch complete item data for missing items
  //         const ITEMS_BATCH_SIZE = 1000;
  //         for (let i = 0; i < missingItemIds.length; i += ITEMS_BATCH_SIZE) {
  //           const batch = missingItemIds.slice(i, i + ITEMS_BATCH_SIZE);

  //           // Fetch complete data for this batch from database
  //           const placeholders = batch.map(() => "?").join(",");
  //           let fetchQuery = "";
  //           let fetchValues = [];

  //           if (supplier_id) {
  //             fetchQuery = `SELECT item_id, serial_number, item_group FROM item_inv WHERE item_id IN (${placeholders}) AND ownership = ? AND company_id = ? AND supplier_info = ?`;
  //             fetchValues = [
  //               ...batch,
  //               "Rent",
  //               user.sqlInfo.company_id,
  //               supplier_id,
  //             ];
  //           } else {
  //             fetchQuery = `SELECT item_id, serial_number, item_group FROM item_inv WHERE item_id IN (${placeholders}) AND ownership = ? AND company_id = ?`;
  //             fetchValues = [...batch, "Rent", user.sqlInfo.company_id];
  //           }

  //           try {
  //             const batchResult = await devitrakApi.post(
  //               "/db_company/inventory-based-on-submitted-parameters",
  //               {
  //                 query: fetchQuery,
  //                 values: fetchValues,
  //               }
  //             );

  //             if (batchResult.data?.result) {
  //               // Map fetched data, fallback to default for missing items
  //               const batchData = batch.map((itemId) => {
  //                 const foundItem = batchResult.data.result.find(
  //                   (ele) => ele.item_id === itemId
  //                 );
  //                 return (
  //                   foundItem || {
  //                     item_id: itemId,
  //                     serial_number: "N/A",
  //                     item_group: "N/A",
  //                   }
  //                 );
  //               });
  //               itemsData.push(...batchData);
  //             } else {
  //               // Fallback if API call fails
  //               const fallbackData = batch.map((itemId) => ({
  //                 item_id: itemId,
  //                 serial_number: "N/A",
  //                 item_group: "N/A",
  //               }));
  //               itemsData.push(...fallbackData);
  //             }
  //           } catch (fetchError) {
  //             console.error("Error fetching batch data:", fetchError);
  //             // Fallback for failed batch
  //             const fallbackData = batch.map((itemId) => ({
  //               item_id: itemId,
  //               serial_number: "N/A",
  //               item_group: "N/A",
  //             }));
  //             itemsData.push(...fallbackData);
  //           }
  //         }
  //       }
  //     }

  //     // Ensure we have data for all requested items
  //     const finalItemsData = itemsArray.map(itemId => {
  //       const foundItem = itemsData.find(item => item.item_id === itemId);
  //       return foundItem || {
  //         item_id: itemId,
  //         serial_number: "N/A",
  //         item_group: "N/A",
  //       };
  //     });

  //     // Generate XLSX file with size optimization
  //     const generateOptimizedXLSXFile = () => {
  //       const headers = [
  //         "Item ID",
  //         "Serial Number",
  //         "Item Group",
  //         "Return Date",
  //       ];

  //       // Limit data to essential fields to reduce file size
  //       const wsData = [
  //         headers,
  //         ...finalItemsData.map((item) => [
  //           item?.item_id || "",
  //           item?.serial_number || "",
  //           item?.item_group || "",
  //           new Date().toISOString().split("T")[0],
  //         ]),
  //       ];

  //       const wb = utils.book_new();
  //       const ws = utils.aoa_to_sheet(wsData);

  //       // Optimize column widths
  //       ws["!cols"] = [
  //         { width: 15 },
  //         { width: 20 },
  //         { width: 20 },
  //         { width: 15 },
  //       ];

  //       utils.book_append_sheet(wb, ws, "Returned Items");

  //       // Generate with compression
  //       const fileArrayBuffer = write(wb, {
  //         type: "array",
  //         bookType: "xlsx",
  //         compression: true,
  //       });

  //       const uint8Array = new Uint8Array(fileArrayBuffer);
  //       let binaryString = "";

  //       // Process in chunks to avoid memory issues with large files
  //       const chunkSize = 8192;
  //       for (let i = 0; i < uint8Array.length; i += chunkSize) {
  //         const chunk = uint8Array.slice(i, i + chunkSize);
  //         for (let j = 0; j < chunk.length; j++) {
  //           binaryString += String.fromCharCode(chunk[j]);
  //         }
  //       }

  //       const base64File = btoa(binaryString);

  //       // Check file size
  //       const fileSizeMB = (base64File.length * 0.75) / (1024 * 1024); // Approximate size

  //       if (fileSizeMB > 25) {
  //         // Most email services limit to 25MB
  //         console.warn(`Large XLSX file: ${fileSizeMB.toFixed(2)} MB`);
  //       }

  //       return {
  //         filename: `returned_items_${
  //           new Date().toISOString().split("T")[0]
  //         }.xlsx`,
  //         content: base64File,
  //         contentType:
  //           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  //         size: fileSizeMB,
  //       };
  //     };

  //     const xlsxAttachment = generateOptimizedXLSXFile();

  //     // If file is too large, send summary email instead
  //     if (xlsxAttachment.size > 20) {
  //       const summaryPayload = {
  //         subject: "Returned items to renter - Summary",
  //         staffEmails: [
  //           ...user.companyData.employees
  //             .filter((element) => Number(element.role) < 2)
  //             .map((ele) => ele.user),
  //         ],
  //         supplierInfo: supplierInfo.data.providerCompanies,
  //         itemCount: itemsArray.length,
  //         returnDate: new Date().toISOString().split("T")[0],
  //         message: `Due to the large number of items (${itemsArray.length}), detailed information has been omitted. Please check the system for complete details.`,
  //       };

  //       const response = await devitrakApi.post(
  //         "/nodemailer/returned-items-summary-notification",
  //         summaryPayload
  //       );

  //       if (response.data) {
  //         return message.success(
  //           "Items returned and summary notification sent (file too large for attachment)."
  //         );
  //       }
  //     } else {
  //       // Send with attachment if file size is acceptable
  //       const emailPayload = {
  //         subject: "Returned items to renter",
  //         staffEmails: [
  //           ...user.companyData.employees
  //             .filter((element) => Number(element.role) < 2)
  //             .map((ele) => ele.user),
  //         ],
  //         supplierInfo: supplierInfo.data.providerCompanies,
  //         attachments: [
  //           {
  //             filename: xlsxAttachment.filename,
  //             content: xlsxAttachment.content,
  //             contentType: xlsxAttachment.contentType,
  //             encoding: "base64",
  //           },
  //         ],
  //       };

  //       // Check email payload size
  //       const emailSizeCheck = checkRequestSize(emailPayload);
  //       if (emailSizeCheck.isLarge) {
  //         console.warn(
  //           `Large email payload: ${emailSizeCheck.size.toFixed(2)} MB`
  //         );
  //       }

  //       const response = await devitrakApi.post(
  //         "/nodemailer/returned-items-to-renter-notification",
  //         emailPayload
  //       );

  //       if (response.data) {
  //         return message.success(
  //           "Items returned and notification sent with XLSX attachment."
  //         );
  //       }
  //     }
  //   } catch (error) {
  //     console.error("Error in email notification:", error);
  //     if (error.response?.status === 413) {
  //       message.error(
  //         "Email attachment too large. Summary notification sent instead."
  //       );
  //       // Fallback to summary email without attachment
  //       try {
  //         await devitrakApi.post(
  //           "/nodemailer/returned-items-summary-notification",
  //           {
  //             subject:
  //               "Returned items to renter - Summary (Attachment too large)",
  //             staffEmails: [
  //               ...user.companyData.employees
  //                 .filter((element) => Number(element.role) < 2)
  //                 .map((ele) => ele.user),
  //             ],
  //             itemCount: Array.from(items).length,
  //             returnDate: new Date().toISOString().split("T")[0],
  //           }
  //         );
  //         message.success("Summary notification sent successfully.");
  //       } catch (summaryError) {
  //         console.error("Failed to send summary notification:", summaryError);
  //         message.error("Failed to send any notification.");
  //       }
  //     } else {
  //       message.error("Failed to send email notification.");
  //     }
  //   }
  // };

  const handleReturnAllItems = async () => {
    setLoading(true);
    try {
      let allItemIds;

      if (isUsingProvidedData) {
        // Use all items from provided data
        allItemIds = data.map((item) => item.item_id);
      } else {
        // Get all item IDs for the current filter (existing logic)
        let getAllQuery = "";
        let getAllValues = [];

        if (supplier_id) {
          getAllQuery =
            "SELECT item_id, serial_number, item_group FROM item_inv WHERE ownership = ? AND company_id = ? AND supplier_info = ?";
          getAllValues = ["Rent", user.sqlInfo.company_id, supplier_id];
        } else {
          getAllQuery =
            "SELECT item_id, serial_number, item_group FROM item_inv WHERE ownership = ? AND company_id = ?";
          getAllValues = ["Rent", user.sqlInfo.company_id];
        }

        const allItemsResult = await devitrakApi.post(
          "/db_company/inventory-based-on-submitted-parameters",
          {
            query: getAllQuery,
            values: getAllValues,
          }
        );

        if (!allItemsResult.data?.result?.length) {
          message.warning("No items found to return");
          return;
        }

        allItemIds = allItemsResult.data.result.map((item) => item.item_id);
      }

      if (!allItemIds || allItemIds.length === 0) {
        message.warning("No items found to return");
        return;
      }

      message.loading({
        content: `Processing ${allItemIds.length} items...`,
        key: "processing",
      });

      // Step 1: Return items to renter
      await returnItemsToRenter(allItemIds);

      message.loading({
        content: "Items returned to renter, now deleting records...",
        key: "processing",
      });

      // Step 2: Delete items from records
      await deleteItemsFromRecords(allItemIds);

      // Step 3: Email notification to staff
      setProgress({ current: 0, total: 1, step: "Sending email notification" });
      // await emailNotification({ items: allItemIds });
      // Step 4: Clear cache memory
      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);
      message.success({
        content: `Successfully processed ${allItemIds.length} items`,
        key: "processing",
      });
      invalidatingQueriesForRefresh();
      setRenterItemList([]);
      setTotalItems(0);
      setSelectedItems(new Set());
      setProgress({ current: 0, total: 0, step: "" });
      handleClose();
    } catch (error) {
      message.error({ content: "Failed to process items", key: "processing" });
      console.error("Error processing items:", error);
      setProgress({ current: 0, total: 0, step: "" });
    } finally {
      setLoading(false);
    }
  };

  const handleReturnSelectedItems = async () => {
    if (selectedItems.size === 0) {
      message.warning("Please select items to return");
      return;
    }

    setLoading(true);
    try {
      const itemIds = Array.from(selectedItems);

      message.loading({
        content: `Processing ${itemIds.length} selected items...`,
        key: "processing",
      });

      // Step 1: Return items to renter
      await returnItemsToRenter(itemIds);

      message.loading({
        content: "Items returned to renter, now deleting records...",
        key: "processing",
      });

      // Step 2: Delete items from records
      await deleteItemsFromRecords(itemIds);

      // Step 3: Email notification to staff
      // await emailNotification({ items: selectedItems });

      // Step 4: Clear cache memory
      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);

      message.success({
        content: `Successfully processed ${itemIds.length} selected items`,
        key: "processing",
      });
      invalidatingQueriesForRefresh();
      // Refresh current page
      setSelectedItems(new Set());
      setProgress({ current: 0, total: 0, step: "" });
      fetchItemsForRenter(currentPage, searchText);
    } catch (error) {
      message.error({
        content: "Failed to process selected items",
        key: "processing",
      });
      console.error("Error processing selected items:", error);
      setProgress({ current: 0, total: 0, step: "" });
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: "Select",
      dataIndex: "select",
      width: 60,
      render: (_, record) => (
        <Checkbox
          checked={selectedItems.has(record.item_id)}
          onChange={(e) => {
            const newSelectedItems = new Set(selectedItems);
            if (e.target.checked) {
              newSelectedItems.add(record.item_id);
            } else {
              newSelectedItems.delete(record.item_id);
            }
            setSelectedItems(newSelectedItems);
          }}
        />
      ),
    },
    {
      title: "Item ID",
      dataIndex: "item_id",
      key: "item_id",
      sorter: (a, b) => a.item_id - b.item_id,
    },
    {
      title: "Serial Number",
      dataIndex: "serial_number",
      key: "serial_number",
      sorter: (a, b) => a.serial_number.localeCompare(b.serial_number),
    },
    {
      title: "Group",
      dataIndex: "item_group",
      key: "item_group",
      sorter: (a, b) => a.item_group.localeCompare(b.item_group),
    },
  ];

  const handleSelectAll = useCallback(
    (checked) => {
      if (checked) {
        const newSelectedItems = new Set(selectedItems);
        renterItemList.forEach((item) => newSelectedItems.add(item.item_id));
        setSelectedItems(newSelectedItems);
      } else {
        const newSelectedItems = new Set(selectedItems);
        renterItemList.forEach((item) => newSelectedItems.delete(item.item_id));
        setSelectedItems(newSelectedItems);
      }
    },
    [selectedItems, renterItemList]
  );

  const isAllCurrentPageSelected = useMemo(() => {
    return (
      renterItemList.length > 0 &&
      renterItemList.every((item) => selectedItems.has(item.item_id))
    );
  }, [renterItemList, selectedItems]);

  const isSomeCurrentPageSelected = useMemo(() => {
    return renterItemList.some((item) => selectedItems.has(item.item_id));
  }, [renterItemList, selectedItems]);

  const renderingOption1 = () => {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Return All Rented Items ({totalItems} items)
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This will return all rented items to the renter and delete them from
          records.
        </Typography>

        <Search
          placeholder="Search by Item ID or Serial Number"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16, width: 300 }}
          allowClear
        />

        <Table
          dataSource={renterItemList}
          columns={columns.slice(1)} // Exclude select column for "return all"
          rowKey="item_id"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          loading={loading}
        />

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={pageSize}
            showSizeChanger
            showQuickJumper
            showTotal={(total, range) =>
              `${range[0]}-${range[1]} of ${total} items`
            }
            onChange={handlePageChange}
            pageSizeOptions={["20", "50", "100", "200"]}
          />
          <BlueButtonConfirmationComponent
            title={`Return All Items (${totalItems})`}
            func={handleReturnAllItems}
            loadingState={loading}
            disabled={totalItems === 0}
            confirmationTitle="Are you sure you want to return the all items? This action can not be reversed."
          />
        </Box>
      </>
    );
  };

  const renderingOption2 = () => {
    return (
      <>
        <Typography variant="h6" gutterBottom>
          Select Items to Return
        </Typography>

        <Search
          placeholder="Search by Item ID or Serial Number"
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ marginBottom: 16, width: 300 }}
          allowClear
        />

        <Space style={{ marginBottom: 16 }}>
          <Checkbox
            checked={isAllCurrentPageSelected}
            indeterminate={
              isSomeCurrentPageSelected && !isAllCurrentPageSelected
            }
            onChange={(e) => handleSelectAll(e.target.checked)}
          >
            Select All on Page ({selectedItems.size} total selected)
          </Checkbox>
        </Space>

        <Table
          dataSource={renterItemList}
          columns={columns}
          rowKey="item_id"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          loading={loading}
        />

        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            <Pagination
              current={currentPage}
              total={totalItems}
              pageSize={pageSize}
              showSizeChanger
              showQuickJumper
              showTotal={(total, range) =>
                `${range[0]}-${range[1]} of ${total} items`
              }
              onChange={handlePageChange}
              pageSizeOptions={["20", "50", "100", "200"]}
            />
            <Typography variant="body2" color="text.secondary">
              {selectedItems.size} item(s) selected across all pages
            </Typography>
          </Box>
          <BlueButtonConfirmationComponent
            title={`Return Selected Items (${selectedItems.size})`}
            loadingState={loading}
            disabled={selectedItems.size === 0}
            confirmationTitle="Are you sure you want to return the selected items? This action can not be reversed."
            func={handleReturnSelectedItems}
          />
        </Box>
      </>
    );
  };

  const items = [
    {
      key: "1",
      label: "Return All Items",
      children: <Paper sx={{ p: 2 }}>{renderingOption1()}</Paper>,
    },
    {
      key: "2",
      label: "Return Selected Items",
      children: <Paper sx={{ p: 2 }}>{renderingOption2()}</Paper>,
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      footer={null}
      centered
      width={1200}
      title="Return Rented Items"
      destroyOnClose
    >
      <Box sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Tabs
              activeKey={activeTab}
              onChange={(key) => {
                setActiveTab(key);
                setCurrentPage(1);
                setSelectedItems(new Set());
                setSearchText("");
                fetchItemsForRenter(1, "");
              }}
              items={items}
            />
          </Grid>
        </Grid>
      </Box>
      {/* Add this in the Modal content, before the Tabs component: */}
      {progress.total > 0 && (
        <Box sx={{ mb: 2, p: 2, bgcolor: "background.paper", borderRadius: 1 }}>
          <Typography variant="body2" gutterBottom>
            {progress.step}
          </Typography>
          <Progress
            percent={Math.round((progress.current / progress.total) * 100)}
            status="active"
            showInfo
            format={(percent) =>
              `${progress.current}/${progress.total} (${percent}%)`
            }
          />
        </Box>
      )}
    </Modal>
  );
};

export default ReturnRentedItemModal;
