import { useState } from "react";
import { WhiteCirclePlusIcon } from "../../../components/icons/Icons";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import ModalAssignDeviceToConsumer from "../action/ModalAssignDeviceToConsumer";

const AssigmentAction = () => {
  const [assignDevice, setAssignDevice] = useState(false);

  return (
    <>
      <button
        onClick={() => setAssignDevice(true)}
        style={{
          ...BlueButton,
          width: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          margin: "0 0 12.5px 0",
        }}
      >
        <WhiteCirclePlusIcon />
        &nbsp;
        <p style={{ ...BlueButtonText, textAlign: "center" }}>
          Assign more devices
        </p>
      </button>
      {assignDevice && (
        <ModalAssignDeviceToConsumer
          assignDevice={assignDevice}
          setAssignDevice={setAssignDevice}
        />
      )}
    </>
  );
};

export default AssigmentAction;
