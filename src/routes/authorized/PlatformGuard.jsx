import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import { PLATFORM_CONSOLE_MOCK } from "../../config/featureFlags";
import { hasPlatformAccess } from "../../config/roles";

/**
 * Admin Console routes (/platform): only users the server marked
 * `platformAccess: true`. Everyone else goes home. The server checks again on
 * every /api/platform request; this only keeps the screens out of sight.
 *
 * The dev-server demo mode (PLATFORM_CONSOLE_MOCK) opens it without the
 * server's answer: there is no server behind it, only sample data.
 */
const PlatformGuard = () => {
  const { user } = useSelector((state) => state.admin);
  return PLATFORM_CONSOLE_MOCK || hasPlatformAccess(user) ? <Outlet /> : <Navigate to="/" replace />;
};

export default PlatformGuard;
