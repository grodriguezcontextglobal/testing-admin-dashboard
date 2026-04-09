import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar } from "antd";
import PropTypes from "prop-types";
import "./DynamicHeaderCompnent.css";

const RefactoredHeaderUntitledUiReact = ({ actions, image, title, subtitle, centerContentComponentTitle, email, phone }) => {
    const isMobile = useMediaQuery("only screen and (max-width: 768px)");

    const renderAvatar = () => {    
        return (
            <Avatar
                size={isMobile ? 48 : 120}
                src={image}
                shape="circle"
            >
                {image ? "" : `${title}`}
            </Avatar>
        );
    };
    return (
        <div className="main-header-container">
            <div className="main-header-content">
                <div className="main-header-left">
                    {renderAvatar()}
                    <div className="main-header-info">
                        <h1 className="title">{title}</h1>
                        <p className="subtitle">{subtitle}</p>
                    </div>
                </div>
                <div className="main-header-center">
                    <h1 className="title">{centerContentComponentTitle}</h1>
                    <h1 className="title">{email}</h1>
                    <p className="subtitle">{phone}</p>
                </div>
                <div className="main-header-right">
                    <div className="main-header-actions">
                        {actions}
                    </div>
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
};

RefactoredHeaderUntitledUiReact.defaultProps = {
    actions: null
}

export default RefactoredHeaderUntitledUiReact;
