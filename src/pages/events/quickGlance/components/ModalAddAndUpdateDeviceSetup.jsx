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
  const eventInventoryRef = useCallback(
    async ({ device = null, database = null, checking = null }) => {
      const eventInventoryRef = await devitrakApi.post("/event/event-list", {
        _id: event.id,
      });
      const updateDeviceInv = [...eventInventoryRef.data.list[0].deviceSetup];
      const sortingData = sortBy(device, "device", "asc");
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
          endingNumber: sortingData.at(-1).device,
          quantity: sortingData.length,
        };
        updateDeviceInv[foundIndex] = updatedInventoryEvent;
        const updatingEventInventory = await devitrakApi.patch(
          `/event/edit-event/${event.id}`,
          {
            deviceSetup: updateDeviceInv,
          }
        );
        return dispatch(
          onAddEventData({
            ...event,
            deviceSetup: updatingEventInventory.data.event.deviceSetup,
          })
        );
      } else {
        const templateUpdateEventInventory = {
          category: database[0].category_name,
          group: database[0].item_group,
          value: database[0].cost,
          description: database[0].descript_item,
          company: user.companyData.company_name,
          quantity: database.length,
          ownership: database[0].ownership,
          createdBy: new Date().toISOString(),
          key: database[0].id,
          dateCreated: new Date().toISOString(),
          resume: `${database[0].category_name} ${database[0].item_group} ${database[0].cost} ${database[0].descript_item} ${user.companyData.company_name} ${database[0].ownership}`,
          consumerUses: false,
          startingNumber: checking.data.receiversInventory[0].device,
          endingNumber: checking.data.receiversInventory.at(-1).device,
          existing: true,
        };

        // Add the new templateUpdateEventInventory to the device setup array
        const updatedDeviceSetup = [
          ...eventInventoryRef.data.list[0].deviceSetup,
          templateUpdateEventInventory,
        ];

        // Update the event with the new device setup
        await devitrakApi.patch(`/event/edit-event/${event.id}`, {
          deviceSetup: updatedDeviceSetup,
        });
      }
      return dispatch(
        onAddEventData({
          ...event,
          deviceSetup: eventInventoryRef.data.list[0].deviceSetup,
        })
      );
    },
    []
  );

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

  const gettingItemsInContainer = async (props) => {
    try {
      const gettingItemsInContainer = await devitrakApi.get(
        `/db_inventory/container-items/${props.item_id}`
      );
      return gettingItemsInContainer;
    } catch (error) {
      console.log(props);
      message.error("Failed to get items in container. Please try again.");
      return null;
    }
  };

  const extractContainersItemsInfo = async (containerSetup) => {
    try {
      const itemsInContainer = await gettingItemsInContainer(containerSetup);
      if (itemsInContainer.data.container.items.length > 0) {
        const sortedItems = itemsInContainer.data.container.items.sort((a, b) =>
          a.serial_number.localeCompare(b.serial_number)
        );
        let database = [...sortedItems];
        const event_id = event.sql.event_id;
        await devitrakApi.post("/db_event/event_device", {
          event_id: event_id,
          item_group: database[0].item_group,
          startingNumber: database[0].serial_number,
          quantity: `${database.length}`,
          company_id: user.sqlInfo.company_id,
          category_name: database[0].category_name,
          data: database.map((item) => item.serial_number),
        });
        await devitrakApi.post("/db_item/item-out-warehouse", {
          warehouse: false,
          company_id: user.sqlInfo.company_id,
          item_group: database[0].item_group,
          startingNumber: database[0].serial_number,
          quantity: `${database.length}`,
          category_name: database[0].category_name,
          data: database.map((item) => item.serial_number),
        });
        const template = {
          deviceList: JSON.stringify(
            database.map((item) => item.serial_number)
          ),
          status: "Operational",
          activity: false,
          comment: "No comment",
          eventSelected: eventName,
          provider: user.company,
          type: database[0].item_group,
          company: user.companyData.id,
          event_id: event.id,
        };
        await devitrakApi.post("/receiver/receivers-pool-bulk", template);
        const checking = await devitrakApi.post(
          "/receiver/receiver-pool-list",
          {
            type: database[0].item_group,
            eventSelected: event.eventInfoDetail.eventName,
            company: user.companyData.id,
          }
        );
        await eventInventoryRef({
          device: checking,
          database: database,
          checking: checking,
        });
        return null;
      }
    } catch (error) {
      console.log("extractContainersItemsInfo", error);
      message.error("Failed to get items in container. Please try again.");
    }
  };

  const checkIfContainer = async (props) => {
    try {
      const extractingContainers = props.filter((item) => item.container > 0);
      if (extractingContainers.length > 0) {
        for (const container of extractingContainers) {
          // extract items info from container
          await extractContainersItemsInfo(container);
        }
      }
      return null;
    } catch (error) {
      console.log("checkIfContainer", error);
      message.error(
        "Failed to extract containers items info. Please try again."
      );
    }
  };

  const updateDeviceSetupInEvent = async (props) => {
    try {
      await eventInventoryRef({
        device: props,
      });
    } catch (error) {
      console.log("updateDeviceSetupInEvent", error);
      message.error(
        "Failed to update device setup in event. Please try again."
      );
    }
  };

  const checkInsertedDataAndUpdateInventoryEvent = async (props) => {
    try {
      const checking = await devitrakApi.post("/receiver/receiver-pool-list", {
        type: props[0].item_group,
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      });
      if (checking.data.receiversInventory.length > 0) {
        await updateDeviceSetupInEvent(checking.data.receiversInventory);
      }
    } catch (error) {
      console.log("checkInsertedDataAndUpdateInventoryEvent", error);
      message.error("Failed to add device. Please try again.");
    }
  };

  const createDeviceRecordInNoSQLDatabase = async (props) => {
    try {
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
      await checkInsertedDataAndUpdateInventoryEvent(data);
      await checkIfContainer(data);
    } catch (error) {
      console.log("createDeviceRecordInNoSQLDatabase", error);
      message.error(
        "Failed to add device to NoSQL database. Please try again."
      );
    }
  };

  const createDeviceInEvent = async (props) => {
    try {
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
    } catch (error) {
      console.log("createDeviceInEvent", error);
      message.error("Failed to add device to event. Please try again.");
    }
  };

  const updateGlobalState = async () => {
    const latestUpdatedInventoryEvent = await devitrakApi.post(
      "/event/event-list",
      {
        _id: event.id,
      }
    );
    dispatch(
      onAddEventData({
        ...event,
        deviceSetup: latestUpdatedInventoryEvent.data.list[0].deviceSetup,
      })
    );
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
      await updateGlobalState();
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
