/**
 * The manual, assembled.
 *
 * Order here is reading order in the app: the events domain first because it is
 * the job everything else serves, then the inventory it borrows from, then the
 * people it hands equipment to.
 *
 * Adding a domain is adding a file here. Keep article ids stable once shipped —
 * they are the URL (/help/<id>) and, if the support bot is ever built, the
 * anchor an answer cites.
 */

import { consumersSection } from "./consumers";
import { eventsSection } from "./events";
import { inventorySection } from "./inventory";

export const MANUAL_SECTIONS = [eventsSection, inventorySection, consumersSection];

/** Domains not written yet, stated so the gap is visible rather than implied. */
export const MANUAL_PENDING = [
  "Staff and roles",
  "Members and students",
  "Company profile and settings",
  "Payments and subscription",
];
