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

const StaffActivityMainPage = () => {
  const { user } = useSelector((state) => state.admin);
  const viewerRoleType = resolveRoleType(user);
  const viewerId = user?.id ?? user?.uid;
  const [filters, setFilters] = useState({ staffMemberId: undefined, action: undefined });

  const employeesQuery = useQuery({
    queryKey: ["employeesPerCompanyList"],
    queryFn: () =>
      devitrakApi.post("/company/search-company", { _id: user.companyData.id }),
    enabled: !!user?.companyData?.id,
  });

  const activityLogQuery = useQuery({
    queryKey: ["staffActivityLogs", filters.staffMemberId, filters.action],
    queryFn: () =>
      devitrakApiAdmin.get("/activity-logs", {
        params: {
          staff_member_id: filters.staffMemberId,
          action: filters.action,
          limit: 50,
          page: 1,
        },
      }),
    enabled: !!user?.companyData?.id,
  });

  const staffOptions = useMemo(() => {
    const employees = employeesQuery.data?.data?.company?.[0]?.employees ?? [];
    return buildStaffFilterOptions(employees, viewerRoleType, viewerId);
  }, [employeesQuery.data, viewerRoleType, viewerId]);

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
      <Header staffOptions={staffOptions} filters={filters} onFiltersChange={setFilters} />
      <Divider />
      <Body sortData={sortData} />
      <Divider />
    </Grid>
  );
};

export default StaffActivityMainPage;
