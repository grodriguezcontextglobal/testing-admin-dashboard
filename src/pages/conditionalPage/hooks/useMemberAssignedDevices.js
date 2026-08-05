import { useQuery } from "@tanstack/react-query";
import { devitrakApi } from "../../../api/devitrakApi";
import { summarizeLoans } from "../../../components/UX/profile";

/**
 * Devices currently assigned to a member.
 *
 * The query key includes the member id. Without it, clicking from one student
 * to the next re-used the previous student's cached rows, so the profile
 * briefly showed the wrong person's devices — next to their guardian's contact
 * details. The header (stat tiles) and the table both call this hook; React
 * Query dedupes them into a single request.
 */
export const memberAssignedDevicesKey = (memberId) => [
  "memberAssignedDevices",
  String(memberId ?? ""),
];

/** Map an API row onto the shape getLoanStatus/summarizeLoans understand. */
export const pickMemberLoanDates = (row) => ({
  expectedReturnDate: row?.expected_return_date,
  returnedDate: row?.returned_date,
});

export function useMemberAssignedDevices(memberId, companyId) {
  const query = useQuery({
    queryKey: memberAssignedDevicesKey(memberId),
    queryFn: () =>
      devitrakApi.post("/db_member/retrieve-members-assigned-devices", {
        member_id: memberId,
        company_id: companyId,
        // History-preserving returns: closed leases stay in the DB, so ask for
        // the open ones only. Everything the profile summarises is a live loan.
        returned: 0,
      }),
    enabled: Boolean(memberId && companyId),
  });

  const rows = query.data?.data?.rows ?? [];

  return {
    ...query,
    rows,
    summary: summarizeLoans(rows, pickMemberLoanDates),
  };
}

export default useMemberAssignedDevices;
