import { message } from "antd";
import { sortBy } from "lodash";
import { useCallback, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../../../store/slices/eventSlice";
import clearCacheMemory from "../../../../../../../utils/actions/clearCacheMemory";
import { valueContext } from "../../EditingForEventInventory";
import { checkAndUpdateGlobalEventStatus } from "./checkAndUpdateGlobalEventStatus";

const useAddingItemsToEventInventoryOneByOne = ({
  closeModal,
//   handleSubmit,
//   loadingStatus,
  openNotification,
//   OutlinedInputStyle,
  queryClient,
//   register,
  setLoadingStatus,
//   Subtitle,
//   watch,
  serialNumbers,
}) => {
  const contextValue = useContext(valueContext);
  const { valueItemSelected, eventInfo } = contextValue;
  const { user } = useSelector((state) => state.admin);
  const dispatch = useDispatch();
  const eventInventoryRef = useCallback(
    async ({ device = null, database = null, checking = null }) => {
      const eventInventoryRef = await devitrakApi.post("/event/event-list", {
        _id: eventInfo.id,
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
          `/event/edit-event/${eventInfo.id}`,
          {
            deviceSetup: updateDeviceInv,
          }
        );
        return dispatch(
          onAddEventData({
            ...eventInfo,
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
        await devitrakApi.patch(`/event/edit-event/${eventInfo.id}`, {
          deviceSetup: updatedDeviceSetup,
        });
        return dispatch(
          onAddEventData({
            ...eventInfo,
            deviceSetup: eventInventoryRef.data.list[0].deviceSetup,
          })
        );
      }
    },
    []
  );

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
        const event_id = eventInfo.sql.event_id;
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
          warehouse: 0,
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
          eventSelected: eventInfo.eventInfoDetail.eventName,
          provider: user.company,
          type: database[0].item_group,
          company: user.companyData.id,
          event_id: eventInfo.id,
        };
        await devitrakApi.post("/receiver/receivers-pool-bulk", template);
        const checking = await devitrakApi.post(
          "/receiver/receiver-pool-list",
          {
            type: database[0].item_group,
            eventSelected: eventInfo.eventInfoDetail.eventName,
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
      // console.log("extractContainersItemsInfo", error);
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
      return message.error(
        "Failed to extract containers items info. Please try again."
      );
    }
  };

  const updateDeviceSetupInEvent = async (props) => {
    try {
      await eventInventoryRef({
        device: props.pool,
        database: props.database,
        checking: props.checking,
      });
    } catch (error) {
      return message.error(
        "Failed to update device setup ineventInfo. Please try again."
      );
    }
  };

  const checkInsertedDataAndUpdateInventoryEvent = async (props) => {
    try {
      const checking = await devitrakApi.post("/receiver/receiver-pool-list", {
        type: props[0].item_group,
        eventSelected: eventInfo.eventInfoDetail.eventName,
        company: user.companyData.id,
      });
      if (checking.data.receiversInventory.length > 0) {
        await updateDeviceSetupInEvent({
          pool: checking.data.receiversInventory,
          database: props,
          checking: checking,
        });
      }
    } catch (error) {
      return message.error("Failed to add device. Please try again.");
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
        eventSelected: eventInfo.eventInfoDetail.eventName,
        provider: user.company,
        type: data[0].item_group,
        company: user.companyData.id,
        event_id: eventInfo.id,
      };
      await devitrakApi.post("/receiver/receivers-pool-bulk", template);
      await checkInsertedDataAndUpdateInventoryEvent(data);
      await checkIfContainer(data);
    } catch (error) {
      return message.error(
        "Failed to add device to NoSQL database. Please try again."
      );
    }
  };

  const createDeviceInEvent = async (props) => {
    try {
      let database = [...props.deviceInfo];
      const event_id = eventInfo.sql.event_id;
      await devitrakApi.post("/db_event/event_device", {
        event_id: event_id,
        item_group: database[0].item_group,
        startingNumber: props.startingSerial,
        quantity: Number(props.quantity),
        company_id: user.sqlInfo.company_id,
        category_name: database[0].category_name,
        data: props.deviceInfo.map((item) => item.serial_number),
      });
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: 0,
        company_id: user.sqlInfo.company_id,
        item_group: database[0].item_group,
        startingNumber: props.startingSerial,
        quantity: Number(props.quantity),
        category_name: database[0].category_name,
        data: props.deviceInfo.map((item) => item.serial_number),
      });
      await createDeviceRecordInNoSQLDatabase(props);
    } catch (error) {
      return message.error("Failed to add device to event. Please try again.");
    }
  };

  const handleUpdateEventInventory = async (data) => {
    if (Object.keys(valueItemSelected).length === 0)
      return message.warning("Please select item to add to inventory.");

    // Use serials coming from modal submit; fallback to prop value if needed
    const serials = (data?.serialNumbers || serialNumbers || [])
      .map((s) => String(s).trim())
      .filter(Boolean);

    if (serials.length < 1)
      return message.warning("Please enter at least one serial number.");

    try {
      setLoadingStatus(true);

      // Fetch available items matching submitted serials (parameterized IN)
      const deviceInfoQuery = `
        Select item_id, serial_number, location, container, category_name, item_group
        from item_inv
        where company_id = ?
          and warehouse = 1
          and enableAssignFeature = 1
          and location = ?
          and item_group = ?
          and category_name = ?
          and serial_number in (${serials.map(() => "?").join(",")})
      `;
      const deviceInfoValues = [
        user.sqlInfo.company_id,
        valueItemSelected.location,
        valueItemSelected.item_group,
        valueItemSelected.category_name,
        ...serials,
      ];
      const deviceInfoResponse = await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query: deviceInfoQuery,
          values: deviceInfoValues,
        }
      );
      const deviceInfo = Array.isArray(deviceInfoResponse.data?.result)
        ? deviceInfoResponse.data.result
        : [];

      if (deviceInfo.length < 1) {
        setLoadingStatus(false);
        return message.warning(
          "No matching available items found for submitted serials."
        );
      }

      // Sort to compute a consistent startingNumber
      const sortedBySerial = deviceInfo
        .slice()
        .sort((a, b) =>
          String(a.serial_number).localeCompare(String(b.serial_number))
        );

      // Persist to SQL event_device and item-out-warehouse, then NoSQL receivers pool
      await createDeviceInEvent({
        deviceInfo,
        startingSerial: sortedBySerial[0].serial_number,
        quantity: deviceInfo.length,
      });

      // Recompute global event deviceSetup after inserts
      await checkAndUpdateGlobalEventStatus(eventInfo, dispatch);

      // Clear caches and notify
      await clearCacheMemory(
        `eventSelected=${eventInfo.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${eventInfo.id}&company=${user.companyData.id}`
      );
      queryClient.invalidateQueries(["listOfreceiverInPool"]);
      openNotification("Items added to event inventory.");
      closeModal();
    } catch (error) {
      console.log(error);
      message.error("Failed to add devices to event. Please try again.");
    } finally {
      setLoadingStatus(false);
    }
  };

  return handleUpdateEventInventory;
};
export default useAddingItemsToEventInventoryOneByOne;
