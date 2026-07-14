import { useMemo } from "react";
import { useSelector } from "react-redux";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@iconify/react";
import { devitrakApi } from "../../../api/devitrakApi";

/**
 * Untitled UI stat tiles for the members (Students) page:
 * total members · minors (flagging missing representatives) · devices out ·
 * overdue. Shares query keys with the tables below so counts stay in sync.
 */
const tileStyle = {
  flex: "1 1 180px",
  minWidth: 0,
  background: "var(--base-white, #fff)",
  border: "1px solid var(--gray-200, #ddded6)",
  borderRadius: "var(--radius-xl, 12px)",
  boxShadow: "var(--shadow-xs)",
  padding: "16px 20px",
  textAlign: "left",
};

const labelStyle = {
  margin: 0,
  fontFamily: "Inter, sans-serif",
  fontSize: "13px",
  fontWeight: 500,
  color: "var(--gray-600, #5d615a)",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const valueStyle = {
  margin: "6px 0 0",
  fontFamily: "Inter, sans-serif",
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: 600,
  color: "var(--gray-900, #171d1a)",
};

const captionStyle = {
  margin: "2px 0 0",
  fontFamily: "Inter, sans-serif",
  fontSize: "12px",
  color: "var(--gray-500, #777b73)",
};

const MembersStatsRow = ({ audienceLabel = "members" }) => {
  const { user } = useSelector((state) => state.admin);
  const companyId = user?.sqlInfo?.company_id;

  const membersQuery = useQuery({
    queryKey: ["membersInfoQuery"],
    queryFn: () =>
      devitrakApi.post("/db_member/consulting-member", { company_id: companyId }),
    enabled: !!companyId,
  });
  const outstandingQuery = useQuery({
    queryKey: ["outstandingLeasesCount", companyId],
    queryFn: () =>
      devitrakApi.post("/db_member/retrieve-members-assigned-devices", {
        company_id: companyId,
        returned: 0,
      }),
    enabled: !!companyId,
  });
  const overdueQuery = useQuery({
    queryKey: ["overdueLeasesQuery", companyId],
    queryFn: () =>
      devitrakApi.post("/db_member/overdue-leases", { company_id: companyId }),
    enabled: !!companyId,
  });

  const members = membersQuery?.data?.data?.members || [];
  const { minors, minorsMissingRep } = useMemo(() => {
    const m = members.filter((x) => Number(x.minor) === 1);
    return {
      minors: m.length,
      minorsMissingRep: m.filter(
        (x) => !x.parent_guardian_email || !String(x.parent_guardian_email).trim()
      ).length,
    };
  }, [members]);

  const outstanding = outstandingQuery?.data?.data?.rows?.length ?? 0;
  const overdue = overdueQuery?.data?.data?.count ?? 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        width: "100%",
        margin: "0 0 16px",
      }}
    >
      <div style={tileStyle}>
        <p style={labelStyle}>
          <Icon icon="tabler:users" width={16} /> Total {audienceLabel}
        </p>
        <p style={valueStyle}>{members.length}</p>
      </div>
      <div style={tileStyle}>
        <p style={labelStyle}>
          <Icon icon="tabler:shield-check" width={16} /> Minors
        </p>
        <p style={valueStyle}>{minors}</p>
        <p
          style={{
            ...captionStyle,
            color:
              minorsMissingRep > 0
                ? "var(--error-600, #b8452a)"
                : "var(--success-600, #079455)",
            fontWeight: minorsMissingRep > 0 ? 600 : 400,
          }}
        >
          {minorsMissingRep > 0
            ? `${minorsMissingRep} missing a representative`
            : "all have representatives"}
        </p>
      </div>
      <div style={tileStyle}>
        <p style={labelStyle}>
          <Icon icon="tabler:device-laptop" width={16} /> Devices out
        </p>
        <p style={valueStyle}>{outstanding}</p>
      </div>
      <div style={tileStyle}>
        <p style={labelStyle}>
          <Icon icon="tabler:alarm" width={16} /> Overdue
        </p>
        <p
          style={{
            ...valueStyle,
            color:
              overdue > 0 ? "var(--error-600, #b8452a)" : "var(--gray-900, #171d1a)",
          }}
        >
          {overdue}
        </p>
        {overdue > 0 && <p style={captionStyle}>see the Overdue devices tab</p>}
      </div>
    </div>
  );
};

export default MembersStatsRow;
