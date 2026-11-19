import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import PlatformNoAccess from "../../pages/platform/PlatformNoAccess";
import { isConsoleHost } from "../../config/consoleHosts";
import { PLATFORM_CONSOLE_DEV_BYPASS } from "../../config/featureFlags";
import { hasPlatformAccess } from "../../config/roles";

/**
 * Admin Console routes (/platform): only users the server marked
 * `platformAccess: true`. The server checks again on every /api/platform
 * request; this only keeps the screens out of sight.
 *
 * PLATFORM_CONSOLE_DEV_BYPASS opens it without the server's answer, and is
 * false in every build by construction. Note it is NOT the sample-data flag:
 * a deployed build can serve sample data and still require the gate, which is
 * the whole reason those two were separated.
 *
 * Where a refusal goes depends on the host.
 *
 * On the console host it goes nowhere: it renders PlatformNoAccess, in place.
 * It used to leave for the dashboard host, which is a different origin with
 * its own session, so the person landed on a login screen with no explanation
 * — measured on 2026-11-19 with an account that correctly has no console
 * access, and reported as "the console does not open". A refusal that cannot
 * be read is indistinguishable from a broken site, and since every load of
 * this host passes through here (config/consoleHosts.js, shouldLandOnConsole),
 * it was the only thing such an account could see.
 *
 * Staying put is also what makes a loop impossible: the page navigates
 * nowhere, so neither the IIS rule for "/" nor shouldLandOnConsole can fire.
 *
 * On the dashboard host there is nothing to explain — the console is simply
 * not this person's screen — so they go home.
 */
const PlatformGuard = () => {
  const { user } = useSelector((state) => state.admin);

  if (PLATFORM_CONSOLE_DEV_BYPASS || hasPlatformAccess(user)) return <Outlet />;

  if (isConsoleHost(window.location.hostname)) {
    return <PlatformNoAccess />;
  }

  return <Navigate to="/" replace />;
};

export default PlatformGuard;
