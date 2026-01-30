import { Tooltip } from "antd";
import BlueButtonComponent from "../../../../components/UX/buttons/BlueButton";
import { WhiteCirclePlusIcon } from "../../../../components/icons/WhiteCirclePlusIcon";
import { Link } from "react-router-dom";
import GrayButtonComponent from "../../../../components/UX/buttons/GrayButton";
import CenteringGrid from "../../../../styles/global/CenteringGrid";
import DangerButtonComponent from "../../../../components/UX/buttons/DangerButton";

const editUIComponents = ({
  moreInfoDisplay,
  setMoreInfoDisplay,
  stylingComponents,
  loadingStatus,
  displaySublocationFields,
  setDisplaySublocationFields,
  item,
}) => {
  const addMoreInformation = () => {
    return (
      <Tooltip title="This information will be applied to all serial numbers created for this device.">
        <div style={{ width: "100%" }}>
          <BlueButtonComponent
            title={"Add more information"}
            func={() => setMoreInfoDisplay(!moreInfoDisplay)}
            icon={<WhiteCirclePlusIcon stroke="var(--basewhite)" />}
            styles={{ width: "100%" }}
            buttonType="button"
          />
        </div>
      </Tooltip>
    );
  };

  const submitFormButtons = () => {
    return (
      <div style={stylingComponents({ loadingStatus }).styleDivParent}>
        <div
          style={{
            textAlign: "left",
            width: "50%",
          }}
        >
          <Link to="/inventory" style={{ width: "100%" }}>
            <GrayButtonComponent
              title={"Go back"}
              func={() => null}
              buttonType="reset"
              styles={{ width: "100%" }}
              titleStyles={{ textTransform: "none" }}
            />
          </Link>
        </div>
        <div
          style={{
            textAlign: "right",
            width: "50%",
          }}
        >
          <BlueButtonComponent
            title={"Update group"}
            disabled={loadingStatus}
            loadingState={loadingStatus}
            // func={handleSubmit}
            styles={stylingComponents({ loadingStatus }).buttonStyleLoading}
            // icon={<WhiteCirclePlusIcon />}
            titleStyles={{ ...CenteringGrid, textTransform: "none" }}
            buttonType="submit"
          />
        </div>
      </div>
    );
  };

  const addSubLocationButton = () => {
    return (
      <Tooltip title="Add sub location">
        <div style={{ width: "100%" }}>
          <BlueButtonComponent
            title={"Add sub location"}
            func={() => setDisplaySublocationFields(true)}
            // icon={<WhiteCirclePlusIcon stroke="var(--basewhite)" />}
            styles={{ width: "100%", display: item === "Main location" && !displaySublocationFields ? "block" : "none" }}
            buttonType="button"
          />
        </div>
      </Tooltip>
    );
  };
  const removeAllSubLocations = () => {
    return (
      <Tooltip title="Remove all sub locations">
        <div style={{ width: "100%" }}>
          <DangerButtonComponent
            title={"Remove all sub locations"}
            func={() => setDisplaySublocationFields(false)}
            buttonType="button"
            styles={{ width: "100%", display: item === "Main location" && displaySublocationFields ? "block" : "none" }}
          />
        </div>
      </Tooltip>
    );
  };

  return {
    addMoreInformation,
    submitFormButtons,  
    addSubLocationButton,
    removeAllSubLocations,
  };
};

export default editUIComponents;
