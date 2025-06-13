import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { useQuery } from "@tanstack/react-query";
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
import { useMemo, useState } from "react";
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

const EditingInventory = ({ editingInventory, setEditingInventory }) => {
  const { register, handleSubmit, setValue } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [assignAllDevices, setAssignAllDevices] = useState(false);
  const dispatch = useDispatch();
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
  const openNotification = (msg) => {
    api.open({
      message: msg,
    });
  };
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

  const handleUpdateDeviceInEvent = async (props) => {
    const inventoryEventUpdate = {
      category: props.inventoryData[0].category_name,
      group: props.inventoryData[0].item_group,
      value: props.inventoryData[0].cost,
      description: props.inventoryData[0].descript_item,
      company: props.inventoryData[0].company,
      quantity: props.quantity,
      ownership: props.inventoryData[0].ownership,
      createdBy: user.email,
      key: nanoid(),
      dateCreated: new Date().toString(),
      resume: `${props.inventoryData[0].category_name} ${
        props.inventoryData[0].item_group
      } ${props.inventoryData[0].cost} ${
        props.inventoryData[0].descript_item
      } ${props.inventoryData[0].company} ${props.inventoryData[0].quantity} ${
        props.inventoryData[0].ownership
      } ${user.email} ${new Date().toString()} ${true} ${
        props.inventoryData[0].startingNumber
      } ${props.inventoryData[0].endingNumber}`,
      consumerUses: false, //change this to false to force company to set device for consumer and others to set device for staff
      startingNumber: props.inventoryData[0].serial_number,
      endingNumber: props.inventoryData.at(-1).serial_number,
      existing: true,
    };
    const deviceInventoryUpdated = [...event.deviceSetup, inventoryEventUpdate];
    const updatingDeviceInEventProcess = await devitrakApi.patch(
      `/event/edit-event/${event.id}`,
      {
        deviceSetup: deviceInventoryUpdated,
      }
    );
    if (updatingDeviceInEventProcess.data) {
      dispatch(
        onAddEventData({
          ...event,
          deviceSetup: deviceInventoryUpdated,
        })
      );
      setValue("quantity", "");
      return setLoadingStatus(false);
    }
  };

  const createDeviceRecordInNoSQLDatabase = async (props) => {
    const template = {
      deviceList: JSON.stringify(
        props.inventoryData.map((item) => item.serial_number)
      ),
      status: "Operational",
      activity: false,
      comment: "No comment",
      eventSelected: eventName,
      provider: user.company,
      type: valueItemSelected.item_group,
      company: user.companyData.id,
      qty: Number(props.quantity),
    };
    await devitrakApi.post("/receiver/receivers-pool-bulk", template);
    await handleUpdateDeviceInEvent(props);
    return null;
  };

  const createDeviceInEvent = async (data) => {
    setLoadingStatus(true);
    try {
      const event_id = event.sql.event_id;
      const response = await devitrakApi.post(
        "/db_event/retrieve-item-location-quantity-full-details",
        {
          location: valueItemSelected.location,
          category_name: valueItemSelected.category_name,
          company_id: user.sqlInfo.company_id,
          warehouse: 1,
          item_group: valueItemSelected.item_group,
          enableAssignFeature: 1,
          quantity: Number(valueItemSelected.qty),
        }
      );
      if (response.data) {
        const inventoryData = response.data.data;
        const respoUpdating = await devitrakApi.post("/db_event/event_device", {
          event_id: event_id,
          item_group: valueItemSelected.item_group,
          category_name: valueItemSelected.category_name,
          startingNumber: inventoryData[0].serial_number,
          company_id: user.sqlInfo.company_id,
          quantity: data.quantity,
          data: inventoryData.map((item) => item.serial_number),
        });
        if (respoUpdating.data.ok) {
          await devitrakApi.post("/db_item/item-out-warehouse", {
            warehouse: 0,
            company_id: user.sqlInfo.company_id,
            item_group: valueItemSelected.item_group,
            category_name: inventoryData[0].category_name,
            startingNumber: inventoryData[0].serial_number,
            quantity: data.quantity,
            data: inventoryData.map((item) => item.serial_number),
          });
        }
        await createDeviceRecordInNoSQLDatabase({
          ...data,
          inventoryData: inventoryData.slice(0, Number(data.quantity)),
        });
        openNotification(
          "Device type and devices range of serial number added to inventory."
        );
        return setLoadingStatus(false);
      }
    } catch (error) {
      message.error(error.response.data.msg);
      return setLoadingStatus(false);
    }
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
              onSubmit={handleSubmit(createDeviceInEvent)}
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
                            {item.startingNumber} - {item.endingNumber}
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
