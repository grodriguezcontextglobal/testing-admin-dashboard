import { Grid, InputLabel, OutlinedInput, Typography } from "@mui/material";
import { nanoid } from "@reduxjs/toolkit";
import { useQuery } from "@tanstack/react-query";
import { Button, Card, Divider, Modal, Popconfirm, Select, Space, notification } from "antd";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { CardStyle } from "../../../../../styles/global/CardStyle";
import CenteringGrid from "../../../../../styles/global/CenteringGrid";
import { GrayButton } from "../../../../../styles/global/GrayButton";
import GrayButtonText from "../../../../../styles/global/GrayButtonText";
import { LightBlueButton } from "../../../../../styles/global/LightBlueButton";
import LightBlueButtonText from "../../../../../styles/global/LightBlueButtonText";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import { TextFontSize20LineHeight30 } from "../../../../../styles/global/TextFontSize20HeightLine30";
import { formatDate } from "../../../../inventory/utils/dateFormat";

const EditingInventory = ({ editingInventory, setEditingInventory }) => {
  const { register, handleSubmit, setValue } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [assignAllDevices, setAssignAllDevices] = useState(false);
  const dispatch = useDispatch();
  const itemQuery = useQuery({
    queryKey: ["listOfItems"],
    queryFn: () =>
      devitrakApi.post("/db_item/warehouse-items", {
        company_id: user.sqlInfo.company_id,
        warehouse: true,
      }),
  });

  const [api, contextHolder] = notification.useNotification();
  const openNotification = (msg) => {
    api.open({
      message: msg,
    });
  };
  const dataFound = itemQuery?.data?.data?.items ?? [];
  const groupingItemByCategoriesToRenderThemInSelector = () => {
    const result = new Map();
    for (let data of dataFound) {
      if (!result.has(data.category_name)) {
        result.set(data.category_name, [data]);
      } else {
        result.set(data.category_name, [
          ...result.get(data.category_name),
          data,
        ]);
      }
    }
    return result;
  };
  const optionsToRenderInSelector = () => {
    const result = new Set();
    for (let [, value] of groupingItemByCategoriesToRenderThemInSelector()) {
      result.add(value);
    }
    const checkLocation = new Map();
    for (let data of Array.from(result)) {
      for (let item of data) {
        if (
          !checkLocation.has(
            `${item.category_name}-${item.item_group}-${item.location}`
          )
        ) {
          checkLocation.set(
            `${item.category_name}-${item.item_group}-${item.location}`,
            [item]
          );
        } else {
          checkLocation.set(
            `${item.category_name}-${item.item_group}-${item.location}`,
            [
              ...checkLocation.get(
                `${item.category_name}-${item.item_group}-${item.location}`
              ),
              item,
            ]
          );
        }
      }
    }
    let finalResultAfterSortValueByLocation = [];
    for (const [, value] of checkLocation) {
      finalResultAfterSortValueByLocation = [
        ...finalResultAfterSortValueByLocation,
        value,
      ];
    }
    return finalResultAfterSortValueByLocation;
  };

  const onChange = (value) => {
    const optionRendering = JSON.parse(value);
    setValueItemSelected(optionRendering);
  };

  const handleUpdateDeviceInEvent = async (props) => {
    const limit = Number(props.quantity) - 1;
    const inventoryEventUpdate = {
      category: valueItemSelected[0].category_name,
      group: valueItemSelected[0].item_group,
      value: valueItemSelected[0].cost,
      description: valueItemSelected[0].descript_item,
      company: valueItemSelected[0].company,
      quantity: props.quantity,
      ownership: valueItemSelected[0].ownership,
      createdBy: user.email,
      key: nanoid(),
      dateCreated: new Date().toString(),
      resume: `${valueItemSelected[0].category_name} ${
        valueItemSelected[0].item_group
      } ${valueItemSelected[0].cost} ${valueItemSelected[0].descript_item} ${
        valueItemSelected[0].company
      } ${valueItemSelected[0].quantity} ${valueItemSelected[0].ownership} ${
        user.email
      } ${new Date().toString()} ${true} ${
        valueItemSelected[0].startingNumber
      } ${valueItemSelected[0].endingNumber}`,
      consumerUses: false,//change this to false to force company to set device for consumer and others to set device for staff
      startingNumber: valueItemSelected[0].serial_number,
      endingNumber: valueItemSelected[limit].serial_number,
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
    for (let index = 0; index < Number(props.quantity); index++) {
      await devitrakApi.post("/receiver/receivers-pool", {
        device: valueItemSelected[index].serial_number,
        status: "Operational",
        activity: false,
        comment: "No comment",
        eventSelected: event.eventInfoDetail.eventName,
        provider: user.company,
        type: valueItemSelected[index].item_group,
        company: user.companyData.id,
      });
    }
    await handleUpdateDeviceInEvent(props);
    return null;
  };

  const createDeviceInEvent = async (data) => {
    setLoadingStatus(true);
    const event_id = event.sql.event_id;
    const respoUpdating = await devitrakApi.post("/db_event/event_device", {
      event_id: event_id,
      item_group: valueItemSelected[0].item_group,
      category_name: valueItemSelected[0].category_name,
      startingNumber: valueItemSelected[0].serial_number,
      quantity: data.quantity,
    });
    if (respoUpdating.data.ok) {
      await devitrakApi.post("/db_item/item-out-warehouse", {
        warehouse: false,
        company_id: user.sqlInfo.company_id,
        item_group: valueItemSelected[0].item_group,
        startingNumber: valueItemSelected[0].serial_number,
        quantity: data.quantity,
      });
    }
    await createDeviceRecordInNoSQLDatabase(data);
    await openNotification("Device type and devices  range of serial number added to inventory.");
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
        eventSelected: event.eventInfoDetail.eventName,
        // provider: event.company,
        company: user.companyData.id,
        type: props.group,
      }
    );
    if (selectedDevicesPool.data) {
      const devicesFetchedPool = selectedDevicesPool.data.receiversInventory;
      for (let data of devicesFetchedPool) {
        const deviceSQL = {
          warehouse: 1,
          status: data.status,
          update_at: formatDate(new Date()),
          serial_number: data.device,
          category_name: props.category,
          item_group: data.type,
          company_id: user.sqlInfo.company_id,
        };
        await devitrakApi.post("/db_event/returning-item", deviceSQL);
        await devitrakApi.delete(`/receiver/delete-device-pool/${data.id}`);
        await devitrakApi.post("/db_event/remove-item-inventory-event", {
          event_id: event.sql.event_id,
          item_group: data.type,
          category_name: props.category,
          serial_number: data.device,
        });
      }
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
        // provider: props.company,
        company: user.companyData.id,
        eventSelected: event.eventInfoDetail.eventName,
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
  return (
    <Modal
      open={editingInventory}
      onCancel={() => closeModal()}
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex:30
      }}
      footer={[]}
    >
    {contextHolder}
      <Grid width={"70vw"} container>
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
                justifyContent: "flex-start",
                alignItems: "center",
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
            </InputLabel>
            <Select
              className="custom-autocomplete"
              showSearch
              placeholder="Search item to add to inventory."
              optionFilterProp="children"
              style={{ ...AntSelectorStyle, width: "100%" }}
              onChange={onChange}
              options={optionsToRenderInSelector().map((item) => {
                return {
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
                      <span style={{ width: "50%" }}>
                        <span style={{ fontWeight: 700 }}>
                          {item[0].category_name}
                        </span>{" "}
                        {item[0].item_group}
                      </span>
                      <span style={{ textAlign: "left", width: "30%" }}>
                        Location:{" "}
                        <span style={{ fontWeight: 700 }}>
                          {item[0].location}
                        </span>
                      </span>
                      <span style={{ textAlign: "right", width: "20%" }}>
                        Total available: {item.length}
                      </span>
                    </Typography>
                  ), //renderOptionAsNeededFormat(JSON.stringify(option))
                  value: JSON.stringify(item),
                };
              })}
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
                        <button style={GrayButton}>
                          <p style={GrayButtonText}>x</p>
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
