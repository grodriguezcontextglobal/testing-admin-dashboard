import PropTypes from "prop-types";
import { NavLink } from "react-router-dom";
import "./profileShell.css";

/**
 * Profile section navigation.
 *
 * Items are places, never actions — an item labelled with a verb ("Assign
 * devices") belongs in the identity card's action rail instead, because a
 * one-shot action in a nav bar makes people believe they've arrived somewhere.
 * The label is what decides it: a page you can come back to earns a noun and a
 * tab ("Reminders"), the act of sending one stays a verb and a button.
 *
 * Two modes, one look:
 *   - `to` on an item renders a NavLink (the member profile has real routes)
 *   - otherwise it renders a button driven by `activeKey` / `onSelect`
 */
const ProfileTabs = ({ items, activeKey, onSelect, ariaLabel, testId }) => {
  const visible = (items ?? []).filter(Boolean);
  if (visible.length === 0) return null;

  return (
    <nav className="profile-tabs" aria-label={ariaLabel} data-testid={testId}>
      {visible.map((item) =>
        item.to ? (
          <NavLink
            key={item.key ?? item.to}
            to={item.to}
            end={item.end}
            className="profile-tabs__item"
          >
            {item.label}
          </NavLink>
        ) : (
          <button
            key={item.key}
            type="button"
            className={`profile-tabs__item${item.key === activeKey ? " is-active" : ""}`}
            aria-current={item.key === activeKey ? "page" : undefined}
            onClick={() => onSelect?.(item.key)}
          >
            {item.label}
          </button>
        )
      )}
    </nav>
  );
};

ProfileTabs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string,
      label: PropTypes.node.isRequired,
      to: PropTypes.string,
      end: PropTypes.bool,
    })
  ),
  activeKey: PropTypes.string,
  onSelect: PropTypes.func,
  ariaLabel: PropTypes.string,
  testId: PropTypes.string,
};

ProfileTabs.defaultProps = {
  items: [],
  activeKey: null,
  onSelect: null,
  ariaLabel: "Profile sections",
  testId: "profile-tabs",
};

export default ProfileTabs;
