import {
  Chip,
  InputAdornment,
  InputLabel,
  OutlinedInput,
  Typography,
} from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message, Modal, Select, Space, Tooltip } from "antd";
import { sortBy } from "lodash";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../api/devitrakApi";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
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
import ItemForm from "./addSerialNumberRangeToEvent/ItemForm";
import ContainerForm from "./addSerialNumberRangeToEvent/containerForm";

const ModalAddAndUpdateDeviceSetup = ({
  openModalDeviceSetup,
  setOpenModalDeviceSetup,
  deviceTitle,
  quantity,
  category_name,
}) => {
  const [blockingButton, setBlockingButton] = useState(false);
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const queryClient = useQueryClient();
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
  const inventorySetupInfo = event.deviceSetup
    .filter((element) => element.group === deviceTitle)
    .at(-1);

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
      if (
        !props.location ||
        !props.serial_number ||
        !props.quantity ||
        !category_name
      )
        return;
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
          category_name: category_name,
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
          category_name: valueItemSelected?.category,
        });

        if (deviceInfoResponse.length === 0)
          return message.warning(
            "There is not available items in the location for the quantity set."
          );
        if (deviceInfoResponse.length < Number(data.quantity))
          return message.warning(
            `There is not enough items in the location for the quantity set. Current quantity available is ${deviceInfoResponse.length}, current quantity set is ${data.quantity}`
          );
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
      }
    },
    [existingDevice, quantity, valueItemSelected, listOfLocations, setValue]
    // REMOVED listOfLocations from dependencies to prevent stale closure
  );

  const removeItem = useCallback((index) => {
    setListOfLocations((prev) => prev.filter((_, i) => i !== index));
  }, []);

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
      // message.error("Failed to get items in container. Please try again.");
      return null;
    }
  };

  const extractContainersItemsInfo = async (containerSetup) => {
    try {
      const itemsInContainer = await gettingItemsInContainer(containerSetup);
      if (
        itemsInContainer.data &&
        itemsInContainer.data.container.items.length > 0
      ) {
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
      return message.warning("Container does not have any stored items.");
    } catch (error) {
      console.log("extractContainersItemsInfo", error);
      // message.error("Failed to get items in container. Please try again.");
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
      // message.error(
      //   "Failed to extract containers items info. Please try again."
      // );
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
        warehouse: 0,
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

    const checkInv = new Map();
    for (const [, value] of Object.entries(
      latestUpdatedInventoryEvent.data.list[0].deviceSetup
    )) {
      if (checkInv.has(value.group)) {
        checkInv.set(value.group, {
          ...checkInv.get(value.group),
          quantity:
            Number(checkInv.get(value.group).quantity) + Number(value.quantity),
          endingNumber: value.endingNumber,
        });
      } else {
        checkInv.set(value.group, value);
      }
    }
    const finalDeviceUpdated = [...checkInv.values()];
    await devitrakApi.patch(`/event/edit-event/${event.id}`, {
      deviceSetup: finalDeviceUpdated,
    });
    dispatch(
      onAddEventData({
        ...event,
        deviceSetup: finalDeviceUpdated,
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
      queryClient.invalidateQueries(["listOfreceiverInPool"]);
      closeModal();
    } catch (error) {
      message.error("Failed to add devices to event. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const trigger = () => {
      if (listOfLocations.length === 0) return setBlockingButton(false);
      let total = 0;
      listOfLocations.forEach((item) => {
        total += Number(item.quantity);
      });
      return setBlockingButton(total === Number(quantity));
    };
    trigger();
  }, [quantity, listOfLocations, addingDeviceFromLocations]);

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
      {inventorySetupInfo.isItSetAsContainerForEvent ? (
        <ContainerForm
          addingDeviceFromLocations={addingDeviceFromLocations}
          AntSelectorStyle={AntSelectorStyle}
          blockingButton={blockingButton}
          BlueButton={BlueButton}
          BlueButtonText={BlueButtonText}
          BorderedCloseIcon={BorderedCloseIcon}
          CenteringGrid={CenteringGrid}
          CheckIcon={CheckIcon}
          checkIfSerialNumberExists={checkIfSerialNumberExists}
          Chip={Chip}
          deviceTitle={deviceTitle}
          gettingData={fullDetailForSelectedData}
          handleDevicesInEvent={handleDevicesInEvent}
          handleSubmit={handleSubmit}
          InputAdornment={InputAdornment}
          InputLabel={InputLabel}
          itemQuery={itemQuery}
          LightBlueButton={LightBlueButton}
          LightBlueButtonText={LightBlueButtonText}
          listOfLocations={listOfLocations}
          onChange={onChange}
          OutlinedInput={OutlinedInput}
          OutlinedInputStyle={OutlinedInputStyle}
          QuestionIcon={QuestionIcon}
          RectangleBluePlusIcon={RectangleBluePlusIcon}
          register={register}
          removeItem={removeItem}
          Select={Select}
          selectOptions={selectOptions}
          Space={Space}
          Subtitle={Subtitle}
          Tooltip={Tooltip}
          Typography={Typography}
          valueItemSelected={valueItemSelected}
        />
      ) : (
        <ItemForm
          addingDeviceFromLocations={addingDeviceFromLocations}
          AntSelectorStyle={AntSelectorStyle}
          blockingButton={blockingButton}
          BlueButtonText={BlueButtonText}
          BorderedCloseIcon={BorderedCloseIcon}
          CenteringGrid={CenteringGrid}
          CheckIcon={CheckIcon}
          checkIfSerialNumberExists={checkIfSerialNumberExists}
          Chip={Chip}
          deviceTitle={deviceTitle}
          disablingButton={disablingButton}
          existingDevice={existingDevice}
          handleDevicesInEvent={handleDevicesInEvent}
          handleSubmit={handleSubmit}
          InputAdornment={InputAdornment}
          InputLabel={InputLabel}
          itemQuery={itemQuery}
          LightBlueButton={LightBlueButton}
          LightBlueButtonText={LightBlueButtonText}
          listOfLocations={listOfLocations}
          loading={loading}
          onChange={onChange}
          OutlinedInput={OutlinedInput}
          OutlinedInputStyle={OutlinedInputStyle}
          quantity={quantity}
          QuestionIcon={QuestionIcon}
          RectangleBluePlusIcon={RectangleBluePlusIcon}
          register={register}
          removeItem={removeItem}
          Select={Select}
          selectOptions={selectOptions}
          Space={Space}
          Subtitle={Subtitle}
          Tooltip={Tooltip}
          Typography={Typography}
          valueItemSelected={valueItemSelected}
          watch={watch}
        />
      )}
      {blockingButton && (
        <BlueButtonComponent
          title={`Add ${deviceTitle} to this event.`}
          func={handleDevicesInEvent}
          disabled={existingDevice.length === Number(quantity)}
          loadingState={loading}
          styles={{
            display: blockingButton ? "flex" : "none",
            width: "100%",
          }}
        />
      )}
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
