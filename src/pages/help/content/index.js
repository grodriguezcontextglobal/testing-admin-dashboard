/**
 * The manual, assembled.
 *
 * Order here is reading order: where you land, then the job, then the money it
 * takes, the stock it borrows, the people it serves, the people who run it, and
 * last the settings that govern all of them.
 *
 * Adding a domain is adding a file here. Keep article ids stable once shipped —
 * they are the URL (/help/<id>) and, if the support bot is ever built, the
 * anchor an answer cites.
 */

import { eventsSection } from "./events";
import { homeSection } from "./home";
import { inventorySection } from "./inventory";
import { profileSection } from "./profile";
import { staffSection } from "./staff";
import { studentsSection } from "./students";
import { transactionsSection } from "./transactions";

export const MANUAL_SECTIONS = [
  homeSection,
  eventsSection,
  transactionsSection,
  inventorySection,
  studentsSection,
  staffSection,
  profileSection,
];

/** Not written yet, stated so the gap is visible rather than implied. */
export const MANUAL_PENDING = [
  "The consumer app — what the people receiving equipment see",
];
