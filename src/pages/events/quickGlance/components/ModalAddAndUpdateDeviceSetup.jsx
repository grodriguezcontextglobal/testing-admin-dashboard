import {
  Chip,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Button, message, Modal, Select, Space, Tooltip } from "antd";
import { sortBy } from "lodash";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import { BorderedCloseIcon } from "../../../../components/icons/BorderedCloseIcon";
import { CheckIcon } from "../../../../components/icons/CheckIcon";
import { QuestionIcon } from "../../../../components/icons/QuestionIcon";
import { RectangleBluePlusIcon } from "../../../../components/icons/RectangleBluePlusIcon";
import { checkValidJSON } from "../../../../components/utils/checkValidJSON";
import { onAddEventData } from "../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../styles/global/AntSelectorStyle";
import { BlueButton } from "../../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import { LightBlueButton } from "../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../styles/global/Subtitle";
import clearCacheMemory from "../../../../utils/actions/clearCacheMemory";

const ModalAddAndUpdateDeviceSetup = ({
  openModalDeviceSetup,
  setOpenModalDeviceSetup,
  deviceTitle,
  quantity,
}) => {
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const { register, handleSubmit, watch, setValue } = useForm();
  const dispatch = useDispatch();
  const closeModal = () => {
    return setOpenModalDeviceSetup(false);
  };
  const eventName = event.eventInfoDetail.eventName;
  const [valueItemSelected, setValueItemSelected] = useState([]);
  const [listOfLocations, setListOfLocations] = useState([]);
  const [loading, setLoading] = useState(false);
  // Query definitions with proper configurations
  const itemQuery = useQuery({
    queryKey: [
      "itemGroupExistingLocationList",
      user.sqlInfo.company_id,
      deviceTitle,
    ],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        item_group: deviceTitle,
        enableAssignFeature: 1,
      }),
    enabled: !!user.sqlInfo.company_id,
    staleTime: 1 * 60 * 1000, // 1 minute cache
  });

  const recordNoSqlDevicesQuery = useQuery({
    queryKey: [
      "recordNoSqlDevices",
      event.eventInfoDetail.eventName,
      user.companyData.id,
      deviceTitle,
    ],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        type: deviceTitle,
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      }),
    staleTime: 1 * 60 * 1000, // 1 minute cache
  });

  const eventInfoSqlDB = useQuery({
    queryKey: ["eventInfoSqlDB"],
    queryFn: () =>
      devitrakApi.post("/db_event/consulting-event", {
        // company_assigned_event_id: user.sqlInfo.company_id,
        event_name: eventName,
      }),
    staleTime: 1 * 60 * 1000, // 5 minutes cache
  });

  // Only refetch data when modal opens
  useEffect(() => {
    if (openModalDeviceSetup) {
      itemQuery.refetch();
      recordNoSqlDevicesQuery.refetch();
      eventInfoSqlDB.refetch();
    }
  }, [openModalDeviceSetup]);

  const existingDevice =
    recordNoSqlDevicesQuery?.data?.data?.receiversInventory ?? [];

  // Memoize the select options to prevent recalculation on every render
  const selectOptions = useMemo(() => {
    const result = [];

    if (itemQuery.data?.data?.items) {
      const dataFound = itemQuery.data.data.items;
      for (const [key, valueData] of Object.entries(dataFound)) {
        result.push({
          key,
          valueData,
          label: (
            <Typography
              textTransform={"capitalize"}
              style={{
                ...Subtitle,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                width: "100%",
              }}
            >
              <span style={{ textAlign: "left", width: "50%" }}>
                Location: <span style={{ fontWeight: 700 }}>{key}</span>
              </span>
              <span style={{ textAlign: "right", width: "50%" }}>
                Available: {valueData?.qty}
              </span>
            </Typography>
          ),
          value: JSON.stringify({
            // data: valueData?.data,
            start: valueData?.start,
            end: valueData?.end,
            serialNumberList: valueData?.serialNumberList,
            location: key,
          }),
        });
      }
    }

    return result;
  }, [itemQuery.data]);

  const onChange = useCallback((value) => {
    try {
      const optionRendering = JSON.parse(value);
      setValueItemSelected(optionRendering);
    } catch (error) {
      return setValueItemSelected([]);
    }
  }, []);

  const checkIfSerialNumberExists = useCallback(() => {
    const serialNumber = watch("serial_number");
    if (!serialNumber || !valueItemSelected?.serialNumberList) return false;
    try {
      const parsedData = checkValidJSON(valueItemSelected.serialNumberList);
      return parsedData.some((item) => item === serialNumber);
    } catch (error) {
      return false;
    }
  }, [watch, valueItemSelected]);

  const fullDetailForSelectedData = async (props) => {
    try {
      const response = await devitrakApi.post(
        "/db_event/retrieve-item-location-quantity-full-details",
        {
          location: props.location,
          company_id: user.sqlInfo.company_id,
          warehouse: 1,
          item_group: deviceTitle,
          enableAssignFeature: 1,
          serial_number: props.serial_number,
          quantity: Number(props.quantity),
          category_name: props.category_name,
        }
      );
      if (response.data) {
        return response.data.data;
      }
    } catch (error) {
      return message.error(JSON.stringify(error));
    }
  };

  const addingDeviceFromLocations = useCallback(
    async (data) => {
      if (existingDevice.length === Number(quantity)) {
        message.warning(
          "Device type had reached out the quantity set when event was created."
        );
        return;
      }

      const checkingDiff = Number(quantity) - existingDevice.length;
      if (Number(data.quantity) > checkingDiff) {
        message.warning(
          `Quantity assigned is bigger than needed to reach out the quantity set in event.`
        );
        return;
      }

      try {
        const deviceInfoResponse = await fullDetailForSelectedData({
          ...data,
          location: valueItemSelected?.location,
        });
        const result = [
          ...listOfLocations,
          {
            quantity: data.quantity,
            deviceInfo: deviceInfoResponse,
            startingNumber: data.serial_number,
            location: valueItemSelected?.location,
          },
        ];

        setValue("quantity", "");
        setValue("serial_number", "");
        setListOfLocations(result);
      } catch (error) {
        console.error("Error adding device from location:", error);
        message.error("Failed to add device. Please try again.");
      }
    },
    [existingDevice, quantity, valueItemSelected, listOfLocations, setValue]
  );

  const removeItem = useCallback((index) => {
    setListOfLocations((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const blockingButton = useMemo(() => {
    if (listOfLocations.length === 0) return false;

    const totalQuantity = listOfLocations.reduce(
      (accu, { quantity }) => accu + Number(quantity),
      0
    );

    return totalQuantity === Number(quantity);
  }, [listOfLocations, quantity]);

  const disablingButton = useMemo(() => {
    return existingDevice.length === Number(quantity)
      ? LightBlueButton
      : BlueButton;
  }, [existingDevice.length, quantity]);

  const addingNewItemsToEvent = async ({ sql, device, updateDeviceInv }) => {
    const template = {
      category: sql[0].category_name,
      group: sql[0].item_group,
      value: sql[0].cost,
      description: sql[0].descript_item,
      company: user.companyData.company_name,
      quantity: device.length,
      ownership: sql[0].ownership,
      createdBy: new Date().toISOString(),
      key: sql[0].id,
      dateCreated: new Date().toISOString(),
      resume: `${sql[0].category_name} ${sql[0].item_group} ${sql[0].cost} ${sql[0].descript_item} ${user.companyData.company_name} ${sql[0].ownership}`,
      consumerUses: false,
      startingNumber: device[0].device,
      endingNumber: device[device.length - 1].device,
      existing: true,
    };

    // Add the new template to the device setup array
    const updatedDeviceSetup = [...updateDeviceInv, template];

    // Update the event with the new device setup
    await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      deviceSetup: updatedDeviceSetup,
    });

    // Update Redux store
    dispatch(
      onAddEventData({
        ...event,
        deviceSetup: updatedDeviceSetup,
      })
    );
  };

  const updateDeviceSetupInEvent = async (props) => {
    const sortingData = sortBy(props, "device", "asc");
    const updateDeviceInv = [...event.deviceSetup];
    const foundIndex = updateDeviceInv.findIndex(
      (element) =>
        String(element.group).toLowerCase() ===
        String(sortingData[0].type).toLowerCase()
    );

    if (foundIndex > -1) {
      // Update existing device setup entry
      const updatedInventoryEvent = {
        ...updateDeviceInv[foundIndex],
        startingNumber: sortingData[0].device,
        endingNumber: sortingData[sortingData.length - 1].device,
        quantity: sortingData.length,
      };
      updateDeviceInv[foundIndex] = updatedInventoryEvent;

      await devitrakApi.patch(`/event/edit-event/${event.id}`, {
        deviceSetup: updateDeviceInv,
      });

      dispatch(
        onAddEventData({
          ...event,
          deviceSetup: updateDeviceInv,
        })
      );
    } else {
      // Add new device setup entry
      const retrieveItemDataFormat = await devitrakApi.post(
        `/db_item/consulting-item`,
        {
          item_group: sortingData[0].type,
          company_id: user.sqlInfo.company_id,
        }
      );

      if (retrieveItemDataFormat.data?.items) {
        await addingNewItemsToEvent({
          sql: retrieveItemDataFormat.data.items,
          device: sortingData,
          updateDeviceInv,
        });
      }
    }
  };

  const gettingItemsInContainer = async (props) => {
    const gettingItemsInContainer = await devitrakApi.get(
      `/db_inventory/container-items/${props.item_id}`
    );
    return gettingItemsInContainer;
  };

  const createDeviceRecordInNoSQLDatabase = async (props) => {
    let data = null;
    data = props.deviceInfo;
    const template = {
      deviceList: JSON.stringify(data.map((item) => item.serial_number)),
      status: "Operational",
      activity: false,
      comment: "No comment",
      eventSelected: eventName,
      provider: user.company,
      type: data[0].item_group,
      company: user.companyData.id,
      event_id: event.id,
    };
    await devitrakApi.post("/receiver/receivers-pool-bulk", template);

    // Check if this is a container item first
    const isContainer = data.some((item) => item.container > 0);
    if (isContainer) {
      // If it's a container, only handle container logic
      await checkIfContainer(data);
    } else {
      // Only update inventory event for non-container items
      await checkInsertedDataAndUpdateInventoryEvent(data);
    }
  };

  const checkIfContainer = async (props) => {
    const extractingContainers = props.filter((item) => item.container > 0);
    if (extractingContainers.length > 0) {
      for (const container of extractingContainers) {
        // First, create device setup entry for the container itself
        const containerSetup = {
          category: container.category_name,
          group: container.item_group,
          value: container.cost || 0,
          description: container.descript_item,
          company: user.companyData.company_name,
          quantity: 1,
          ownership: container.ownership,
          createdBy: new Date().toISOString(),
          key: container.id,
          dateCreated: new Date().toISOString(),
          resume: `${container.category_name} ${container.item_group} ${container.cost || 0} ${container.descript_item} ${user.companyData.company_name} ${container.ownership}`,
          consumerUses: false,
          startingNumber: container.serial_number,
          endingNumber: container.serial_number,
          existing: true
        };

        // Get and process contained items
        const itemsInContainer = await gettingItemsInContainer({
          item_id: container.item_id,
        });

        const itemsProfile = await devitrakApi.post(
          "/db_inventory/check-large-data",
          {
            item_ids: [
              ...itemsInContainer.data.container.items.map(
                (item) => item.item_id
              ),
            ],
          }
        );

        const containerItems = itemsProfile.data.result;
        if (containerItems.length > 0) {
          const sortedItems = containerItems.sort((a, b) =>
            a.serial_number.localeCompare(b.serial_number)
          );

          const containedItemsSetup = {
            category: sortedItems[0].category_name,
            group: sortedItems[0].item_group,
            value: sortedItems[0].cost || 0,
            description: sortedItems[0].descript_item,
            company: user.companyData.company_name,
            quantity: sortedItems.length,
            ownership: sortedItems[0].ownership,
            createdBy: new Date().toISOString(),
            key: sortedItems[0].id,
            dateCreated: new Date().toISOString(),
            resume: `${sortedItems[0].category_name} ${sortedItems[0].item_group} ${sortedItems[0].cost || 0} ${sortedItems[0].descript_item} ${user.companyData.company_name} ${sortedItems[0].ownership}`,
            consumerUses: false,
            startingNumber: sortedItems[0].serial_number,
            endingNumber: sortedItems[sortedItems.length - 1].serial_number,
            existing: true
          };

          const updatedDeviceSetup = [...event.deviceSetup];

          // Update or add container entry
          const containerIndex = updatedDeviceSetup.findIndex(
            (setup) => setup.group === container.item_group
          );
          if (containerIndex > -1) {
            updatedDeviceSetup[containerIndex] = containerSetup;
          } else {
            updatedDeviceSetup.push(containerSetup);
          }

          // Update or add contained items entry
          const containedItemsIndex = updatedDeviceSetup.findIndex(
            (setup) => setup.group === sortedItems[0].item_group
          );
          if (containedItemsIndex > -1) {
            updatedDeviceSetup[containedItemsIndex] = containedItemsSetup;
          } else {
            updatedDeviceSetup.push(containedItemsSetup);
          }

          // Update both container and contained items in a single update
          await devitrakApi.patch(`/event/edit-event/${event.id}`, {
            deviceSetup: updatedDeviceSetup,
          });

          dispatch(
            onAddEventData({
              ...event,
              deviceSetup: updatedDeviceSetup,
            })
          );
        }
      }
    }
    return null;
  };

  const checkInsertedDataAndUpdateInventoryEvent = async (props) => {
    console.log("checkInsertedDataAndUpdateInventoryEvent", props);
    try {
      const checking = await devitrakApi.post("/receiver/receiver-pool-list", {
        type: props[0].item_group,
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      });
      console.log("checking", checking);
      if (checking.data.receiversInventory.length > 0) {
        console.log(
          "checking.data.receiversInventory",
          checking.data.receiversInventory
        );
        await updateDeviceSetupInEvent(checking.data.receiversInventory);
      }
    } catch (error) {
      message.error("Failed to add device. Please try again.");
    }
  };

  const createDeviceInEvent = async (props) => {
    console.log("createDeviceInEvent", props.deviceInfo);
    let database = [...props.deviceInfo];
    const event_id = event.sql.event_id;
    await devitrakApi.post("/db_event/event_device", {
      event_id: event_id,
      item_group: database[0].item_group,
      startingNumber: database[0].serial_number,
      quantity: props.quantity,
      company_id: user.sqlInfo.company_id,
      category_name: database[0].category_name,
      data: props.deviceInfo.map((item) => item.serial_number),
    });
    await devitrakApi.post("/db_item/item-out-warehouse", {
      warehouse: false,
      company_id: user.sqlInfo.company_id,
      item_group: database[0].item_group,
      startingNumber: database[0].serial_number,
      quantity: props.quantity,
      category_name: database[0].category_name,
      data: props.deviceInfo.map((item) => item.serial_number),
    });
    await createDeviceRecordInNoSQLDatabase(props);
  };

  const handleDevicesInEvent = async () => {
    if (listOfLocations.length === 0) return;

    try {
      setLoading(true);

      for (let data of listOfLocations) {
        const index = data.deviceInfo.findIndex(
          (element) => element.serial_number === data.startingNumber
        );
        if (index > -1) {
          const deviceInfo = [...data.deviceInfo].slice(
            index,
            index + Number(data.quantity)
          );
          await createDeviceInEvent({ ...data, deviceInfo });
        } else {
          message.warning("Device not found");
        }
      }
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );
      closeModal();
    } catch (error) {
      message.error("Failed to add devices to event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={openModalDeviceSetup}
      onCancel={closeModal}
      centered
      maskClosable={false}
      footer={[]}
      width={700}
      style={{ zIndex: 30 }}
      destroyOnClose={true} // Important for cleanup
    >
      <form
        style={{
          width: "100%",
          justifyContent: "flex-start",
          alignItems: "center",
          textAlign: "left",
          padding: 0,
        }}
        onSubmit={handleSubmit(addingDeviceFromLocations)}
      >
        <Typography style={{ ...Subtitle, margin: "0px auto 1rem" }}>
          Enter serial number range for <strong>{deviceTitle}</strong> to assign
          to this event.
        </Typography>
        <div style={{ margin: "0px auto 1rem", width: "100%" }}>
          <Select
            className="custom-autocomplete"
            showSearch
            placeholder="Search item to add to inventory."
            optionFilterProp="children"
            style={{ ...AntSelectorStyle, width: "100%" }}
            onChange={onChange}
            options={selectOptions}
            loading={itemQuery.isLoading}
            virtual={true} // Enable virtual scrolling for better performance
            filterOption={(input, option) => {
              return option.key.toLowerCase().includes(input.toLowerCase());
            }}
            getPopupContainer={(triggerNode) => triggerNode.parentNode}
          />
        </div>
        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            textAlign: "left",
            gap: "10px",
          }}
        >
          <div
            style={{
              textAlign: "left",
              width: "100%",
              margin: "0.5rem 0",
            }}
          >
            <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500, textWrap: "pretty" }}
              >
                <Tooltip title="The check icon means the serial number does exist in company's inventory. The x icon means the serial number does not exist in company's inventory.">
                  Starting from serial number <QuestionIcon />
                </Tooltip>
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("serial_number")}
              style={OutlinedInputStyle}
              placeholder="e.g. 154580"
              endAdornment={
                <InputAdornment position="end">
                  <span>
                    {checkIfSerialNumberExists() ? (
                      <CheckIcon />
                    ) : (
                      <BorderedCloseIcon />
                    )}
                  </span>
                </InputAdornment>
              }
            />
          </div>
          <div
            style={{
              textAlign: "left",
              width: "100%",
              margin: "0.5rem 0",
            }}
          >
            <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
              <Typography
                textTransform={"none"}
                textAlign={"left"}
                style={{ ...Subtitle, fontWeight: 500, textWrap: "pretty" }}
              >
                Qty of devices from {valueItemSelected[0]?.location}
              </Typography>
            </InputLabel>
            <OutlinedInput
              required
              {...register("quantity")}
              style={OutlinedInputStyle}
              placeholder="e.g. 150"
              type="number" // Better input type for quantities
            />
          </div>
        </div>
        <span style={{ width: "100%", textAlign: "right" }}>
          <p style={Subtitle}>
            series starts: {valueItemSelected?.start} - series ends:{" "}
            {valueItemSelected?.end}
          </p>
        </span>

        <div
          style={{
            width: "100%",
            display: "flex",
            justifyContent: "flex-start",
            alignItems: "center",
            margin: "0.5rem 0",
            gap: "5px",
          }}
        >
          <Space size={[8, 16]} wrap>
            {listOfLocations.map((item, index) => (
              <Chip
                key={`${item.startingNumber}-${index}`}
                label={`${item.location || "Unknown"} - ${item.quantity}`}
                onDelete={() => removeItem(index)}
              />
            ))}
          </Space>
        </div>
        <div
          style={{
            textAlign: "left",
            width: "100%",
            margin: "0.5rem 0",
          }}
        >
          <InputLabel style={{ marginBottom: "3px", width: "100%" }}>
            <Typography
              textTransform={"none"}
              textAlign={"left"}
              style={{
                ...Subtitle,
                color: "transparent",
                fontWeight: 500,
                textWrap: "pretty",
              }}
            >
              Qty of devices from {valueItemSelected[0]?.location}
            </Typography>
          </InputLabel>
          <button
            disabled={blockingButton}
            type="submit"
            style={{
              ...LightBlueButton,
              ...CenteringGrid,
              display: blockingButton ? "none" : "flex",
              width: "100%",
            }}
          >
            <Typography textTransform="none" style={LightBlueButtonText}>
              <RectangleBluePlusIcon />
              &nbsp; Add qty from location
            </Typography>
          </button>
        </div>
      </form>
      <Button
        disabled={existingDevice.length === Number(quantity)}
        loading={loading}
        onClick={handleDevicesInEvent}
        style={{
          ...disablingButton,
          ...CenteringGrid,
          display: blockingButton ? "flex" : "none",
          width: "100%",
        }}
      >
        <Typography textTransform={"none"} style={BlueButtonText}>
          Add devices to this event.
        </Typography>
      </Button>
    </Modal>
  );
};

export default ModalAddAndUpdateDeviceSetup;

ModalAddAndUpdateDeviceSetup.propTypes = {
  openModalDeviceSetup: PropTypes.bool,
  setOpenModalDeviceSetup: PropTypes.func,
  deviceTitle: PropTypes.string,
  quantity: PropTypes.string,
};
