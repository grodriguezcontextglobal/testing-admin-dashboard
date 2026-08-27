/**
 * Deleting one member from their own page.
 *
 * The bulk modal (components/modals/DeleteMember.jsx) already does this for a
 * selection off the table. This is the same write for the member you are
 * looking at, plus the one question the bulk modal never asks: whether they are
 * still holding anything.
 */

const text = (value) => String(value ?? "").trim();

/** The member's display name, for the confirmation and the audit row. */
export const memberLabel = (member) => {
  const name = [member?.first_name, member?.last_name]
    .map((part) => text(part))
    .filter(Boolean)
    .join(" ");
  return name || text(member?.email) || `member ${member?.member_id ?? ""}`.trim();
};

/**
 * Whether the member can be removed.
 *
 * A member still holding devices cannot: deleting them leaves the assignment
 * pointing at nobody, and the device is out with a person the system no longer
 * knows. Check the devices in first — or charge for them, which is what
 * `member:charge_fee` is for.
 *
 * `out` is read from the same summary the page's stat tiles use, so what the
 * button does and what the tiles say cannot disagree.
 */
export const deleteMemberEligibility = (deviceSummary) => {
  /* `Number(null)` is 0, so an unresolved summary would read as "nothing
     assigned" and let a member holding devices be deleted. Absent is absent. */
  const raw = deviceSummary?.out;
  const out =
    raw === null || raw === undefined || raw === "" ? Number.NaN : Number(raw);

  if (!Number.isFinite(out)) {
    // The summary has not resolved yet. Not a refusal — just not answerable.
    return { deletable: false, reason: "unknown", detail: "Checking assigned devices…" };
  }

  if (out > 0) {
    const overdue = Number(deviceSummary?.overdue) || 0;
    return {
      deletable: false,
      reason: "holding-devices",
      detail: `${out} device${out === 1 ? "" : "s"} still assigned${
        overdue > 0 ? `, ${overdue} overdue` : ""
      }. Check them in before removing the record.`,
    };
  }

  return { deletable: true, reason: null, detail: null };
};

/**
 * Body for POST /api/db_member/delete-member-info.
 *
 * `member_ids` as an array, which is what the bulk modal sends — the endpoint
 * also documents `ids` and `member_id`, and sending one shape everywhere is
 * worth more than sending the singular one here.
 */
export const buildDeleteMemberPayload = ({ memberId, companyId }) => ({
  member_ids: [memberId],
  company_id: companyId,
});

/** What the confirmation says will happen, in the member's own terms. */
export const describeDeleteConsequence = (member) =>
  `${memberLabel(
    member
  )} and their assignment history leave this company's records. This cannot be undone.`;

/**
 * The audit row, in the shape POST /api/admin/activity-logs takes and matching
 * what the bulk modal writes — an uppercase verb and a capitalised model.
 */
export const buildDeleteMemberAuditEntry = (member) => ({
  action: "DELETE",
  target_model: "Member",
  target_id: member?.member_id,
  details: {
    reason: "deleted_from_member_page",
    name: memberLabel(member),
    email: text(member?.email) || null,
    grade: text(member?.grade) || null,
  },
});
