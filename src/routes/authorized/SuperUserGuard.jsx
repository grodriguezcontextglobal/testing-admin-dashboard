import { Navigate, Outlet } from "react-router";
import { useStaffRoleAndLocations } from "../../utils/checkStaffRoleAndLocations";

// Gates platform-observability routes (job queue stats/lookup) behind the
// employee-level `super_user` flag — narrower than PermissionGuard's roleType
// matrix, which has no concept of this flag. See FRONTEND_task_queue_changes.md
// §8.2: only intended for the company's own super_user (root_admin/founder)
// today, not a true cross-company platform flag — the backend has no such
// concept exposed to the frontend yet.
const SuperUserGuard = () => {
  const { isSuperUser } = useStaffRoleAndLocations();
  return isSuperUser ? <Outlet /> : <Navigate to="/" replace />;
};

export default SuperUserGuard;
