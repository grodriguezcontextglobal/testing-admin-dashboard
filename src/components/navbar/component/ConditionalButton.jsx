import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Icon as IconifyIcon } from "@iconify/react";
import industries from "./industriesList.json";
import { getIndustryProfile } from "../../../config/industryProfiles";

const ConditionalButton = ({ user, icon: Icon, variant = "desktop" }) => {
  const location = useLocation();
  const [conditionalInfo, setConditionalInfo] = useState({
    title: null,
    route: null,
  });

  useEffect(() => {
    if (!user?.companyData?.industry) {
      setConditionalInfo({
        title: null,
        route: null,
      });
      return;
    }

    const industry = String(user.companyData.industry);
    if (industries[industry]) {
      const representative = industries[industry][0];
      setConditionalInfo({
        title: representative,
        route: `/members`,
        state: {
          referencing: representative.toLowerCase(),
        },
      });
    } else {
      console.warn(`Industry "${industry}" not found in industries list`);
      setConditionalInfo({
        title: null,
        route: null,
      });
    }
  }, [user?.companyData?.industry]);

  const isActive = location.pathname === `${conditionalInfo.route}`;

  if (variant === "sidebar") {
    return (
      <NavLink
        to={`${conditionalInfo.route}`}
        style={{ display: conditionalInfo.title ? "flex" : "none" }}
        state={conditionalInfo.state}
        preventScrollReset
        className={
          isActive
            ? "mobile-sidebar-nav__item mobile-sidebar-nav__item--active"
            : "mobile-sidebar-nav__item"
        }
      >
        {Icon && <Icon className="mobile-sidebar-nav__icon" size={20} strokeWidth={2} />}
        <span className="mobile-sidebar-nav__label">{conditionalInfo.title}</span>
      </NavLink>
    );
  }

  return (
    <NavLink
      to={`${conditionalInfo.route}`}
      style={{ display: conditionalInfo.title ? "block" : "none" }}
      state={conditionalInfo.state}
      preventScrollReset
    >
      <div className="content-main-navbar-updated">
        <article
          className={
            isActive
              ? "nav-item-base-main-navbar-updated"
              : "nav-item-base-1-main-navbar-updated"
          }
        >
          <div className="content-2-main-navbar-updated">
            <div className="text-1-main-navbar-updated text-mdsemibold">
              <p
                style={{
                  textTransform: "capitalize",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <IconifyIcon
                  icon={getIndustryProfile(user?.companyData?.industry).icon}
                  width={18}
                  height={18}
                />
                {conditionalInfo.title}
              </p>
            </div>
          </div>
        </article>
      </div>
    </NavLink>
  );
};

export default ConditionalButton;
