/**
 * The company's event list: where it is asked for, and the key the server
 * caches it under.
 *
 * `GET /api/event/event-list-per-company` reads the raw query string and
 * caches the answer under it, so the key to clear is the query string itself,
 * character for character. Deleting a draft refetched the list and got the
 * cached one back, still carrying the deleted event, and only a page reload
 * showed the truth (reported 2026-10-06).
 *
 * The URL and the cache key come from here so they cannot drift apart: the
 * same string written in two files is what made the bug possible.
 */

/** The server's cache key for this company's event list. */
export const eventsListCacheKey = (company) => `company=${company}&type=event`;

/** The request that fetches it. */
export const eventsListPath = (company) =>
  `/event/event-list-per-company?${eventsListCacheKey(company)}`;
