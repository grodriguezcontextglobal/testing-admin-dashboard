import { useQuery, useQueryClient } from "@tanstack/react-query";
import { message, Space } from "antd";
import { createContext, useCallback, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import RefreshButton from "../../../../../components/utils/UX/RefreshButton";
import DangerButtonConfirmationComponent from "../../../../../components/UX/buttons/DangerButtonConfirmation";
import ReusableCardWithHeaderAndFooter from "../../../../../components/UX/cards/ReusableCardWithHeaderAndFooter";
import ModalUX from "../../../../../components/UX/modal/ModalUX";
import { onAddEventData } from "../../../../../store/slices/eventSlice";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import AddStockWizard from "./components/EditingInventoryUXOptions/AddStockWizard";
import RenderingEventInventorySection from "./components/EditingInventoryUXOptions/RenderingEventInventorySection";
import { buildStockRows } from "./utils/eventStockFlow";

export const valueContext = createContext(null);

/**
 * The event-inventory editor: a three-step wizard for adding company stock, and
 * the list of what the event already holds underneath it.
 *
 * Adding used to be one flat modal — a JSON-serialising Select, a two-mode
 * radio whose meaning lived in a tooltip, and a form that committed without
 * ever showing which serials it had resolved. The wizard replaces that; the
 * write path and every payload it sends are unchanged.
 */
const EditingInventory = ({ editingInventory, setEditingInventory }) => {
  const { register, handleSubmit, watch } = useForm();
  const { user } = useSelector((state) => state.admin);
  const { event } = useSelector((state) => state.event);
  const [valueItemSelected, setValueItemSelected] = useState({});
  const [loadingStatus, setLoadingStatus] = useState(false);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const itemQuery = useQuery({
    queryKey: ["itemGroupExistingLocationList", user.sqlInfo.company_id],
    queryFn: () =>
      devitrakApi.post("/db_event/retrieve-item-group-location-quantity", {
        company_id: user.sqlInfo.company_id,
        warehouse: 1,
        enableAssignFeature: 1,
        logistic_status: "in-stock",
      }),
  });

  const { notify, contextHolder } = useStatusNotification();
  const openNotification = useCallback(
    (msg) => {
      notify("error", msg);
    },
    [notify],
  );
  const eventName = event.eventInfoDetail.eventName;

  // The same response the old Select read, as rows instead of JSX. Search now
  // runs against the group, the category and the location rather than over
  // rendered markup.
  const stockRows = useMemo(
    () => buildStockRows(itemQuery.data?.data?.groupedInventory),
    [itemQuery.data],
  );

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
      // One atomic call replaces three: UPDATE warehouse, SELECT item_id,
      // DELETE assignments. As three independent transactions a failure
      // between the first and the last left stock marked returned to the
      // warehouse *and* still assigned to the event, with nothing to
      // reconcile it. item_ids are no longer sent — the server derives them
      // from company-scoped rows, which is what closes the old DELETE that
      // took ids straight from the browser with no company filter.
      let returnResult;
      try {
        returnResult = await devitrakApi.post(
          "/db_event/return-event-devices",
          {
            event_id: event.sql.event_id,
            item_group: devicesFetchedPool[0].type,
            category_name: props.category,
            serial_numbers: devicesFetchedPool.map((item) => item.device),
          },
        );
      } catch (error) {
        // Deliberately re-thrown: the caller updates the event UI on the line
        // after this one, so swallowing here would report the devices as
        // removed when they were not. Today an error propagates as an
        // unhandled rejection, which stops the same UI update but tells the
        // user nothing — this keeps the stop and adds the message.
        const noneMatched = error?.response?.status === 404;
        notify(
          "error",
          noneMatched
            ? "None of those serial numbers were found in this company's inventory. Nothing was returned."
            : "Returning the devices to stock failed. The event was not changed.",
        );
        throw error;
      }

      // A partial return is still a return for the serials that matched, so
      // this warns rather than failing — but it must be visible, since the
      // event will show the items as removed either way.
      const skipped = Number(returnResult?.data?.skipped_serials) || 0;
      if (skipped > 0) {
        notify(
          "warning",
          `${skipped} serial number(s) were skipped — they do not exist or belong to another company. The rest were returned to stock.`,
        );
      }
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
      // Keep every row that is not THIS category+group pair. The previous
      // `category !== x && group !== y` kept only rows differing in both, so
      // removing one group also dropped every other group in its category.
      const removing = event.deviceSetup.filter(
        (element) =>
          element.category !== props.category || element.group !== props.group,
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
        // Both cache keys are independent (different literal keys, neither depends on
        // the other's result), so clear them concurrently instead of sequentially.
        await Promise.all([
          clearCacheMemory(
            `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`,
          ),
          clearCacheMemory(
            `eventSelected=${event.id}&company=${user.companyData.id}`,
          ),
        ]);
      }
    } else {
      return message.warning(
        "Some of these devices are already assigned to consumers in this event. Removing the group now would break those transactions.",
      );
    }
  };

  const handleRefresh = async () => {
    return itemQuery.refetch();
  };

  const bodyModal = () => {
    return (
      <div style={{ display: "grid", gap: "1.5rem" }}>
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <h2
                style={{
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "18px",
                  fontWeight: 600,
                  lineHeight: "28px",
                  color: "var(--gray-900, #101828)",
                }}
              >
                Add stock to this event
              </h2>
              <p
                style={{
                  margin: 0,
                  fontFamily: "Inter, sans-serif",
                  fontSize: "14px",
                  lineHeight: "20px",
                  color: "var(--gray-500, #667085)",
                }}
              >
                {eventName}
              </p>
            </div>
            <RefreshButton propsFn={handleRefresh} />
          </div>

          <valueContext.Provider
            value={{
              valueItemSelected: valueItemSelected,
              eventInfo: event,
            }}
          >
            <AddStockWizard
              closeModal={closeModal}
              handleSubmit={handleSubmit}
              loadingStatus={loadingStatus}
              openNotification={openNotification}
              queryClient={queryClient}
              register={register}
              setLoadingStatus={setLoadingStatus}
              setValueItemSelected={setValueItemSelected}
              stockRows={stockRows}
              valueItemSelected={valueItemSelected}
              watch={watch}
            />
          </valueContext.Provider>
        </div>

        <div>
          <h3
            style={{
              margin: "0 0 12px",
              fontFamily: "Inter, sans-serif",
              fontSize: "14px",
              fontWeight: 600,
              lineHeight: "20px",
              color: "var(--gray-700, #344054)",
            }}
          >
            Already in this event
          </h3>
          <RenderingEventInventorySection
            event={event}
            Space={Space}
            ReusableCardWithHeaderAndFooter={ReusableCardWithHeaderAndFooter}
            DangerButtonConfirmationComponent={DangerButtonConfirmationComponent}
            handleRemoveItemFromInventoryEvent={handleRemoveItemFromInventoryEvent}
          />
        </div>
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
