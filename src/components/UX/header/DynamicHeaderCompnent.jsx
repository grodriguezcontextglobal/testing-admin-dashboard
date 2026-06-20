import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar } from "antd";
import PropTypes from "prop-types";
import "./DynamicHeaderCompnent.css";

const RefactoredHeaderUntitledUiReact = ({
  actions,
  image,
  title,
  subtitle,
  centerContentComponentTitle,
  email,
  phone,
  isMinor,
  guardianName,
  guardianEmail,
  guardianPhone,
}) => {
  const isMobile = useMediaQuery("only screen and (max-width: 768px)");

  const renderAvatar = () => {
    return (
      <Avatar size={isMobile ? 48 : 120} src={image} shape="circle">
        {image ? "" : `${title}`}
      </Avatar>
    );
  };

  return (
    <div className="main-header-container" data-testid="consumer-header">
      <div className="main-header-content">
        <div className="main-header-left">
          {renderAvatar()}
          <div className="main-header-info">
            <h1 className="title" data-testid="consumer-name">{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
        </div>
        <div className="main-header-center">
          <h1 className="title">{centerContentComponentTitle}</h1>
          <h1 className="title">{email}</h1>
          <p className="subtitle">{phone}</p>
        </div>
        {isMinor && (
          <div className="main-header-center">
            <h1 className="title">Guardian Information</h1>
            <h1 className="title">{guardianName}</h1>
            <h1 className="title">{guardianEmail}</h1>
            <p className="subtitle">{guardianPhone}</p>
          </div>
        )}
        <div className="main-header-right">
          <div className="main-header-actions">{actions}</div>
        </div>
      </div>
    </div>
  );
};

RefactoredHeaderUntitledUiReact.propTypes = {
  actions: PropTypes.node,
  image: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  centerContentComponentTitle: PropTypes.string,
  email: PropTypes.string,
  phone: PropTypes.string,
  isMinor: PropTypes.bool,
  guardianName: PropTypes.string,
  guardianEmail: PropTypes.string,
  guardianPhone: PropTypes.string,
};

RefactoredHeaderUntitledUiReact.defaultProps = {
  actions: null,
  isMinor: false,
  guardianName: "",
  guardianEmail: "",
  guardianPhone: "",
};

export default RefactoredHeaderUntitledUiReact;

