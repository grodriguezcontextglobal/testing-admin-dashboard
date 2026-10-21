import { useQuery } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../api/devitrakApi";
import clearCacheMemory from "../../../../../utils/actions/clearCacheMemory";
import { mapLostFeeToReceipt } from "../../../../payment/utils/receiptUtils";
import {
  LOST_FEE_METHOD,
  buildLostFeeReport,
  buildLostReceiverUpdate,
  describeLostComment,
  normalizeAssignedReceiver,
  resolveLostDeviceFee,
} from "../utils/lostFee";

/**
 * Settling a lost device, whichever way it is paid: cash, card or waived.
 *
 * Cash and CreditCard each carried their own copy of the write-off; a third
 * method would have made three. One copy now, and it ends with the receipt
 * every settlement owes the consumer.
 *
 * `settle` throws an Error whose `step` says how far it got, so the screen can
 * say whether the device is still live ("writeOff") or written off without its
 * fee on record ("report"). A failed email does not throw: the money is on
 * record and the receipt is on screen, so it comes back as `mailFailed`.
 */
export function useLostFeeSettlement({ customer }) {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const { receiverToReplaceObject } = useSelector((state) => state.helper);
  const { paymentIntentReceiversAssigned } = useSelector((state) => state.stripe);

  const device = receiverToReplaceObject;
  const fee = resolveLostDeviceFee(event, device?.deviceType);
  const receiver = normalizeAssignedReceiver(paymentIntentReceiversAssigned);

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

  const failAt = (step, cause) => Object.assign(new Error(step), { step, cause });

  const writeDeviceOff = async ({ method, waiverReason }) => {
    const update = buildLostReceiverUpdate(
      receiver && {
        ...receiver,
        serialNumber: receiver.serialNumber ?? device?.serialNumber,
        deviceType: receiver.deviceType ?? device?.deviceType,
      }
    );
    if (!update) throw failAt("writeOff");

    // 1 — the consumer's assigned record becomes a write-off
    await devitrakApi.patch(`/receiver/receiver-update/${update.id}`, update);

    // 2 — the unit leaves circulation
    const inPool = groupBy(
      poolQuery.data?.data?.receiversInventory ?? [],
      "device"
    )[device.serialNumber]?.find((entry) => entry.activity === true);
    if (!inPool) return;

    const comment = describeLostComment({ method, admin: user, waiverReason });
    await devitrakApi.patch(`/receiver/receivers-pool-update/${inPool.id}`, {
      id: inPool.id,
      activity: false,
      comment,
      status: "Lost",
    });
    await devitrakApi.post("/receiver/receiver-returned-issue", {
      ...inPool,
      activity: false,
      comment,
      status: "Lost",
      user: customer?.email,
      admin: user?.email,
      timeStamp: Date.now(),
    });
  };

  const sendFeeEmail = async ({ amount, feePaymentIntent }) => {
    const stamp = new Date().toString().split(" ");
    await devitrakApi.post("/nodemailer/lost-device-fee-notification", {
      consumer: {
        name: `${customer?.name ?? ""} ${customer?.lastName ?? ""}`.trim(),
        email: customer?.email,
      },
      device: `${device.deviceType} - ${device.serialNumber}`,
      amount,
      event: event.eventInfoDetail.eventName,
      company: event.company,
      date: stamp.slice(0, 4),
      time: stamp[4],
      transaction: receiver?.paymentIntent,
      ...(feePaymentIntent ? { paymentIntent: feePaymentIntent } : {}),
      link: `https://app.devitrak.net/authentication/${event.id}/${user.companyData.id}/${customer?.uid}`,
    });
  };

  const settle = async ({ method, amount, feePaymentIntent, waiverReason }) => {
    try {
      await writeDeviceOff({ method, waiverReason });
    } catch (error) {
      throw error?.step ? error : failAt("writeOff", error);
    }

    try {
      await devitrakApi.post(
        "/cash-report/create-cash-report",
        buildLostFeeReport({
          amount,
          method,
          device,
          paymentIntent: receiver?.paymentIntent,
          consumer: customer,
          admin: user,
          event,
          companyId: user.companyData.id,
          feePaymentIntent,
          waiverReason,
        })
      );
    } catch (error) {
      throw failAt("report", error);
    }

    // A waiver charges nothing, so there is no fee email to send: the
    // template is a payment notice. The receipt still records it.
    let mailFailed = false;
    if (method !== LOST_FEE_METHOD.WAIVED) {
      try {
        await sendFeeEmail({ amount, feePaymentIntent });
      } catch {
        mailFailed = true;
      }
    }

    await Promise.allSettled([
      clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.eventName}&company=${user.companyData.id}`
      ),
      clearCacheMemory(`eventSelected=${event.id}&company=${user.companyData.id}`),
      clearCacheMemory(
        `eventSelected=${event.eventInfoDetail.id}&company=${user.companyData.id}`
      ),
    ]);

    return {
      mailFailed,
      receipt: mapLostFeeToReceipt({
        consumer: customer,
        device,
        amount,
        method,
        paymentIntent: receiver?.paymentIntent,
        feePaymentIntent,
        company: user?.company,
        date: new Date().toISOString(),
        admin: user,
        waiverReason,
      }),
    };
  };

  return { event, user, device, receiver, fee, poolQuery, settle };
}

