/**
 * The manual, assembled.
 *
 * Order here is reading order in the app: the events domain first because it is
 * the job everything else serves, then the inventory it borrows from, then the
 * students it hands equipment to, then the settings that govern all three.
 *
 * Adding a domain is adding a file here. Keep article ids stable once shipped —
 * they are the URL (/help/<id>) and, if the support bot is ever built, the
 * anchor an answer cites.
 */

import { eventsSection } from "./events";
import { inventorySection } from "./inventory";
import { profileSection } from "./profile";
import { studentsSection } from "./students";

export const MANUAL_SECTIONS = [
  eventsSection,
  inventorySection,
  studentsSection,
  profileSection,
];

/** Not written yet, stated so the gap is visible rather than implied. */
export const MANUAL_PENDING = [
  "Staff — adding people, assigning them to events",
  "Transactions and deposits at an event",
  "Home and the search bar",
  "The consumer app",
];
