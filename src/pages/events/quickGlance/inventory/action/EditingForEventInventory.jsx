import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Button,
  Card,
  Divider,
  Modal,
  Popconfirm,
  Select,
  Space,
  message,
  notification,
} from "antd";
import { sortBy } from "lodash";
import { useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { CardStyle } from "../../../../../styles/global/CardStyle";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { DangerButton } from "../../../../../styles/global/DangerButton";
import { DangerButtonText } from "../../../../../styles/global/DangerButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";

const EditingInventory = ({ editingInventory, setEditingInventory }) => {
  const { register, handleSubmit } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [assignAllDevices, setAssignAllDevices] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const itemQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
      }),
  });
  const [api, contextHolder] = notification.useNotification();
  const openNotification = useCallback(
    (msg) => {
      api.open({
        message: msg,
      });
    },
    [api]
  );
  const eventName = event.eventInfoDetail.eventName;
  const selectOptions = useMemo(() => {
    const result = [];
    if (itemQuery.data) {
      const groupedInventory = itemQuery.data.data.groupedInventory;
      for (const [categoryName, itemGroups] of Object.entries(
        groupedInventory
      )) {
        for (const [itemGroup, locations] of Object.entries(itemGroups)) {
          for (const [location, quantity] of Object.entries(locations)) {
            // Render Location Row with quantity
            result.push({
              key: `${itemGroup}-${location}`,
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
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "flex-start",
                      alignItems: "center",
                      width: "100%",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        width: "fit-content",
                        marginRight: "5px",
                      }}
                    >
                      {categoryName}
                    </span>
                    {itemGroup}
                  </div>
                  <span style={{ textAlign: "left", width: "50%" }}>
                    Location:{" "}
                    <span style={{ fontWeight: 700 }}>{location}</span>
                  </span>
                  <span style={{ textAlign: "right", width: "50%" }}>
                    Available: {quantity}
                  </span>
                </Typography>
              ),
              value: JSON.stringify({
                category_name: categoryName,
                item_group: itemGroup,
                location,
                qty: quantity,
              }),
            });
          }
        }
      }
    }

    return result;
  }, [itemQuery.data]);

  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };

  const closeModal = () => {
    return setEditingInventory(false);
  };

  const returningDevicesInStockAfterBeingRemoveFromInventoryEvent = async (
    props
  ) => {
    const selectedDevicesPool = await devitrakApi.post(
      "/receiver/receiver-pool-list",
      {
        eventSelected: eventName,
        company: user.companyData.id,
        type: props.group,
      }
    );
    if (selectedDevicesPool.data) {
      if (selectedDevicesPool.data.receiversInventory.length === 0) {
        return null;
      }
      const devicesFetchedPool = selectedDevicesPool.data.receiversInventory;
      const ids = [...devicesFetchedPool.map((item) => item.id)];
      await devitrakApi.post(`/receiver/delete-bulk-devices-pool`, { ids });
      await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query:
            "UPDATE item_inv set warehouse = 1, update_at = NOW() WHERE item_group IN (?) AND category_name IN (?) AND serial_number IN (?) AND company_id = ?",
          values: [
            [devicesFetchedPool[0].type],
            [props.category],
            [...devicesFetchedPool.map((item) => item.device)],
            133,
          ],
        }
      );
      const responseItem = await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query: `SELECT item_id FROM item_inv WHERE item_group = ? AND category_name = ? AND serial_number IN (${devicesFetchedPool
            .map((item) => `${item.device}`)
            .join(",")})`,
          values: [devicesFetchedPool[0].type, props.category],
        }
      );
      await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query: `DELETE FROM item_inv_assigned_event WHERE event_id = ? AND item_id IN (${responseItem.data.result
            .map((item) => `${item.item_id}`)
            .join(",")})`,
          values: [event.sql.event_id],
        }
      );
    }
  };

  const updateDeviceSetupStore = (props) => {
    return dispatch(
      onAddEventData({
        ...event,
        deviceSetup: props,
      })
    );
  };

  const handleRemoveItemFromInventoryEvent = async (props) => {
    const checkingIfInventoryIsAlreadyInUsed = await devitrakApi.post(
      "/receiver/receiver-assigned-list",
      {
        company: user.companyData.id,
        eventSelected: eventName,
        "device.deviceType": props.group,
        "device.status": true,
      }
    );
    if (checkingIfInventoryIsAlreadyInUsed.data.listOfReceivers.length < 1) {
      const removing = event.deviceSetup.filter(
        (element) => element.key !== props.key
      );
      const updatingDeviceInEventProcess = await devitrakApi.patch(
        `/event/edit-event/${event.id}`,
        { deviceSetup: removing }
      );
      if (updatingDeviceInEventProcess.data) {
        await returningDevicesInStockAfterBeingRemoveFromInventoryEvent(props);
        await updateDeviceSetupStore(removing);
      }
    } else {
      return alert(
        "Device type is already in use for consumers in event. Delete item will cause conflict in future transactions in the event."
      );
    }
  };

  const handleRefresh = async () => {
    return itemQuery.refetch();
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
        return dispatch(
          onAddEventData({
            ...event,
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
      return message.error(
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
        quantity: assignAllDevices ? String(valueItemSelected.qty) : props.quantity,
        company_id: user.sqlInfo.company_id,
        category_name: database[0].category_name,
        data: props.deviceInfo.map((item) => item.serial_number),
      });
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: 0,
        company_id: user.sqlInfo.company_id,
        item_group: database[0].item_group,
        startingNumber: database[0].serial_number,
        quantity: assignAllDevices ? String(valueItemSelected.qty) : props.quantity,
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
    try {
      setLoadingStatus(true);
      const c = await devitrakApi.post(
        "/db_event/retrieve-item-location-quantity",
        {
          company_id: user.sqlInfo.company_id,
          warehouse: 1,
          item_group: valueItemSelected.item_group,
          enableAssignFeature: 1,
        }
      );
      const response = await devitrakApi.post(
        "/db_event/retrieve-item-location-quantity-full-details",
        {
          location: valueItemSelected.location,
          company_id: user.sqlInfo.company_id,
          warehouse: 1,
          item_group: valueItemSelected.item_group,
          enableAssignFeature: 1,
          serial_number: c.data.items[valueItemSelected.location].start,
          quantity: assignAllDevices
            ? Number(valueItemSelected.qty)
            : Number(data.quantity),
          category_name: valueItemSelected.category_name,
        }
      );
      const deviceInfo = response.data.data;
      if (deviceInfo.length > 0) {
        await createDeviceInEvent({ ...data, deviceInfo });
        openNotification("Items added to event inventory.");
      } else {
        message.warning("Device not found");
      }
      await updateGlobalState();
      await clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      );
      await clearCacheMemory(
        `eventSelected=${event.id}&company=${user.companyData.id}`
      );
      queryClient.invalidateQueries(["listOfreceiverInPool"]);
      setLoadingStatus(false);
      closeModal();
    } catch (error) {
      message.error("Failed to add devices to event. Please try again.");
    } finally {
      setLoadingStatus(false);
    }
  };

  return (
    <Modal
      open={editingInventory}
      onCancel={() => closeModal()}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 30,
        marginTop: "100px",
      }}
      footer={[]}
      width={1000}
    >
      {contextHolder}
      <Grid width={"80vw"} container>
        <Grid padding={"0 25px 0 0"} item xs={10} sm={10} md={12} lg={12}>
          <Grid
            style={{
              borderRadius: "8px",
              border: "1px solid var(--gray300, #D0D5DD)",
              background: "var(--gray100, #F2F4F7)",
              padding: "24px",
              width: "100%",
            }}
            item
            xs={12}
            sm={12}
            md={12}
            lg={12}
          >
            <InputLabel
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignItems: "center",
              }}
            >
              <Typography
                textTransform="none"
                style={{ ...TextFontSize20LineHeight30, fontWeight: 600 }}
              >
                Existing groups
              </Typography>
            </InputLabel>
            <InputLabel
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                margin: "0 0 0.5rem",
              }}
            >
              <Typography
                textTransform="none"
                style={{
                  ...TextFontSize20LineHeight30,
                  fontWeight: 600,
                  fontSize: "14px",
                  color: "#000",
                }}
              >
                Select from existing category
              </Typography>
              <RefreshButton propsFn={handleRefresh} />
            </InputLabel>
            <Select
              className="custom-autocomplete"
              showSearch
              placeholder="Search item to add to inventory."
              optionFilterProp="children"
              style={{ ...AntSelectorStyle, width: "100%" }}
              onChange={onChange}
              options={selectOptions}
            />
            <form
              onSubmit={handleSubmit(handleUpdateEventInventory)}
              style={{
                width: "100%",
              }}
            >
              <Grid
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginY={2}
                gap={2}
                style={{
                  width: "100%",
                }}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <Grid item xs={6} sm={6} md={6} lg={6}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <Typography
                      textTransform={"none"}
                      textAlign={"left"}
                      style={{ ...Subtitle, fontWeight: 500 }}
                    >
                      Assign all&nbsp;
                      <input
                        type="checkbox"
                        value={assignAllDevices}
                        onChange={(e) => setAssignAllDevices(e.target.checked)}
                      />
                    </Typography>
                  </InputLabel>
                </Grid>
              </Grid>
              <Grid
                display={"flex"}
                justifyContent={"space-between"}
                alignItems={"center"}
                marginY={2}
                gap={2}
                item
                xs={12}
                sm={12}
                md={12}
                lg={12}
              >
                <Grid item xs={6} sm={6} md={6} lg={6}>
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p
                      style={{
                        ...Subtitle,
                        fontWeight: 500,
                        textTransform: "none",
                        textAlign: "left",
                      }}
                    >
                      Quantity
                    </p>
                  </InputLabel>
                  <OutlinedInput
                    disabled={assignAllDevices}
                    {...register("quantity")}
                    style={{
                      ...OutlinedInputStyle,
                      width: "100%",
                    }}
                    placeholder="Enter quantity needed."
                    fullWidth
                  />
                </Grid>
                <Grid
                  style={{ alignSelf: "baseline" }}
                  item
                  xs={6}
                  sm={6}
                  md={6}
                  lg={6}
                >
                  <InputLabel style={{ marginBottom: "0.2rem", width: "100%" }}>
                    <p
                      style={{
                        ...Subtitle,
                        fontWeight: 500,
                        color: "transparent",
                        textTransform: "none",
                        textAlign: "left",
                      }}
                      color={"transparent"}
                    >
                      Quantity
                    </p>
                  </InputLabel>
                  <Button
                    loading={loadingStatus}
                    disabled={loadingStatus}
                    htmlType="submit"
                    style={{
                      ...LightBlueButton,
                      ...CenteringGrid,
                      width: "100%",
                    }}
                  >
                    <p style={LightBlueButtonText}>Add item</p>
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Grid>
          <Divider />
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Space style={{ width: "100%" }} size={[8, 16]} wrap>
              {event.deviceSetup.map((item) => {
                return (
                  <Card
                    title={item.group}
                    key={item.id}
                    extra={[
                      <Popconfirm
                        title="Are you sure you want to remove this item from event?"
                        key={item.id}
                        onConfirm={() =>
                          handleRemoveItemFromInventoryEvent(item)
                        }
                      >
                        <button style={DangerButton}>
                          <p style={DangerButtonText}>X</p>
                        </button>
                      </Popconfirm>,
                    ]}
                    style={{ ...CardStyle, alignSelf: "flex-start" }}
                  >
                    <Grid container>
                      <Grid item xs={12} sm={12} md={12} lg={12}>
                        <p>
                          Qty: {item.quantity} | Serial number range:{" "}
                          <strong>
                            {item.startingNumber ?? ""} -{" "}
                            {item.endingNumber ?? ""}
                          </strong>
                        </p>
                      </Grid>
                    </Grid>
                  </Card>
                );
              })}
            </Space>
          </Grid>
        </Grid>
      </Grid>
    </Modal>
  );
};

export default EditingInventory;
