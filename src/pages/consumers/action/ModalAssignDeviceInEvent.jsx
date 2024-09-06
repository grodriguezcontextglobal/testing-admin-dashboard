import { Grid, MenuItem, Select } from "@mui/material";
import { Divider, Modal } from "antd";
import { PropTypes } from "prop-types";
import { useEffect } from "react";
import "../../../styles/global/ant-select.css";
const ModalAssignDeviceInEvent = ({ assignDevice, setAssignDevice }) => {
  useEffect(() => {
    const controller = new AbortController();
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
    >
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
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Select style={{ width: "100%" }} placeholder="Select a device">
                <MenuItem value={"1"}>Device 1</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={12} md={12} lg={12}>
            <Select style={{ width: "100%" }} placeholder="Select a device">
                <MenuItem value={"1"}>Device 1</MenuItem>
            </Select>
          </Grid>

        </Divider>
      </Grid>
    </Modal>
  );
};

ModalAssignDeviceInEvent.propTypes = {};

export default ModalAssignDeviceInEvent;
