/**
 * Whether the liability/assignment email may be declined for a member.
 *
 * COPPA: a device handed to a member under 13 always notifies the guardian, so
 * staff cannot opt out. Being a minor is deliberately NOT enough — a 13-17
 * year old keeps the email optional, which is the distinction the assignment
 * screen has to honour.
 *
 * `under_13` arrives from the server (derived from date_of_birth) and shows up
 * as 1/0, "1"/"0", or true/false depending on the path, so it is coerced.
 * A missing value means "not known to be under 13" and stays optional — the
 * age gates elsewhere are what block an assignment with no DOB.
 */
export const isContractEmailRequired = (member) =>
  Boolean(Number(member?.under_13));

/**
 * The email actually goes out when staff asked for it OR policy demands it.
 * Kept as one expression so the screen and any future caller can't disagree
 * about which of the two wins.
 */
export const shouldSendContractEmail = (member, staffOptedIn) =>
  Boolean(staffOptedIn) || isContractEmailRequired(member);

export default shouldSendContractEmail;
