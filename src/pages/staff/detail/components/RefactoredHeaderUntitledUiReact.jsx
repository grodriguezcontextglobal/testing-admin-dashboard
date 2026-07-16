import { Icon } from "@iconify/react";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar } from "antd";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import Chip from "../../../../components/UX/Chip/Chip";
import "./RefactoredHeaderUntitledUiReact.css";

const ROLE_LABEL = {
  "0": "Root Admin",
  "1": "Admin",
  "2": "User",
};

const RefactoredHeaderUntitledUiReact = ({ actions, statusChip }) => {
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
            <div className="mh-name-row">
              <h2 className="mh-name">{`${info?.name ?? ""} ${info?.lastName ?? ""}`}</h2>
              {statusChip}
            </div>
            <div className="mh-role-row">
              <Chip
                size="small"
                color="info"
                label={ROLE_LABEL[info?.role] ?? "—"}
              />
            </div>
          </div>
        </div>

        {/* Contact */}
        <div className="main-header-center">
          <p className="mh-section-label">Contact</p>
          <div className="mh-contact-row">
            <Icon icon="tabler:mail" width={14} color="var(--gray-500, #777b73)" />
            <span className="mh-contact-value">{info?.email ?? "—"}</span>
          </div>
          {info?.phone && (
            <div className="mh-contact-row">
              <Icon icon="tabler:phone" width={14} color="var(--gray-500, #777b73)" />
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
  statusChip: PropTypes.node,
};

RefactoredHeaderUntitledUiReact.defaultProps = {
  actions: null,
  statusChip: null,
};

export default RefactoredHeaderUntitledUiReact;
