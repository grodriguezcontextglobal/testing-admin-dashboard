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

const { Search } = Input;

const ReturnRentedItemModal = ({ handleClose, open, supplier_id }) => {
  const [activeTab, setActiveTab] = useState("1");
  const [renterItemList, setRenterItemList] = useState([]);
  const [selectedItems, setSelectedItems] = useState(new Set()); // Use Set for O(1) lookups
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50); // Configurable page size
  const [totalItems, setTotalItems] = useState(0);
  const { user } = useSelector((state) => state.admin);

  // Fetch items with pagination and search
  const fetchItemsForRenter = useCallback(
    async (page = 1, search = "") => {
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
    [supplier_id, pageSize, user.sqlInfo.company_id]
  );

  useEffect(() => {
    if (open) {
      setCurrentPage(1);
      setSelectedItems(new Set());
      setSearchText("");
      fetchItemsForRenter(1, "");
    }
  }, [open, fetchItemsForRenter]);

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setCurrentPage(1);
      fetchItemsForRenter(1, searchText);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchText, fetchItemsForRenter]);

  // Handle page change
  const handlePageChange = useCallback(
    (page, size) => {
      setCurrentPage(page);
      if (size !== pageSize) {
        setPageSize(size);
      }
      fetchItemsForRenter(page, searchText);
    },
    [fetchItemsForRenter, searchText, pageSize]
  );

  // Helper function to process items in batches
  const processBatchedItems = async (
    itemIds,
    batchProcessor,
    batchSize = 500
  ) => {
    const results = [];

    for (let i = 0; i < itemIds.length; i += batchSize) {
      const batch = itemIds.slice(i, i + batchSize);
      try {
        const result = await batchProcessor(batch);
        results.push(result);

        // Add small delay between batches to prevent overwhelming the server
        if (i + batchSize < itemIds.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      } catch (error) {
        console.error(`Error processing batch ${i / batchSize + 1}:`, error);
        throw error;
      }
    }

    return results;
  };

  // Step 1: Return items to renter
  const returnItemsToRenter = async (itemIds) => {
    const returnDate = new Date().toISOString();
    const moreInfo = {
      supplier_id: supplier_id || null,
      company_id: user.sqlInfo.company_id,
      returned_by: user.name,
      return_timestamp: returnDate,
    };

    const batchProcessor = async (batch) => {
      const payload = batch.map((item_id) => item_id);
      return await devitrakApi.post(
        "/db_company/inventory-based-on-submitted-parameters",
        {
          query:
            "UPDATE item_inv SET warehouse =? enableAssignFeature = ? returnedRentedInfo = ? return_date = ? WHERE item_id in (?)",
          values: [1, 0, JSON.stringify(moreInfo), returnDate, [...payload]],
        }
      );
    };

    return await processBatchedItems(itemIds, batchProcessor);
  };

  // Step 2: Delete items from records
  const deleteItemsFromRecords = async (itemIds) => {
    const batchProcessor = async (batch) => {
      const placeholders = batch.map(() => "?").join(",");
      const deleteQuery = `DELETE FROM item_inv WHERE item_id IN (${placeholders}) AND company_id = ?`;
      const deleteValues = [...batch, user.sqlInfo.company_id];
      return await devitrakApi.post(
        "/db_company/inventory-based-on-submitted-parameters",
        {
          query: deleteQuery,
          values: deleteValues,
        }
      );
    };

    return await processBatchedItems(itemIds, batchProcessor);
  };

  const emailNotification = async ({ items }) => {
    const supplierInfo = await devitrakApi.post(
      `/company/provider-company/${supplier_id}`,
      {
        creator: user?.companyData?.id,
        provider_id: supplier_id,
      }
    );
    const response = await devitrakApi.post(
      "/nodemailer/returned-items-to-renter-notification",
      {
        subject: "Returned items to renter",
        staffEmails: [
          ...user.companyData.employees
            .filter((element) => Number(element.role) < 2)
            .map((ele) => ele.user),
        ],
        items: [
          ...Array.from(items).map(
            (item) => renterItemList.filter((ele) => ele.item_id === item)[0]
          ),
        ],
        supplierInfo: supplierInfo.data.providerCompanies,
      }
    );
    if (response.data) {
      return message.success("Item is returned to the company.");
    }
  };
  const handleReturnAllItems = async () => {
    setLoading(true);
    try {
      // Get all item IDs for the current filter
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
      console.log("getAllQuery", {
        query: getAllQuery,
        values: getAllValues,
      });
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

      const allItemIds = allItemsResult.data.result.map((item) => item.item_id);

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
      await emailNotification({ items: allItemIds });

      // Step 4: Clear cache memory
      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);

      message.success({
        content: `Successfully processed ${allItemIds.length} items`,
        key: "processing",
      });

      setRenterItemList([]);
      setTotalItems(0);
      setSelectedItems(new Set());
      handleClose();
    } catch (error) {
      message.error({ content: "Failed to process items", key: "processing" });
      console.error("Error processing items:", error);
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
      await emailNotification({ items: selectedItems });

      // Step 4: Clear cache memory
      await clearCacheMemory(`providerCompanies_${user.companyData.id}`);

      message.success({
        content: `Successfully processed ${itemIds.length} selected items`,
        key: "processing",
      });

      // Refresh current page
      setSelectedItems(new Set());
      fetchItemsForRenter(currentPage, searchText);
    } catch (error) {
      message.error({
        content: "Failed to process selected items",
        key: "processing",
      });
      console.error("Error processing selected items:", error);
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
    </Modal>
  );
};

export default ReturnRentedItemModal;
