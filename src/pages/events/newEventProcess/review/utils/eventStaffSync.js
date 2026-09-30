/**
 * Linking the event's staff to its SQL row, at the review step.
 *
 * Reported 2026-09-30: finishing a resumed draft failed with a 408, because
 * this step inserted again the staff the first attempt had already linked.
 * There is no endpoint that reads an event's SQL staff, so it cannot be checked
 * beforehand; instead the server's "already on the event" answer counts as
 * done, and the step goes on. Unchanged staff no longer stop the event.
 *
 * Underneath it, a second bug: the loop read `employeeStaff.entries()`, whose
 * keys are array indexes, and sent them as the email — staff were looked up by
 * `email: 0`, `email: 1`… MySQL compares a text column to 0 as true, so that
 * lookup most likely matched arbitrary staff, and the last one was linked.
 */

const normalizeEmail = (email) => `${email ?? ""}`.trim().toLowerCase();

/**
 * Everyone in adminUser and headsetAttendees, once each, keyed by email. A
 * person in both lists keeps the first (admin) role.
 */
export const staffToLink = (staff) => {
  const byEmail = new Map();
  for (const member of [...(staff?.adminUser ?? []), ...(staff?.headsetAttendees ?? [])]) {
    const email = normalizeEmail(member?.email);
    if (email && !byEmail.has(email)) byEmail.set(email, { ...member, email });
  }
  return [...byEmail.values()];
};

/** The server saying this staff member is already on the event. */
export const isAlreadyLinked = (error) => {
  const status = error?.response?.status;
  if (status === 408 || status === 409) return true;
  return /duplicate|already/i.test(`${error?.response?.data?.msg ?? ""}`);
};

/**
 * @param {{ api: {post: Function}, eventId: number|string, staff: object }} input
 * @returns {Promise<{ linked: string[], alreadyLinked: string[] }>}
 */
export const syncEventStaff = async ({ api, eventId, staff }) => {
  const linked = [];
  const alreadyLinked = [];

  for (const member of staffToLink(staff)) {
    const lookup = await api.post("/db_staff/consulting-member", { email: member.email });
    const existing = lookup?.data?.member ?? [];
    const staffId =
      existing.length > 0
        ? existing.at(-1).staff_id
        : (
            await api.post("/db_staff/new_member", {
              first_name: member.firstName,
              last_name: member.lastName,
              email: member.email,
              phone_number: "0000000000",
            })
          )?.data?.member?.insertId;

    try {
      await api.post("/db_event/event_staff", {
        event_id: eventId,
        staff_id: staffId,
        role: member.role,
      });
      linked.push(member.email);
    } catch (error) {
      if (!isAlreadyLinked(error)) throw error;
      alreadyLinked.push(member.email);
    }
  }

  return { linked, alreadyLinked };
};
