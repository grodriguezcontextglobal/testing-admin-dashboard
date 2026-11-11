import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { hasPlatformAccess } from "../../config/roles";

/**
 * Admin Console routes (/platform): only users the server marked
 * `platformAccess: true`. Everyone else goes home. The server checks again on
 * every /api/platform request; this only keeps the screens out of sight.
 */
const PlatformGuard = () => {
  const { user } = useSelector((state) => state.admin);
  return hasPlatformAccess(user) ? <Outlet /> : <Navigate to="/" replace />;
};

export default PlatformGuard;
