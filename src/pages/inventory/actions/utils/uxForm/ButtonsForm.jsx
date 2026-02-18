import { Link, useLocation } from "react-router-dom";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { Divider } from "antd";

const ButtonsForm = ({ stylingComponents, loadingStatus, moreInfoDisplay }) => {
  const location = useLocation()
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
            title={location.pathname.includes("bulk") ? "Save new group of items":"Update group of items"}
            loadingState={loadingStatus}
            disabled={loadingStatus}
            styles={stylingComponents({ loadingStatus }).buttonStyleLoading}
            buttonType="submit"
          />
          <Link to="/inventory" style={{ width: "100%" }}>
            <GrayButtonComponent
              title={"Go back"}
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
