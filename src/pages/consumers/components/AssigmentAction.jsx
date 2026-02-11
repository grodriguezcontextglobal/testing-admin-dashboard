import { Typography } from "@mui/material";
import { useState } from "react";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import UXDropdown from "../../../components/UX/dropdown/DropDownComponent";
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
      <UXDropdown
        options={items}
        // onSelect={handleSelect}
        placement="top-end"
        variant="ghost" //"outline" // | "ghost" | "primary""
        renderTrigger={({ onClick, ref }) => (
          <div ref={ref} style={{ display: "inline-block", width: "100%" }}>
            <BlueButtonComponent
              buttonType="button"
              title={"Create a new transaction"}
              func={onClick}
              size="lg"
            />
          </div>
        )}
        style={{ width: "100%" }}
      />
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
