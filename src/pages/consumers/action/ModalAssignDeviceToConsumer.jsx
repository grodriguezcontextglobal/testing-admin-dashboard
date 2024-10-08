import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Modal, Switch } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import "../../../styles/global/ant-select.css";
import AssignemntNewDeviceInInventory from "./assingmentComponents/AssignemntNewDeviceInInventory";
import AssignmentFromExistingInventory from "./assingmentComponents/AssignmentFromExistingInventory";
const ModalAssignDeviceToConsumer = ({ assignDevice, setAssignDevice }) => {
  const [existingOption, setExistingOption] = useState(true);
  const { customer } = useSelector((state) => state.customer);
  const checkConsumerInSqlDb = useQuery({
    queryKey: ["consumerInSqlDb"],
    queryFn: () =>
      devitrakApi.post("/db_consumer/consulting-consumer", {
        email: customer.email,
      }),
    refetchOnMount: false,
  });
  useEffect(() => {
    const controller = new AbortController();
    checkConsumerInSqlDb.refetch();
    return () => {
      controller.abort();
    };
  }, []);

  const closeModal = () => {
    return setAssignDevice(false);
  };
  return (
    <Modal
      open={assignDevice}
      onCancel={() => closeModal()}
      width={1000}
      footer={[]}
      style={{ zIndex: 30 }}
    >
      <Grid
        container
        display={"flex"}
        justifyContent={"center"}
        alignItems={"center"}
        marginY={2}
        key={"settingUp-deviceList-event"}
      >        <Divider>
          <Switch
            value={existingOption}
            onChange={() => setExistingOption(!existingOption)}
            // checkedChildren="From existing inventory"
            // unCheckedChildren="New inventory device"
            defaultChecked
          />
        </Divider>
        {existingOption ? (
          <AssignmentFromExistingInventory consumerInfoSqlDb={checkConsumerInSqlDb?.data?.data?.consumer} closeModal={closeModal} />
        ) : (
          <AssignemntNewDeviceInInventory consumerInfoSqlDb={checkConsumerInSqlDb?.data?.data?.consumer} closeModal={closeModal} />
        )}
      </Grid>
    </Modal>
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
