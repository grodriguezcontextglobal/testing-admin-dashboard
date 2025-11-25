import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
// import { Divider } from "antd";
import { PropTypes } from "prop-types";
// import { useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import ModalUX from "../../../components/UX/modal/ModalUX";
import "../../../styles/global/ant-select.css";
// import CustomizedSwitch from "../../staff/detail/components/equipment_components/assingmentComponents/components/CustomizedSwitch";
// import AssignemntNewDeviceInInventory from "./assingmentComponents/AssignemntNewDeviceInInventory";
import AssignmentFromExistingInventory from "./assingmentComponents/AssignmentFromExistingInventory";
const ModalAssignDeviceToConsumer = ({ assignDevice, setAssignDevice }) => {
  // const [existingOption, setExistingOption] = useState(true);
  const { customer } = useSelector((state) => state.customer);
  const checkConsumerInSqlDb = useQuery({
    queryKey: ["consumerInSqlDb"],
    queryFn: () =>
      devitrakApi.post("/db_consumer/consulting-consumer", {
        email: customer.email,
      }),
    enabled: !!customer.email,
  });

  const closeModal = () => {
    return setAssignDevice(false);
  };
  const bodyModal = () => {
    return (
      <Grid
        container
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        marginY={2}
        key={"settingUp-deviceList-event"}
      >
        {/* <Divider>
          <CustomizedSwitch
            state={existingOption}
            handler={setExistingOption}
          />
        </Divider> */}
        {/* {existingOption ? ( */}
          <AssignmentFromExistingInventory
            closeModal={closeModal}
            consumerInfoSqlDb={
              checkConsumerInSqlDb?.data?.data?.consumer?.at(-1) ?? {}
            }
          />
        {/* ) : (
          <AssignemntNewDeviceInInventory />
        )} */}
      </Grid>
    );
  };

  return (
    <ModalUX
      openDialog={assignDevice}
      closeModal={closeModal}
      body={bodyModal()}
    />
  );
};

ModalAssignDeviceToConsumer.propTypes = {
  item_group: PropTypes.string,
  startingNumber: PropTypes.string,
  endingNumber: PropTypes.string,
  deviceInfo: PropTypes.string,
  street: PropTypes.string,
  city: PropTypes.string,
  state: PropTypes.string,
  zip: PropTypes.string,
};

export default ModalAssignDeviceToConsumer;
