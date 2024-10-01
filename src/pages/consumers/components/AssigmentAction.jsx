import { useState } from "react";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import ModalAssignDeviceToConsumer from "../action/ModalAssignDeviceToConsumer";
import { Dropdown } from "antd";
import { Typography } from "@mui/material";
import { Subtitle } from "../../../styles/global/Subtitle";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import ModalAssignDeviceInEvent from "../action/ModalAssignDeviceInEvent";

const AssigmentAction = () => {
  const [assignDevice, setAssignDevice] = useState(false);
  const [assignDeviceEvent, setAssignDeviceEvent] = useState(false);

  const items = [
    {
      label: (
        <Typography
          style={{ ...Subtitle, ...CenteringGrid, width: "100%" }}
          // onClick={() => {
          //   setAssignDeviceEvent(true);
          // }}
        >
          For an event
        </Typography>
      ),
      key: 1,
      disabled: true,
    },
    {
      label: (
        <Typography
          style={{ ...Subtitle, ...CenteringGrid, width: "100%" }}
          onClick={() => {
            setAssignDevice(true);
          }}
        >
          As a lease.
        </Typography>
      ),
      key: 2,
    },
  ];

  return (
    <>
      <Dropdown
        menu={{
          items,
        }}
        trigger={["click"]}
      >
        <button
          // onClick={() => setAssignDevice(true)}
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
            Create new transaction
          </p>
        </button>
      </Dropdown>
      {assignDevice && (
        <ModalAssignDeviceToConsumer
          assignDevice={assignDevice}
          setAssignDevice={setAssignDevice}
        />
      )}
      {assignDeviceEvent && (
        <ModalAssignDeviceInEvent
          assignDevice={assignDeviceEvent}
          setAssignDevice={setAssignDeviceEvent}
        />
      )}
    </>
  );
};

export default AssigmentAction;
