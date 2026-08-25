import { useQueryClient } from "@tanstack/react-query";
import { groupBy } from "lodash";
import { useState } from "react";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import { useStatusNotification } from "../../../../../../components/notification/alerts/useStatusNotification";
import clearCacheMemory from "../../../../../../utils/actions/clearCacheMemory";

/**
 * Every device action available on one transaction: hand out, take back, take
 * back everything, and email the consumer what they are holding.
 *
 * Pulled out of ExpandedRowInTable.jsx, which was a 677-line component holding
 * both these mutations and the markup that triggered them. The behaviour is
 * deliberately unchanged — same endpoints, same order, same notifications —
 * with three exceptions, all of them cases where the old code could throw or
 * lie:
 *
 *  1. The receiver id comes in on the row (`devicesForTransaction` already
 *     resolved it) instead of being re-derived by grouping the whole list by
 *     serial number and indexing into it, which threw a TypeError whenever the
 *     serial was missing from the group.
 *  2. A failed return no longer resolves silently. The old handler caught the
 *     error, returned null and cleared the spinner, so a device that was still
 *     out looked returned until the next refresh.
 *  3. `notify` is called on failure, not only on success.
 */
export function useTransactionDeviceActions({
  event,
  user,
  consumer,
  record,
  rows,
  refetch,
  onTransactionEmptied,
}) {
  const queryClient = useQueryClient();
  const { notify, contextHolder } = useStatusNotification();
  const [busyKey, setBusyKey] = useState(null);
  const [isReportSending, setIsReportSending] = useState(false);
  const [isBulkRunning, setIsBulkRunning] = useState(false);

  const eventName = event?.eventInfoDetail?.eventName;
  const companyId = user?.companyData?.id;
  const consumerLink = `https://app.devitrak.net/?event=${event?.id}&company=${companyId}`;

  const consumerPayload = {
    email: consumer?.email,
    firstName: consumer?.name,
    lastName: consumer?.lastName,
  };

  /** Both keys are independent, so they clear concurrently. */
  const clearEventCaches = () =>
    Promise.all([
      clearCacheMemory(`eventSelected=${eventName}&company=${companyId}`),
      clearCacheMemory(`eventSelected=${event?.id}&company=${companyId}`),
    ]);

  const notifyReturned = async (devices) => {
    try {
      await devitrakApi.post("/nodemailer/confirm-returned-device-notification", {
        consumer: consumerPayload,
        devices,
        event: eventName,
        transaction: record.paymentIntent,
        company: companyId,
        link: consumerLink,
        admin: user?.email,
      });
    } catch (error) {
      // The device is already back; a failed receipt email must not read as a
      // failed return.
      notify("warning", "Device returned, but the receipt email did not send.");
    }
  };

  /**
   * After a return, decide whether the transaction is now empty — that is what
   * releases the card deposit.
   */
  const settleTransactionIfEmpty = async () => {
    try {
      const response = await devitrakApi.post("/receiver/receiver-assigned-list", {
        user: consumer.email,
        company: companyId,
        eventSelected: eventName,
        paymentIntent: record.paymentIntent,
      });
      const byStatus = groupBy(response?.data?.listOfReceivers, "device.status");
      if (byStatus.false?.length) await notifyReturned([...byStatus.false]);
      if (!byStatus.true) onTransactionEmptied?.();
    } catch (error) {
      notify("warning", "Could not confirm the transaction is fully returned.");
    }
  };

  const handleReturn = async (row) => {
    if (!row?.receiverId) {
      return notify("error", "This device record is incomplete. Refresh and retry.");
    }
    setBusyKey(row.key);
    try {
      const poolQuery = await devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: eventName,
        company: companyId,
        device: row.serialNumber,
        type: row.deviceType,
      });

      await devitrakApi.patch(`/receiver/receiver-update/${row.receiverId}`, {
        id: row.receiverId,
        device: {
          serialNumber: row.serialNumber,
          deviceType: row.deviceType,
          deviceValue: row.deviceValue,
          status: false,
        },
      });

      const inPool = poolQuery.data?.receiversInventory?.at(-1);
      if (inPool) {
        await devitrakApi.patch(`/receiver/receivers-pool-update/${inPool.id}`, {
          id: inPool.id,
          activity: false,
        });
      }

      await clearCacheMemory(
        `event_id=${event.id}&company=${companyId}&consumerInfo.id=${
          consumer.id ?? consumer.uid
        }`
      );
      await clearEventCaches();
      refetch();
      notify("success", `${row.serialNumber} returned.`);
      await settleTransactionIfEmpty();
    } catch (error) {
      // Previously swallowed: the row lost its spinner and looked returned.
      notify("error", `${row.serialNumber} was not returned. Nothing changed.`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleAssign = async (row) => {
    if (!row?.receiverId) {
      return notify("error", "This device record is incomplete. Refresh and retry.");
    }
    setBusyKey(row.key);
    try {
      const poolQuery = await devitrakApi.post("/receiver/receiver-pool-list", {
        eventSelected: eventName,
        company: companyId,
        device: row.serialNumber,
        type: row.deviceType,
      });
      const inPool = poolQuery.data?.receiversInventory?.at(-1);

      if (inPool?.activity) {
        // Was a browser alert(); a notification keeps it in the page.
        notify(
          "warning",
          `${row.serialNumber} is already out with another consumer. Pick another serial number.`
        );
        return setBusyKey(null);
      }

      await devitrakApi.patch(`/receiver/receiver-update/${row.receiverId}`, {
        id: row.receiverId,
        device: {
          serialNumber: row.serialNumber,
          deviceType: row.deviceType,
          deviceValue: row.deviceValue,
          status: true,
        },
      });

      if (inPool) {
        await devitrakApi.patch(`/receiver/receivers-pool-update/${inPool.id}`, {
          ...inPool,
          activity: true,
        });
      }

      await clearEventCaches();
      refetch();
      notify("success", `${row.serialNumber} assigned.`);

      await devitrakApi.post("/nodemailer/assignig-device-notification", {
        consumer: consumerPayload,
        devices: [
          {
            serialNumber: row.serialNumber,
            deviceType: row.deviceType,
            paymentIntent: record.paymentIntent,
          },
        ],
        event: eventName,
        transaction: record.paymentIntent,
        company: companyId,
        link: consumerLink,
        admin: user?.email,
      });
    } catch (error) {
      notify("error", `${row.serialNumber} was not assigned. Nothing changed.`);
    } finally {
      setBusyKey(null);
    }
  };

  const handleReturnAll = async () => {
    const stillOut = rows.filter((row) => row.status === true);
    if (stillOut.length === 0) {
      return notify("info", "Nothing on this transaction is still out.");
    }

    setIsBulkRunning(true);
    try {
      // The bulk endpoints take the raw receiver records, not the table rows.
      const receivers = stillOut.map((row) => ({
        id: row.receiverId,
        paymentIntent: row.paymentIntent,
        eventSelected: [eventName],
        device: {
          serialNumber: row.serialNumber,
          deviceType: row.deviceType,
          deviceValue: row.deviceValue,
          status: true,
        },
      }));

      await devitrakApi.patch("/receiver/transaction-all-items-returned-at-once", {
        timeStamp: new Date().getTime(),
        device: receivers,
      });
      await devitrakApi.patch("/receiver/transaction-return-all-items-in-pool", {
        device: receivers,
        company: companyId,
        activity: false,
        eventSelected: eventName,
      });
      await notifyReturned(receivers);
      await clearEventCaches();

      queryClient.invalidateQueries({ queryKey: ["listOfreceiverInPool"] });
      refetch();
      notify(
        "success",
        `${stillOut.length} device${stillOut.length === 1 ? "" : "s"} returned.`
      );
      onTransactionEmptied?.();
    } catch (error) {
      notify("error", "The bulk return failed. Nothing was returned.");
    } finally {
      setIsBulkRunning(false);
    }
  };

  const sendDeviceReport = async () => {
    setIsReportSending(true);
    try {
      const response = await devitrakApi.post(
        "/nodemailer/device-report-per-transaction",
        {
          consumer: consumerPayload,
          devices: rows.map((row) => ({
            device: {
              serialNumber: row.serialNumber,
              deviceType: row.deviceType,
              status: row.status,
            },
            paymentIntent: record.paymentIntent,
          })),
          event: eventName,
          transaction: record.paymentIntent,
          company: companyId,
          link: consumerLink,
          admin: user?.email,
        }
      );
      if (response.data?.ok) {
        notify("success", `Report queued for ${consumer.email}.`);
      } else {
        // The old handler only reported success, so a rejected report looked
        // like nothing had happened at all.
        notify("warning", "The report was not queued. Try again.");
      }
    } catch (error) {
      notify("error", "The report could not be sent.");
    } finally {
      setIsReportSending(false);
    }
  };

  return {
    contextHolder,
    busyKey,
    isReportSending,
    isBulkRunning,
    handleReturn,
    handleAssign,
    handleReturnAll,
    sendDeviceReport,
    settleTransactionIfEmpty,
  };
}

export default useTransactionDeviceActions;
