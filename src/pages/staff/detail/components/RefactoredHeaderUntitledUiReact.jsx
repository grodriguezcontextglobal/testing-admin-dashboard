import { Icon } from "@iconify/react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar } from "antd";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import "./RefactoredHeaderUntitledUiReact.css";

const ROLE_LABEL = {
  "0": "Root Admin",
  "1": "Admin",
  "2": "User",
};

const RefactoredHeaderUntitledUiReact = ({ actions }) => {
  const isMobile = useMediaQuery("only screen and (max-width: 768px)");
  const { profile } = useSelector((state) => state.staffDetail);
  const info = profile.adminUserInfo || {};

  const initials =
    info.name?.at(0) && info.lastName?.at(0)
      ? `${info.name.at(0)}${info.lastName.at(0)}`
      : info.name?.at(0) ?? "";

  return (
    <div className="main-header-container">
      <div className="main-header-content">

        {/* Avatar + name/role */}
        <div className="main-header-left">
          <Avatar size={isMobile ? 48 : 80} src={info.imageProfile} shape="circle">
            {initials}
          </Avatar>
          <div className="main-header-info">
            <h2 className="mh-name">{`${info?.name ?? ""} ${info?.lastName ?? ""}`}</h2>
            <p className="mh-role">{ROLE_LABEL[info?.role] ?? "—"}</p>
          </div>
        </div>

        {/* Contact */}
        <div className="main-header-center">
          <p className="mh-section-label">Contact</p>
          <div className="mh-contact-row">
            <Icon icon="tabler:mail" width={14} color="#667085" />
            <span className="mh-contact-value">{info?.email ?? "—"}</span>
          </div>
          {info?.phone && (
            <div className="mh-contact-row">
              <Icon icon="tabler:phone" width={14} color="#667085" />
              <span className="mh-contact-value">{info.phone}</span>
            </div>
          )}
        </div>

        {/* Badges / actions */}
        <div className="main-header-right">
          <div className="main-header-actions">{actions}</div>
        </div>

      </div>
    </div>
  );
};

RefactoredHeaderUntitledUiReact.propTypes = {
  actions: PropTypes.node,
};

RefactoredHeaderUntitledUiReact.defaultProps = {
  actions: null,
};

export default RefactoredHeaderUntitledUiReact;
