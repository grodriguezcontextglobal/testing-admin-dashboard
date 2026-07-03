import { Icon } from "@iconify/react";
import { Grid } from "@mui/material";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Avatar, Typography } from "antd";
import { PropTypes } from "prop-types";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { devitrakApi } from "../../api/devitrakApi";
import DevitrakLoading from "../../components/animation/DevitrakLoading";
import dicRole from "../../components/general/dicRole";
import { RightNarrowInCircle } from "../../components/icons/RightNarrowInCircle";
import RefreshButton from "../../components/utils/UX/RefreshButton";
import BaseTable from "../../components/ux/tables/BaseTable";
import { onAddStaffProfile } from "../../store/slices/staffDetailSlide";
import "../../styles/global/ant-table.css";
import CenteringGrid from "../../styles/global/CenteringGrid";
import DownLoadReportButton from "./components/DownLoadReportButton";
import TableHeader from "../../components/UX/TableHeader";
import { buildStaffRows, filterStaffRows } from "./utils/staffTableUtils";

// Module-scope constants: no dependency on props/state, so they never need to
// be recreated per render (keeps the memoized columns stable).
const styling = {
  fontSize: "12px",
  fontFamily: "Inter",
  fontStyle: "normal",
  fontWeight: 400,
  lineHeight: "18px",
  textAlign: "left",
  textTransform: "capitalize",
  justifyContent: "flex-start",
  color: "var(--gray-600, #475467)",
};

const renderTernary = (props) => {
  if (typeof props === "string") return props;
  return props ? "Active" : "Inactive";
};

// Shared cell renderer for the "active"-style status pills (At event / Devices /
// Event status) — they were three byte-for-byte copies before.
const StatusPill = ({ active }) => {
  const isNegative = !active || active === "Pending";
  return (
    <span
      style={{
        borderRadius: "16px",
        justifyContent: "center",
        display: "flex",
        padding: "2px 8px",
        alignItems: "center",
        background: isNegative ? "#ffefef" : "var(--success-50, #ECFDF3)",
        width: "fit-content",
      }}
    >
      <Typography
        color={isNegative ? "#d31717" : "var(--success-700, #027A48)"}
        style={styling}
      >
        <Icon
          icon="tabler:point-filled"
          rotate={3}
          color={isNegative ? "#d31717" : "#12B76A"}
        />
        {renderTernary(active)}
      </Typography>
    </span>
  );
};
StatusPill.propTypes = { active: PropTypes.any };

const QUERY_KEY = "employeesPerCompanyList";

const MainAdminSettingPage = ({
  searchAdmin,
  modalState,
  deletingStaffMembers,
}) => {
  const { user } = useSelector((state) => state.admin);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const queryClient = useQueryClient();
  const companyId = user.companyData.id;

  // Single reactive query that resolves the company AND enriches every employee
  // in parallel. Replaces the old useState + useEffect + sequential for-loop.
  const employeesQuery = useQuery({
    queryKey: [QUERY_KEY, companyId],
    enabled: !!companyId,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const companyRes = await devitrakApi.post("/company/search-company", {
        _id: companyId,
      });
      const company = companyRes?.data?.company?.[0];
      const companyEmployees = company?.employees ?? [];

      // Parallelize the per-employee lookups instead of awaiting one at a time.
      const detailed = await Promise.all(
        companyEmployees.map(async (data) => {
          const base = {
            ...data,
            email: data.user,
            status: data.status === "Pending" ? data.status : data.active,
            companyData: company,
          };
          try {
            const individual = await devitrakApi.post("/staff/admin-users", {
              email: data.user,
            });
            return {
              ...base,
              adminUserInfo: individual?.data?.adminUsers?.[0] ?? null,
            };
          } catch {
            return { ...base, adminUserInfo: null };
          }
        }),
      );
      return detailed;
    },
  });

  // Instant refresh when a staff member is added/deleted upstream. Skip the
  // first render so we don't double-fetch on mount (react-query already fetches).
  const isFirstRun = useRef(true);
  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false;
      return;
    }
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY, companyId] });
  }, [modalState, deletingStaffMembers, companyId, queryClient]);

  const handleDetailStaff = useCallback(
    async (record) => {
      // Pending members have no admin user yet — guard so the click doesn't
      // throw on `adminUserInfo.id` (was the cause of "clicks do nothing").
      const adminId = record?.entireData?.adminUserInfo?.id;
      if (!adminId) return;
      try {
        const sqlStaff = await devitrakApi.post("/db_staff/consulting-member", {
          email: record.email,
        });
        const profile = sqlStaff.data.member.at(-1) ?? {};
        dispatch(onAddStaffProfile({ ...record.entireData, sql: profile }));
        return navigate(`/staff/${adminId}/main`);
      } catch {
        /* network/lookup failed — stay on the list */
      }
    },
    [dispatch, navigate],
  );

  // Build table rows once per data change (rows carry a precomputed search
  // haystack), then filter cheaply on each keystroke. See ./utils/staffTableUtils.
  const tableRows = useMemo(
    () => buildStaffRows(employeesQuery.data),
    [employeesQuery.data],
  );

  const filteredRows = useMemo(
    () => filterStaffRows(tableRows, searchAdmin),
    [tableRows, searchAdmin],
  );

  const columns = useMemo(
    () => [
      {
        title: "Name",
        dataIndex: "name",
        align: "left",
        width: "25%",
        sorter: { compare: (a, b) => ("" + a.name).localeCompare(b.name) },
        render: (name, record) => {
          const initials = String(name).split(" ");
          return (
            <span
              key={`${name}`}
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "flex-start",
                alignSelf: "flex-start",
              }}
            >
              <Avatar src={record?.entireData?.adminUserInfo?.imageProfile}>
                {!record?.entireData?.adminUserInfo?.imageProfile &&
                  initials.map((initial) => initial[0])}
              </Avatar>
              &nbsp;
              <div
                style={{
                  width: "70%",
                  flexDirection: "column",
                  justifyContent: "flex-start",
                }}
              >
                <Typography
                  style={{
                    justifyContent: "flex-start",
                    color: "var(--gray900, #101828)",
                    fontSize: "14px",
                    fontFamily: "Inter",
                    lineHeight: "20px",
                    fontWeight: 500,
                  }}
                >
                  {name}
                </Typography>
                <Typography style={styling}>
                  {record?.entireData?.adminUserInfo?.phone
                    ? record.entireData.adminUserInfo.phone
                    : "+1-000-000-0000"}
                </Typography>
              </div>
            </span>
          );
        },
      },
      {
        title: "Role",
        dataIndex: "role",
        width: "10%",
        responsive: ["lg"],
        editable: true,
        sorter: { compare: (a, b) => ("" + a.role).localeCompare(b.role) },
        render: (role) => (
          <Typography style={styling}>{dicRole[role]}</Typography>
        ),
      },
      {
        title: "At event",
        dataIndex: "active",
        width: "10%",
        responsive: ["lg"],
        editable: true,
        sorter: { compare: (a, b) => ("" + a.active).localeCompare(b.active) },
        render: (active) => <StatusPill active={active} />,
      },
      {
        title: "Devices",
        dataIndex: "active",
        width: "10%",
        responsive: ["lg"],
        editable: true,
        sorter: { compare: (a, b) => ("" + a.active).localeCompare(b.active) },
        render: (active) => <StatusPill active={active} />,
      },
      {
        title: "Event status",
        dataIndex: "active",
        width: "10%",
        responsive: ["lg"],
        editable: true,
        sorter: { compare: (a, b) => ("" + a.active).localeCompare(b.active) },
        render: (active) => <StatusPill active={active} />,
      },
      {
        title: "Email address",
        dataIndex: "email",
        width: "30%",
        responsive: ["lg"],
        sorter: { compare: (a, b) => ("" + a.email).localeCompare(b.email) },
      },
      {
        title: "",
        key: "action",
        align: "center",
        width: "5%",
        render: (_, record) =>
          record.active !== "Pending" ? (
            <Typography.Link
              onClick={(e) => {
                // Row-level onClick already handles navigation; stop the event
                // here so we don't fire handleDetailStaff twice.
                e.stopPropagation();
                handleDetailStaff(record);
              }}
            >
              <RightNarrowInCircle />
            </Typography.Link>
          ) : null,
      },
    ],
    [handleDetailStaff],
  );

  if (employeesQuery.isLoading) {
    return (
      <div style={CenteringGrid}>
        <DevitrakLoading />
      </div>
    );
  }

  return (
    <Grid margin={"15px 0 0 0"} padding={0} container>
      <TableHeader
        leftCta={<RefreshButton propsFn={() => employeesQuery.refetch()} />}
        rightCta={<DownLoadReportButton />}
      />
      <BaseTable
        enablePagination={true}
        style={{ width: "100%", cursor: "pointer" }}
        dataSource={filteredRows}
        columns={columns}
        rowClassName="editable-row"
        className="table-ant-customized"
        onRow={(record) => ({
          onClick: () =>
            record.active !== "Pending" && handleDetailStaff(record),
        })}
      />
    </Grid>
  );
};

MainAdminSettingPage.propTypes = {
  searchAdmin: PropTypes.string,
  modalState: PropTypes.bool,
  deletingStaffMembers: PropTypes.bool,
};
export default MainAdminSettingPage;
