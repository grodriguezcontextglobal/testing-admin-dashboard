import { InputAdornment, OutlinedInput } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import BlueButtonComponent from "../../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../../components/UX/buttons/GrayButton";
import { onAddPaymentIntentSelected } from "../../../../../../store/slices/stripeSlice";
import { OutlinedInputStyle } from "../../../../../../styles/global/OutlinedInputStyle";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";
import "../../consumerDetail.css";
import {
  buildLostFeeReport,
  normalizeAssignedReceiver,
  resolveLostDeviceFee,
} from "../../utils/lostFee";
import LostFeeScreen from "../components/LostFeeScreen";

/**
 * Collect a lost-device fee in cash.
 *
 * Behaviour preserved: write the device off in the assigned list, release it
 * from the pool with a "Device lost" note, file a returned-issue record, post a
 * cash report, email the consumer, clear the event caches, go back to the
 * transactions tab.
 *
 * What changed:
 *   - It no longer crashes on arrival. The fee was read as
 *     `returnDeviceValue().value` while building the form's defaultValues, and
 *     that helper returned undefined for any device type not priced in the
 *     event — so the screen threw before rendering. Now the price is resolved
 *     safely and a missing one is reported.
 *   - A hard reload of this URL has no receiver in the store; that used to
 *     dereference `receiverToReplaceObject.deviceType` and blank the page.
 *   - Failures are reported. The submit handler's only error branch was
 *     `console.error`, so a failed write left the operator on a form that
 *     looked like it had never been submitted while the device stayed live.
 *   - The pool lookup no longer filters on `user.company` while the event
 *     stores `event.company`; it asks the endpoint for this event's pool and
 *     matches the serial.
 */
const Cash = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { customer } = useSelector((state) => state.customer);
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const { paymentIntentReceiversAssigned } = useSelector((state) => state.stripe);
  const { notify, contextHolder } = useStatusNotification();

  const device = receiverToReplaceObject;
  const fee = resolveLostDeviceFee(event, device?.deviceType);
  const receiver = normalizeAssignedReceiver(paymentIntentReceiversAssigned);

  const {
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { total: fee.amount ? String(fee.amount) : "" } });

  const poolQuery = useQuery({
    queryKey: ["lostFeePool", event?.eventInfoDetail?.eventName, device?.serialNumber],
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: event.eventInfoDetail.eventName,
        company: user.companyData.id,
        device: device.serialNumber,
        type: device.deviceType,
      }),
    enabled: Boolean(event?.eventInfoDetail?.eventName && device?.serialNumber),
  });

  const goBack = () => {
    dispatch(onAddPaymentIntentSelected(""));
    navigate(`/events/event-attendees/${customer?.uid}/transactions-details`);
  };

  const writeDeviceOff = async () => {
    // 1 — the consumer's assigned record becomes a write-off
    await devitrakApi.patch(`/receiver/receiver-update/${receiver.id}`, {
      id: receiver.id,
      device: { ...receiver.device, status: "Lost" },
      active: false,
    });

    // 2 — the unit leaves circulation
    const inPool = groupBy(
      poolQuery.data?.data?.receiversInventory ?? [],
      "device"
    )[device.serialNumber]?.find((entry) => entry.activity === true);

    if (inPool) {
      await devitrakApi.patch(`/receiver/receivers-pool-update/${inPool.id}`, {
        id: inPool.id,
        activity: false,
        comment: "Device lost",
        status: "Lost",
      });
      await devitrakApi.post("/receiver/receiver-returned-issue", {
        ...inPool,
        activity: false,
        comment: "Device lost",
        status: "Lost",
        user: customer?.email,
        admin: user?.email,
        timeStamp: Date.now(),
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      await writeDeviceOff();

      await devitrakApi.post(
        "/cash-report/create-cash-report",
        buildLostFeeReport({
          amount: data.total,
          method: "Cash",
          device,
          paymentIntent: receiver?.paymentIntent,
          consumer: customer,
          admin: user,
          event,
          companyId: user.companyData.id,
        })
      );

      const stamp = new Date().toString().split(" ");
      await devitrakApi.post("/nodemailer/lost-device-fee-notification", {
        consumer: {
          name: `${customer.name} ${customer.lastName}`,
          email: customer.email,
        },
        device: `${device.deviceType} - ${device.serialNumber}`,
        amount: data.total,
        event: event.eventInfoDetail.eventName,
        company: event.company,
        date: stamp.slice(0, 4),
        time: stamp[4],
        transaction: receiver?.paymentIntent,
        link: `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer.uid}`,
      });

      // All three keys are independent, so they clear concurrently.
      await Promise.all([
        clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
        ),
        clearCacheMemory(
          `eventSelected=${event.id}&company=${user.companyData.id}`
        ),
        clearCacheMemory(
          `eventSelected=${event.eventInfoDetail.id}&company=${user.companyData.id}`
        ),
      ]);

      notify("success", `Cash fee recorded for ${device.serialNumber}.`);
      goBack();
    } catch (error) {
      // Was `console.error(error)` only: the operator saw an unchanged form and
      // no indication that the device is still marked as in use.
      notify(
        "error",
        "The fee was not recorded. The device is still marked as in use."
      );
    }
  };

  if (!device?.serialNumber || !receiver?.id) {
    return (
      <LostFeeScreen
        title="Collect lost device fee · cash"
        onCancel={goBack}
        error={{
          title: "No device selected",
          description:
            "Report a device as lost from its transaction to collect the fee.",
        }}
      />
    );
  }

  return (
    <>
      {contextHolder}
      <form onSubmit={handleSubmit(onSubmit)}>
        <LostFeeScreen
          title="Collect lost device fee · cash"
          description="Recorded as cash taken at the counter. The consumer is emailed a receipt."
          device={device}
          amount={fee.amount}
          consumerName={`${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim()}
          eventName={event?.eventInfoDetail?.eventName}
          onCancel={goBack}
          footer={
            <>
              <GrayButtonComponent
                title="Cancel"
                buttonType="button"
                func={goBack}
              />
              <BlueButtonComponent
                title="Record cash payment"
                buttonType="submit"
                loadingState={isSubmitting}
              />
            </>
          }
        >
          <div className="lost-fee__field">
            <label className="serial-capture__label" htmlFor="lost-fee-amount">
              Amount collected
            </label>
            <OutlinedInput
              id="lost-fee-amount"
              style={OutlinedInputStyle}
              startAdornment={<InputAdornment position="start">$</InputAdornment>}
              aria-invalid={errors.total ? "true" : "false"}
              {...register("total", { required: true })}
            />
            {errors?.total && (
              <p className="serial-capture__error">An amount is required.</p>
            )}
            {/* Says why the field is empty instead of prefilling a silent zero. */}
            {!fee.found && (
              <p className="transaction-panel__hint">
                This device type has no replacement value set on the event, so
                enter the amount manually.
              </p>
            )}
          </div>
        </LostFeeScreen>
      </form>
    </>
  );
};

export default Cash;
