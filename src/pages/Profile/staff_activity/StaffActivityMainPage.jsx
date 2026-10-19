import { Grid } from "@mui/material";
import { Divider } from "antd";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi, devitrakApiAdmin } from "../../../api/devitrakApi";
import { resolveRoleType } from "../../../config/roles";
import Header from "./components/Header";
import Body from "./components/Body";
import {
  buildStaffFilterOptions,
  filterLogsByHierarchy,
  mapLogToListItem,
} from "./utils/staffActivityLogUtils";

const PAGE_SIZE = 50;

const StaffActivityMainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const viewerRoleType = resolveRoleType(user);
  const viewerId = user?.id ?? user?.uid;
  const [filters, setFilters] = useState({ staffMemberId: undefined, action: undefined });
  const [page, setPage] = useState(1);

  const employeesQuery = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user.companyData.id }),
    enabled: !!user?.companyData?.id,
  });

  /* The page is asked of the server, not sliced out of one fixed batch: the
     endpoint answers `total` and `totalPages`, and this screen used to ask for
     page 1 and nothing else — so with 96 entries the older half could not be
     reached at all. */
  const activityLogQuery = useQuery({
    queryKey: ["staffActivityLogs", filters.staffMemberId, filters.action, page],
    queryFn: () =>
      devitrakApiAdmin.get("/activity-logs", {
        params: {
          staff_member_id: filters.staffMemberId,
          action: filters.action,
          limit: PAGE_SIZE,
          page,
        },
      }),
    enabled: !!user?.companyData?.id,
    keepPreviousData: true,
  });

  /* Back to the first page whenever the filters change: page 4 of the old
     result is rarely a page of the new one. */
  const changeFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  const staffOptions = useMemo(() => {
    const employees = employeesQuery.data?.data?.company?.[0]?.employees ?? [];
    return buildStaffFilterOptions(employees, viewerRoleType, viewerId);
  }, [employeesQuery.data, viewerRoleType, viewerId]);

  /* Cache clears used to be filtered here; the server leaves them out of the
     report since dbcd4f5 (in production since 2026-10-16). */
  const sortData = useMemo(() => {
    const logs = activityLogQuery.data?.data?.logs ?? [];
    return filterLogsByHierarchy(logs, viewerRoleType, viewerId).map(mapLogToListItem);
  }, [activityLogQuery.data, viewerRoleType, viewerId]);

  return (
    <Grid
      style={{
        padding: "5px",
        display: "flex",
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
      }}
      container
    >
      <Header staffOptions={staffOptions} filters={filters} onFiltersChange={changeFilters} />
      <Divider />
      <Body
        sortData={sortData}
        pagination={{
          position: "bottom",
          align: "center",
          current: page,
          pageSize: PAGE_SIZE,
          total: activityLogQuery.data?.data?.total ?? sortData.length,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
      <Divider />
    </Grid>
  );
};

export default StaffActivityMainPage;
