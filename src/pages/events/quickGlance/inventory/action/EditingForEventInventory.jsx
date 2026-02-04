import { Grid, InputLabel, Typography } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Select, Space, notification } from "antd";
import { createContext, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import DangerButtonConfirmationComponent from "../../../../../components/UX/buttons/DangerButtonConfirmation";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import { AntSelectorStyle } from "../../../../../styles/global/AntSelectorStyle";
import { OutlinedInputStyle } from "../../../../../styles/global/OutlinedInputStyle";
import { Subtitle } from "../../../../../styles/global/Subtitle";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import Main from "./components/EditingInventoryUXOptions/Main";
import RenderingEventInventorySection from "./components/EditingInventoryUXOptions/renderingEventInventorySection";

export const valueContext = createContext(null);

const EditingInventory = ({ editingInventory, setEditingInventory }) => {
  const { register, handleSubmit, watch } = useForm();
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
    [api],
  );
  const eventName = event.eventInfoDetail.eventName;
  const selectOptions = useMemo(() => {
    const result = [];
    if (itemQuery.data) {
      const groupedInventory = itemQuery.data.data.groupedInventory;
      for (const [categoryName, itemGroups] of Object.entries(
        groupedInventory,
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
    props,
  ) => {
    const selectedDevicesPool = await devitrakApi.post(
      "/receiver/receiver-pool-list",
      {
        eventSelected: eventName,
        company: user.companyData.id,
        type: props.group,
      },
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
            user.sqlInfo.company_id,
          ],
        },
      );
      const responseItem = await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query: `SELECT item_id FROM item_inv WHERE item_group = ? AND category_name = ? AND serial_number IN (${devicesFetchedPool
            .map((item) => `${item.device}`)
            .join(",")})`,
          values: [devicesFetchedPool[0].type, props.category],
        },
      );
      await devitrakApi.post(
        "/db_event/inventory-based-on-submitted-parameters",
        {
          query: `DELETE FROM item_inv_assigned_event WHERE event_id = ? AND item_id IN (${responseItem.data.result
            .map((item) => `${item.item_id}`)
            .join(",")})`,
          values: [event.sql.event_id],
        },
      );
    }
  };

  const updateDeviceSetupStore = (props) => {
    return dispatch(
      onAddEventData({
        ...event,
        deviceSetup: props,
      }),
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
      },
    );
    if (checkingIfInventoryIsAlreadyInUsed.data.listOfReceivers.length < 1) {
      const removing = event.deviceSetup.filter(
        (element) => element.key !== props.key,
      );
      const updatingDeviceInEventProcess = await devitrakApi.patch(
        `/event/edit-event/${event.id}`,
        { deviceSetup: removing },
      );
      if (updatingDeviceInEventProcess.data) {
        await returningDevicesInStockAfterBeingRemoveFromInventoryEvent(props);
        updateDeviceSetupStore(removing);
        queryClient.refetchQueries({
          queryKey: ["listOfreceiverInPool"],
        });
        await clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
        );
        await clearCacheMemory(
          `eventSelected=${event.id}&company=${user.companyData.id}`,
        );
      }
    } else {
      return alert(
        "Device type is already in use for consumers in event. Delete item will cause conflict in future transactions in the event.",
      );
    }
  };

  const handleRefresh = async () => {
    return itemQuery.refetch();
  };
  const bodyModal = () => {
    return (
      <div style={{ display:"grid", gap:"1rem"}}>
        <ReusableCardWithHeaderAndFooter title="Select from existing company's inventory">
          <Grid container>
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
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
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
                {/* form to add item to event inventory */}
                <valueContext.Provider
                  value={{
                    valueItemSelected: valueItemSelected,
                    eventInfo: event,
                  }}
                >
                  <Main
                    assignAllDevices={assignAllDevices}
                    closeModal={closeModal}
                    handleSubmit={handleSubmit}
                    loadingStatus={loadingStatus}
                    openNotification={openNotification}
                    OutlinedInputStyle={OutlinedInputStyle}
                    queryClient={queryClient}
                    refreshButton={handleRefresh}
                    register={register}
                    setAssignAllDevices={setAssignAllDevices}
                    setLoadingStatus={setLoadingStatus}
                    Subtitle={Subtitle}
                    valueItemSelected={valueItemSelected}
                    watch={watch}
                    eventName={eventName}
                  />
                </valueContext.Provider>
              </Grid>
            </Grid>
          </Grid>
        </ReusableCardWithHeaderAndFooter>
        <RenderingEventInventorySection
          event={event}
          Space={Space}
          ReusableCardWithHeaderAndFooter={ReusableCardWithHeaderAndFooter}
          DangerButtonConfirmationComponent={DangerButtonConfirmationComponent}
          handleRemoveItemFromInventoryEvent={handleRemoveItemFromInventoryEvent}
        />
      </div>
    );
  };

  return (
    <>
      {contextHolder}
      <ModalUX
        body={bodyModal()}
        openDialog={editingInventory}
        closeModal={closeModal}
        width={1000}
      />
    </>
  );
};

export default EditingInventory;
