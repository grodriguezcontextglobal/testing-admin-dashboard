import { useState } from "react";
import BlueButtonComponent from "../../../components/UX/buttons/BlueButton";
import ModalAssignDeviceInEvent from "../action/ModalAssignDeviceInEvent";
import ModalAssignDeviceToConsumer from "../action/ModalAssignDeviceToConsumer";
import Dropdown from "../../../components/UX/dropdown/DropDownComponent";
const AssigmentAction = ({ refetching }) => {
  const [assignDevice, setAssignDevice] = useState(false);
  const [assignDeviceEvent, setAssignDeviceEvent] = useState(false);
  const items = [
    {
      label: "For an event.",
      value: "0",
    },
    {
      label: "For a lease.",
      value: "1",
    },
  ];

  const handleSelect = (option) => {
    const key = option.value;
    if (key === "0") {
      return setAssignDeviceEvent(true);
    } else if (key === "1") {
      return setAssignDevice(true);
    }
  };


  return (
    <>
      <Dropdown
        options={items}
        onSelect={handleSelect}
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
