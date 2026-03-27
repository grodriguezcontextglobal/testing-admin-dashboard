import { useMediaQuery } from "@uidotdev/usehooks";
import { Avatar } from "antd";
import PropTypes from "prop-types";
import { useSelector } from "react-redux";
import "./RefactoredHeaderUntitledUiReact.css";

const RefactoredHeaderUntitledUiReact = ({ actions, }) => {
    const isMobile = useMediaQuery("only screen and (max-width: 768px)");
    const { profile } = useSelector((state) => state.staffDetail);
    const staffInformationData = profile.adminUserInfo || {};

    const renderAvatar = () => {
        return (
            <Avatar
                size={isMobile ? 48 : 120}
                src={staffInformationData.imageProfile}
                shape="circle"
            >
                {staffInformationData.name.at(0) && staffInformationData.lastName.at(0) ? `${staffInformationData.name.at(0)}${staffInformationData.lastName.at(0)}` : staffInformationData.name.at(0)}
            </Avatar>
        );
    };
    const dicRole = {
        "0": "Root Admin",
        "1": "Admin",
        "2": "User"
    }
    return (
        <div className="main-header-container">
            <div className="main-header-content">
                <div className="main-header-left">
                    {renderAvatar()}
                    <div className="main-header-info">
                        <h1 className="title">{`${staffInformationData?.name} ${staffInformationData?.lastName}`}</h1>
                        <p className="subtitle">{dicRole[staffInformationData?.role]}</p>
                    </div>
                </div>
                <div className="main-header-center">
                    <h1 className="title">Contact</h1>
                    <h1 className="title">{staffInformationData?.email}</h1>
                    <p className="subtitle">{staffInformationData?.phone}</p>
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
    dataFound: PropTypes.array.isRequired,
    actions: PropTypes.node,
};

RefactoredHeaderUntitledUiReact.defaultProps = {
    actions: null
}

export default RefactoredHeaderUntitledUiReact;
