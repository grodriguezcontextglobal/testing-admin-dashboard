/**
 * The name the generated lease event is stored under.
 *
 * The same string is written as `event_name`, `venue_name`, the receivers-pool
 * `eventSelected` and `eventInfoDetail.eventName`, so all four have to agree
 * exactly. It used to be rebuilt inline in four places, each calling
 * `new Date().toLocaleDateString()` again — which returns a different value
 * either side of midnight, so a request that straddled it wrote two different
 * names for one assignment. The date and the reference are passed in, computed
 * once per submission.
 */
export function buildLeaseEventName({ profile, date, reference }) {
  return `${profile?.firstName} ${profile?.lastName} / ${profile?.email} / ${date} / reference: ${reference}`;
}
