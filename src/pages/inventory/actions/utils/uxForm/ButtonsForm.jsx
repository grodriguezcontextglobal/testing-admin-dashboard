import { Divider } from "antd";
import { Link } from "react-router-dom";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";

const ButtonsForm = ({ stylingComponents, loadingStatus, moreInfoDisplay, primaryButtonTitle = "Save new group of items", secondaryButtonTitle = "Go back", backLink = "/inventory", scannedSerialNumbers }) => {
  return (
    <>
      <Divider style={{ display: moreInfoDisplay ? "" : "none" }} />
        <div
          style={{
            display: "grid",
            gridAutoColumns: "minmax(1fr, 1fr 1fr)",
            gap: "0.5rem",
          }}
        >
          <BlueButtonComponent
            title={primaryButtonTitle}
            loadingState={loadingStatus}
            styles={stylingComponents({ loadingStatus }).buttonStyleLoading}
            buttonType="submit"
            disabled={loadingStatus || scannedSerialNumbers?.length === 0}
          />
          <Link to={backLink} style={{ width: "100%" }}>
            <GrayButtonComponent
              title={secondaryButtonTitle}
              func={() => null}
              // icon={<WhiteCirclePlusIcon stroke="#344054" hoverStroke="#fff" />}
              styles={{ width: "100%" }}
              buttonType="reset"
            />
          </Link>
        </div>
    </>
  );
};

export default ButtonsForm;
