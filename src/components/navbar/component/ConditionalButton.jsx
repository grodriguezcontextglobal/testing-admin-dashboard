import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import industries from "./industriesList.json";

const ConditionalButton = ({ user }) => {
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

  return (
    <NavLink
      key={conditionalInfo.title}
      to={`${conditionalInfo.route}`}
      style={{ display: conditionalInfo.title ? "block" : "none" }}
      state={conditionalInfo.state}
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
