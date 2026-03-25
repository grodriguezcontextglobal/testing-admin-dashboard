import PropTypes from "prop-types";
import { Avatar } from "antd";
import { useMediaQuery } from "@uidotdev/usehooks";
import { GeneralDeviceIcon } from "../../../../components/icons/GeneralDeviceIcon";
import DeviceDescriptionTags from "../detailComponent/DeviceDescriptionTags";
import { checkArray } from "../../../../components/utils/checkArray";
import "./MainHeaderContainingAllSections.css";

const MainHeaderContainingAllSections = ({ dataFound, actions }) => {
    const isMobile = useMediaQuery("only screen and (max-width: 768px)");
    const device = checkArray(dataFound);

    const renderAvatar = () => {
        if (device?.image_url && device.image_url.length > 0) {
            return (
                <Avatar
                    size={isMobile ? 48 : 120}
                    src={device.image_url}
                />
            );
        }
        return (
            <Avatar size={isMobile ? 48 : 120}>
                <GeneralDeviceIcon dimensions={{ width: "100%", height: "100%" }} />
            </Avatar>
        );
    };

    return (
        <div className="main-header-container">
            <div className="main-header-content">
                <div className="main-header-left">
                    {renderAvatar()}
                    <div className="main-header-info">
                        <h1 className="title">{device?.item_group}</h1>
                        <h2 className="title">{device?.category_name}</h2>
                        <p className="subtitle">{device?.company}</p>
                    </div>
                </div>
                <div className="main-header-center">
                    <DeviceDescriptionTags dataFound={dataFound} />
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

MainHeaderContainingAllSections.propTypes = {
    dataFound: PropTypes.array.isRequired,
    actions: PropTypes.node,
};

MainHeaderContainingAllSections.defaultProps = {
    actions: null
}

export default MainHeaderContainingAllSections;
