/**
 * Staged (client-side) student date-of-birth store for the school sales demo.
 *
 * Gustavo's date_of_birth persistence (Phase D) is not committed yet, so the
 * demo can't rely on the backend returning a DOB. This store keeps a DOB per
 * member in localStorage and overrides whatever the record carries, so setting
 * a student's birth date makes the under-13 (COPPA) consent gate fire
 * immediately — no backend round-trip. Swap these reads for the real member
 * field once Phase D ships.
 */
import { useCallback, useEffect, useState } from "react";
import { deriveAgeCategory } from "./consentModel";

const STORAGE_KEY = "devitrak.stagedStudentDob.v1";

const listeners = new Set();
let cache = null;

const read = () => {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
  } catch {
    cache = {};
  }
  return cache;
};

const write = (next) => {
  cache = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage disabled or over quota — keep the in-memory cache */
  }
  listeners.forEach((notify) => notify());
};

const subscribe = (cb) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/** Staged DOB (ISO string) for a member, or null. */
export const getStagedDob = (memberId) =>
  memberId != null ? read()[String(memberId)] ?? null : null;

/** Set (or, with a falsy value, clear) a member's staged DOB. */
export const setStagedDob = (memberId, dob) => {
  if (memberId == null) return;
  const next = { ...read() };
  if (dob) next[String(memberId)] = dob;
  else delete next[String(memberId)];
  write(next);
};

export const clearStagedDob = (memberId) => setStagedDob(memberId, null);

/** Wipe all staged DOBs — a clean slate before a demo run. */
export const resetStagedDob = () => write({});

/**
 * React hook: the effective date of birth for a member (staged DOB overrides
 * the record's own), plus a setter and the derived age category. Re-renders
 * when the staged DOB changes anywhere.
 */
export const useStudentDob = (member) => {
  const memberId = member?.member_id;
  const [staged, setStaged] = useState(() => getStagedDob(memberId));

  useEffect(() => {
    setStaged(getStagedDob(memberId));
    return subscribe(() => setStaged(getStagedDob(memberId)));
  }, [memberId]);

  const dob = staged ?? member?.date_of_birth ?? null;
  const setDob = useCallback((value) => setStagedDob(memberId, value), [memberId]);
  const clearDob = useCallback(() => clearStagedDob(memberId), [memberId]);
  const ageCategory = deriveAgeCategory({ ...(member || {}), date_of_birth: dob });

  return { dob, setDob, clearDob, ageCategory, isStaged: staged != null };
};
