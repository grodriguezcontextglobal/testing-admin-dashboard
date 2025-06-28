import { Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, Divider, message, Modal, Select } from "antd";
import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { BlueButton } from "../../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { Subtitle } from "../../../../../styles/global/Subtitle";

const ContainerContent = ({
  openModal,
  setOpenModal,
  containerInfo,
  containerItemsContent,
  refetch,
}) => {
  const { user } = useSelector((state) => state.admin);
  const [itemToContent, setItemToContent] = useState(
    containerInfo?.container_items ?? []
  );
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    category_name: "",
    item_group: "",
    brand: "",
    ownership: "",
  });
  const queryClient = useQueryClient();
  const itemsInInventoryQuery = useQuery({
    queryKey: ["structuredCompanyInventory", filters],
    queryFn: () =>
      devitrakApi.post(`/db_company/company-inventory-structure`, {
        company_id: user.sqlInfo.company_id,
        filters: filters,
      }),
    enabled: !!user.sqlInfo.company_id,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });

  const FILTER_CONFIG = [
    {
      dataKey: "category_name",
      placeholder: "Select Category",
      stateKey: "category_name",
    },
    {
      dataKey: "item_group",
      placeholder: "Select Item Group",
      stateKey: "item_group",
    },
    { dataKey: "brand", placeholder: "Select Brand", stateKey: "brand" },
    {
      dataKey: "ownership",
      placeholder: "Select Ownership",
      stateKey: "ownership",
    },
  ];

  const renderFilterOptions = () => {
    const data = itemsInInventoryQuery?.data?.data?.groupedData;
    if (!data) return null;

    return (
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {FILTER_CONFIG.map(({ dataKey, placeholder, stateKey }) => {
          const options = data[dataKey] || {};
          console.log(filters[stateKey]);
          return (
            <Grid item xs={3} key={stateKey}>
              <Select
                virtual={true}
                loading={loading}
                style={{ width: "100%" }}
                placeholder={placeholder}
                value={filters[stateKey] !== "" ? filters[stateKey] : null}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, [stateKey]: value }))
                }
                onClear={() => {
                  setFilters((prev) => ({ ...prev, [stateKey]: undefined }));
                }}
                allowClear
              >
                {Object.entries(options).map(([name]) => (
                  <Select.Option key={name} value={name}>
                    {`${name}`}
                  </Select.Option>
                ))}
              </Select>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const closeModal = () => {
    return setOpenModal(false);
  };

  const buildQueryParams = () => {
    const baseParams = {
      company_id: user.sqlInfo.company_id,
      warehouse: 1,
      enableAssignFeature: 1,
    };

    // Add non-empty filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== "") {
        baseParams[key] = value;
      }
    });

    return baseParams;
  };

  const handleSearchItems = async () => {
    try {
      setLoading(true);
      const queryParams = buildQueryParams();
      const response = await devitrakApi.post(
        "/db_item/warehouse-items",
        queryParams
      );
      return setSearchResults(response.data.items || []);
    } catch (error) {
      message.error("Failed to fetch items");
    } finally {
      setLoading(false);
    }
  };

  const renderSearchResults = () => {
    return (
      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="Select items"
        loading={loading}
        value={itemToContent.map((item) => item.serial_number)}
        onChange={handleItemSelection}
        optionFilterProp="label"
        optionLabelProp="label"
        virtual={true}
        maxTagCount={5}
        maxTagPlaceholder={(omitted) => `+ ${omitted.length} more selected`}
        showSearch
        allowClear
        options={searchResults.map((item) => ({
          value: item.serial_number,
          label: `${item.serial_number} - ${item.item_group}`,
          // disabled:
          //   item.display_item === 0 &&
          //   String(item.container_id) !== String(searchParams),
          item: item,
        }))}
      />
    );
  };

  const handleItemSelection = (selectedSerialNumbers) => {
    const newItemToContent = selectedSerialNumbers.map((serialNumber) => {
      const selectedItem = searchResults.find(
        (item) => item.serial_number === serialNumber
      );
      return {
        serial_number: selectedItem.serial_number,
        ...selectedItem,
      };
    });

    if (newItemToContent.length > containerInfo.containerSpotLimit) {
      message.warning(
        `This container has a limit of ${containerInfo.containerSpotLimit} items. Please remove some items before adding more.`
      );
      // Keep the previous valid selection
      return;
    }
    setItemToContent(newItemToContent);
  };

  const savingItemsInContainer = async () => {
    try {
      if (containerItemsContent.length > 0) {
        await devitrakApi.delete(
          `/db_inventory/container/${containerInfo.item_id}`
        );
        message;
      }
      const response = await devitrakApi.post(`/db_inventory/container-items`, {
        container_item_id: containerInfo.item_id,
        child_ids: itemToContent.map((item) => item.item_id),
      });
      if (response.data) message.success("Case was successfully saved");
      queryClient.invalidateQueries({
        queryKey: ["infoItemSql"],
      });
      queryClient.invalidateQueries({
        queryKey: ["trackingItemActivity"],
      });
      refetch();
      return setOpenModal(false);
    } catch (error) {
      return message.error("Something went wrong: " + error.message);
    }
  };

  const updateExistingContent = async () => {
    try {
      setLoading(true);
      const response = await devitrakApi.put(
        `/db_inventory/container/${containerInfo.container_item_id}`,
        {
          child_ids: itemToContent.map((item) => item.item_id),
        }
      );
      if (response.data) {
        message.success("Container content updated successfully");
        queryClient.invalidateQueries({
          queryKey: ["infoItemSql"],
        });
        queryClient.invalidateQueries({
          queryKey: ["trackingItemActivity"],
        });
        setOpenModal(false);
      }
    } catch (error) {
      message.error("Failed to update container content: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={openModal}
      onCancel={closeModal}
      footer={[]}
      centered
      maskClosable={false}
      title="Add/Update content."
      width={1000}
    >
      <Grid
        display={"flex"}
        justifyContent={"flex-start"}
        alignItems={"center"}
        gap={1}
        container
      >
        {renderFilterOptions()}
        <Grid
          display={"flex"}
          justifyContent={"space-between"}
          alignItems={"center"}
          item
          xs={12}
          sm={12}
          md={12}
          lg={12}
        >
          <div style={{ display: "flex", gap: "10px" }}>
            <Button
              onClick={handleSearchItems}
              style={BlueButton}
              loading={loading}
            >
              <p style={{ ...BlueButtonText, ...CenteringGrid }}>
                Search items
              </p>
            </Button>
            {searchResults.length > 0 && (
              <h2
                style={{
                  ...Subtitle,
                  color: "var(--danger-action)",
                  margin: "0 0 0 10px",
                  textDecoration: "underline",
                }}
              >
                {searchResults.length} results
              </h2>
            )}
          </div>
          {itemToContent.length > 0 && (
            <Button
              style={BlueButton}
              onClick={() => {
                console.log(itemToContent);
              }}
            >
              <p style={BlueButtonText}>
                Done {itemToContent.length} items selected
              </p>
            </Button>
          )}
        </Grid>
        <Grid item xs={12}>
          {renderSearchResults()}
        </Grid>
        <Divider />
        <Grid
          style={{ display: itemToContent?.length > 0 ? "flex" : "none" }}
          justifyContent={"flex-start"}
          alignItems={"center"}
          gap={1}
          item
          xs={12}
          sm={12}
          md={12}
        >
          <Button style={GrayButton} onClick={() => setItemToContent([])}>
            <p style={{ ...GrayButtonText, ...CenteringGrid }}>Cancel</p>
          </Button>
          <Button
            loading={loading}
            style={BlueButton}
            onClick={
              containerInfo.container_item_id
                ? updateExistingContent
                : savingItemsInContainer
            }
          >
            <p style={{ ...BlueButtonText, ...CenteringGrid }}>
              {containerInfo.container_item_id ? "Update" : "Save"}
            </p>
          </Button>{" "}
        </Grid>
      </Grid>
    </Modal>
  );
};

export default ContainerContent;
