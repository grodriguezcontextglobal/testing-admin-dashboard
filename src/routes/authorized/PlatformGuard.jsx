import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { PLATFORM_CONSOLE_DEV_BYPASS } from "../../config/featureFlags";
import { hasPlatformAccess } from "../../config/roles";

/**
 * Admin Console routes (/platform): only users the server marked
 * `platformAccess: true`. Everyone else goes home. The server checks again on
 * every /api/platform request; this only keeps the screens out of sight.
 *
 * PLATFORM_CONSOLE_DEV_BYPASS opens it without the server's answer, and is
 * false in every build by construction. Note it is NOT the sample-data flag:
 * a deployed build can serve sample data and still require the gate, which is
 * the whole reason those two were separated.
 */
const PlatformGuard = () => {
  const { user } = useSelector((state) => state.admin);
  return PLATFORM_CONSOLE_DEV_BYPASS || hasPlatformAccess(user) ? (
    <Outlet />
  ) : (
    <Navigate to="/" replace />
  );
};

export default PlatformGuard;
