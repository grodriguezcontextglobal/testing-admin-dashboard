import { useQueryClient } from "@tanstack/react-query";
import PropTypes from "prop-types";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../components/notification/alerts/useStatusNotification";
import DangerButtonConfirmationComponent from "../../../../../components/UX/buttons/DangerButtonConfirmation";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import LightBlueButtonComponent from "../../../../../components/UX/buttons/LigthBlueButton";
import { onAddCustomerInfo } from "../../../../../store/slices/customerSlice";
import { onAddDeviceToDisplayInQuickGlance } from "../../../../../store/slices/devicesHandleSlice";
import {
  onReceiverObjectToReplace,
  onTriggerModalToReplaceReceiver,
} from "../../../../../store/slices/helperSlice";
import {
  onAddCustomer,
  onAddDevicesAssignedInPaymentIntent,
  onAddPaymentIntentDetailSelected,
  onAddPaymentIntentSelected,
} from "../../../../../store/slices/stripeSlice";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import "../eventDeviceDetail.css";
import { readDeviceSelection } from "../utils/eventDeviceDetail";
import Choice from "../lostFee/Choice";
import { Replace } from "./Replace";
import UpdateStatus from "./components/UpdateStatus";

/**
 * What can be done to this device, as the identity card's action rail.
 *
 * It was a transparent antd Card floating at the right edge of a three-column
 * grid whose middle column was empty, holding buttons whose colour said nothing
 * about what they do: "Lost" and "Exchange" were both destructive red, "Return"
 * was light blue behind a bare "Are you sure?", and when the device was *not* in
 * use the single remaining action — "Edit Status" — was also red, though editing
 * a status destroys nothing.
 *
 * Now: the reversible action leads, the irreversible ones sit below it behind
 * confirmations that state their consequence, and the rail says why it is empty
 * when the device is already written off.
 */
const ActionsMainPage = ({ onChanged }) => {
  const { deviceInfoSelected } = useSelector((state) => state.devicesHandle);
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { triggerModal } = useSelector((state) => state.helper);
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();

  const [openLostModal, setOpenLostModal] = useState(false);
  const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
  const [busy, setBusy] = useState(null);

  const device = readDeviceSelection(deviceInfoSelected);

  const notifyReturned = async ({ paymentIntent, devices, email }) => {
    try {
      const consumer = await devitrakApi.post("/auth/user-query", { email });
      const found = consumer.data?.users?.at(-1);
      if (!found) return;
      await devitrakApi.post("/nodemailer/confirm-returned-device-notification", {
        consumer: {
          email: found.email,
          firstName: found.name,
          lastName: found.lastName,
        },
        devices,
        event: event.eventInfoDetail.eventName,
        transaction: paymentIntent,
        company: user.companyData.id,
        link: `https://app.devitrak.net/?event=${event.id}&company=${user.companyData.id}`,
        admin: user.email,
      });
    } catch (error) {
      notify("warning", "Device returned, but the receipt email did not send.");
    }
  };

  const handleReturn = async () => {
    setBusy("return");
    try {
      const assigned = await devitrakApi.post("/receiver/receiver-assigned-list", {
        "device.serialNumber": device.serialNumber,
        "device.status": true,
        "device.deviceType": device.type,
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
      });

      const record = assigned.data?.listOfReceivers?.at(-1);
      if (!record) {
        // The old handler simply fell through every `if (ok)` and did nothing,
        // leaving the button spinning with no explanation.
        notify("info", "This device is not currently assigned to anyone.");
        return;
      }

      await devitrakApi.patch(`/receiver/receiver-update/${record.id}`, {
        id: record.id,
        device: { ...record.device, status: false },
        timeStamp: new Date().getTime(),
      });

      const pool = await devitrakApi.post("/receiver/receiver-pool-list", {
        device: device.serialNumber,
        type: device.type,
        activity: true,
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      });
      const poolDevice = pool.data?.receiversInventory?.at(-1);
      if (poolDevice) {
        await devitrakApi.patch(
          `/receiver/receivers-pool-update/${poolDevice.id}`,
          { id: poolDevice.id, activity: false }
        );
      }

      await Promise.all([
        clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
        ),
        clearCacheMemory(`eventSelected=${event.id}&company=${user.companyData.id}`),
        clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.id}&company=${user.companyData.id}`
        ),
      ]);
      queryClient.invalidateQueries({ queryKey: ["assignedDeviceListQuery"] });
      queryClient.invalidateQueries({ queryKey: ["deviceInPoolList"] });

      // Keep the page on the device, showing it as available. The old handler
      // navigated away to the event after a 1s timeout, so you never saw the
      // result of your own action.
      dispatch(
        onAddDeviceToDisplayInQuickGlance({
          ...deviceInfoSelected,
          activity: false,
          entireData: { ...deviceInfoSelected.entireData, activity: false },
        })
      );
      onChanged?.();
      notify("success", `${device.serialNumber} returned.`);

      await notifyReturned({
        paymentIntent: record.paymentIntent,
        devices: assigned.data.listOfReceivers.map((item) => ({
          device: { ...item.device },
          paymentIntent: item.paymentIntent,
        })),
        email: record.user,
      });
    } catch (error) {
      notify("error", "The device was not returned. Nothing changed.");
    } finally {
      setBusy(null);
    }
  };

  const handleReportLost = async () => {
    setBusy("lost");
    try {
      const assigned = await devitrakApi.post("/receiver/receiver-assigned-list", {
        "device.serialNumber": device.serialNumber,
        eventSelected: event.eventInfoDetail.eventName,
        provider: event.company,
      });
      const record = assigned.data?.listOfReceivers?.at(-1);
      if (!record) {
        notify("info", "This device has no assignment to charge a fee against.");
        return;
      }

      const consumerQuery = await devitrakApi.post("/auth/users", {
        email: record.user,
      });
      const consumer = consumerQuery.data?.users?.at(-1);
      if (!consumer) {
        notify("error", "The consumer holding this device could not be found.");
        return;
      }

      const profile = { ...consumer, uid: consumer.id };
      dispatch(onAddPaymentIntentSelected(record.paymentIntent));
      dispatch(onAddPaymentIntentDetailSelected(record));
      dispatch(onAddDevicesAssignedInPaymentIntent([record]));
      dispatch(onAddCustomer(profile));
      dispatch(onAddCustomerInfo(profile));
      dispatch(
        onReceiverObjectToReplace({
          deviceType: device.type,
          serialNumber: device.serialNumber,
        })
      );
      setOpenLostModal(true);
    } catch (error) {
      notify("error", `Something went wrong. ${error.message}`);
    } finally {
      setBusy(null);
    }
  };

  const handleExchange = () => {
    dispatch(onTriggerModalToReplaceReceiver(true));
    dispatch(
      onReceiverObjectToReplace({
        deviceType: device.type,
        serialNumber: device.serialNumber,
        status: true,
      })
    );
  };

  const actions = () => {
    if (device.isLost) {
      return (
        <p className="device-rail__note">
          This device is written off as lost. Nothing further can be done to it
          from this event.
        </p>
      );
    }

    if (device.isAssigned) {
      return (
        <>
          {/* The reversible one leads. */}
          <LightBlueButtonComponent
            title="Return to inventory"
            size="lg"
            styles={{ width: "100%" }}
            loadingState={busy === "return"}
            func={handleReturn}
          />
          <GrayButtonComponent
            title="Exchange for another unit"
            size="lg"
            styles={{ width: "100%" }}
            func={handleExchange}
          />
          <DangerButtonConfirmationComponent
            title="Report lost"
            size="lg"
            styles={{ width: "100%" }}
            loadingState={busy === "lost"}
            confirmationTitle={`Report ${device.serialNumber} as lost?`}
            confirmationDescription="The unit is written off, released from the pool, and the fee flow opens next. This cannot be undone."
            okText="Report lost"
            func={handleReportLost}
          />
        </>
      );
    }

    return (
      <>
        <GrayButtonComponent
          title="Update condition"
          size="lg"
          styles={{ width: "100%" }}
          func={() => setOpenUpdateStatus(true)}
        />
        <p className="device-rail__note">
          This unit is in the event&apos;s pool and can be handed to a consumer.
        </p>
      </>
    );
  };

  return (
    <>
      {contextHolder}
      <div className="device-rail" data-testid="device-actions">
        {actions()}
      </div>

      {openLostModal && (
        <Choice openModal={openLostModal} setOpenModal={setOpenLostModal} />
      )}
      {triggerModal && <Replace />}
      {openUpdateStatus && (
        <UpdateStatus
          openUpdateStatusModal={openUpdateStatus}
          setOpenUpdateStatusModal={setOpenUpdateStatus}
        />
      )}
    </>
  );
};

ActionsMainPage.propTypes = {
  onChanged: PropTypes.func,
};

ActionsMainPage.defaultProps = {
  onChanged: undefined,
};

export default ActionsMainPage;
