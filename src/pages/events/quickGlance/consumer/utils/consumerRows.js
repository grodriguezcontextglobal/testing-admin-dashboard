/**
 * The consumers table's rows, and the per-bucket counts the legend puts on its
 * pills.
 *
 * Both used to be closures inside CustomerDatabase, which also owned the query
 * — so the legend sitting right above the table had no way to say how many
 * consumers were in each bucket. The query moved up to the section that renders
 * the legend, and the shaping came here, where it can be tested without a
 * rendered table.
 *
 * Search runs over the raw record, before the row is shaped, which is what the
 * screen has always done: typing an id or a phone number finds someone even
 * though neither is a column.
 */

import checkTypeFetchResponse from "../../../../../components/utils/checkTypeFetchResponse";
import {
  CONSUMER_STATUSES,
  normalizeConsumerStatus,
} from "./consumerStatusFilter";

/** The response arrives as an array, or as a JSON string of one. */
const asList = (response) => {
  try {
    const parsed = checkTypeFetchResponse(response);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    // A string that is not JSON. Nothing to render, and nothing worth throwing
    // over — the table shows its empty state.
    return [];
  }
};

export const buildConsumerRows = (response, { search } = {}) => {
  const term = String(search ?? "").trim().toLowerCase();
  const list = asList(response);
  const matching = term
    ? list.filter((item) => JSON.stringify(item).toLowerCase().includes(term))
    : list;

  return matching
    .filter((item) => item?.user)
    .map((item) => ({
      user: [item.user.name, item.user.lastName],
      email: item.user.email,
      status: item.transactions,
      phone: item.user.phoneNumber,
      key: item.user.id,
      entireData: item.user,
    }));
};

/**
 * How many consumers sit in each bucket. Counted over the searched rows but
 * before the status filter, so the pills keep saying what they would show if
 * you clicked them — counting after the filter would leave every unselected
 * pill reading 0.
 */
export const countConsumersByStatus = (rows) => {
  const counts = {};
  CONSUMER_STATUSES.forEach((status) => {
    counts[status.value] = 0;
  });
  (Array.isArray(rows) ? rows : []).forEach((row) => {
    counts[normalizeConsumerStatus(row?.status)] += 1;
  });
  return counts;
};
