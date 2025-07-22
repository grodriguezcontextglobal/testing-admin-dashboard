import { Chip } from "@mui/material";
import { message, Select, Space } from "antd";
import { useCallback, useState } from "react";
import { useSelector } from "react-redux";
const ContainerForm = ({
  AntSelectorStyle,
  blockingButton,
  CenteringGrid,
  deviceTitle,
  setListOfLocations,
  gettingData,
  handleSubmit,
  itemQuery,
  LightBlueButton,
  LightBlueButtonText,
  onChange,
  RectangleBluePlusIcon,
  selectOptions,
  Subtitle,
  Typography,
}) => {
  const [loading, setLoading] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [itemToContent, setItemToContent] = useState([]);
  const [finalSelection, setFinalSelection] = useState([]);

  const { event } = useSelector((state) => state.event);
  const eventInvInfo = event.deviceSetup
    .filter((element) => element.group === deviceTitle)
    .at(-1);
  const renderLocationBasedOptions = useCallback((selectedOptions) => {
    if (!Array.isArray(selectedOptions) || selectedOptions.length === 0) {
      return [];
    }

    const serialNumbersByLocation = new Map();

    selectedOptions.forEach((option) => {
      try {
        const valueData =
          typeof option.value === "string"
            ? JSON.parse(option.value)
            : option.valueData;

        const location = valueData.location || option.key;
        const serialNumbers = valueData.serialNumberList || [];

        if (!serialNumbersByLocation.has(location)) {
          serialNumbersByLocation.set(location, new Set());
        }

        serialNumbers.forEach((serial) => {
          serialNumbersByLocation.get(location).add(serial);
        });
      } catch (error) {
        console.error("Error processing option:", error);
      }
    });
    return Array.from(serialNumbersByLocation.entries()).map(
      ([location, serials]) => ({
        value: location,
        key: location,
        label: location,
        serialNumbers: Array.from(serials),
      })
    );
  }, []);
  const handleItemSelection = (selectedSerialNumbers) => {
    // Handle item removal
    if (selectedSerialNumbers.length < itemToContent.length) {
      const newItemToContent = itemToContent.filter((item) =>
        selectedSerialNumbers.includes(item)
      );
      return setItemToContent(newItemToContent);
    }

    // Handle item addition
    const newItems = selectedSerialNumbers
      .filter(
        (serialNumber) => !itemToContent.some((item) => item === serialNumber)
      )
      .map((serialNumber) => {
        const selectedItem = itemQuery.data.data.items[
          selectedLocation
        ].serialNumberList.find((item) => item === serialNumber);
        return selectedItem ? selectedItem : null;
      })
      .filter(Boolean);

    const updatedItemToContent = [...itemToContent, ...newItems];

    // Check container limit
    if (updatedItemToContent.length > eventInvInfo.quantity) {
      message.warning(
        `This container has a limit of ${eventInvInfo.quantity} items. Please remove some items before adding more.`
      );
      return;
    }

    return setItemToContent(updatedItemToContent);
  };

  const renderSearchResults = () => {
    const locationOptions = renderLocationBasedOptions(selectOptions);
    const selectedLocationData = locationOptions.find(
      (opt) => opt.key === selectedLocation
    );
    const serialNumbers = selectedLocationData?.serialNumbers || [];
    return (
      <Select
        mode="multiple"
        style={{ width: "100%" }}
        placeholder="Select items"
        loading={loading}
        value={itemToContent.map((item) => item)}
        onChange={handleItemSelection}
        optionFilterProp="label"
        optionLabelProp="label"
        virtual={true}
        maxTagCount={eventInvInfo.quantity}
        maxTagPlaceholder={(omitted) => `+ ${omitted.length} more selected`}
        showSearch
        allowClear
        options={serialNumbers.map((serialNumber) => ({
          value: `${serialNumber}`,
          label: serialNumber,
          item: { serial_number: serialNumber, location: selectedLocation },
        }))}
      />
    );
  };

  const handleLocationChange = (location) => {
    setLoading(true);
    setSelectedLocation(location);
    if (onChange) {
      setLoading(false);
      onChange(location);
    }
  };

  const addingDataToAssignToEventInventory = async () => {
    setFinalSelection([
      ...finalSelection,
      {
        location: selectedLocation,
        serialNumberList: itemToContent.map((item) => item),
      },
    ]);
    let currentData = [
      ...finalSelection,
      {
        location: selectedLocation,
        serialNumberList: itemToContent.map((item) => item),
      },
    ];
    await handleSubmitContainerInfo(currentData);
    return setItemToContent([]);
  };

  const removeItem = (index) => {
    setFinalSelection((prev) => prev.filter((_, i) => i !== index));
    return setListOfLocations((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitContainerInfo = async (currentData) => {
    try {
      let info = [];
      for (let data of currentData) {
        let deviceInfo = [];
        data.serialNumberList.map(async (item) => {
          const containerInfo = await gettingData({
            serial_number: item,
            quantity: 1,
            location: data.location,
          });
          deviceInfo.push(containerInfo.at(-1));
        });
        info.push({
          location: data.location,
          deviceInfo: deviceInfo,
          quantity: data.serialNumberList.length,
          startingNumber: data.serialNumberList[0],
        });
      }
      return setListOfLocations(info);
    } catch (error) {
      return message.error("Failed to add device. Please try again.");
    }
  };

  return (
      <form
        style={{
          width: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
          padding: 0,
        }}
        onSubmit={handleSubmit(addingDataToAssignToEventInventory)}
      >
        <div style={{ margin: "0px auto 1rem", width: "100%" }}>
          <label style={{ ...Subtitle, margin: "0px auto 1rem" }}>
            Select location from where items will be added to inventory.
          </label>
          <Select
            className="custom-autocomplete"
            showSearch
            placeholder="Search item to add to inventory."
            optionFilterProp="children"
            style={{ ...AntSelectorStyle, width: "100%" }}
            onChange={handleLocationChange}
            options={renderLocationBasedOptions(selectOptions)}
            loading={itemQuery.isLoading}
            virtual={true}
            filterOption={(input, option) => {
              return option.key.toLowerCase().includes(input.toLowerCase());
            }}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          />
        </div>
        <div>{renderSearchResults()}</div>
        <div
          style={{
            margin: "0px auto 1rem",
            width: "100%",
            display: finalSelection.length > 0 ? "flex" : "none",
          }}
        >
          {
            <Space
              style={{ margin: "1rem auto", width: "100%" }}
              size={[8, 16]}
              wrap
            >
              {finalSelection.length > 0 &&
                finalSelection.map((item, index) => (
                  <Chip
                    key={`${item.location}-${index}`}
                    label={`${item.location || "Unknown"} - ${
                      item.serialNumberList.length
                    }`}
                    onDelete={() => removeItem(index)}
                  />
                ))}
            </Space>
          }
        </div>
        <div
          style={{
            textAlign: "left",
            width: "100%",
            margin: "0.5rem 0",
          }}
        >
          <button
            disabled={blockingButton}
            type="submit"
            style={{
              ...LightBlueButton,
              ...CenteringGrid,
              display:
                eventInvInfo.quantity ===
                finalSelection
                  .map((item) => item.serialNumberList.length)
                  .reduce((a, b) => a + b, 0)
                  ? "none"
                  : "flex",
              width: "100%",
            }}
          >
            <Typography textTransform="none" style={LightBlueButtonText}>
              <RectangleBluePlusIcon />
              &nbsp; Add qty: {itemToContent.length} from &nbsp;
              {selectedLocation}
              &nbsp; location
            </Typography>
          </button>
        </div>
      </form>
  );
};

export default ContainerForm;
