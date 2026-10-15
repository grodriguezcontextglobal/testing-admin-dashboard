import { isMinorMember } from "./ageCalculationUtils";

/**
 * The email a member is registered under as an event consumer.
 *
 * Consumers are looked up and created by email (`/auth/user-query`,
 * `/auth/new`), so a member without one could not be put on an event. For a
 * minor registered with only a guardian email (2026-10-15, decided by
 * Gustavo): the guardian's address tagged with the member id,
 * `maria+m1234@gmail.com`.
 * - Unique per child, so two siblings with the same guardian stay two
 *   consumers. The plain guardian address would merge the second into the
 *   first, and the second child would never show on the event.
 * - Mail sent to the consumer still reaches the guardian's inbox with the
 *   providers that support plus addressing (Gmail, Outlook, iCloud).
 *
 * This is only the consumer's key. Who is *asked* to confirm does not change:
 * getConfirmationRecipient still answers the plain guardian address.
 *
 * @param {object|undefined} member
 * @returns {string|null} null when there is nothing safe to build it from
 */
export const consumerEmailFor = (member) => {
  const own = `${member?.email ?? ""}`.trim();
  if (own) return own;
  if (!isMinorMember(member)) return null;

  const guardian = `${member?.parent_guardian_email ?? ""}`.trim();
  const id = `${member?.member_id ?? ""}`.trim();
  const at = guardian.lastIndexOf("@");
  if (at < 1 || at === guardian.length - 1 || !/^[A-Za-z0-9]+$/.test(id)) return null;

  return `${guardian.slice(0, at)}+m${id}${guardian.slice(at)}`;
};
