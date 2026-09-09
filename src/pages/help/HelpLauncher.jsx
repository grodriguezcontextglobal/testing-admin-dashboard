import { Tooltip } from "antd";
import { Info } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePermission } from "../../hooks/usePermission";
import { MANUAL_SECTIONS } from "./content";
import { articleForRoute } from "./utils/manual";
import "./helpLauncher.css";

/**
 * The manual, one click away from wherever you are.
 *
 * It started as a nav item next to Inventory and Events, which was wrong twice:
 * it spent a slot in the primary navigation on something nobody navigates to on
 * purpose, and it could only ever open the front of the manual. Pinned to the
 * edge of the screen it costs no navigation, and — because it knows the route
 * you are on — it opens the article about the screen in front of you.
 *
 * Not rendered on the manual itself, where it would point at the page you are
 * already reading.
 */
const HelpLauncher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const canRead = usePermission("nav:help");

  const onTheManual = location.pathname.startsWith("/help");
  if (!canRead || onTheManual) return null;

  const contextual = articleForRoute(MANUAL_SECTIONS, location.pathname);
  const label = contextual
    ? `User manual — ${contextual.title}`
    : "User manual";

  return (
    <Tooltip title={label} placement="left">
      <button
        type="button"
        className="help-launcher"
        aria-label={label}
        onClick={() => navigate(contextual ? `/help/${contextual.id}` : "/help")}
      >
        <Info width={22} height={22} aria-hidden="true" />
      </button>
    </Tooltip>
  );
};

export default HelpLauncher;
