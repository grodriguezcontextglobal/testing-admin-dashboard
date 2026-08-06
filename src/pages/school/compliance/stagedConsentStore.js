/**
 * Staged (client-side) guardian-consent store for the school sales demo.
 *
 * Consent records are kept in localStorage and broadcast to subscribers so the
 * UI reacts immediately when consent is recorded — no backend round-trip. This
 * lets the consent gate work in a demo regardless of whether the server's
 * under-13 enforcement (Gustavo's Phase D) is deployed yet.
 *
 * The shape of a stored record matches POST /api/school/consent/record, so the
 * eventual real integration swaps this store's read/record calls for API calls
 * without touching consentModel.js or the consuming components.
 */
import { useCallback, useEffect, useState } from "react";
import {
  DEFAULT_CONSENT_METHOD,
  DEFAULT_ENFORCEMENT,
  DEFAULT_POLICY_TYPE,
  DEFAULT_POLICY_VERSION,
  deriveAgeCategory,
  evaluateAssignmentGate,
} from "./consentModel";

const STORAGE_KEY = "devitrak.stagedGuardianConsent.v1";

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

/** Recorded consent for a member, or null. Reference-stable until it changes. */
export const getStagedConsent = (memberId) =>
  memberId != null ? read()[String(memberId)] ?? null : null;

/** Record (stage) a guardian-consent event for a member. */
export const recordStagedConsent = ({
  member_id,
  signer_name,
  signer_email,
  policy_type = DEFAULT_POLICY_TYPE,
  policy_version = DEFAULT_POLICY_VERSION,
  method = DEFAULT_CONSENT_METHOD,
}) => {
  const record = {
    member_id: String(member_id),
    signer_name,
    signer_email,
    policy_type,
    policy_version: String(policy_version),
    method,
    recorded_at: new Date().toISOString(),
  };
  write({ ...read(), [String(member_id)]: record });
  return record;
};

/** Remove a member's staged consent (useful for resetting the demo). */
export const clearStagedConsent = (memberId) => {
  const next = { ...read() };
  delete next[String(memberId)];
  write(next);
};

/** Wipe all staged consent — a clean slate before a demo run. */
export const resetStagedConsent = () => write({});

/**
 * React hook: live consent state for a member.
 *
 * Returns the recorded consent (if any), the derived age category, the current
 * consent status, whether assignment is blocked and why, and helpers to record
 * or clear consent. Re-renders automatically when consent changes anywhere.
 */
export const useStudentConsent = (member, enforcement = DEFAULT_ENFORCEMENT) => {
  const memberId = member?.member_id;
  const [consentRecord, setConsentRecord] = useState(() =>
    getStagedConsent(memberId)
  );

  useEffect(() => {
    setConsentRecord(getStagedConsent(memberId));
    return subscribe(() => setConsentRecord(getStagedConsent(memberId)));
  }, [memberId]);

  const ageCategory = deriveAgeCategory(member || {});
  const gate = evaluateAssignmentGate(member || {}, consentRecord, enforcement);

  const recordConsent = useCallback(
    (fields) => recordStagedConsent({ member_id: memberId, ...fields }),
    [memberId]
  );
  const clearConsent = useCallback(
    () => clearStagedConsent(memberId),
    [memberId]
  );

  return {
    ageCategory,
    consentRecord,
    status: gate.status,
    blocked: gate.blocked,
    reason: gate.reason,
    recordConsent,
    clearConsent,
  };
};
