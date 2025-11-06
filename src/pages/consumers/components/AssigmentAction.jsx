import { Typography } from "@mui/material";
import { Button, Dropdown } from "antd";
import { useState } from "react";
import { WhiteCirclePlusIcon } from "../../../components/icons/WhiteCirclePlusIcon";
import { BlueButton } from "../../../styles/global/BlueButton";
import { BlueButtonText } from "../../../styles/global/BlueButtonText";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { Subtitle } from "../../../styles/global/Subtitle";
import ModalAssignDeviceInEvent from "../action/ModalAssignDeviceInEvent";
import ModalAssignDeviceToConsumer from "../action/ModalAssignDeviceToConsumer";

const AssigmentAction = ({ refetching }) => {
  const [assignDevice, setAssignDevice] = useState(false);
  const [assignDeviceEvent, setAssignDeviceEvent] = useState(false);

  const items = [
    {
      label: (
        <Typography
          style={{ ...Subtitle, ...CenteringGrid, width: "100%" }}
          onClick={() => {
            setAssignDeviceEvent(true);
          }}
        >
          For an event.
        </Typography>
      ),
      key: 1,
      // disabled: true,
    },
    {
      label: (
        <Typography
          style={{ ...Subtitle, ...CenteringGrid, width: "100%" }}
          onClick={() => {
            setAssignDevice(true);
          }}
        >
          For a lease.
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
        <Button
          htmlType="button"
          style={{ ...BlueButton, width: "100%", margin: "0 0 12.5px 0" }}
        >
          <p style={{ ...BlueButtonText, alignItems: "center" }}>
              <WhiteCirclePlusIcon width="18px" height="18px" />
            &nbsp; Create new transaction
          </p>
        </Button>
      </Dropdown>
      {assignDevice && (
        <ModalAssignDeviceToConsumer
          assignDevice={assignDevice}
          setAssignDevice={setAssignDevice}
        />
      )}
      {assignDeviceEvent && (
        <ModalAssignDeviceInEvent
          refetching={refetching}
          assignDevice={assignDeviceEvent}
          setAssignDevice={setAssignDeviceEvent}
        />
      )}
    </>
  );
};

export default AssigmentAction;
