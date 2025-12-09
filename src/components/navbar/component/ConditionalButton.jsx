import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";

const ConditionalButton = ({ user }) => {
  const [conditionalInfo, setConditionalInfo] = useState({
    title: null,
    route: null,
  });
  useEffect(() => {
    switch (String(user.companyData.industry).toLowerCase()) {
      case "software":
        return setConditionalInfo({
          title: "Software",
          route: `members`,
        });
      case "education":
        return setConditionalInfo({
          title: "Students",
          route: `/members`,
        });
      case "professional services":
        return setConditionalInfo({
          title: "Professional Service",
          route: `/members`,
        });
      case "healthcare and social assistance":
        return setConditionalInfo({
          title: "Patiences",
          route: `/members`,
        });
      default:
        return setConditionalInfo({
          title: null,
          route: null,
        });
    }
  }, []);

  return (
    <NavLink
      key={conditionalInfo.title}
      to={`${conditionalInfo.route}`}
      style={{ display: conditionalInfo.title ? "block" : "none" }}
      preventScrollReset
    >
      <div className="content-main-navbar-updated">
        <article
          className={
            location.pathname === `${conditionalInfo.route}`
              ? "nav-item-base-main-navbar-updated"
              : "nav-item-base-1-main-navbar-updated"
          }
        >
          <div className="content-2-main-navbar-updated">
            <div className="text-1-main-navbar-updated text-mdsemibold">
              <p style={{ textTransform: "capitalize" }}>
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
