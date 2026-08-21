import { useQuery } from "@tanstack/react-query";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../../../../api/devitrakApi";
import {
  buildConsumerChips,
  buildConsumerStatTiles,
  countRequestedDevices,
  summarizeConsumerDevices,
} from "../../utils/consumerActivity";

/**
 * Everything the consumer's page needs about their activity at this event, from
 * one place.
 *
 * Replaces ConsumerActivity.jsx, which ran three queries on mount, invalidated
 * five cache keys on every consumer change, and then refetched all three by
 * hand — so opening a consumer fired eight requests to render three numbers.
 * One of the three queries (`/receiver/list-receiver-returned-issue`) was never
 * read at all; it only appeared in the `if (data)` guard, which meant a failure
 * there blanked the whole strip.
 *
 * The query keys are exported because the transaction table and the expanded
 * transaction panel need to invalidate exactly these. They previously all
 * shared the key `["assginedDeviceList"]` while posting different bodies — the
 * panel's per-transaction fetch overwrote the page-wide list in the cache, so
 * the stat strip started reporting one transaction's devices as the consumer's
 * total.
 */

export const consumerTransactionsKey = (eventId, companyId, consumerId) => [
  "consumerEventTransactions",
  String(eventId ?? ""),
  String(companyId ?? ""),
  String(consumerId ?? ""),
];

export const consumerAssignedDevicesKey = (eventName, companyId, email) => [
  "consumerEventAssignedDevices",
  String(eventName ?? ""),
  String(companyId ?? ""),
  String(email ?? ""),
];

/** The same consumer is mirrored into two slices at selection time. */
export const useSelectedConsumer = () => {
  const fromCustomer = useSelector((state) => state.customer?.customer);
  const fromStripe = useSelector((state) => state.stripe?.customer);
  return fromCustomer ?? fromStripe ?? null;
};

export function useConsumerEventActivity() {
  const { event } = useSelector((state) => state.event);
  const { user } = useSelector((state) => state.admin);
  const consumer = useSelectedConsumer();

  const companyId = user?.companyData?.id;
  const eventName = event?.eventInfoDetail?.eventName;
  const consumerId = consumer?.id ?? consumer?.uid;

  const transactionsQuery = useQuery({
    queryKey: consumerTransactionsKey(event?.id, companyId, consumerId),
    queryFn: () =>
      devitrakApi.get(
        `/transaction/transaction?event_id=${event.id}&company=${companyId}&consumerInfo.id=${consumerId}`
      ),
    enabled: Boolean(event?.id && companyId && consumerId),
  });

  const assignedDevicesQuery = useQuery({
    queryKey: consumerAssignedDevicesKey(eventName, companyId, consumer?.email),
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        user: consumer.email,
        company: companyId,
        eventSelected: eventName,
      }),
    enabled: Boolean(eventName && companyId && consumer?.email),
  });

  const transactions = transactionsQuery.data?.data?.list ?? [];
  const receivers = assignedDevicesQuery.data?.data?.listOfReceivers ?? [];

  const summary = summarizeConsumerDevices(receivers);
  const requested = countRequestedDevices(transactions);

  const refetch = () => {
    transactionsQuery.refetch();
    assignedDevicesQuery.refetch();
  };

  return {
    consumer,
    transactions,
    receivers,
    summary,
    requested,
    statTiles: buildConsumerStatTiles({ requested, summary }),
    chips: buildConsumerChips(summary),
    // The strip is secondary to the page: it shows placeholders while it loads
    // and says so when it fails, but it never blocks the transactions below it.
    isLoading: transactionsQuery.isLoading || assignedDevicesQuery.isLoading,
    isError: transactionsQuery.isError || assignedDevicesQuery.isError,
    refetch,
  };
}

export default useConsumerEventActivity;
