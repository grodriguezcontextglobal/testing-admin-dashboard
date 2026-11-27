import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";
import PlatformNoAccess from "../../pages/platform/PlatformNoAccess";
import { isConsoleHost } from "../../config/consoleHosts";
import { PLATFORM_CONSOLE_DEV_BYPASS } from "../../config/featureFlags";
import { hasPlatformAccess } from "../../config/roles";
import { usePlatformMe } from "../../hooks/platform/usePlatformMe";
import {
  GATE_ALLOW,
  GATE_REFUSE,
  platformGateVerdict,
} from "../../pages/platform/utils/platformGate";

/**
 * What the console shows while it is asking the server who this is.
 *
 * It is a whole screen rather than a skeleton of the console because the
 * answer may be "no", and a half-drawn console that then disappears reads as a
 * fault. It is also the reason the wait is kept short: the answer is cached
 * per session, so this is seen on the first console load and not between
 * screens.
 */
const CheckingAccess = () => (
  <main
    aria-busy="true"
    style={{
      minHeight: "100dvh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      boxSizing: "border-box",
      background: "var(--gray-50, #f8f9fb)",
      fontFamily: "Inter, sans-serif",
      fontSize: "14px",
      color: "var(--gray600, #475467)",
    }}
  >
    Checking console access…
  </main>
);

/**
 * Admin Console routes (/platform): only users the server marks
 * `platformAccess: true` on GET /api/platform/me, asked now.
 *
 * It used to read that field out of the sign-in response and nothing else.
 * That was the screens' own copy of the answer, taken once and never
 * refreshed — and redux-persist writes the store to localStorage, so the copy
 * outlived the tab. An operator whose access was revoked kept seeing console
 * screens until they signed out, not merely until they reloaded. Nothing
 * leaked, because the server refuses every /api/platform request on its own
 * five checks, but what that person saw first was an error rather than a
 * refusal that explains itself. The route to ask was built for us on 2026-11-19
 * and went uncalled for six days.
 *
 * The sign-in field is now a hint, and it can only refuse: a hint of "no"
 * skips the request entirely, because the server would refuse it too.
 * utils/platformGate.js holds the rest of the reasoning, including why a 500
 * is not a refusal.
 *
 * PLATFORM_CONSOLE_DEV_BYPASS opens it without asking anyone, and is false in
 * every build by construction. Note it is NOT the sample-data flag: a deployed
 * build can serve sample data and still require the gate, which is the whole
 * reason those two were separated.
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
  const hint = hasPlatformAccess(user);
  const me = usePlatformMe({ enabled: hint && !PLATFORM_CONSOLE_DEV_BYPASS });

  const verdict = PLATFORM_CONSOLE_DEV_BYPASS
    ? GATE_ALLOW
    : platformGateVerdict({ hint, data: me.body, error: me.error });

  if (verdict === GATE_ALLOW) return <Outlet />;

  if (verdict === GATE_REFUSE) {
    if (isConsoleHost(window.location.hostname)) {
      return <PlatformNoAccess />;
    }
    return <Navigate to="/" replace />;
  }

  return <CheckingAccess />;
};

export default PlatformGuard;
