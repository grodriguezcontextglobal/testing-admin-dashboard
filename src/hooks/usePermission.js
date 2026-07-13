import { useSelector } from "react-redux";
import { hasPermission, resolveRoleType } from "../config/roles";

export const usePermission = (action) => {
  const { user } = useSelector((state) => state.admin);
  return hasPermission(action, resolveRoleType(user));
};
