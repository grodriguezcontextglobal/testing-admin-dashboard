import { Grid } from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { Divider, Switch } from "antd";
import { PropTypes } from "prop-types";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { devitrakApi } from "../../../api/devitrakApi";
import ModalUX from "../../../components/UX/modal/ModalUX";
import "../../../styles/global/ant-select.css";
import CenteringGrid from "../../../styles/global/CenteringGrid";
import { TextFontSize20LineHeight30 } from "../../../styles/global/TextFontSize20HeightLine30";
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
        {" "}
        <Divider>
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <h2 style={{ ...CenteringGrid, ...TextFontSize20LineHeight30 }}>
              New inventory
            </h2>
            &nbsp;
            <Switch
              value={existingOption}
              onChange={() => setExistingOption(!existingOption)}
              defaultChecked
            />
            &nbsp;
            <h2 style={{ ...CenteringGrid, ...TextFontSize20LineHeight30 }}>
              Existing inventory
            </h2>
          </div>
        </Divider>
        {existingOption ? (
          <AssignmentFromExistingInventory
            consumerInfoSqlDb={checkConsumerInSqlDb?.data?.data?.consumer}
            closeModal={closeModal}
          />
        ) : (
          <AssignemntNewDeviceInInventory
            consumerInfoSqlDb={checkConsumerInSqlDb?.data?.data?.consumer}
            closeModal={closeModal}
          />
        )}
      </Grid>
    );
  };

  return (
    <ModalUX openDialog={assignDevice} closeModal={closeModal} body={bodyModal} />
    // <Modal
    //   open={assignDevice}
    //   onCancel={() => closeModal()}
    //   width={1000}
    //   footer={[]}
    //   style={{ zIndex: 30 }}
    // ></Modal>
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
