import { Divider } from "antd";
import { Link, useLocation } from "react-router-dom";
import BlueButtonComponent from "../../../../../components/UX/buttons/BlueButton";
import GrayButtonComponent from "../../../../../components/UX/buttons/GrayButton";
import { useState } from "react";
import ModalUX from "../../../../../components/UX/modal/ModalUX";

const ButtonsForm = ({
  stylingComponents,
  loadingStatus,
  moreInfoDisplay,
  primaryButtonTitle = "Save new group of items",
  secondaryButtonTitle = "Go back",
  backLink = "/inventory",
  formId = "bulkItemForm",
  callFunction = () => null,
  updateAll = false,
}) => {
  const location = useLocation()
  const [openConfirmation, setOpenConfirmation] = useState(false)
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
        {updateAll ?
          <BlueButtonComponent
            title={primaryButtonTitle}
            loadingState={loadingStatus}
            styles={stylingComponents({ loadingStatus }).buttonStyleLoading}
            buttonType="button"
            disabled={loadingStatus}
            func={() => setOpenConfirmation(true)}
          /> :
          <BlueButtonComponent
            title={primaryButtonTitle}
            loadingState={loadingStatus}
            styles={stylingComponents({ loadingStatus }).buttonStyleLoading}
            buttonType="submit"
            disabled={loadingStatus}
            form={formId}
          />
        }
        {location.pathname === "/create-event-page/device-detail" ? null : <Link to={backLink} style={{ width: "100%" }}>
          <GrayButtonComponent
            title={secondaryButtonTitle}
            func={() => callFunction()}
            styles={{ width: "100%" }}
            buttonType="reset"
          />
        </Link>}
      </div>
      {
        updateAll && openConfirmation &&
        <ConfirmationModal
          openConfirmation={openConfirmation}
          setOpenConfirmation={setOpenConfirmation}
          formId={formId}
        />
      }
    </>
  );
};

export default ButtonsForm;

const ConfirmationModal = ({
  openConfirmation,
  setOpenConfirmation,
  formId,
}) => {
  return (
    <ModalUX
      openDialog={openConfirmation}
      closeModal={() => setOpenConfirmation(false)}
      title="Confirmation"
      body={<div>Are you sure you want to update all items in this group?</div>}
      footer={[
        <div key={'parent'} style={{ display: "flex", gap: "0.5rem" }}>
          <GrayButtonComponent
            key="cancel"
            title="Cancel"
            func={() => setOpenConfirmation(false)}
            styles={{ width: "100%" }}
            buttonType="button"
          />
          <BlueButtonComponent
            key="confirm"
            title="Confirm"
            form={formId}
            styles={{ width: "100%" }}
            buttonType="submit"
          />
        </div>
      ]}
    />
  );
};
