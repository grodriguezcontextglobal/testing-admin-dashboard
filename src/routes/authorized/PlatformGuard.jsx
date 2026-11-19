import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import ExternalRedirect from "../../components/utils/ExternalRedirect";
import { dashboardUrl, isConsoleHost } from "../../config/consoleHosts";
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
 *
 * Where a refusal goes depends on the host. On the console host, "/" is sent
 * straight back to /platform by IIS (public/web.config), so navigating there
 * would bounce on every reload; the person is taken off the host instead, to
 * the dashboard, which is where someone without console access belongs.
 */
const PlatformGuard = () => {
  const { user } = useSelector((state) => state.admin);

  if (PLATFORM_CONSOLE_DEV_BYPASS || hasPlatformAccess(user)) return <Outlet />;

  if (isConsoleHost(window.location.hostname)) {
    return <ExternalRedirect to={dashboardUrl("/")} />;
  }

  return <Navigate to="/" replace />;
};

export default PlatformGuard;
