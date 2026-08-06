import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";

/**
 * Devices a consumer is currently holding, flattened out of the receiver
 * records behind their transactions.
 *
 * Note the deliberate difference from the member/student side: consumer
 * receivers carry no expected_return_date, so there is no due-date countdown
 * to show here. What matters instead is device state — in use, returned, or
 * lost — and what the outstanding kit is worth.
 */
export const consumerAssignedDevicesKey = (consumerId, paymentIntents) => [
  "consumerAssignedDevices",
  String(consumerId ?? ""),
  [...(paymentIntents ?? [])].sort().join(","),
];

/** true = still out, false = returned, "Lost" = written off. */
export function getDeviceState(status) {
  if (status === "Lost") return { key: "lost", tone: "critical", label: "Lost" };
  if (status === false) return { key: "returned", tone: "success", label: "Returned" };
  return { key: "out", tone: "neutral", label: "In use" };
}

export function summarizeConsumerDevices(rows) {
  const list = Array.isArray(rows) ? rows : [];
  return list.reduce(
    (acc, row) => {
      const state = getDeviceState(row.status);
      acc.total += 1;
      if (state.key === "lost") acc.lost += 1;
      if (state.key === "returned") acc.returned += 1;
      if (state.key === "out") {
        acc.out += 1;
        acc.valueOnLoan += Number(row.deviceValue) || 0;
      }
      return acc;
    },
    { total: 0, out: 0, lost: 0, returned: 0, valueOnLoan: 0 }
  );
}

export function useConsumerAssignedDevices({
  consumerId,
  companyId,
  paymentIntents,
}) {
  const intents = (paymentIntents ?? []).filter(Boolean);

  const query = useQuery({
    queryKey: consumerAssignedDevicesKey(consumerId, intents),
    queryFn: () =>
      devitrakApi.post("/receiver/receiver-assigned-list", {
        paymentIntent: { $in: intents },
        company: companyId,
      }),
    enabled: Boolean(companyId && intents.length > 0),
  });

  const rows = (query.data?.data?.listOfReceivers ?? []).map((receiver, index) => ({
    key: `${receiver?._id ?? receiver?.paymentIntent ?? "receiver"}-${index}`,
    serialNumber: receiver?.device?.serialNumber ?? "—",
    deviceType: receiver?.device?.deviceType ?? "—",
    deviceValue: receiver?.device?.deviceValue ?? 0,
    status: receiver?.device?.status,
    paymentIntent: receiver?.paymentIntent,
    eventSelected: Array.isArray(receiver?.eventSelected)
      ? receiver.eventSelected[0]
      : receiver?.eventSelected,
    assignedAt: receiver?.timestamp ?? receiver?.created_at ?? null,
  }));

  return {
    ...query,
    // With no transactions there are no receivers to ask for; report an empty
    // result rather than leaving the section stuck in a loading state.
    isLoading: intents.length === 0 ? false : query.isLoading,
    rows,
    summary: summarizeConsumerDevices(rows),
  };
}

export default useConsumerAssignedDevices;
