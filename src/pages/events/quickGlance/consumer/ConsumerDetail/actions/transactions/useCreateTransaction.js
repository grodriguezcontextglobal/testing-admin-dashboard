import { nanoid } from "@reduxjs/toolkit";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../../api/devitrakApi";
import DeviceAssigned from "../../../../../../../classes/deviceAssigned";
import { useStatusNotification } from "../../../../../../../components/notification/alerts/useStatusNotification";
import {
  onAddDevicesSelection,
  onAddDevicesSelectionPaidTransactions,
} from "../../../../../../../store/slices/devicesHandleSlice";
import clearCacheMemory from "../../../../../../../utils/actions/clearCacheMemory";
import { availableSerialsForGroup } from "../../../utils/deviceScan";
import {
  buildCashPaymentIntentId,
  buildDeviceSelection,
  buildFreePaymentIntentId,
  buildTransactionProfile,
  consumerDeviceOptions,
  validateDraft,
} from "../../../utils/transactionDraft";
import { useSelectedConsumer } from "../../hooks/useConsumerEventActivity";

/**
 * Creating a transaction, for every mode.
 *
 * The four flows this replaces each held their own copy of the pool query, the
 * device-block builder, the id generator, the receiver assignment and the cache
 * invalidation list. The differences that actually matter are the two
 * strategies:
 *
 *   immediate — no charge and cash. The transaction, the receivers and the pool
 *               updates are all written here, then the modal closes.
 *   stripe    — card deposit. Ask Stripe for a client secret and hand off to
 *               <StripeCheckoutElement>; the draft is parked in Redux, which is
 *               where the checkout element reads it from.
 *
 * Ordering matters and is deliberate: nothing is written until `validateDraft`
 * passes, and the devices are assigned *before* the transaction is saved, so a
 * failure cannot leave a saved transaction with no devices on it — which is
 * exactly what the old multi-device path produced whenever its starting serial
 * was not found.
 */

const POOL_KEY = (eventName, companyId) => [
  "eventDevicePool",
  String(eventName ?? ""),
  String(companyId ?? ""),
];

export function useCreateTransaction({ mode, onDone }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const consumer = useSelectedConsumer();

  const [group, setGroup] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [serials, setSerials] = useState([]);
  const [amount, setAmount] = useState("");
  const [problems, setProblems] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [clientSecret, setClientSecret] = useState("");

  const companyId = user?.companyData?.id;
  const eventName = event?.eventInfoDetail?.eventName;

  // One pool query for the whole modal, keyed on the event and company. The old
  // screens each ran their own under the shared key
  // ["devicesInPoolListPerEvent"] with different bodies — and two of the four
  // omitted `activity: false`, so those two listed devices already out with
  // another consumer as available.
  const poolQuery = useQuery({
    queryKey: POOL_KEY(eventName, companyId),
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: eventName,
        company: companyId,
        activity: false,
      }),
    enabled: Boolean(eventName && companyId),
    staleTime: 1000 * 30,
  });

  const pool = poolQuery.data?.data?.receiversInventory ?? [];
  const options = consumerDeviceOptions(event);
  const selectedOption = options.find((option) => option.group === group) ?? null;
  const availableSerials = availableSerialsForGroup(pool, group);

  const reset = () => {
    setGroup(null);
    setQuantity(1);
    setSerials([]);
    setAmount("");
    setProblems([]);
    setClientSecret("");
  };

  const chooseGroup = (nextGroup) => {
    setGroup(nextGroup);
    // Serials belong to the type they were scanned for; keeping them across a
    // type change is how you assign a headset on a tablet request.
    setSerials([]);
    setProblems([]);
  };

  const changeQuantity = (next) => {
    const value = Number(next);
    setQuantity(next);
    if (Number.isFinite(value) && value > 0) {
      setSerials((current) => current.slice(0, value));
    }
    setProblems([]);
  };

  const draft = {
    group,
    quantity,
    serials,
    availableCount: availableSerials.length,
    requiresAmount: mode.requiresAmount,
    amount,
  };

  const clearEventCaches = () =>
    Promise.all([
      clearCacheMemory(`eventSelected=${eventName}&company=${companyId}`),
      clearCacheMemory(`eventSelected=${event?.id}&company=${companyId}`),
    ]);

  const refreshEverything = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: POOL_KEY(eventName, companyId) }),
      queryClient.invalidateQueries({ queryKey: ["consumerEventTransactions"] }),
      queryClient.invalidateQueries({ queryKey: ["consumerEventAssignedDevices"] }),
      queryClient.invalidateQueries({ queryKey: ["poolInfoQuery"] }),
    ]);

  /** Assign one scanned serial to the transaction and take it out of the pool. */
  const assignSerial = async (serial, paymentIntent, deviceType) => {
    const record = pool.find(
      (entry) =>
        String(entry?.device).toLowerCase() === String(serial).toLowerCase()
    );

    const assignment = new DeviceAssigned(
      paymentIntent,
      { serialNumber: serial, deviceType, status: true },
      consumer.email,
      true,
      eventName,
      user.company,
      new Date().getTime(),
      companyId,
      event.id
    );

    await devitrakApi.post("/receiver/receiver-assignation", assignment.render());

    if (record?.id) {
      await devitrakApi.patch(`/receiver/receivers-pool-update/${record.id}`, {
        activity: true,
        status: "Operational",
      });
    }
  };

  const notifyConsumer = async (paymentIntent, deviceType) => {
    try {
      await devitrakApi.post("/nodemailer/assignig-device-notification", {
        consumer: {
          email: consumer.email,
          firstName: consumer.name,
          lastName: consumer.lastName,
        },
        devices: serials.map((serial) => ({
          serialNumber: serial,
          deviceType,
          paymentIntent,
        })),
        event: eventName,
        transaction: paymentIntent,
        company: companyId,
        link: `https://app.devitrak.net/?event=${event.id}&company=${companyId}`,
        admin: user.email,
      });
    } catch (error) {
      // The devices are assigned; a failed email is not a failed transaction.
      notify("warning", "Transaction created, but the email did not send.");
    }
  };

  /** No charge and cash: everything is written here and now. */
  const submitImmediate = async () => {
    const deviceSelection = buildDeviceSelection(selectedOption, serials.length);
    const reference = nanoid(12);
    const paymentIntent =
      mode.key === "cash"
        ? buildCashPaymentIntentId({
            amount,
            adminEmail: user.email,
            reference,
          })
        : buildFreePaymentIntentId(reference);

    const stripeResponse = await devitrakApi.post(
      "/stripe/stripe-transaction-no-regular-user",
      {
        paymentIntent,
        clientSecret: `${serials.length}${consumer.uid}${reference}`,
        device: serials.length,
        user: consumer.uid,
        eventSelected: eventName,
        provider: user.company,
        company: companyId,
      }
    );

    // Devices first: a failure here must not leave a saved transaction that
    // claims devices it never got.
    for (const serial of serials) {
      await assignSerial(serial, paymentIntent, deviceSelection.deviceType);
    }

    await devitrakApi.post(
      "/stripe/save-transaction",
      buildTransactionProfile({
        paymentIntent,
        clientSecret:
          stripeResponse.data?.stripeTransaction?.clientSecret ?? "unknown",
        deviceSelection,
        consumer,
        event,
        companyId,
        date: `${new Date()}`,
      })
    );

    await clearEventCaches();
    await refreshEverything();
    await notifyConsumer(paymentIntent, deviceSelection.deviceType);

    notify(
      "success",
      `${serials.length} device${serials.length === 1 ? "" : "s"} assigned to ${
        consumer.email
      }.`
    );
    onDone?.();
  };

  /**
   * Card deposit: park the draft where <StripeCheckoutElement> reads it and let
   * the card form take over. Nothing is assigned until the card clears.
   */
  const submitStripe = async () => {
    const response = await devitrakApi.post(
      "/stripe/create-payment-intent-customized",
      { customerEmail: consumer?.email, total: amount }
    );

    const secret = response.data?.paymentIntentCustomized?.client_secret;
    if (!secret) throw new Error("Stripe returned no client secret");

    dispatch(onAddDevicesSelection(serials.length));
    dispatch(
      onAddDevicesSelectionPaidTransactions({
        serialNumber: serials[0],
        serialNumbers: serials,
        quantity: serials.length,
        amount,
        deviceType: selectedOption,
      })
    );
    setClientSecret(secret);
  };

  const submit = async () => {
    const validation = validateDraft(draft);
    setProblems(validation.problems);
    if (!validation.ok) return;

    setIsSaving(true);
    try {
      if (mode.strategy === "stripe") await submitStripe();
      else await submitImmediate();
    } catch (error) {
      // Every one of the old flows ended in `alert(error)` or a bare
      // `console.error`, so a half-written transaction looked like a no-op.
      notify(
        "error",
        "The transaction was not created. Check the devices before retrying."
      );
      setProblems([
        "The transaction could not be saved. Nothing was handed over — re-check the serial numbers and try again.",
      ]);
    } finally {
      setIsSaving(false);
    }
  };

  return {
    contextHolder,
    // data
    options,
    pool,
    availableSerials,
    selectedOption,
    isLoadingPool: poolQuery.isLoading,
    isPoolError: poolQuery.isError,
    retryPool: poolQuery.refetch,
    // draft
    group,
    quantity,
    serials,
    amount,
    problems,
    clientSecret,
    isSaving,
    // actions
    chooseGroup,
    changeQuantity,
    setSerials,
    setAmount,
    submit,
    reset,
  };
}

export default useCreateTransaction;
