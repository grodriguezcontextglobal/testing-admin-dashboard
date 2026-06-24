import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { hasPermission, resolveRoleType } from "../../config/roles";

const PermissionGuard = ({ action }) => {
  const { user } = useSelector((state) => state.admin);
  return hasPermission(action, resolveRoleType(user))
    ? <Outlet />
    : <Navigate to="/" replace />;
};

export default PermissionGuard;
