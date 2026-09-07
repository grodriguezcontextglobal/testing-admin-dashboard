import { Tooltip } from "antd";
import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "./themeContext";

/**
 * The colour-scheme control, in the navbar beside Profile.
 *
 * One button that walks light → dark → system, rather than three. The icon
 * shows the mode that is **currently chosen**, not the next one: a control
 * whose icon predicts the future reads as broken the first time someone
 * glances at it to find out where they are.
 *
 * `system` gets its own icon rather than borrowing sun or moon, because it is
 * a different answer — "follow the machine" — and not a third palette. The
 * tooltip names what it resolved to, which is the only way to tell a system
 * dark from an explicit dark.
 */
const ICON = {
  light: Sun,
  dark: Moon,
  system: Monitor,
};

const LABEL = {
  light: "Light",
  dark: "Dark",
  system: "System",
};

const ThemeToggle = () => {
  const { mode, resolved, cycle } = useTheme();
  const Icon = ICON[mode] ?? Sun;

  return (
    <Tooltip
      title={
        mode === "system"
          ? `Theme: following your system (${resolved})`
          : `Theme: ${LABEL[mode]}`
      }
      placement="bottom"
    >
      <button
        onClick={cycle}
        aria-label={`Theme: ${LABEL[mode] ?? "Light"}. Change it.`}
        style={{
          border: "none",
          outline: "none",
          backgroundColor: "transparent",
          display: "flex",
          cursor: "pointer",
        }}
        type="button"
      >
        <div className="content-main-navbar-updated">
          <article className="nav-item-base-1-main-navbar-updated">
            <div className="content-2-main-navbar-updated">
              <div className="text-1-main-navbar-updated text-mdsemibold">
                <Icon
                  size={22}
                  strokeWidth={1.8}
                  /* currentColor, so the icon follows the navbar's own text
                     colour in both schemes instead of pinning a hex. */
                  color="currentColor"
                  aria-hidden="true"
                />
              </div>
            </div>
          </article>
        </div>
      </button>
    </Tooltip>
  );
};

export default ThemeToggle;
