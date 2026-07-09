import { LogOut } from "lucide-react";
import pkg from "prop-types";
import { NavLink, useLocation } from "react-router-dom";
import { hasPermission, resolveRoleType } from "../../../config/roles";
import { DevitrakLogo } from "../../icons/DevitrakLogo";
import { DevitrakName } from "../../icons/DevitrakName";
import ConditionalButton from "./ConditionalButton";
import "./MobileSidebarNav.css";

const { PropTypes } = pkg;

const MobileSidebarNav = ({ navItems, user, onLogout, onNavigate }) => {
  const location = useLocation();

  return (
    <div className="mobile-sidebar-nav" onClick={onNavigate}>
      <div className="mobile-sidebar-nav__header">
        <NavLink to={"/"} className="mobile-sidebar-nav__logo">
          <DevitrakLogo />
          <DevitrakName />
        </NavLink>
      </div>

      <nav className="mobile-sidebar-nav__body">
        <ul className="mobile-sidebar-nav__list">
          {navItems.map((item) => {
            if (!hasPermission(item.permission, resolveRoleType(user)) || !item.mobile) return null;

            if (item.route === 0) {
              return (
                <li key={item.title}>
                  <ConditionalButton user={user} icon={item.icon} variant="sidebar" />
                </li>
              );
            }

            const Icon = item.icon;
            const isActive = location.pathname === `${item.route}`;

            return (
              <li key={item.title}>
                <NavLink
                  to={item.route}
                  preventScrollReset
                  className={
                    isActive
                      ? "mobile-sidebar-nav__item mobile-sidebar-nav__item--active"
                      : "mobile-sidebar-nav__item"
                  }
                >
                  {Icon && <Icon className="mobile-sidebar-nav__icon" size={20} strokeWidth={2} />}
                  <span className="mobile-sidebar-nav__label">{item.title}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="mobile-sidebar-nav__footer">
        <button type="button" className="mobile-sidebar-nav__item mobile-sidebar-nav__logout" onClick={onLogout}>
          <LogOut className="mobile-sidebar-nav__icon" size={20} strokeWidth={2} />
          <span className="mobile-sidebar-nav__label">Log out</span>
        </button>
      </div>
    </div>
  );
};

export default MobileSidebarNav;

MobileSidebarNav.propTypes = {
  navItems: PropTypes.array.isRequired,
  user: PropTypes.object,
  onLogout: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
};
