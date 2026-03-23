import PropTypes from "prop-types";
import { Avatar, Button, Input } from "antd";
import { useMediaQuery } from "@mui/material";
import { Icon } from "@iconify/react";
import "./MainHeaders.css";
import Breadcrumb from "../../../components/UX/breadcrumbs/Breadcrumb";

const MainHeaders = ({
  user,
  breadcrumbs,
  onBack,
  actions,
  showSearch = true,
  showMoreOptions = true,
  moreOptionsRendering = () => {},
}) => {
  const isMobile = useMediaQuery("(max-width: 1023px)");

  return (
    <div className="main-header-comp">
      <div className="main-header-top">
        {isMobile ? (
          <Button
            type="link"
            icon={<Icon icon="mdi:arrow-left" />}
            onClick={onBack}
          >
            Back
          </Button>
        ) : (
          <Breadcrumb
            path={breadcrumbs}
          />
        )}
      </div>

      <div className="main-header-middle">
        <div className="main-header-user-info">
          <Avatar size={isMobile ? 48 : 64} src={user.avatarUrl} />
          <div>
            <h1 style={{ textAlign: "left" }} className="main-header-user-name">
              {user.name}
            </h1>
            <p style={{ textAlign: "left" }} className="main-header-user-email">
              {user.email}
            </p>
          </div>
        </div>
        <div className="main-header-actions">
          {!isMobile && actions.desktop}
          {isMobile && actions.mobile}
        </div>
      </div>
      <div className="main-header-more-options">
        {showMoreOptions && moreOptionsRendering()}
      </div>

      {showSearch && (
        <Input
          className="main-header-search"
          placeholder="Search"
          prefix={<Icon icon="ant-design:search-outlined" />}
        />
      )}
    </div>
  );
};

MainHeaders.propTypes = {
  user: PropTypes.object.isRequired,
  breadcrumbs: PropTypes.array,
  onBack: PropTypes.func,
  actions: PropTypes.object,
  showSearch: PropTypes.bool,
};

MainHeaders.defaultProps = {
  breadcrumbs: [],
  actions: { desktop: [], mobile: [] },
  showSearch: false,
};

export default MainHeaders;
